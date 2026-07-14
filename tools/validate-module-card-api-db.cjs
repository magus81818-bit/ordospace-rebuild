/* ============================================================
   [이 파일은] API+DB 통합 검증기 — API 핸들러가 실제 DB와 정상 동작하는지 확인.
                GET으로 조회 → PUT으로 저장 → 다시 GET으로 확인하는 왕복 테스트.
   [언제 실행] API 또는 repository 코드 수정 후 (DB 환경변수 필요)
   [수정할 때 주의] 실제 DB에 데이터를 쓰므로 테스트 DB에서 실행 권장.
   ============================================================ */
const { Readable } = require('stream');
const handler = require('../api/module-cards.js');
const {
  closeSql,
  createSql,
  DATABASE_ENV_KEYS
} = require('../api/_lib/module-card-repository.cjs');

function createReq(method, body) {
  const raw = body === undefined ? '' : JSON.stringify(body);
  const req = Readable.from(raw ? [Buffer.from(raw)] : []);
  req.method = method;
  req.headers = raw ? { 'content-type': 'application/json' } : {};
  return req;
}

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(chunk) {
      this.body += chunk || '';
    },
    json() {
      return this.body ? JSON.parse(this.body) : null;
    }
  };
}

async function callHandler(method, body) {
  const req = createReq(method, body);
  const res = createRes();
  await handler(req, res);
  return res;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testCards() {
  const marker = `api-db-check-${Date.now()}`;
  return [
    {
      id: `${marker}-a`,
      projectId: 'api-db-check-project',
      module: 'API DB check card A',
      spec: 'Round 3 API write/read verification',
      status: 'review',
      assignedTo: 'worker-api-check',
      comments: [{ role: 'system', author: 'API QA', text: marker, date: new Date().toISOString() }]
    },
    {
      id: `${marker}-b`,
      projectId: 'api-db-check-project',
      module: 'API DB check card B',
      spec: 'Round 3 normalization verification',
      status: 'unexpected-status',
      attachments: [{ name: 'qa-proof.txt', url: '#', size: '-', date: '2026-07-02' }]
    }
  ];
}

async function assertSchemaExists() {
  const sql = createSql(process.env);
  try {
    const rows = await sql`
      select
        to_regclass('public.ordo_module_cards')::text as table_name,
        to_regclass('public.ordo_module_cards_project_status_idx')::text as index_name
    `;
    assert(rows[0] && rows[0].table_name === 'ordo_module_cards', 'ordo_module_cards table should exist');
    assert(rows[0] && rows[0].index_name === 'ordo_module_cards_project_status_idx', 'project/status index should exist');
  } finally {
    await closeSql(sql);
  }
}

async function main() {
  const presentEnv = DATABASE_ENV_KEYS.filter((key) => Boolean(process.env[key]));
  assert(presentEnv.length > 0, 'No ModuleCard database environment variable is available.');

  let originalCards = null;
  let restoreNeeded = false;

  try {
    const initialGet = await callHandler('GET');
    const initialPayload = initialGet.json();
    assert(initialGet.statusCode === 200, `initial GET should return 200, received ${initialGet.statusCode}`);
    assert(initialPayload && initialPayload.ok === true, 'initial GET should return ok:true');
    assert(Array.isArray(initialPayload.cards), 'initial GET should return a cards array');
    assert(initialGet.headers['cache-control'] === 'no-store', 'GET response should disable caching');
    originalCards = initialPayload.cards;

    await assertSchemaExists();

    const invalidPut = await callHandler('PUT', { cards: [{ id: 'missing-project-and-module' }] });
    const invalidPayload = invalidPut.json();
    assert(invalidPut.statusCode === 400, `invalid PUT should return 400, received ${invalidPut.statusCode}`);
    assert(invalidPayload && invalidPayload.code === 'INVALID_MODULE_CARDS', 'invalid PUT should return INVALID_MODULE_CARDS');

    const cards = testCards();
    const validPut = await callHandler('PUT', { cards });
    const putPayload = validPut.json();
    restoreNeeded = true;
    assert(validPut.statusCode === 200, `valid PUT should return 200, received ${validPut.statusCode}`);
    assert(putPayload && putPayload.ok === true, 'valid PUT should return ok:true');
    assert(putPayload.saved === cards.length, 'valid PUT should report saved card count');
    assert(putPayload.cards[1].status === 'pending', 'unknown status should normalize to pending');

    const afterPut = await callHandler('GET');
    const afterPayload = afterPut.json();
    assert(afterPut.statusCode === 200, `GET after PUT should return 200, received ${afterPut.statusCode}`);
    assert(afterPayload && afterPayload.ok === true, 'GET after PUT should return ok:true');
    assert(afterPayload.cards.length === cards.length, 'GET after PUT should return the test cards');
    assert(afterPayload.cards.some((card) => card.id === cards[0].id), 'GET after PUT should include first test card');
    assert(afterPayload.cards.some((card) => card.id === cards[1].id && card.status === 'pending'), 'GET after PUT should include normalized second test card');

    const unsupported = await callHandler('POST', { cards });
    const unsupportedPayload = unsupported.json();
    assert(unsupported.statusCode === 405, `POST should return 405, received ${unsupported.statusCode}`);
    assert(unsupportedPayload && unsupportedPayload.code === 'METHOD_NOT_ALLOWED', 'POST should return METHOD_NOT_ALLOWED');
  } finally {
    if (restoreNeeded && originalCards) {
      const restore = await callHandler('PUT', { cards: originalCards });
      assert(restore.statusCode === 200, `restore PUT should return 200, received ${restore.statusCode}`);
    }
  }

  const finalGet = await callHandler('GET');
  const finalPayload = finalGet.json();
  assert(finalGet.statusCode === 200, `final GET should return 200, received ${finalGet.statusCode}`);
  assert(finalPayload && finalPayload.ok === true, 'final GET should return ok:true');
  assert(Array.isArray(finalPayload.cards), 'final GET should return a cards array');

  console.log(JSON.stringify({
    ok: true,
    envKeysPresent: presentEnv,
    restoredCardCount: finalPayload.cards.length
  }));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
