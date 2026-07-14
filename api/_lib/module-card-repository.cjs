/* ============================================================
   [이 파일은] 서버 쪽 "금고지기" — Postgres DB에 카드를 실제로 넣고 꺼내는 일을 합니다.
                데이터 검증, 테이블 생성, 트랜잭션 저장을 모두 여기서 처리합니다.
   [언제 실행] api/module-cards.js 핸들러가 호출할 때마다.
   [주요 등장인물]
     - createSql          : DB 연결 생성 (환경 변수에서 URL 읽음)
     - ensureSchema       : 테이블이 없으면 자동 생성 (첫 배포 때 유용)
     - validateModuleCards: 카드 배열의 유효성 검증 (id/projectId/module 필수)
     - listModuleCards    : DB에서 카드 전체를 읽어 정규화해서 반환
     - replaceModuleCards : 트랜잭션 안에서 기존 카드를 지우고 새 카드를 넣음
     - closeSql           : DB 연결 정리
   [연결] ← api/module-cards.js (핸들러)
          → Postgres DB (POSTGRES_URL 환경 변수)
   [다음 읽을 파일] tools/validate-module-card-api-contract.cjs (API 계약 검증)
   [수정할 때 주의] VALID_STATUSES 세트를 바꾸면 lifecycle 서비스의 STATUSES 와
                    일치시켜야 합니다. replaceModuleCards는 DELETE→INSERT 패턴이므로
                    카드를 빠뜨리면 DB에서 사라집니다.
   ============================================================ */
const postgres = require('postgres');

// DB 연결 URL을 찾을 환경 변수 이름 (우선순위 순).
const DATABASE_ENV_KEYS = ['POSTGRES_URL', 'POSTGRES_URL_NON_POOLING', 'DATABASE_URL'];
// 서버가 인정하는 카드 상태 목록 — lifecycle 서비스의 STATUSES와 반드시 일치해야 합니다.
const VALID_STATUSES = new Set(['pending', 'in_progress', 'review', 'done', 'approved', 'revision']);

// 환경 변수에서 DB URL을 찾아 반환. 없으면 빈 문자열 → createSql에서 503 에러.
function getDatabaseUrl(env = process.env) {
  return DATABASE_ENV_KEYS.map((key) => env[key]).find(Boolean) || '';
}

function createDatabaseNotConfiguredError() {
  const error = new Error('ModuleCard database is not configured. Connect a Vercel Postgres-compatible store and expose POSTGRES_URL or DATABASE_URL.');
  error.code = 'DATABASE_NOT_CONFIGURED';
  error.statusCode = 503;
  return error;
}

// DB 연결 객체 생성. URL 없으면 503 에러를 던짐 (DB 미설정 상태).
function createSql(env = process.env) {
  const url = getDatabaseUrl(env);
  if (!url) throw createDatabaseNotConfiguredError();
  return postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: 'require',
    onnotice: function(){}
  });
}

// 테이블이 없으면 자동 생성 (CREATE IF NOT EXISTS). 첫 배포 때 한 번 실행되면 이후 무연산.
async function ensureSchema(sql) {
  await sql`
    create table if not exists ordo_module_cards (
      id text primary key,
      project_id text not null,
      status text not null,
      card jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    create index if not exists ordo_module_cards_project_status_idx
    on ordo_module_cards (project_id, status)
  `;
}

// 카드 정규화: 빠진 필드 채우기 + 유효하지 않은 status를 'pending'으로 교정.
function normalizeCard(card) {
  const next = Object.assign({}, card);
  next.attachments = Array.isArray(next.attachments) ? next.attachments : [];
  next.comments = Array.isArray(next.comments) ? next.comments : [];
  next.qcChecklist = Array.isArray(next.qcChecklist) ? next.qcChecklist : [];
  next.workLogs = Array.isArray(next.workLogs) ? next.workLogs : [];
  next.revisionCount = Number.isFinite(Number(next.revisionCount)) ? Number(next.revisionCount) : 0;
  if (!VALID_STATUSES.has(next.status)) next.status = 'pending';
  return next;
}

// 카드 배열 유효성 검증: 배열인지, 각 카드에 id/projectId/module이 있는지, 중복 id 없는지.
function validateModuleCards(cards) {
  if (!Array.isArray(cards)) {
    return { ok: false, message: 'cards must be an array.' };
  }

  const ids = new Set();
  for (const rawCard of cards) {
    if (!rawCard || typeof rawCard !== 'object') {
      return { ok: false, message: 'Each card must be an object.' };
    }
    const card = normalizeCard(rawCard);
    if (!card.id || !card.projectId || !card.module) {
      return { ok: false, message: 'Each card needs id, projectId, and module.' };
    }
    if (ids.has(card.id)) {
      return { ok: false, message: `Duplicate card id: ${card.id}` };
    }
    ids.add(card.id);
  }

  return { ok: true, cards: cards.map(normalizeCard) };
}

// GET 요청 처리: DB에서 카드 전체를 읽어 정규화 후 반환.
async function listModuleCards(sql) {
  await ensureSchema(sql);
  const rows = await sql`
    select card
    from ordo_module_cards
    order by project_id asc, id asc
  `;
  return rows.map((row) => normalizeCard(row.card));
}

// PUT 요청 처리: 트랜잭션 안에서 기존 전체 삭제 → 새 카드 전체 삽입.
// "전체 교체" 전략 — 부분 수정이 아니라 매번 통째로 갈아끼움.
async function replaceModuleCards(sql, cards) {
  const validation = validateModuleCards(cards);
  if (!validation.ok) {
    const error = new Error(validation.message);
    error.code = 'INVALID_MODULE_CARDS';
    error.statusCode = 400;
    throw error;
  }

  await ensureSchema(sql);
  await sql.begin(async (tx) => {
    await tx`delete from ordo_module_cards`;
    for (const card of validation.cards) {
      await tx`
        insert into ordo_module_cards (id, project_id, status, card, updated_at)
        values (${card.id}, ${card.projectId}, ${card.status}, ${tx.json(card)}, now())
        on conflict (id) do update set
          project_id = excluded.project_id,
          status = excluded.status,
          card = excluded.card,
          updated_at = now()
      `;
    }
  });

  return validation.cards;
}

async function closeSql(sql) {
  if (sql && typeof sql.end === 'function') await sql.end({ timeout: 5 });
}

module.exports = {
  DATABASE_ENV_KEYS,
  VALID_STATUSES,
  closeSql,
  createDatabaseNotConfiguredError,
  createSql,
  ensureSchema,
  getDatabaseUrl,
  listModuleCards,
  replaceModuleCards,
  validateModuleCards
};
