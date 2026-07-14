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
  CLIENT_DECISIONS,
  buildClientModuleCardDecision,
  canClientDecideModuleCard,
} from "../src/cards/module-card-actions.mjs";

const client = mvpSeed.users.find((user) => user.role === ROLES.CLIENT);
const worker = mvpSeed.users.find((user) => user.id === "user-worker-ux");
const clientReviewCard = mvpSeed.moduleCards.find((card) => card.id === "card-002");
const approvedCard = mvpSeed.moduleCards.find((card) => card.id === "card-001");

assert.equal(clientReviewCard.status, MODULE_STATUS.CLIENT_REVIEW);
assert.equal(canClientDecideModuleCard(clientReviewCard, client.id), true);
assert.equal(canClientDecideModuleCard(clientReviewCard, worker.id), false);
assert.equal(canClientDecideModuleCard(approvedCard, client.id), false);

const approval = buildClientModuleCardDecision({
  actorId: client.id,
  card: clientReviewCard,
  decision: CLIENT_DECISIONS.APPROVE,
  nextNumber: 1,
  note: "Approved for launch candidate.",
  now: new Date("2026-07-01T12:00:00.000Z"),
});

assert.equal(approval.card.status, MODULE_STATUS.APPROVED);
assert.equal(approval.card.progress, 100);
assert.equal(approval.card.qcStatus, QC_STATUS.PASSED);
assert.equal(approval.card.revisionCount, clientReviewCard.revisionCount);
assert.equal(approval.activity.type, ACTIVITY_TYPES.APPROVED);
assert.equal(approval.activity.fromStatus, MODULE_STATUS.CLIENT_REVIEW);
assert.equal(approval.activity.toStatus, MODULE_STATUS.APPROVED);
assert.equal(approval.comment.visibility, "client");
assert.equal(approval.comment.authorId, client.id);

const revision = buildClientModuleCardDecision({
  actorId: client.id,
  card: clientReviewCard,
  decision: CLIENT_DECISIONS.REQUEST_REVISION,
  nextNumber: 2,
  note: "Please simplify the checkout visual states before approval.",
  now: new Date("2026-07-01T12:05:00.000Z"),
});

assert.equal(revision.card.status, MODULE_STATUS.REVISION_REQUESTED);
assert.equal(revision.card.qcStatus, QC_STATUS.BLOCKED);
assert.equal(revision.card.revisionCount, clientReviewCard.revisionCount + 1);
assert.equal(revision.activity.type, ACTIVITY_TYPES.REVISION_REQUESTED);
assert.equal(revision.activity.fromStatus, MODULE_STATUS.CLIENT_REVIEW);
assert.equal(revision.activity.toStatus, MODULE_STATUS.REVISION_REQUESTED);
assert.equal(revision.comment.visibility, "client");

assert.throws(
  () =>
    buildClientModuleCardDecision({
      actorId: client.id,
      card: clientReviewCard,
      decision: CLIENT_DECISIONS.REQUEST_REVISION,
      nextNumber: 3,
    }),
  /Revision request note is required/,
);

assert.throws(
  () =>
    buildClientModuleCardDecision({
      actorId: worker.id,
      card: clientReviewCard,
      decision: CLIENT_DECISIONS.APPROVE,
      nextNumber: 4,
    }),
  /Card is not ready for this client decision/,
);

const nextCards = mvpSeed.moduleCards.map((card) =>
  card.id === revision.card.id ? revision.card : card,
);
const nextComments = [...mvpSeed.comments, revision.comment];
const nextActivities = [...mvpSeed.activities, revision.activity];

assert.equal(getCardsForRole(nextCards, ROLES.CLIENT, client.id).length, 7);
assert.equal(getCardsForRole(nextCards, ROLES.WORKER, worker.id).length, 3);
assert.equal(getCommentsForCard(nextComments, clientReviewCard.id).length, 2);
assert.equal(getActivityForCard(nextActivities, clientReviewCard.id).length, 2);

console.log(
  JSON.stringify(
    {
      ok: true,
      approvedStatus: approval.card.status,
      revisionStatus: revision.card.status,
      activityTypes: [approval.activity.type, revision.activity.type],
    },
    null,
    2,
  ),
);
