import assert from "node:assert/strict";

import { mvpSeed } from "../src/data/mvp-seed.mjs";
import {
  ACTIVITY_TYPES,
  MODULE_STATUS,
  QC_STATUS,
  ROLES,
  getCardsForRole,
} from "../src/domain/module-card.model.mjs";
import {
  buildAssignedModuleCard,
  getNextLocalCardNumber,
} from "../src/cards/module-card-actions.mjs";

const admin = mvpSeed.users.find((user) => user.role === ROLES.ADMIN);
const worker = mvpSeed.users.find((user) => user.id === "user-worker-dev");
const client = mvpSeed.users.find((user) => user.role === ROLES.CLIENT);
const originalCardCount = mvpSeed.moduleCards.length;

const result = buildAssignedModuleCard({
  clientId: client.id,
  createdBy: admin.id,
  input: {
    title: "  Search results polish  ",
    summary: "Improve the empty and filtered search result states.",
    phase: "QA",
    priority: "urgent",
    assigneeId: worker.id,
    dueDate: "2026-07-14",
    estimateHours: "6",
    deliverable: "Search result QA memo",
  },
  nextNumber: getNextLocalCardNumber(mvpSeed.moduleCards),
  now: new Date("2026-06-30T12:00:00.000Z"),
});

assert.equal(result.card.id, "card-local-008");
assert.equal(result.card.title, "Search results polish");
assert.equal(result.card.status, MODULE_STATUS.ASSIGNED);
assert.equal(result.card.priority, "urgent");
assert.equal(result.card.clientId, client.id);
assert.equal(result.card.assigneeId, worker.id);
assert.equal(result.card.createdBy, admin.id);
assert.equal(result.card.qcStatus, QC_STATUS.NOT_STARTED);
assert.equal(result.card.progress, 0);
assert.equal(result.card.loggedHours, 0);
assert.deepEqual(result.card.deliverables, ["Search result QA memo"]);

assert.equal(result.activity.id, "event-local-008");
assert.equal(result.activity.cardId, result.card.id);
assert.equal(result.activity.actorId, admin.id);
assert.equal(result.activity.type, ACTIVITY_TYPES.ASSIGNED);
assert.equal(result.activity.fromStatus, MODULE_STATUS.DRAFT);
assert.equal(result.activity.toStatus, MODULE_STATUS.ASSIGNED);

const nextCards = [...mvpSeed.moduleCards, result.card];
assert.equal(mvpSeed.moduleCards.length, originalCardCount);
assert.equal(getCardsForRole(nextCards, ROLES.ADMIN, admin.id).length, 8);
assert.equal(getCardsForRole(nextCards, ROLES.WORKER, worker.id).length, 4);
assert.equal(getCardsForRole(nextCards, ROLES.CLIENT, client.id).length, 8);

assert.throws(
  () =>
    buildAssignedModuleCard({
      clientId: client.id,
      createdBy: admin.id,
      input: { ...result.card, dueDate: "07/14/2026" },
      nextNumber: 9,
    }),
  /dueDate must use YYYY-MM-DD/,
);

console.log(
  JSON.stringify(
    {
      ok: true,
      createdCardId: result.card.id,
      adminCards: getCardsForRole(nextCards, ROLES.ADMIN, admin.id).length,
      workerCards: getCardsForRole(nextCards, ROLES.WORKER, worker.id).length,
      clientCards: getCardsForRole(nextCards, ROLES.CLIENT, client.id).length,
    },
    null,
    2,
  ),
);
