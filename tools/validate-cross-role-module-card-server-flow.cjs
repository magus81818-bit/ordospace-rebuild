/* ============================================================
   [이 파일은] 역할 횡단 서버 플로우 검증기 — worker → admin → client 순서로
                상태 전이를 실행하고 서버 저장 후에도 일관성이 유지되는지 확인.
   [언제 실행] 역할 간 워크플로우 또는 서버 저장 로직 수정 후 (DB 환경변수 필요)
   [수정할 때 주의] lifecycle 서비스의 역할별 함수가 바뀌면 시나리오 갱신 필요.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { Readable } = require('stream');

const handler = require('../api/module-cards.js');
const { DATABASE_ENV_KEYS } = require('../api/_lib/module-card-repository.cjs');

const repoRoot = path.resolve(__dirname, '..');
const WORKER_ID = 'worker-001';

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
      location: { protocol: 'https:', hash: '#admin-cards' },
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

function completeWorkerSide(lifecycle, card, marker) {
  card.qcChecklist.forEach((_, index) => {
    lifecycle.updateQc(card, index, true);
  });
  assert(lifecycle.qcComplete(card) === true, `${card.id} QC should be complete.`);

  lifecycle.addWorkLog(card, `Worker flow log ${marker}`, WORKER_ID);
  lifecycle.addAttachment(card, `flow-${marker}.md`);
  lifecycle.submitWorkerReview(card, WORKER_ID, `Worker requests PM review ${marker}`);
  assert(card.status === 'review', `${card.id} should move to PM review.`);
}

async function main() {
  const presentEnv = DATABASE_ENV_KEYS.filter((key) => Boolean(process.env[key]));
  assert(presentEnv.length > 0, 'No ModuleCard database environment variable is available.');

  const initialGet = await callHandler('GET');
  const initialPayload = initialGet.json();
  assert(initialGet.statusCode === 200, `initial GET should return 200, received ${initialGet.statusCode}`);
  assert(initialPayload && initialPayload.ok === true, 'initial GET should return ok:true');
  assert(Array.isArray(initialPayload.cards), 'initial GET should return cards array');
  assert(initialPayload.cards.length >= 12, 'DB should contain the seeded ModuleCard baseline before cross-role flow validation.');

  const originalCards = initialPayload.cards;
  const marker = `cross-role-flow-${Date.now()}`;
  let restoreNeeded = false;

  try {
    const { context } = createLifecycleContext();
    const lifecycle = context.window.ORDO_MODULE_CARD_LIFECYCLE;
    assert(lifecycle, 'Lifecycle service should be exposed.');

    context.window.ORDO_DISABLE_MODULE_CARD_REMOTE = false;
    const hydration = await lifecycle.hydrateRemote();
    assert(hydration.ok === true, 'Lifecycle should hydrate ModuleCards from the server API.');
    assert(context.window.ORDO_MODULE_CARDS.length === originalCards.length, 'Hydrated card count should match DB baseline.');

    const created = lifecycle.createAdminCards([
      {
        spec: 'Flow QA',
        specCode: 'flow.qa',
        dial: 'Cross-role approval',
        module: `${marker}-approval`,
        chain: 'ops',
        step: 3,
        gateRef: 'Build Complete',
        mhEstimate: '1~2',
        qcChecklist: [{ label: 'Worker complete', passed: false }]
      },
      {
        spec: 'Flow QA',
        specCode: 'flow.qa',
        dial: 'Cross-role revision',
        module: `${marker}-revision`,
        chain: 'ops',
        step: 3,
        gateRef: 'Build Complete',
        mhEstimate: '1~2',
        qcChecklist: [{ label: 'Worker complete', passed: false }]
      }
    ], {
      projectId: 'proj-001',
      assignedTo: WORKER_ID,
      dueDate: '2026-07-25'
    });
    assert(created.length === 2, 'Admin should create two temporary flow cards.');

    const approvalCard = created[0];
    const revisionCard = created[1];
    assert(approvalCard.assignedTo === WORKER_ID && revisionCard.assignedTo === WORKER_ID, 'Admin-created flow cards should be assigned to the Worker.');

    completeWorkerSide(lifecycle, approvalCard, marker);
    completeWorkerSide(lifecycle, revisionCard, marker);

    lifecycle.sendAdminToClient(approvalCard, `Admin sends approval flow ${marker}`);
    lifecycle.sendAdminToClient(revisionCard, `Admin sends revision flow ${marker}`);
    assert(approvalCard.status === 'done', 'Approval flow card should be in Client approval queue.');
    assert(revisionCard.status === 'done', 'Revision flow card should be in Client approval queue before revision.');

    lifecycle.approveClient(approvalCard, `Client approves flow ${marker}`);
    lifecycle.requestRevision(revisionCard, {
      role: 'client',
      note: `Client requests revision flow ${marker}`
    });
    assert(approvalCard.status === 'approved', 'Approval flow card should be approved by Client.');
    assert(revisionCard.status === 'revision', 'Revision flow card should move to revision by Client.');

    const workerQueue = context.window.ORDO_MODULE_CARDS.filter((card) => card.assignedTo === WORKER_ID);
    const clientApproved = context.window.ORDO_MODULE_CARDS.filter((card) => card.status === 'approved');
    const clientRevisions = context.window.ORDO_MODULE_CARDS.filter((card) => card.status === 'revision');
    assert(workerQueue.some((card) => card.id === approvalCard.id), 'Worker role queue should still include the approval flow card by assignment.');
    assert(workerQueue.some((card) => card.id === revisionCard.id), 'Worker role queue should still include the revision flow card by assignment.');
    assert(clientApproved.some((card) => card.id === approvalCard.id), 'Client role status view should include the approved flow card.');
    assert(clientRevisions.some((card) => card.id === revisionCard.id), 'Client role status view should include the revision flow card.');

    const save = await lifecycle.saveRemoteNow(context.window.ORDO_MODULE_CARDS);
    restoreNeeded = true;
    assert(save.ok === true, 'Cross-role lifecycle changes should save through the remote API.');

    const afterGet = await callHandler('GET');
    const afterPayload = afterGet.json();
    assert(afterGet.statusCode === 200, `after GET should return 200, received ${afterGet.statusCode}`);
    assert(afterPayload && afterPayload.ok === true, 'after GET should return ok:true');

    const savedApproval = afterPayload.cards.find((card) => card.module === `${marker}-approval`);
    const savedRevision = afterPayload.cards.find((card) => card.module === `${marker}-revision`);
    assert(savedApproval, 'DB should include the approval flow card.');
    assert(savedRevision, 'DB should include the revision flow card.');
    assert(savedApproval.status === 'approved', 'DB should persist the approved cross-role outcome.');
    assert(savedRevision.status === 'revision', 'DB should persist the revision cross-role outcome.');
    assert(savedApproval.assignedTo === WORKER_ID, 'DB should persist Worker assignment on approved flow card.');
    assert(savedRevision.assignedTo === WORKER_ID, 'DB should persist Worker assignment on revision flow card.');
    assert(hasComment(savedApproval, `Worker requests PM review ${marker}`), 'DB should persist Worker review comment for approval flow.');
    assert(hasComment(savedApproval, `Admin sends approval flow ${marker}`), 'DB should persist Admin handoff comment for approval flow.');
    assert(hasComment(savedApproval, `Client approves flow ${marker}`), 'DB should persist Client approval comment.');
    assert(hasComment(savedRevision, `Worker requests PM review ${marker}`), 'DB should persist Worker review comment for revision flow.');
    assert(hasComment(savedRevision, `Admin sends revision flow ${marker}`), 'DB should persist Admin handoff comment for revision flow.');
    assert(hasComment(savedRevision, `Client requests revision flow ${marker}`), 'DB should persist Client revision comment.');
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
  assert(!finalPayload.cards.some((card) => String(card.module || '').includes(marker)), 'Temporary cross-role flow cards should be removed after restore.');

  console.log(JSON.stringify({
    ok: true,
    envKeysPresent: presentEnv,
    crossRoleFlowVerified: [
      'hydrate from server',
      'admin create and assign',
      'worker QC/log/attachment/review',
      'admin send to client',
      'client approval branch',
      'client revision branch',
      'role status queues checked',
      'restore seeded baseline'
    ],
    restoredCardCount: finalPayload.cards.length
  }));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
