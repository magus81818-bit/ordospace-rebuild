import {
  ACTIVITY_TYPES,
  MODULE_STATUS,
  PRIORITIES,
  QC_STATUS,
  getStatusLabel,
} from "../domain/module-card.model.mjs";

const DEFAULT_PROJECT = Object.freeze({
  id: "project-commerce",
  name: "Commerce rebuild",
});
const WORKER_EDITABLE_STATUSES = Object.freeze([
  MODULE_STATUS.ASSIGNED,
  MODULE_STATUS.IN_PROGRESS,
  MODULE_STATUS.QC_READY,
  MODULE_STATUS.REVISION_REQUESTED,
]);
export const CLIENT_DECISIONS = Object.freeze({
  APPROVE: "approve",
  REQUEST_REVISION: "request_revision",
});

export function buildAssignedModuleCard({
  clientId,
  createdBy,
  input,
  nextNumber,
  now = new Date(),
  project = DEFAULT_PROJECT,
}) {
  assertValue(createdBy, "createdBy");
  assertValue(clientId, "clientId");
  assertValue(nextNumber, "nextNumber");

  const title = cleanText(input.title);
  const summary = cleanText(input.summary);
  const phase = cleanText(input.phase);
  const assigneeId = cleanText(input.assigneeId);
  const dueDate = cleanText(input.dueDate);
  const deliverable = cleanText(input.deliverable);
  const priority = PRIORITIES.includes(input.priority)
    ? input.priority
    : "normal";
  const estimateHours = Number(input.estimateHours);

  assertValue(title, "title");
  assertValue(summary, "summary");
  assertValue(phase, "phase");
  assertValue(assigneeId, "assigneeId");
  assertDate(dueDate);
  assertValue(deliverable, "deliverable");

  if (!Number.isFinite(estimateHours) || estimateHours <= 0) {
    throw new Error("estimateHours must be greater than 0");
  }

  const sequence = String(nextNumber).padStart(3, "0");
  const cardId = `card-local-${sequence}`;
  const activityId = `event-local-${sequence}`;
  const timestamp = now.toISOString();

  const card = {
    id: cardId,
    projectId: project.id,
    projectName: project.name,
    title,
    summary,
    status: MODULE_STATUS.ASSIGNED,
    priority,
    clientId,
    assigneeId,
    createdBy,
    phase,
    dueDate,
    estimateHours,
    loggedHours: 0,
    progress: 0,
    qcStatus: QC_STATUS.NOT_STARTED,
    deliverables: [deliverable],
    tags: [phase.toLowerCase()],
    revisionCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const activity = {
    id: activityId,
    cardId,
    actorId: createdBy,
    type: ACTIVITY_TYPES.ASSIGNED,
    fromStatus: MODULE_STATUS.DRAFT,
    toStatus: MODULE_STATUS.ASSIGNED,
    message: `Admin created and assigned ${title}.`,
    createdAt: timestamp,
  };

  return { activity, card };
}

export function getNextLocalCardNumber(cards) {
  return cards.length + 1;
}

export function buildWorkerModuleCardUpdate({
  actorId,
  card,
  input,
  nextNumber,
  now = new Date(),
}) {
  assertValue(actorId, "actorId");
  assertValue(card?.id, "card");
  assertValue(nextNumber, "nextNumber");

  if (!canWorkerUpdateCard(card, actorId)) {
    throw new Error("Card is not editable by this worker");
  }

  const progress = Number(input.progress);
  const loggedHours = Number(input.loggedHours);
  const qcStatus = cleanText(input.qcStatus);
  const note = cleanText(input.note);

  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    throw new Error("progress must be between 0 and 100");
  }

  if (!Number.isFinite(loggedHours) || loggedHours < 0) {
    throw new Error("loggedHours must be 0 or greater");
  }

  if (!Object.values(QC_STATUS).includes(qcStatus)) {
    throw new Error("qcStatus is invalid");
  }

  const roundedProgress = Math.round(progress);
  const nextStatus = getWorkerNextStatus(card, {
    loggedHours,
    note,
    progress: roundedProgress,
    qcStatus,
  });
  const hasChange =
    roundedProgress !== card.progress ||
    loggedHours !== card.loggedHours ||
    qcStatus !== card.qcStatus ||
    nextStatus !== card.status ||
    Boolean(note);

  if (!hasChange) {
    throw new Error("No worker update was provided");
  }

  const sequence = String(nextNumber).padStart(3, "0");
  const timestamp = now.toISOString();
  const updatedCard = {
    ...card,
    loggedHours,
    progress: roundedProgress,
    qcStatus,
    status: nextStatus,
    updatedAt: timestamp,
  };
  const activity = {
    id: `event-worker-local-${sequence}`,
    cardId: card.id,
    actorId,
    type:
      nextStatus === card.status
        ? ACTIVITY_TYPES.QC_UPDATED
        : ACTIVITY_TYPES.STATUS_CHANGED,
    fromStatus: card.status,
    toStatus: nextStatus,
    message: buildWorkerActivityMessage(card, updatedCard),
    createdAt: timestamp,
  };
  const comment = note
    ? {
        id: `comment-worker-local-${sequence}`,
        cardId: card.id,
        authorId: actorId,
        visibility: "team",
        body: note,
        createdAt: timestamp,
      }
    : null;

  return { activity, card: updatedCard, comment };
}

