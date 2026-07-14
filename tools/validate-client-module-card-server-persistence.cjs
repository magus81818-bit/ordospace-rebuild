/* ============================================================
   [이 파일은] client 역할 서버 퍼시스턴스 검증기 — client가 승인/수정요청 후
                서버에 저장하고 다시 불러와도 상태가 유지되는지 확인.
   [언제 실행] client 워크플로우 또는 서버 저장 로직 수정 후 (DB 환경변수 필요)
   [수정할 때 주의] lifecycle 서비스의 client 함수가 바뀌면 시나리오 갱신 필요.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { Readable } = require('stream');

const handler = require('../api/module-cards.js');
const { DATABASE_ENV_KEYS } = require('../api/_lib/module-card-repository.cjs');

const repoRoot = path.resolve(__dirname, '..');
const APPROVAL_CARD_ID = 'mc-004';
const REVISION_CARD_ID = 'mc-011';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

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

async function apiFetch(url, options = {}) {
  if (String(url) !== '/api/module-cards') {
    return {
      ok: false,
      status: 404,
      json: async () => ({ ok: false, message: 'Unknown test URL.' })
    };
  }

  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : undefined;
  const res = await callHandler(method, body);
  return {
    ok: res.statusCode >= 200 && res.statusCode < 300,
    status: res.statusCode,
    json: async () => res.json()
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    snapshot() {
      return Object.fromEntries(store.entries());
    }
  };
}

function createLifecycleContext() {
  const storage = createStorage();
  const listeners = [];
  const context = {
    console,
    Date,
    JSON,
    Number,
    Object,
    String,
    Array,
    Map,
    Set,
    clearTimeout,
    setTimeout,
    window: {
      localStorage: storage,
      ORDO_NOTIFICATIONS: {},
      ORDO_DISABLE_MODULE_CARD_REMOTE: true,
      location: { protocol: 'https:', hash: '#approvals' },
      fetch: apiFetch,
      clearTimeout,
      setTimeout,
      addEventListener() {},
      dispatchEvent(event) {
        listeners.push(event);
      },
      CustomEvent: class CustomEvent {
        constructor(type, init) {
          this.type = type;
          this.detail = init && init.detail;
        }
      }
    }
  };
  context.globalThis = context;
  context.localStorage = storage;
  context.CustomEvent = context.window.CustomEvent;

  vm.createContext(context);
  vm.runInContext(read('app/data/workspace.data.js'), context, {
    filename: 'workspace.data.js'
  });
  vm.runInContext(
    "const ORDO_CLIENT_PROJECT_META = { id:'proj-001', name:'Test Project', pm:'Test PM', contractMh:480, nextGate:'Build Complete' };",
    context
  );
  vm.runInContext(read('app/services/module-card-lifecycle.service.js'), context, {
    filename: 'module-card-lifecycle.service.js'
  });

  return { context, storage, listeners };
}

function cardById(cards, id) {
  return cards.find((card) => card.id === id);
}

function hasComment(card, marker) {
  return (card.comments || []).some((comment) => String(comment.text || '').includes(marker));
}

async function main() {
  const presentEnv = DATABASE_ENV_KEYS.filter((key) => Boolean(process.env[key]));
  assert(presentEnv.length > 0, 'No ModuleCard database environment variable is available.');

  const initialGet = await callHandler('GET');
  const initialPayload = initialGet.json();
  assert(initialGet.statusCode === 200, `initial GET should return 200, received ${initialGet.statusCode}`);
  assert(initialPayload && initialPayload.ok === true, 'initial GET should return ok:true');
  assert(Array.isArray(initialPayload.cards), 'initial GET should return cards array');
  assert(initialPayload.cards.length >= 12, 'DB should contain the seeded ModuleCard baseline before Client server validation.');

  const originalCards = initialPayload.cards;
  const baselineApprovalCard = cardById(originalCards, APPROVAL_CARD_ID);
  const baselineRevisionCard = cardById(originalCards, REVISION_CARD_ID);
  assert(baselineApprovalCard, `Seeded DB should include ${APPROVAL_CARD_ID} for Client approval validation.`);
  assert(baselineRevisionCard, `Seeded DB should include ${REVISION_CARD_ID} for Client revision validation.`);
  assert(baselineApprovalCard.status === 'done', `${APPROVAL_CARD_ID} should start in client review status.`);
  assert(baselineRevisionCard.status === 'review', `${REVISION_CARD_ID} should start in PM review status for setup.`);

  const marker = `client-server-persistence-${Date.now()}`;
  let restoreNeeded = false;

  try {
    const { context } = createLifecycleContext();
    const lifecycle = context.window.ORDO_MODULE_CARD_LIFECYCLE;
    assert(lifecycle, 'Lifecycle service should be exposed.');

    context.window.ORDO_DISABLE_MODULE_CARD_REMOTE = false;
    const hydration = await lifecycle.hydrateRemote();
    assert(hydration.ok === true, 'Lifecycle should hydrate ModuleCards from the server API.');
    assert(context.window.ORDO_MODULE_CARDS.length === originalCards.length, 'Hydrated card count should match DB baseline.');

    const approvalCard = cardById(context.window.ORDO_MODULE_CARDS, APPROVAL_CARD_ID);
    const revisionCard = cardById(context.window.ORDO_MODULE_CARDS, REVISION_CARD_ID);
    assert(approvalCard && revisionCard, 'Client validation cards should exist after hydration.');

    lifecycle.addFreeComment(approvalCard, 'client', `Client comment ${marker}`, 'Client');
    lifecycle.approveClient(approvalCard, `Client approval ${marker}`);

    lifecycle.sendAdminToClient(revisionCard, `Setup client revision ${marker}`);
    lifecycle.requestRevision(revisionCard, {
      role: 'client',
      note: `Client revision ${marker}`
    });

    const save = await lifecycle.saveRemoteNow(context.window.ORDO_MODULE_CARDS);
    restoreNeeded = true;
    assert(save.ok === true, 'Client lifecycle changes should save through the remote API.');

    const afterGet = await callHandler('GET');
    const afterPayload = afterGet.json();
    assert(afterGet.statusCode === 200, `after GET should return 200, received ${afterGet.statusCode}`);
    assert(afterPayload && afterPayload.ok === true, 'after GET should return ok:true');

    const savedApprovalCard = cardById(afterPayload.cards, APPROVAL_CARD_ID);
    const savedRevisionCard = cardById(afterPayload.cards, REVISION_CARD_ID);
    assert(savedApprovalCard && savedRevisionCard, 'DB should include Client validation cards after save.');
    assert(savedApprovalCard.status === 'approved', 'DB should include Client approval status.');
    assert(hasComment(savedApprovalCard, `Client comment ${marker}`), 'DB should include Client free comment marker.');
    assert(hasComment(savedApprovalCard, `Client approval ${marker}`), 'DB should include Client approval note marker.');
    assert(savedRevisionCard.status === 'revision', 'DB should include Client revision request status.');
    assert(savedRevisionCard.revisionCount > (Number(baselineRevisionCard.revisionCount) || 0), 'DB should increment revisionCount for Client revision.');
    assert(hasComment(savedRevisionCard, `Client revision ${marker}`), 'DB should include Client revision note marker.');
  } finally {
    if (restoreNeeded) {
      const restore = await callHandler('PUT', { cards: originalCards });
      assert(restore.statusCode === 200, `restore PUT should return 200, received ${restore.statusCode}`);
    }
  }

  const finalGet = await callHandler('GET');
  const finalPayload = finalGet.json();
  assert(finalGet.statusCode === 200, `final GET should return 200, received ${finalGet.statusCode}`);
  assert(finalPayload && finalPayload.ok === true, 'final GET should return ok:true');
  assert(finalPayload.cards.length === originalCards.length, 'DB should be restored to the original seeded baseline.');
  const finalApprovalCard = cardById(finalPayload.cards, APPROVAL_CARD_ID);
  const finalRevisionCard = cardById(finalPayload.cards, REVISION_CARD_ID);
  assert(finalApprovalCard && finalApprovalCard.status === baselineApprovalCard.status, `${APPROVAL_CARD_ID} should be restored to its original status.`);
  assert(finalRevisionCard && finalRevisionCard.status === baselineRevisionCard.status, `${REVISION_CARD_ID} should be restored to its original status.`);
  assert(!hasComment(finalApprovalCard, marker), 'Temporary Client approval/comment marker should be removed after restore.');
  assert(!hasComment(finalRevisionCard, marker), 'Temporary Client revision marker should be removed after restore.');

  console.log(JSON.stringify({
    ok: true,
    envKeysPresent: presentEnv,
    clientActionsVerified: [
      'hydrate from server',
      'add client comment',
      'approve card',
      'request revision',
      'restore seeded baseline'
    ],
    restoredCardCount: finalPayload.cards.length
  }));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
