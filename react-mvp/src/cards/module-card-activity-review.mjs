import {
  ACTIVITY_TYPES,
  getCardById,
  getCardsForRole,
  getDisplayNameForUser,
  getRoleLabel,
  getStatusLabel,
  getUserById,
} from "../domain/module-card.model.mjs";

export const ACTIVITY_REVIEW_LIMIT = 6;

const ACTIVITY_TYPE_LABELS = Object.freeze({
  [ACTIVITY_TYPES.ASSIGNED]: "Assigned",
  [ACTIVITY_TYPES.APPROVED]: "Approved",
  [ACTIVITY_TYPES.COMMENTED]: "Commented",
  [ACTIVITY_TYPES.CREATED]: "Created",
  [ACTIVITY_TYPES.QC_UPDATED]: "QC updated",
  [ACTIVITY_TYPES.REVIEWED]: "Reviewed",
  [ACTIVITY_TYPES.REVISION_REQUESTED]: "Revision requested",
  [ACTIVITY_TYPES.SENT_TO_CLIENT]: "Sent to client",
  [ACTIVITY_TYPES.STATUS_CHANGED]: "Status changed",
  [ACTIVITY_TYPES.SUBMITTED]: "Submitted",
});

export function createActivityReview({
  activities,
  cards,
  limit = ACTIVITY_REVIEW_LIMIT,
  role,
  userId,
  users,
}) {
  const visibleCards = getCardsForRole(cards, role, userId);
  const cardIds = new Set(visibleCards.map((card) => card.id));
  const visibleActivities = activities
    .filter((activity) => cardIds.has(activity.cardId))
    .sort(compareNewestFirst);
  const items = visibleActivities.slice(0, limit).map((activity) =>
    createActivityReviewItem({
      activity,
      card: getCardById(cards, activity.cardId),
      role,
      users,
    }),
  );
  const counts = countActivityTypes(visibleActivities);

  return {
    byType: counts,
    items,
    metrics: createActivityReviewMetrics({
      counts,
      visibleActivities,
      visibleCards,
    }),
    total: visibleActivities.length,
    visibleCardCount: visibleCards.length,
  };
}

export function getActivityTypeLabel(type) {
  return ACTIVITY_TYPE_LABELS[type] ?? type;
}

function createActivityReviewItem({ activity, card, role, users }) {
  const actor = getUserById(users, activity.actorId);

  return {
    actorLabel: actor
      ? `${actor.name} - ${getRoleLabel(actor.role)}`
      : "Unknown actor",
    cardId: activity.cardId,
    cardTitle: card?.title ?? "Unavailable ModuleCard",
    createdAt: activity.createdAt,
    detailTo: card ? `/workspace/${role}/cards/${card.id}` : null,
    id: activity.id,
    message: activity.message,
    statusChange: formatActivityStatusChange(activity),
    type: activity.type,
    typeLabel: getActivityTypeLabel(activity.type),
  };
}

function createActivityReviewMetrics({
  counts,
  visibleActivities,
  visibleCards,
}) {
  return [
    {
      id: "visible-events",
      label: "Visible events",
      value: String(visibleActivities.length),
    },
    {
      id: "visible-cards",
      label: "Visible cards",
      value: String(visibleCards.length),
    },
    {
      id: "handoffs",
      label: "Handoffs",
      value: String(
        (counts[ACTIVITY_TYPES.SUBMITTED] ?? 0) +
          (counts[ACTIVITY_TYPES.SENT_TO_CLIENT] ?? 0),
      ),
    },
    {
      id: "client-decisions",
      label: "Client decisions",
      value: String(
        (counts[ACTIVITY_TYPES.APPROVED] ?? 0) +
          (counts[ACTIVITY_TYPES.REVISION_REQUESTED] ?? 0),
      ),
    },
  ];
}

function countActivityTypes(activities) {
  return activities.reduce((counts, activity) => {
    counts[activity.type] = (counts[activity.type] ?? 0) + 1;
    return counts;
  }, {});
}

function formatActivityStatusChange(activity) {
  if (activity.fromStatus && activity.toStatus) {
    return `${getStatusLabel(activity.fromStatus)} -> ${getStatusLabel(
      activity.toStatus,
    )}`;
  }

  if (activity.toStatus) {
    return getStatusLabel(activity.toStatus);
  }

  return "";
}

function compareNewestFirst(firstActivity, secondActivity) {
  const firstTime = Date.parse(firstActivity.createdAt);
  const secondTime = Date.parse(secondActivity.createdAt);

  if (Number.isFinite(firstTime) && Number.isFinite(secondTime)) {
    return secondTime - firstTime || secondActivity.id.localeCompare(firstActivity.id);
  }

  return secondActivity.createdAt.localeCompare(firstActivity.createdAt);
}
