import assert from "node:assert/strict";

import { mvpSeed } from "../src/data/mvp-seed.mjs";
import {
  MODULE_STATUS,
  QC_STATUS,
  ROLES,
  getActivityForCard,
  getCardsForRole,
  getCommentsForCard,
} from "../src/domain/module-card.model.mjs";
import {
  buildWorkerModuleCardUpdate,
  canWorkerUpdateCard,
} from "../src/cards/module-card-actions.mjs";

const worker = mvpSeed.users.find((user) => user.id === "user-worker-dev");
const otherWorker = mvpSeed.users.find((user) => user.id === "user-worker-ux");
const assignedCard = mvpSeed.moduleCards.find((card) => card.id === "card-006");
const inProgressCard = mvpSeed.moduleCards.find((card) => card.id === "card-005");
const approvedCard = mvpSeed.moduleCards.find((card) => card.id === "card-001");

assert.equal(canWorkerUpdateCard(assignedCard, worker.id), true);
assert.equal(canWorkerUpdateCard(assignedCard, otherWorker.id), false);
assert.equal(canWorkerUpdateCard(approvedCard, otherWorker.id), false);

const progressUpdate = buildWorkerModuleCardUpdate({
  actorId: worker.id,
  card: assignedCard,
  input: {
    progress: 42,
    loggedHours: 3.5,
    qcStatus: QC_STATUS.IN_REVIEW,
    note: "Tracking names are mapped and ready for analytics review.",
  },
  nextNumber: 1,
  now: new Date("2026-07-01T09:00:00.000Z"),
});

assert.equal(progressUpdate.card.status, MODULE_STATUS.IN_PROGRESS);
assert.equal(progressUpdate.card.progress, 42);
assert.equal(progressUpdate.card.loggedHours, 3.5);
assert.equal(progressUpdate.card.qcStatus, QC_STATUS.IN_REVIEW);
assert.equal(progressUpdate.activity.fromStatus, MODULE_STATUS.ASSIGNED);
assert.equal(progressUpdate.activity.toStatus, MODULE_STATUS.IN_PROGRESS);
assert.equal(progressUpdate.comment.authorId, worker.id);

const qcReadyUpdate = buildWorkerModuleCardUpdate({
  actorId: worker.id,
  card: inProgressCard,
  input: {
    progress: 100,
    loggedHours: 20,
    qcStatus: QC_STATUS.PASSED,
    note: "Checkout flow is complete and passes local QC.",
  },
  nextNumber: 2,
  now: new Date("2026-07-01T09:15:00.000Z"),
});

assert.equal(qcReadyUpdate.card.status, MODULE_STATUS.QC_READY);
assert.equal(qcReadyUpdate.card.progress, 100);
assert.equal(qcReadyUpdate.card.qcStatus, QC_STATUS.PASSED);
assert.equal(qcReadyUpdate.activity.fromStatus, MODULE_STATUS.IN_PROGRESS);
assert.equal(qcReadyUpdate.activity.toStatus, MODULE_STATUS.QC_READY);

assert.throws(
  () =>
    buildWorkerModuleCardUpdate({
      actorId: otherWorker.id,
      card: assignedCard,
      input: {
        progress: 30,
        loggedHours: 2,
        qcStatus: QC_STATUS.IN_REVIEW,
        note: "Wrong worker update.",
      },
      nextNumber: 3,
    }),
  /Card is not editable by this worker/,
);

assert.throws(
  () =>
    buildWorkerModuleCardUpdate({
      actorId: otherWorker.id,
      card: approvedCard,
      input: {
        progress: 100,
        loggedHours: 8,
        qcStatus: QC_STATUS.PASSED,
        note: "Approved card update.",
      },
      nextNumber: 4,
    }),
  /Card is not editable by this worker/,
);

const nextCards = mvpSeed.moduleCards.map((card) => {
  if (card.id === progressUpdate.card.id) {
    return progressUpdate.card;
  }

  if (card.id === qcReadyUpdate.card.id) {
    return qcReadyUpdate.card;
  }

  return card;
});
const nextComments = [...mvpSeed.comments, progressUpdate.comment, qcReadyUpdate.comment];
const nextActivities = [
  ...mvpSeed.activities,
  progressUpdate.activity,
  qcReadyUpdate.activity,
];

assert.equal(getCardsForRole(nextCards, ROLES.WORKER, worker.id).length, 3);
assert.equal(getCommentsForCard(nextComments, assignedCard.id).length, 1);
assert.equal(getCommentsForCard(nextComments, inProgressCard.id).length, 1);
assert.equal(getActivityForCard(nextActivities, assignedCard.id).length, 2);
assert.equal(getActivityForCard(nextActivities, inProgressCard.id).length, 2);

console.log(
  JSON.stringify(
    {
      ok: true,
      progressCard: progressUpdate.card.id,
      progressStatus: progressUpdate.card.status,
      qcReadyCard: qcReadyUpdate.card.id,
      qcReadyStatus: qcReadyUpdate.card.status,
    },
    null,
    2,
  ),
);
