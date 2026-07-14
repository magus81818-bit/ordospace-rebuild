export const ROLES = Object.freeze({
  ADMIN: "admin",
  WORKER: "worker",
  CLIENT: "client",
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: "Admin",
  [ROLES.WORKER]: "Worker",
  [ROLES.CLIENT]: "Client",
});

export const MODULE_STATUS = Object.freeze({
  DRAFT: "draft",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  QC_READY: "qc_ready",
  ADMIN_REVIEW: "admin_review",
  CLIENT_REVIEW: "client_review",
  APPROVED: "approved",
  REVISION_REQUESTED: "revision_requested",
});

export const STATUS_LABELS = Object.freeze({
  [MODULE_STATUS.DRAFT]: "Draft",
  [MODULE_STATUS.ASSIGNED]: "Assigned",
  [MODULE_STATUS.IN_PROGRESS]: "In progress",
  [MODULE_STATUS.QC_READY]: "QC ready",
  [MODULE_STATUS.ADMIN_REVIEW]: "Admin review",
  [MODULE_STATUS.CLIENT_REVIEW]: "Client review",
  [MODULE_STATUS.APPROVED]: "Approved",
  [MODULE_STATUS.REVISION_REQUESTED]: "Revision requested",
});

export const QC_STATUS = Object.freeze({
  NOT_STARTED: "not_started",
  IN_REVIEW: "in_review",
  PASSED: "passed",
  BLOCKED: "blocked",
});

export const PRIORITIES = Object.freeze(["low", "normal", "high", "urgent"]);

export const ACTIVITY_TYPES = Object.freeze({
  CREATED: "created",
  ASSIGNED: "assigned",
  STATUS_CHANGED: "status_changed",
  COMMENTED: "commented",
  QC_UPDATED: "qc_updated",
  SUBMITTED: "submitted",
  REVIEWED: "reviewed",
  SENT_TO_CLIENT: "sent_to_client",
  APPROVED: "approved",
  REVISION_REQUESTED: "revision_requested",
});

export const LIFECYCLE_STEPS = Object.freeze([
  {
    id: "admin-create",
    role: ROLES.ADMIN,
    label: "Admin creates and assigns",
    statuses: [MODULE_STATUS.DRAFT, MODULE_STATUS.ASSIGNED],
  },
  {
    id: "worker-progress",
    role: ROLES.WORKER,
    label: "Worker updates and checks",
    statuses: [MODULE_STATUS.IN_PROGRESS, MODULE_STATUS.QC_READY],
  },
  {
    id: "admin-review",
    role: ROLES.ADMIN,
    label: "Admin reviews and sends",
    statuses: [MODULE_STATUS.ADMIN_REVIEW],
  },
  {
    id: "client-decision",
    role: ROLES.CLIENT,
    label: "Client approves or requests revision",
    statuses: [
      MODULE_STATUS.CLIENT_REVIEW,
      MODULE_STATUS.APPROVED,
      MODULE_STATUS.REVISION_REQUESTED,
    ],
  },
]);

export const STATUS_TRANSITIONS = deepFreeze({
  [MODULE_STATUS.DRAFT]: [
    {
      id: "assign-worker",
      role: ROLES.ADMIN,
      to: MODULE_STATUS.ASSIGNED,
      label: "Assign worker",
    },
  ],
  [MODULE_STATUS.ASSIGNED]: [
    {
      id: "start-work",
      role: ROLES.WORKER,
      to: MODULE_STATUS.IN_PROGRESS,
      label: "Start work",
    },
  ],
  [MODULE_STATUS.IN_PROGRESS]: [
    {
      id: "mark-qc-ready",
      role: ROLES.WORKER,
      to: MODULE_STATUS.QC_READY,
      label: "Mark QC ready",
    },
  ],
  [MODULE_STATUS.QC_READY]: [
    {
      id: "submit-admin-review",
      role: ROLES.WORKER,
      to: MODULE_STATUS.ADMIN_REVIEW,
      label: "Submit for admin review",
    },
  ],
  [MODULE_STATUS.ADMIN_REVIEW]: [
    {
      id: "send-client",
      role: ROLES.ADMIN,
      to: MODULE_STATUS.CLIENT_REVIEW,
      label: "Send to client",
    },
    {
      id: "request-worker-revision",
      role: ROLES.ADMIN,
      to: MODULE_STATUS.REVISION_REQUESTED,
      label: "Request worker revision",
    },
  ],
  [MODULE_STATUS.CLIENT_REVIEW]: [
    {
      id: "client-approve",
      role: ROLES.CLIENT,
      to: MODULE_STATUS.APPROVED,
      label: "Approve",
    },
    {
      id: "client-request-revision",
      role: ROLES.CLIENT,
      to: MODULE_STATUS.REVISION_REQUESTED,
      label: "Request revision",
    },
  ],
  [MODULE_STATUS.REVISION_REQUESTED]: [
    {
      id: "restart-revision",
      role: ROLES.WORKER,
      to: MODULE_STATUS.IN_PROGRESS,
      label: "Start revision",
    },
  ],
  [MODULE_STATUS.APPROVED]: [],
});

