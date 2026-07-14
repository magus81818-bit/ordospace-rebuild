import assert from "node:assert/strict";

import { mvpSeed } from "../src/data/mvp-seed.mjs";
import {
  MODULE_STATUS,
  QC_STATUS,
  ROLES,
  getCardById,
} from "../src/domain/module-card.model.mjs";
import {
  CLIENT_DECISIONS,
  buildAdminClientReviewSend,
  buildAssignedModuleCard,
  buildClientModuleCardDecision,
  buildWorkerAdminReviewSubmission,
  buildWorkerModuleCardUpdate,
} from "../src/cards/module-card-actions.mjs";
import {
  MODULE_CARD_STORE_STORAGE_KEY,
  createModuleCardStoreState,
  normalizeModuleCardStoreState,
  readStoredModuleCardStore,
  saveModuleCardStoreState,
} from "../src/cards/module-card-store.service.mjs";

const storage = createMemoryStorage();
const admin = mvpSeed.users.find((user) => user.role === ROLES.ADMIN);
const client = mvpSeed.users.find((user) => user.role === ROLES.CLIENT);
const worker = mvpSeed.users.find((user) => user.id === "user-worker-dev");

let state = createModuleCardStoreState();

const created = buildAssignedModuleCard({
  clientId: client.id,
  createdBy: admin.id,
  input: {
    title: "Persistent QA card",
    summary: "Confirm localStorage survives refresh for new work.",
    phase: "QA",
    priority: "normal",
    assigneeId: worker.id,
    dueDate: "2026-07-15",
    estimateHours: "4",
    deliverable: "Persistence verification memo",
  },
  nextNumber: state.counters.nextLocalCardNumber,
  now: new Date("2026-07-01T13:00:00.000Z"),
});
state = applyMutation(state, {
  card: created.card,
  activity: created.activity,
  counterKey: "nextLocalCardNumber",
  mode: "append",
});

const workerUpdate = buildWorkerModuleCardUpdate({
  actorId: worker.id,
  card: getCardById(state.moduleCards, "card-005"),
  input: {
    progress: 100,
    loggedHours: 20,
    qcStatus: QC_STATUS.PASSED,
    note: "Checkout flow is ready and should persist after refresh.",
  },
  nextNumber: state.counters.nextLocalWorkerUpdateNumber,
  now: new Date("2026-07-01T13:05:00.000Z"),
});
state = applyMutation(state, {
  card: workerUpdate.card,
  activity: workerUpdate.activity,
  comment: workerUpdate.comment,
  counterKey: "nextLocalWorkerUpdateNumber",
});

const submission = buildWorkerAdminReviewSubmission({
  actorId: worker.id,
  card: workerUpdate.card,
  nextNumber: state.counters.nextLocalWorkerSubmitNumber,
  note: "Ready for admin review after persistence check.",
  now: new Date("2026-07-01T13:10:00.000Z"),
});
state = applyMutation(state, {
  card: submission.card,
  activity: submission.activity,
  comment: submission.comment,
  counterKey: "nextLocalWorkerSubmitNumber",
});

const adminSend = buildAdminClientReviewSend({
  actorId: admin.id,
  card: getCardById(state.moduleCards, "card-003"),
  nextNumber: state.counters.nextLocalAdminSendNumber,
  note: "Authentication build is ready for persisted client review.",
  now: new Date("2026-07-01T13:15:00.000Z"),
});
state = applyMutation(state, {
  card: adminSend.card,
  activity: adminSend.activity,
  comment: adminSend.comment,
  counterKey: "nextLocalAdminSendNumber",
});

const clientDecision = buildClientModuleCardDecision({
  actorId: client.id,
  card: getCardById(state.moduleCards, "card-002"),
  decision: CLIENT_DECISIONS.REQUEST_REVISION,
  nextNumber: state.counters.nextLocalClientDecisionNumber,
  note: "Please simplify the visual states before final approval.",
  now: new Date("2026-07-01T13:20:00.000Z"),
});
state = applyMutation(state, {
  card: clientDecision.card,
  activity: clientDecision.activity,
  comment: clientDecision.comment,
  counterKey: "nextLocalClientDecisionNumber",
});

assert.equal(saveModuleCardStoreState(state, storage), true);
assert.match(storage.getItem(MODULE_CARD_STORE_STORAGE_KEY), /card-local-008/);

const restored = readStoredModuleCardStore(storage);

assert.equal(restored.moduleCards.length, 8);
assert.equal(restored.comments.length, 7);
assert.equal(restored.activities.length, 12);
assert.equal(getCardById(restored.moduleCards, "card-local-008").status, MODULE_STATUS.ASSIGNED);
assert.equal(getCardById(restored.moduleCards, "card-005").status, MODULE_STATUS.ADMIN_REVIEW);
assert.equal(getCardById(restored.moduleCards, "card-003").status, MODULE_STATUS.CLIENT_REVIEW);
assert.equal(
  getCardById(restored.moduleCards, "card-002").status,
  MODULE_STATUS.REVISION_REQUESTED,
);
assert.equal(restored.counters.nextLocalCardNumber, 9);
assert.equal(restored.counters.nextLocalWorkerUpdateNumber, 2);
assert.equal(restored.counters.nextLocalWorkerSubmitNumber, 2);
assert.equal(restored.counters.nextLocalAdminSendNumber, 2);
assert.equal(restored.counters.nextLocalClientDecisionNumber, 2);

const nextCreate = buildAssignedModuleCard({
  clientId: client.id,
  createdBy: admin.id,
  input: {
    title: "Second persisted card",
    summary: "Confirm counters continue after restore.",
    phase: "QA",
    priority: "low",
    assigneeId: worker.id,
    dueDate: "2026-07-16",
    estimateHours: "3",
    deliverable: "Counter verification memo",
  },
  nextNumber: restored.counters.nextLocalCardNumber,
});
assert.equal(nextCreate.card.id, "card-local-009");

const legacyNormalized = normalizeModuleCardStoreState({
  ...state,
  counters: null,
});
assert.equal(legacyNormalized.counters.nextLocalCardNumber, 9);

storage.setItem(MODULE_CARD_STORE_STORAGE_KEY, "{bad json");
const repaired = readStoredModuleCardStore(storage);
assert.equal(repaired.moduleCards.length, mvpSeed.moduleCards.length);
assert.equal(storage.getItem(MODULE_CARD_STORE_STORAGE_KEY), null);

console.log(
  JSON.stringify(
    {
      ok: true,
      storageKey: MODULE_CARD_STORE_STORAGE_KEY,
      restoredCards: restored.moduleCards.length,
      restoredComments: restored.comments.length,
      restoredActivities: restored.activities.length,
      nextLocalCardNumber: restored.counters.nextLocalCardNumber,
    },
    null,
    2,
  ),
);

function applyMutation(
  currentState,
  { activity, card, comment = null, counterKey, mode = "replace" },
) {
  const nextCards =
    mode === "append"
      ? [...currentState.moduleCards, card]
      : currentState.moduleCards.map((currentCard) =>
          currentCard.id === card.id ? card : currentCard,
        );
  const nextCounters = {
    ...currentState.counters,
    [counterKey]: currentState.counters[counterKey] + 1,
  };

  return {
    ...currentState,
    moduleCards: nextCards,
    comments: comment
      ? [...currentState.comments, comment]
      : currentState.comments,
    activities: [...currentState.activities, activity],
    counters: nextCounters,
  };
}

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}