export function canWorkerUpdateCard(card, actorId) {
  return Boolean(
    card &&
      card.assigneeId === actorId &&
      WORKER_EDITABLE_STATUSES.includes(card.status),
  );
}

export function buildWorkerAdminReviewSubmission({
  actorId,
  card,
  nextNumber,
  note = "",
  now = new Date(),
}) {
  assertValue(actorId, "actorId");
  assertValue(card?.id, "card");
  assertValue(nextNumber, "nextNumber");

  if (!canWorkerSubmitForAdminReview(card, actorId)) {
    throw new Error("Card is not ready for admin review submission");
  }

  const cleanNote = cleanText(note);
  const sequence = String(nextNumber).padStart(3, "0");
  const timestamp = now.toISOString();
  const submittedCard = {
    ...card,
    status: MODULE_STATUS.ADMIN_REVIEW,
    updatedAt: timestamp,
  };
  const activity = {
    id: `event-submit-local-${sequence}`,
    cardId: card.id,
    actorId,
    type: ACTIVITY_TYPES.SUBMITTED,
    fromStatus: MODULE_STATUS.QC_READY,
    toStatus: MODULE_STATUS.ADMIN_REVIEW,
    message: `Worker submitted ${card.title} for admin review.`,
    createdAt: timestamp,
  };
  const comment = cleanNote
    ? {
        id: `comment-submit-local-${sequence}`,
        cardId: card.id,
        authorId: actorId,
        visibility: "team",
        body: cleanNote,
        createdAt: timestamp,
      }
    : null;

  return { activity, card: submittedCard, comment };
}

export function canWorkerSubmitForAdminReview(card, actorId) {
  return Boolean(
    card &&
      card.assigneeId === actorId &&
      card.status === MODULE_STATUS.QC_READY &&
      card.progress >= 100 &&
      card.qcStatus === QC_STATUS.PASSED,
  );
}

export function buildAdminClientReviewSend({
  actorId,
  card,
  nextNumber,
  note = "",
  now = new Date(),
}) {
  assertValue(actorId, "actorId");
  assertValue(card?.id, "card");
  assertValue(nextNumber, "nextNumber");

  if (!canAdminSendToClientReview(card)) {
    throw new Error("Card is not ready for client review");
  }

  const cleanNote = cleanText(note);
  const sequence = String(nextNumber).padStart(3, "0");
  const timestamp = now.toISOString();
  const sentCard = {
    ...card,
    status: MODULE_STATUS.CLIENT_REVIEW,
    updatedAt: timestamp,
  };
  const activity = {
    id: `event-admin-send-local-${sequence}`,
    cardId: card.id,
    actorId,
    type: ACTIVITY_TYPES.SENT_TO_CLIENT,
    fromStatus: MODULE_STATUS.ADMIN_REVIEW,
    toStatus: MODULE_STATUS.CLIENT_REVIEW,
    message: `Admin sent ${card.title} to client review.`,
    createdAt: timestamp,
  };
  const comment = cleanNote
    ? {
        id: `comment-admin-send-local-${sequence}`,
        cardId: card.id,
        authorId: actorId,
        visibility: "client",
        body: cleanNote,
        createdAt: timestamp,
      }
    : null;

  return { activity, card: sentCard, comment };
}

