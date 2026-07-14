/* ============================================================
   [이 파일은] 시드 데이터 투입기 — workspace.data.js의 카드 12장을 읽어서
                실제 DB에 PUT으로 밀어넣는 초기 세팅 도구.
   [언제 실행] DB를 처음 세팅하거나 초기 데이터로 리셋할 때
   [수정할 때 주의] 기존 DB 데이터를 전체 교체(replace)하므로 운영 DB에서 실행 금지.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { Readable } = require('stream');

const handler = require('../api/module-cards.js');
const {
  DATABASE_ENV_KEYS,
  validateModuleCards
} = require('../api/_lib/module-card-repository.cjs');

const WORKSPACE_DATA_PATH = path.join(__dirname, '..', 'app', 'data', 'workspace.data.js');
const EXPECTED_SEED_CARD_COUNT = 12;

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

function loadStaticModuleCards() {
  const source = fs.readFileSync(WORKSPACE_DATA_PATH, 'utf8');
  const sandboxWindow = {};
  const sandbox = {
    console,
    window: sandboxWindow
  };
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, {
    filename: WORKSPACE_DATA_PATH,
    timeout: 1000
  });

  const cards = sandboxWindow.ORDO_MODULE_CARDS;
  assert(Array.isArray(cards), 'ORDO_MODULE_CARDS should be available in workspace.data.js');
  assert(cards.length === EXPECTED_SEED_CARD_COUNT, `Expected ${EXPECTED_SEED_CARD_COUNT} seed cards, found ${cards.length}`);

  const validation = validateModuleCards(cards);
  assert(validation.ok, validation.message || 'Seed cards should pass ModuleCard validation');
  return validation.cards;
}

function assertSameCardIds(expectedCards, actualCards) {
  const expectedIds = new Set(expectedCards.map((card) => card.id));
  const actualIds = new Set(actualCards.map((card) => card.id));
  assert(actualIds.size === expectedIds.size, 'Verified card id count should match seed card id count');
  for (const id of expectedIds) {
    assert(actualIds.has(id), `Verified DB result is missing card id: ${id}`);
  }
}

async function main() {
  const presentEnv = DATABASE_ENV_KEYS.filter((key) => Boolean(process.env[key]));
  assert(presentEnv.length > 0, 'No ModuleCard database environment variable is available.');

  const seedCards = loadStaticModuleCards();

  const putRes = await callHandler('PUT', { cards: seedCards });
  const putPayload = putRes.json();
  assert(putRes.statusCode === 200, `seed PUT should return 200, received ${putRes.statusCode}`);
  assert(putPayload && putPayload.ok === true, 'seed PUT should return ok:true');
  assert(putPayload.saved === seedCards.length, 'seed PUT should report the seeded card count');

  const getRes = await callHandler('GET');
  const getPayload = getRes.json();
  assert(getRes.statusCode === 200, `seed verification GET should return 200, received ${getRes.statusCode}`);
  assert(getPayload && getPayload.ok === true, 'seed verification GET should return ok:true');
  assert(Array.isArray(getPayload.cards), 'seed verification GET should return a cards array');
  assert(getPayload.cards.length === seedCards.length, 'seed verification GET should return the seeded card count');
  assertSameCardIds(seedCards, getPayload.cards);

  console.log(JSON.stringify({
    ok: true,
    source: 'app/data/workspace.data.js',
    envKeysPresent: presentEnv,
    seededCardCount: putPayload.saved,
    verifiedCardCount: getPayload.cards.length
  }));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
