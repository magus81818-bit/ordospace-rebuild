import {
  ACTIVITY_TYPES,
  MODULE_STATUS,
  PRIORITIES,
  QC_STATUS,
  ROLES,
} from "../src/domain/module-card.model.mjs";
import { mvpSeed } from "../src/data/mvp-seed.mjs";

const errors = [];
const validRoles = new Set(Object.values(ROLES));
const validStatuses = new Set(Object.values(MODULE_STATUS));
const validPriorities = new Set(PRIORITIES);
const validQcStatuses = new Set(Object.values(QC_STATUS));
const validActivityTypes = new Set(Object.values(ACTIVITY_TYPES));

const userIds = new Set(mvpSeed.users.map((user) => user.id));
const cardIds = new Set(mvpSeed.moduleCards.map((card) => card.id));

assertUnique("users", mvpSeed.users.map((user) => user.id));
assertUnique("moduleCards", mvpSeed.moduleCards.map((card) => card.id));
assertUnique("comments", mvpSeed.comments.map((comment) => comment.id));
assertUnique("activities", mvpSeed.activities.map((activity) => activity.id));

mvpSeed.users.forEach((user) => {
  if (!validRoles.has(user.role)) {
    errors.push(`User ${user.id} has invalid role ${user.role}`);
  }
});

mvpSeed.moduleCards.forEach((card) => {
  if (!validStatuses.has(card.status)) {
    errors.push(`Card ${card.id} has invalid status ${card.status}`);
  }

  if (!validPriorities.has(card.priority)) {
    errors.push(`Card ${card.id} has invalid priority ${card.priority}`);
  }

  if (!validQcStatuses.has(card.qcStatus)) {
    errors.push(`Card ${card.id} has invalid qcStatus ${card.qcStatus}`);
  }

  if (!userIds.has(card.clientId)) {
    errors.push(`Card ${card.id} points to missing client ${card.clientId}`);
  }

  if (!userIds.has(card.createdBy)) {
    errors.push(`Card ${card.id} points to missing creator ${card.createdBy}`);
  }

  if (card.assigneeId && !userIds.has(card.assigneeId)) {
    errors.push(`Card ${card.id} points to missing assignee ${card.assigneeId}`);
  }

  if (card.status !== MODULE_STATUS.DRAFT && !card.assigneeId) {
    errors.push(`Card ${card.id} is not draft but has no assignee`);
  }

  if (card.progress < 0 || card.progress > 100) {
    errors.push(`Card ${card.id} has invalid progress ${card.progress}`);
  }
});

mvpSeed.comments.forEach((comment) => {
  if (!cardIds.has(comment.cardId)) {
    errors.push(`Comment ${comment.id} points to missing card ${comment.cardId}`);
  }

  if (!userIds.has(comment.authorId)) {
    errors.push(`Comment ${comment.id} points to missing user ${comment.authorId}`);
  }
});

mvpSeed.activities.forEach((activity) => {
  if (!cardIds.has(activity.cardId)) {
    errors.push(`Activity ${activity.id} points to missing card ${activity.cardId}`);
  }

  if (!userIds.has(activity.actorId)) {
    errors.push(`Activity ${activity.id} points to missing actor ${activity.actorId}`);
  }

  if (!validActivityTypes.has(activity.type)) {
    errors.push(`Activity ${activity.id} has invalid type ${activity.type}`);
  }

  if (activity.fromStatus && !validStatuses.has(activity.fromStatus)) {
    errors.push(`Activity ${activity.id} has invalid fromStatus ${activity.fromStatus}`);
  }

  if (activity.toStatus && !validStatuses.has(activity.toStatus)) {
    errors.push(`Activity ${activity.id} has invalid toStatus ${activity.toStatus}`);
  }
});

if (errors.length > 0) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      users: mvpSeed.users.length,
      moduleCards: mvpSeed.moduleCards.length,
      comments: mvpSeed.comments.length,
      activities: mvpSeed.activities.length,
    },
    null,
    2,
  ),
);

function assertUnique(label, values) {
  const seen = new Set();

  values.forEach((value) => {
    if (seen.has(value)) {
      errors.push(`${label} contains duplicate id ${value}`);
    }

    seen.add(value);
  });
}
