/* ============================================================
   [이 파일은] API 계약 검증기 — module-cards API 핸들러의 요청/응답 형식이
                올바른지 DB 없이 확인. GET/PUT의 상태코드, 헤더, 에러 응답 형식 점검.
   [언제 실행] npm run validate:api-contract (API 핸들러 수정 후)
   [수정할 때 주의] API 응답 형식을 바꾸면 이 테스트도 갱신 필요.
   ============================================================ */
const { Readable } = require('stream');
const handler = require('../api/module-cards.js');
const {
  DATABASE_ENV_KEYS,
  getDatabaseUrl,
  validateModuleCards
} = require('../api/_lib/module-card-repository.cjs');

function createReq(method, body) {
  const raw = body ? JSON.stringify(body) : '';
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
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const previousEnv = {};
  DATABASE_ENV_KEYS.forEach((key) => {
    previousEnv[key] = process.env[key];
    delete process.env[key];
  });

  try {
    assert(getDatabaseUrl() === '', 'database URL should be empty during no-DB contract test');

    const res = await callHandler('GET');
    const payload = res.json();
    assert(res.statusCode === 503, 'GET without DB should return 503');
    assert(payload && payload.code === 'DATABASE_NOT_CONFIGURED', 'GET without DB should explain missing database');
    assert(res.headers['cache-control'] === 'no-store', 'GET response should disable caching');

    const invalid = validateModuleCards([{ id: 'missing-project' }]);
    assert(!invalid.ok, 'invalid card payload should be rejected');

    const valid = validateModuleCards([{
      id: 'mc-test',
      projectId: 'pj-test',
      module: 'Hero copy',
      status: 'unknown-status'
    }]);
    assert(valid.ok, 'valid card payload should be accepted');
    assert(valid.cards[0].status === 'pending', 'unknown card status should be normalized');
    assert(Array.isArray(valid.cards[0].comments), 'missing comments should be normalized');

    console.log('ModuleCard API contract validated.');
  } finally {
    DATABASE_ENV_KEYS.forEach((key) => {
      if (previousEnv[key]) process.env[key] = previousEnv[key];
      else delete process.env[key];
    });
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
