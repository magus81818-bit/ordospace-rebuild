import assert from "node:assert/strict";

import { mvpSeed } from "../src/data/mvp-seed.mjs";
import {
  ACTIVITY_TYPES,
  MODULE_STATUS,
  QC_STATUS,
  ROLES,
  getActivityForCard,
  getCardsForRole,
  getCommentsForCard,
} from "../src/domain/module-card.model.mjs";
import {
  buildWorkerAdminReviewSubmission,
  buildWorkerModuleCardUpdate,
  canWorkerSubmitForAdminReview,
} from "../src/cards/module-card-actions.mjs";

const worker = mvpSeed.users.find((user) => user.id === "user-worker-dev");
const otherWorker = mvpSeed.users.find((user) => user.id === "user-worker-ux");
const inProgressCard = mvpSeed.moduleCards.find((card) => card.id === "card-005");
const assignedCard = mvpSeed.moduleCards.find((card) => card.id === "card-006");

const qcReadyUpdate = buildWorkerModuleCardUpdate({
  actorId: worker.id,
  card: inProgressCard,
  input: {
    progress: 100,
    loggedHours: 20,
    qcStatus: QC_STATUS.PASSED,
    note: "Checkout flow is ready for submission.",
  },
  nextNumber: 1,
  now: new Date("2026-07-01T10:00:00.000Z"),
});

assert.equal(canWorkerSubmitForAdminReview(qcReadyUpdate.card, worker.id), true);
assert.equal(canWorkerSubmitForAdminReview(qcReadyUpdate.card, otherWorker.id), false);
assert.equal(canWorkerSubmitForAdminReview(assignedCard, worker.id), false);

const submission = buildWorkerAdminReviewSubmission({
  actorId: worker.id,
  card: qcReadyUpdate.card,
  nextNumber: 1,
  note: "Ready for admin review after worker QC.",
  now: new Date("2026-07-01T10:05:00.000Z"),
});

assert.equal(submission.card.status, MODULE_STATUS.ADMIN_REVIEW);
assert.equal(submission.card.progress, 100);
assert.equal(submission.card.qcStatus, QC_STATUS.PASSED);
assert.equal(submission.activity.type, ACTIVITY_TYPES.SUBMITTED);
assert.equal(submission.activity.fromStatus, MODULE_STATUS.QC_READY);
assert.equal(submission.activity.toStatus, MODULE_STATUS.ADMIN_REVIEW);
assert.equal(submission.comment.authorId, worker.id);
assert.equal(submission.comment.visibility, "team");

assert.throws(
  () =>
    buildWorkerAdminReviewSubmission({
      actorId: worker.id,
      card: assignedCard,
      nextNumber: 2,
      note: "Too early.",
    }),
  /Card is not ready for admin review submission/,
);

assert.throws(
  () =>
    buildWorkerAdminReviewSubmission({
      actorId: otherWorker.id,
      card: qcReadyUpdate.card,
      nextNumber: 3,
    }),
  /Card is not ready for admin review submission/,
);

const nextCards = mvpSeed.moduleCards.map((card) =>
  card.id === submission.card.id ? submission.card : card,
);
const nextComments = [
  ...mvpSeed.comments,
  qcReadyUpdate.comment,
  submission.comment,
];
const nextActivities = [
  ...mvpSeed.activities,
  qcReadyUpdate.activity,
  submission.activity,
];

assert.equal(getCardsForRole(nextCards, ROLES.WORKER, worker.id).length, 3);
assert.equal(getCardsForRole(nextCards, ROLES.ADMIN, worker.id).length, 7);
assert.equal(getCommentsForCard(nextComments, inProgressCard.id).length, 2);
assert.equal(getActivityForCard(nextActivities, inProgressCard.id).length, 3);

console.log(
  JSON.stringify(
    {
      ok: true,
      submittedCard: submission.card.id,
      status: submission.card.status,
      activityType: submission.activity.type,
    },
    null,
    2,
  ),
);