export function canAdminSendToClientReview(card) {
  return Boolean(card && card.status === MODULE_STATUS.ADMIN_REVIEW);
}

export function buildClientModuleCardDecision({
  actorId,
  card,
  decision,
  nextNumber,
  note = "",
  now = new Date(),
}) {
  assertValue(actorId, "actorId");
  assertValue(card?.id, "card");
  assertValue(nextNumber, "nextNumber");

  if (!canClientDecideModuleCard(card, actorId)) {
    throw new Error("Card is not ready for this client decision");
  }

  const cleanDecision = cleanText(decision);
  const cleanNote = cleanText(note);

  if (!Object.values(CLIENT_DECISIONS).includes(cleanDecision)) {
    throw new Error("Client decision is invalid");
  }

  if (
    cleanDecision === CLIENT_DECISIONS.REQUEST_REVISION &&
    !cleanNote
  ) {
    throw new Error("Revision request note is required");
  }

  const approved = cleanDecision === CLIENT_DECISIONS.APPROVE;
  const nextStatus = approved
    ? MODULE_STATUS.APPROVED
    : MODULE_STATUS.REVISION_REQUESTED;
  const sequence = String(nextNumber).padStart(3, "0");
  const timestamp = now.toISOString();
  const decidedCard = {
    ...card,
    progress: approved ? 100 : card.progress,
    qcStatus: approved ? QC_STATUS.PASSED : QC_STATUS.BLOCKED,
    revisionCount: approved ? card.revisionCount : card.revisionCount + 1,
    status: nextStatus,
    updatedAt: timestamp,
  };
  const activityType = approved
    ? ACTIVITY_TYPES.APPROVED
    : ACTIVITY_TYPES.REVISION_REQUESTED;
  const activity = {
    id: `event-client-decision-local-${sequence}`,
    cardId: card.id,
    actorId,
    type: activityType,
    fromStatus: MODULE_STATUS.CLIENT_REVIEW,
    toStatus: nextStatus,
    message: approved
      ? `Client approved ${card.title}.`
      : `Client requested a revision for ${card.title}.`,
    createdAt: timestamp,
  };
  const comment = cleanNote
    ? {
        id: `comment-client-decision-local-${sequence}`,
        cardId: card.id,
        authorId: actorId,
        visibility: "client",
        body: cleanNote,
        createdAt: timestamp,
      }
    : null;

  return { activity, card: decidedCard, comment };
}

export function canClientDecideModuleCard(card, actorId) {
  return Boolean(
    card &&
      card.clientId === actorId &&
      card.status === MODULE_STATUS.CLIENT_REVIEW,
  );
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function assertValue(value, label) {
  if (!value) {
    throw new Error(`${label} is required`);
  }
}

function assertDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("dueDate must use YYYY-MM-DD");
  }
}

function getWorkerNextStatus(card, update) {
  if (
    update.progress >= 100 &&
    update.qcStatus === QC_STATUS.PASSED
  ) {
    return MODULE_STATUS.QC_READY;
  }

  if (
    card.status === MODULE_STATUS.QC_READY &&
    (update.progress < 100 || update.qcStatus !== QC_STATUS.PASSED)
  ) {
    return MODULE_STATUS.IN_PROGRESS;
  }

  if (
    card.status === MODULE_STATUS.ASSIGNED ||
    card.status === MODULE_STATUS.REVISION_REQUESTED
  ) {
    const workerStarted =
      update.progress > 0 ||
      update.loggedHours > card.loggedHours ||
      Boolean(update.note);

    return workerStarted ? MODULE_STATUS.IN_PROGRESS : card.status;
  }

  return card.status;
}

function buildWorkerActivityMessage(card, updatedCard) {
  if (card.status !== updatedCard.status) {
    return `Worker moved ${card.title} from ${getStatusLabel(
      card.status,
    )} to ${getStatusLabel(updatedCard.status)}.`;
  }

  return `Worker updated ${card.title} to ${updatedCard.progress}% progress with QC ${updatedCard.qcStatus}.`;
}
