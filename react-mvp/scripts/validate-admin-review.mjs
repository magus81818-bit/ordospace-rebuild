import assert from "node:assert/strict";

import { mvpSeed } from "../src/data/mvp-seed.mjs";
import {
  ACTIVITY_TYPES,
  MODULE_STATUS,
  ROLES,
  getActivityForCard,
  getCardsForRole,
  getCommentsForCard,
} from "../src/domain/module-card.model.mjs";
import {
  buildAdminClientReviewSend,
  canAdminSendToClientReview,
} from "../src/cards/module-card-actions.mjs";

const admin = mvpSeed.users.find((user) => user.role === ROLES.ADMIN);
const client = mvpSeed.users.find((user) => user.role === ROLES.CLIENT);
const adminReviewCard = mvpSeed.moduleCards.find((card) => card.id === "card-003");
const clientReviewCard = mvpSeed.moduleCards.find((card) => card.id === "card-002");

assert.equal(adminReviewCard.status, MODULE_STATUS.ADMIN_REVIEW);
assert.equal(canAdminSendToClientReview(adminReviewCard), true);
assert.equal(canAdminSendToClientReview(clientReviewCard), false);

const result = buildAdminClientReviewSend({
  actorId: admin.id,
  card: adminReviewCard,
  nextNumber: 1,
  note: "Authentication build is ready for client review.",
  now: new Date("2026-07-01T11:00:00.000Z"),
});

assert.equal(result.card.status, MODULE_STATUS.CLIENT_REVIEW);
assert.equal(result.card.clientId, client.id);
assert.equal(result.activity.type, ACTIVITY_TYPES.SENT_TO_CLIENT);
assert.equal(result.activity.fromStatus, MODULE_STATUS.ADMIN_REVIEW);
assert.equal(result.activity.toStatus, MODULE_STATUS.CLIENT_REVIEW);
assert.equal(result.comment.visibility, "client");
assert.equal(result.comment.authorId, admin.id);

assert.throws(
  () =>
    buildAdminClientReviewSend({
      actorId: admin.id,
      card: clientReviewCard,
      nextNumber: 2,
    }),
  /Card is not ready for client review/,
);

const nextCards = mvpSeed.moduleCards.map((card) =>
  card.id === result.card.id ? result.card : card,
);
const nextComments = [...mvpSeed.comments, result.comment];
const nextActivities = [...mvpSeed.activities, result.activity];

assert.equal(getCardsForRole(nextCards, ROLES.ADMIN, admin.id).length, 7);
assert.equal(getCardsForRole(nextCards, ROLES.CLIENT, client.id).length, 7);
assert.equal(getCommentsForCard(nextComments, adminReviewCard.id).length, 2);
assert.equal(getActivityForCard(nextActivities, adminReviewCard.id).length, 2);

console.log(
  JSON.stringify(
    {
      ok: true,
      sentCard: result.card.id,
      status: result.card.status,
      activityType: result.activity.type,
    },
    null,
    2,
  ),
);
