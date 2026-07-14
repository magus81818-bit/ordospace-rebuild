import { PRIORITIES, QC_STATUS } from "../domain/module-card.model.mjs";
import { CLIENT_DECISIONS } from "./module-card-actions.mjs";

export const NOTE_MAX_LENGTH = 240;

export function validateAdminCreateInput(input, { today = new Date(), workers = [] } = {}) {
  const errors = [];
  const title = cleanText(input.title);
  const summary = cleanText(input.summary);
  const phase = cleanText(input.phase);
  const assigneeId = cleanText(input.assigneeId);
  const dueDate = cleanText(input.dueDate);
  const deliverable = cleanText(input.deliverable);
  const estimateHours = Number(input.estimateHours);
  const workerIds = new Set(workers.map((worker) => worker.id));

  if (title.length < 3) {
    errors.push("Title must be at least 3 characters.");
  }

  if (summary.length < 12) {
    errors.push("Summary must be at least 12 characters.");
  }

  if (!phase) {
    errors.push("Phase is required.");
  }

  if (!PRIORITIES.includes(input.priority)) {
    errors.push("Priority is invalid.");
  }

  if (!assigneeId) {
    errors.push("Worker is required.");
  } else if (workerIds.size > 0 && !workerIds.has(assigneeId)) {
    errors.push("Worker must be one of the available worker accounts.");
  }

  if (!isValidDateString(dueDate)) {
    errors.push("Due date must use a valid YYYY-MM-DD date.");
  } else if (dueDate < getLocalDateString(today)) {
    errors.push("Due date cannot be in the past.");
  }

  if (!Number.isFinite(estimateHours) || estimateHours < 1 || estimateHours > 200) {
    errors.push("Estimate hours must be between 1 and 200.");
  }

  if (deliverable.length < 3) {
    errors.push("Deliverable must be at least 3 characters.");
  }

  return errors;
}

export function validateWorkerUpdateInput(input, card) {
  const errors = [];
  const progress = Number(input.progress);
  const loggedHours = Number(input.loggedHours);
  const qcStatus = cleanText(input.qcStatus);
  const note = cleanText(input.note);

  if (!card) {
    errors.push("ModuleCard is required.");
    return errors;
  }

  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    errors.push("Progress must be between 0 and 100.");
  }

  if (!Number.isFinite(loggedHours) || loggedHours < 0) {
    errors.push("Logged hours must be 0 or greater.");
  }

  if (!Object.values(QC_STATUS).includes(qcStatus)) {
    errors.push("QC status is invalid.");
  }

  errors.push(...validateOptionalNote(note, "Team note"));

  if (
    errors.length === 0 &&
    Math.round(progress) === card.progress &&
    loggedHours === card.loggedHours &&
    qcStatus === card.qcStatus &&
    !note
  ) {
    errors.push("Change progress, hours, QC status, or add a note before saving.");
  }

  return errors;
}

export function validateOptionalNote(note, label = "Note") {
  const cleanNote = cleanText(note);

  if (cleanNote.length > NOTE_MAX_LENGTH) {
    return [`${label} must be ${NOTE_MAX_LENGTH} characters or fewer.`];
  }

  return [];
}

export function validateClientDecisionInput({ decision, note }) {
  const errors = [];
  const cleanDecision = cleanText(decision);
  const cleanNote = cleanText(note);

  if (!Object.values(CLIENT_DECISIONS).includes(cleanDecision)) {
    errors.push("Client decision is invalid.");
  }

  if (cleanDecision === CLIENT_DECISIONS.REQUEST_REVISION && !cleanNote) {
    errors.push("Revision note is required when requesting a revision.");
  }

  errors.push(...validateOptionalNote(cleanNote, "Decision note"));

  return errors;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getLocalDateString(date) {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
