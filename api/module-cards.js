/* ============================================================
   [이 파일은] 서버 쪽 "우체국 창구" — 브라우저가 카드를 보내거나(PUT) 꺼내갈(GET) 때
                요청을 받아 DB(금고)와 연결해주는 API 핸들러입니다.
   [언제 실행] Vercel 서버리스 함수로 배포되어, 브라우저가 /api/module-cards 로
                요청을 보낼 때마다 실행됩니다.
   [주요 등장인물]
     - handler(req, res) : GET → 카드 전체 조회 / PUT → 카드 전체 교체
     - readJsonBody      : 요청 본문(body)을 JSON으로 파싱
     - sendJson / sendError : 응답을 JSON으로 보내는 도우미
   [연결] ← 브라우저의 lifecycle 서비스 (saveRemoteNow / hydrateRemote)
          → _lib/module-card-repository.cjs (실제 DB 읽기/쓰기)
   [다음 읽을 파일] api/_lib/module-card-repository.cjs (금고지기)
   [수정할 때 주의] PUT은 카드 "전체"를 한꺼번에 교체합니다 (부분 수정 API 아님).
                    JSON 파싱 실패 시 400 에러, DB 미설정 시 503 에러.
   ============================================================ */
const {
  closeSql,
  createSql,
  listModuleCards,
  replaceModuleCards
} = require('./_lib/module-card-repository.cjs');

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  sendJson(res, statusCode, {
    ok: false,
    code: error.code || 'MODULE_CARD_API_ERROR',
    message: error.message || 'ModuleCard API failed.'
  });
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  let sql;
  try {
    sql = createSql();

    if (req.method === 'GET') {
      const cards = await listModuleCards(sql);
      sendJson(res, 200, { ok: true, source: 'postgres', cards });
      return;
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const cards = await replaceModuleCards(sql, body.cards);
      sendJson(res, 200, { ok: true, source: 'postgres', saved: cards.length, cards });
      return;
    }

    sendJson(res, 405, {
      ok: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Use GET to load ModuleCards or PUT to save them.'
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      error.code = 'INVALID_JSON';
      error.statusCode = 400;
    }
    sendError(res, error);
  } finally {
    await closeSql(sql);
  }
}

module.exports = handler;
module.exports._private = { readJsonBody, sendJson };
