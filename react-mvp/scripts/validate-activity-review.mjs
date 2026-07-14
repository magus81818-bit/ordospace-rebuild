import assert from "node:assert/strict";

import { mvpSeed } from "../src/data/mvp-seed.mjs";
import {
  ACTIVITY_TYPES,
  QC_STATUS,
  ROLES,
  getCardById,
} from "../src/domain/module-card.model.mjs";
import {
  buildAdminClientReviewSend,
  buildWorkerAdminReviewSubmission,
  buildWorkerModuleCardUpdate,
} from "../src/cards/module-card-actions.mjs";
import {
  createActivityReview,
  getActivityTypeLabel,
} from "../src/cards/module-card-activity-review.mjs";

const admin = mvpSeed.users.find((user) => user.role === ROLES.ADMIN);
const client = mvpSeed.users.find((user) => user.role === ROLES.CLIENT);
const workerDev = mvpSeed.users.find((user) => user.id === "user-worker-dev");
const workerUx = mvpSeed.users.find((user) => user.id === "user-worker-ux");

assert.equal(getActivityTypeLabel(ACTIVITY_TYPES.SENT_TO_CLIENT), "Sent to client");
assert.equal(getActivityTypeLabel("custom_type"), "custom_type");

const seedAdminReview = createActivityReview({
  activities: mvpSeed.activities,
  cards: mvpSeed.moduleCards,
  role: ROLES.ADMIN,
  userId: admin.id,
  users: mvpSeed.users,
});
const seedWorkerDevReview = createActivityReview({
  activities: mvpSeed.activities,
  cards: mvpSeed.moduleCards,
  role: ROLES.WORKER,
  userId: workerDev.id,
  users: mvpSeed.users,
});
const seedWorkerUxReview = createActivityReview({
  activities: mvpSeed.activities,
  cards: mvpSeed.moduleCards,
  role: ROLES.WORKER,
  userId: workerUx.id,
  users: mvpSeed.users,
});
const seedClientReview = createActivityReview({
  activities: mvpSeed.activities,
  cards: mvpSeed.moduleCards,
  role: ROLES.CLIENT,
  userId: client.id,
  users: mvpSeed.users,
});

assert.equal(seedAdminReview.total, 7);
assert.equal(seedWorkerDevReview.total, 3);
assert.equal(seedWorkerUxReview.total, 4);
assert.equal(seedClientReview.total, 7);
assert.equal(seedAdminReview.visibleCardCount, 7);
assert.equal(seedWorkerDevReview.visibleCardCount, 3);
assert.equal(seedClientReview.visibleCardCount, 7);

const workerUpdate = buildWorkerModuleCardUpdate({
  actorId: workerDev.id,
  card: getCardById(mvpSeed.moduleCards, "card-005"),
  input: {
    progress: 100,
    loggedHours: 20,
    qcStatus: QC_STATUS.PASSED,
    note: "Checkout flow is ready for persisted audit review.",
  },
  nextNumber: 1,
  now: new Date("2026-07-01T14:00:00.000Z"),
});
const workerSubmit = buildWorkerAdminReviewSubmission({
  actorId: workerDev.id,
  card: workerUpdate.card,
  nextNumber: 1,
  note: "Ready for admin audit review.",
  now: new Date("2026-07-01T14:05:00.000Z"),
});
const adminSend = buildAdminClientReviewSend({
  actorId: admin.id,
  card: getCardById(mvpSeed.moduleCards, "card-003"),
  nextNumber: 1,
  note: "Ready for client audit review.",
  now: new Date("2026-07-01T14:10:00.000Z"),
});

const nextCards = mvpSeed.moduleCards.map((card) => {
  if (card.id === workerSubmit.card.id) {
    return workerSubmit.card;
  }

  if (card.id === adminSend.card.id) {
    return adminSend.card;
  }

  return card;
});
const nextActivities = [
  ...mvpSeed.activities,
  workerUpdate.activity,
  workerSubmit.activity,
  adminSend.activity,
];

const nextAdminReview = createActivityReview({
  activities: nextActivities,
  cards: nextCards,
  role: ROLES.ADMIN,
  userId: admin.id,
  users: mvpSeed.users,
});
const nextWorkerDevReview = createActivityReview({
  activities: nextActivities,
  cards: nextCards,
  role: ROLES.WORKER,
  userId: workerDev.id,
  users: mvpSeed.users,
});
const nextWorkerUxReview = createActivityReview({
  activities: nextActivities,
  cards: nextCards,
  role: ROLES.WORKER,
  userId: workerUx.id,
  users: mvpSeed.users,
});
const limitedClientReview = createActivityReview({
  activities: nextActivities,
  cards: nextCards,
  limit: 2,
  role: ROLES.CLIENT,
  userId: client.id,
  users: mvpSeed.users,
});

assert.equal(nextAdminReview.total, 10);
assert.equal(nextWorkerDevReview.total, 6);
assert.equal(nextWorkerUxReview.total, 4);
assert.equal(limitedClientReview.total, 10);
assert.equal(limitedClientReview.items.length, 2);
assert.equal(limitedClientReview.items[0].id, adminSend.activity.id);
assert.equal(limitedClientReview.items[0].cardTitle, "Authentication build");
assert.equal(limitedClientReview.items[0].actorLabel, "Hana Lee - Admin");
assert.equal(limitedClientReview.items[0].statusChange, "Admin review -> Client review");
assert.equal(limitedClientReview.metrics[2].value, "4");
assert.equal(limitedClientReview.metrics[3].value, "2");

console.log(
  JSON.stringify(
    {
      ok: true,
      adminEvents: nextAdminReview.total,
      clientVisibleEvents: limitedClientReview.total,
      workerDevEvents: nextWorkerDevReview.total,
      workerUxEvents: nextWorkerUxReview.total,
      newestClientEvent: limitedClientReview.items[0].typeLabel,
    },
    null,
    2,
  ),
);