export function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

export function getLifecycleStepForStatus(status) {
  return LIFECYCLE_STEPS.find((step) => step.statuses.includes(status)) ?? null;
}

export function getAvailableTransitions(card, role) {
  if (!card || !role) {
    return [];
  }

  return (STATUS_TRANSITIONS[card.status] ?? []).filter(
    (transition) => transition.role === role,
  );
}

export function isTerminalStatus(status) {
  return status === MODULE_STATUS.APPROVED;
}

export function getCardsForRole(cards, role, userId) {
  if (role === ROLES.ADMIN) {
    return cards;
  }

  if (role === ROLES.WORKER) {
    return cards.filter((card) => card.assigneeId === userId);
  }

  if (role === ROLES.CLIENT) {
    return cards.filter((card) => card.clientId === userId);
  }

  return [];
}

export function getCardById(cards, cardId) {
  return cards.find((card) => card.id === cardId) ?? null;
}

export function getUserById(users, userId) {
  return users.find((user) => user.id === userId) ?? null;
}

export function getDisplayNameForUser(users, userId) {
  return getUserById(users, userId)?.name ?? "Unassigned";
}

export function getCommentsForCard(comments, cardId) {
  return comments.filter((comment) => comment.cardId === cardId);
}

export function getActivityForCard(activities, cardId) {
  return activities.filter((activity) => activity.cardId === cardId);
}

export function sortCardsByDueDate(cards) {
  return [...cards].sort((firstCard, secondCard) =>
    firstCard.dueDate.localeCompare(secondCard.dueDate),
  );
}

export function summarizeModuleCards(cards) {
  const byStatus = Object.fromEntries(
    Object.values(MODULE_STATUS).map((status) => [status, 0]),
  );

  const summary = cards.reduce(
    (result, card) => {
      result.byStatus[card.status] = (result.byStatus[card.status] ?? 0) + 1;
      result.totalLoggedHours += card.loggedHours;
      result.totalProgress += card.progress;

      if (card.status === MODULE_STATUS.APPROVED) {
        result.approvedCount += 1;
      }

      if (card.status === MODULE_STATUS.REVISION_REQUESTED) {
        result.revisionCount += 1;
      }

      if (
        card.status === MODULE_STATUS.ADMIN_REVIEW ||
        card.status === MODULE_STATUS.CLIENT_REVIEW
      ) {
        result.reviewCount += 1;
      }

      return result;
    },
    {
      totalCards: cards.length,
      byStatus,
      approvedCount: 0,
      reviewCount: 0,
      revisionCount: 0,
      totalLoggedHours: 0,
      totalProgress: 0,
    },
  );

  return {
    ...summary,
    averageProgress:
      summary.totalCards === 0
        ? 0
        : Math.round(summary.totalProgress / summary.totalCards),
  };
}

export function createModelSnapshot(seed) {
  const userByRole = Object.fromEntries(
    Object.values(ROLES).map((role) => [
      role,
      seed.users.filter((user) => user.role === role).length,
    ]),
  );

  return {
    users: seed.users.length,
    cards: seed.moduleCards.length,
    comments: seed.comments.length,
    activities: seed.activities.length,
    userByRole,
    cardSummary: summarizeModuleCards(seed.moduleCards),
  };
}

function deepFreeze(value) {
  if (Array.isArray(value)) {
    value.forEach(deepFreeze);
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
  }

  return Object.freeze(value);
}
