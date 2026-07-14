/* ============================================================
   [이 파일은] lifecycle 서비스의 "규칙 시험관" — 브라우저 없이 Node.js VM에서
                카드 상태 전이 규칙이 제대로 작동하는지 자동 검증합니다.
   [언제 실행] npm run static:validate-lifecycle (코드 수정 후 반드시)
   [검증 항목]
     - worker QC 미완료 시 리뷰 요청 차단
     - worker QC 완료 → 리뷰 요청 → review 전환
     - admin → client 전달 → done 전환 + 알림 생성
     - client 수정 요청 → revision + revisionCount 증가
     - client 승인 → approved 전환
     - localStorage hydrate (새로고침 후 상태 유지)
   [작동 원리] VM(가상 머신)에서 lifecycle 서비스를 로드하고, 가짜 localStorage를
                주입한 뒤, 상태 전이 시나리오를 실행하며 assert로 검증.
   [수정할 때 주의] lifecycle 서비스의 가드 조건이 바뀌면 이 테스트도 같이 수정.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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
    },
  };
}

function createContext(storageSeed) {
  const storage = createStorage(storageSeed);
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
    window: {
      localStorage: storage,
      ORDO_NOTIFICATIONS: {},
    },
  };
  context.globalThis = context;
  context.localStorage = storage;
  vm.createContext(context);
  vm.runInContext(read('app/data/workspace.data.js'), context, {
    filename: 'workspace.data.js',
  });
  vm.runInContext(
    "const ORDO_CLIENT_PROJECT_META = { id:'proj-001', pm:'Test PM' };",
    context,
  );
  vm.runInContext(read('app/services/module-card-lifecycle.service.js'), context, {
    filename: 'module-card-lifecycle.service.js',
  });
  return { context, storage };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function cardById(context, id) {
  return context.window.ORDO_MODULE_CARDS.find((card) => card.id === id);
}

function run() {
  const { context, storage } = createContext();
  const lifecycle = context.window.ORDO_MODULE_CARD_LIFECYCLE;

  assert(lifecycle, 'Lifecycle service was not exposed.');

  const workerCard = cardById(context, 'mc-005');
  assert(workerCard.status === 'in_progress', 'Expected mc-005 to start in progress.');
  assert(
    lifecycle.canWorkerSubmit(workerCard, 'worker-001') === false,
    'Incomplete QC should block worker review submission.',
  );

  workerCard.qcChecklist.forEach((_, index) => {
    lifecycle.updateQc(workerCard, index, true);
  });
  lifecycle.addWorkLog(workerCard, 'Validated data schema and migration seed.', 'worker-001');
  lifecycle.addAttachment(workerCard, 'schema-review.md');
  lifecycle.submitWorkerReview(workerCard, 'worker-001', 'Ready for PM review.');
  assert(workerCard.status === 'review', 'Worker submission should move card to review.');

  lifecycle.sendAdminToClient(workerCard, 'Please review the completed module.');
  assert(workerCard.status === 'done', 'Admin send should move card to client approval queue.');
  assert(
    context.window.ORDO_NOTIFICATIONS.client.length === 1,
    'Client notification should be queued.',
  );

  lifecycle.requestRevision(workerCard, {
    role: 'client',
    note: 'Please revise the schema summary.',
  });
  assert(workerCard.status === 'revision', 'Client revision should move card to revision.');
  assert(workerCard.revisionCount === 1, 'Client revision should increment revisionCount.');

  const approvalCard = cardById(context, 'mc-004');
  lifecycle.approveClient(approvalCard, 'Approved.');
  assert(approvalCard.status === 'approved', 'Client approval should approve done cards.');

  lifecycle.persist();
  const secondRun = createContext(storage.snapshot());
  assert(
    cardById(secondRun.context, 'mc-005').status === 'revision',
    'Persisted cards should hydrate on the next load.',
  );
  assert(
    cardById(secondRun.context, 'mc-004').status === 'approved',
    'Approved state should survive reload.',
  );

  console.log(JSON.stringify({
    ok: true,
    checked: [
      'worker QC gate',
      'worker submit to PM review',
      'admin send to client queue',
      'client revision request',
      'client approval',
      'localStorage hydration',
    ],
  }, null, 2));
}

run();
