/* ============================================================
   [이 파일은] 새로고침 복구 검증기 — 상태 변경 → 서버 저장 → "새로고침" 시뮬레이션
                → 서버에서 다시 불러와도 데이터가 복원되는지 확인.
   [언제 실행] hydrate/persist 로직 또는 서버 저장 수정 후 (DB 환경변수 필요)
   [수정할 때 주의] hydrate 우선순위(서버 > localStorage > seed)가 바뀌면 갱신 필요.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { Readable } = require('stream');

const handler = require('../api/module-cards.js');
const { DATABASE_ENV_KEYS } = require('../api/_lib/module-card-repository.cjs');

const repoRoot = path.resolve(__dirname, '..');
const API_PATH = '/api/module-cards';
const TEST_CARD_ID = 'mc-005';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

function createApiFetch(modeState) {
  return async function apiFetch(url, options = {}) {
    if (String(url) !== API_PATH) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ ok: false, message: 'Unknown test URL.' })
      };
    }

    const method = options.method || 'GET';
    if (modeState.mode === 'fail-get-503' && method === 'GET') {
      return {
        ok: false,
        status: 503,
        json: async () => ({
          ok: false,
          code: 'SIMULATED_DATABASE_DOWN',
          message: 'Simulated ModuleCard database outage.'
        })
      };
    }

    if (modeState.mode === 'fail-put-500' && method === 'PUT') {
      return {
        ok: false,
        status: 500,
        json: async () => ({
          ok: false,
          code: 'SIMULATED_SAVE_FAILURE',
          message: 'Simulated ModuleCard save failure.'
        })
      };
    }

    const body = options.body ? JSON.parse(options.body) : undefined;
    const res = await callHandler(method, body);
    return {
      ok: res.statusCode >= 200 && res.statusCode < 300,
      status: res.statusCode,
      json: async () => res.json()
    };
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

function createLifecycleContext(options = {}) {
  const storage = createStorage(options.storage || {});
  const listeners = [];
  const modeState = options.modeState || { mode: 'ok' };
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
      fetch: createApiFetch(modeState),
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

  return { context, storage, listeners, modeState };
}

function cardById(cards, id) {
  return cards.find((card) => card.id === id);
}

function hasComment(card, marker) {
  return (card.comments || []).some((comment) => String(comment.text || '').includes(marker));
}

function markerExists(cards, marker) {
  return cards.some((card) => hasComment(card, marker));
}

async function main() {
  const presentEnv = DATABASE_ENV_KEYS.filter((key) => Boolean(process.env[key]));
  assert(presentEnv.length > 0, 'No ModuleCard database environment variable is available.');

  const initialGet = await callHandler('GET');
  const initialPayload = initialGet.json();
  assert(initialGet.statusCode === 200, `initial GET should return 200, received ${initialGet.statusCode}`);
  assert(initialPayload && initialPayload.ok === true, 'initial GET should return ok:true');
  assert(Array.isArray(initialPayload.cards), 'initial GET should return cards array');
  assert(initialPayload.cards.length >= 12, 'DB should contain the seeded ModuleCard baseline before recovery validation.');

  const originalCards = clone(initialPayload.cards);
  assert(cardById(originalCards, TEST_CARD_ID), `Seeded DB should include ${TEST_CARD_ID} for recovery validation.`);

  const marker = `refresh-recovery-${Date.now()}`;
  const recoveryChecks = [];
  let restoreNeeded = false;

  try {
    const healthyMode = { mode: 'ok' };
    const healthy = createLifecycleContext({ modeState: healthyMode });
    const healthyLifecycle = healthy.context.window.ORDO_MODULE_CARD_LIFECYCLE;
    assert(healthyLifecycle, 'Lifecycle service should be exposed in healthy context.');

    healthy.context.window.ORDO_DISABLE_MODULE_CARD_REMOTE = false;
    const hydration = await healthyLifecycle.hydrateRemote();
    assert(hydration.ok === true, 'Healthy context should hydrate ModuleCards from the server API.');
    assert(healthy.context.window.ORDO_MODULE_CARDS.length === originalCards.length, 'Healthy hydration should match DB baseline count.');
    assert(healthyLifecycle.backendInfo().lastStatus === 'synced', 'Healthy hydration should report synced backend status.');
    assert(healthyLifecycle.storageInfo().persistedCards === originalCards.length, 'Healthy hydration should cache server cards in localStorage.');
    recoveryChecks.push('server hydrate writes coherent local cache');

    const cachedStorage = healthy.storage.snapshot();
    const refreshMode = { mode: 'ok' };
    const refreshed = createLifecycleContext({ storage: cachedStorage, modeState: refreshMode });
    const refreshedLifecycle = refreshed.context.window.ORDO_MODULE_CARD_LIFECYCLE;
    assert(refreshedLifecycle.storageInfo().liveCards === originalCards.length, 'Refresh context should boot from cached cards before remote load.');
    assert(refreshedLifecycle.storageInfo().persistedCards === originalCards.length, 'Refresh context should keep cached card count.');

    refreshed.context.window.ORDO_DISABLE_MODULE_CARD_REMOTE = false;
    const refreshHydration = await refreshedLifecycle.hydrateRemote();
    assert(refreshHydration.ok === true, 'Refresh context should rehydrate from server successfully.');
    assert(refreshedLifecycle.backendInfo().lastStatus === 'synced', 'Refresh context should report synced after remote load.');
    assert(refreshed.context.window.ORDO_MODULE_CARDS.length === originalCards.length, 'Refresh context should preserve baseline card count after remote load.');
    recoveryChecks.push('refresh boots from cache then resyncs from server');

    const failedLoadMode = { mode: 'fail-get-503' };
    const failedLoad = createLifecycleContext({ storage: cachedStorage, modeState: failedLoadMode });
    const failedLoadLifecycle = failedLoad.context.window.ORDO_MODULE_CARD_LIFECYCLE;
    failedLoad.context.window.ORDO_DISABLE_MODULE_CARD_REMOTE = false;
    const failedHydration = await failedLoadLifecycle.hydrateRemote();
    assert(failedHydration.ok === false, 'Failed load should return ok:false.');
    assert(failedLoadLifecycle.backendInfo().lastStatus === 'needs-database', '503 load failure should report needs-database.');
    assert(failedLoadLifecycle.storageInfo().liveCards === originalCards.length, 'Failed load should not blank live ModuleCards.');
    assert(failedLoadLifecycle.storageInfo().persistedCards === originalCards.length, 'Failed load should keep cached ModuleCards available.');
    recoveryChecks.push('remote load outage keeps cached cards visible');

    failedLoadMode.mode = 'fail-put-500';
    const editableCard = cardById(failedLoad.context.window.ORDO_MODULE_CARDS, TEST_CARD_ID);
    assert(editableCard, `${TEST_CARD_ID} should exist before failed save validation.`);
    failedLoadLifecycle.addFreeComment(editableCard, 'admin', `Recovery QA local comment ${marker}`, 'Recovery QA');
    const failedSave = await failedLoadLifecycle.saveRemoteNow(failedLoad.context.window.ORDO_MODULE_CARDS);
    assert(failedSave.ok === false, 'Failed save should return ok:false.');
    assert(failedLoadLifecycle.backendInfo().lastStatus === 'save-failed', 'Failed save should report save-failed.');
    assert(hasComment(cardById(failedLoad.context.window.ORDO_MODULE_CARDS, TEST_CARD_ID), marker), 'Failed save should keep the local comment in live state.');
    assert(markerExists(JSON.parse(failedLoad.storage.snapshot()[failedLoadLifecycle.STORAGE_KEY]).cards, marker), 'Failed save should keep the local comment in localStorage.');
    recoveryChecks.push('remote save outage keeps local mutation cached');

    failedLoadMode.mode = 'ok';
    const recoverySave = await failedLoadLifecycle.saveRemoteNow(failedLoad.context.window.ORDO_MODULE_CARDS);
    if (recoverySave.ok) restoreNeeded = true;
    assert(recoverySave.ok === true, 'Recovery save should succeed after the API returns.');
    assert(failedLoadLifecycle.backendInfo().lastStatus === 'saved', 'Recovery save should report saved.');

    const afterRecoveryGet = await callHandler('GET');
    const afterRecoveryPayload = afterRecoveryGet.json();
    assert(afterRecoveryGet.statusCode === 200, `after recovery GET should return 200, received ${afterRecoveryGet.statusCode}`);
    assert(afterRecoveryPayload && afterRecoveryPayload.ok === true, 'after recovery GET should return ok:true');
    assert(markerExists(afterRecoveryPayload.cards, marker), 'DB should include the recovered local mutation after successful save.');

    const recoveryHydration = await failedLoadLifecycle.hydrateRemote();
    assert(recoveryHydration.ok === true, 'Recovery hydrate should succeed after the API returns.');
    assert(failedLoadLifecycle.backendInfo().lastStatus === 'synced', 'Recovery hydrate should report synced.');
    assert(markerExists(failedLoad.context.window.ORDO_MODULE_CARDS, marker), 'Recovered marker should remain visible after server rehydrate.');
    recoveryChecks.push('later successful save/load recovers normal backend status');
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
  assert(!markerExists(finalPayload.cards, marker), 'Temporary recovery marker should be removed after restore.');

  console.log(JSON.stringify({
    ok: true,
    envKeysPresent: presentEnv,
    recoveryChecks,
    restoredCardCount: finalPayload.cards.length
  }));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
