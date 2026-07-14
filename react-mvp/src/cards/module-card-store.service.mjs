import { mvpSeed } from "../data/mvp-seed.mjs";
import {
  ACTIVITY_TYPES,
  MODULE_STATUS,
  PRIORITIES,
  QC_STATUS,
} from "../domain/module-card.model.mjs";

export const MODULE_CARD_STORE_STORAGE_KEY =
  "ordospace.reactMvp.moduleCards.v1";
export const MODULE_CARD_STORE_VERSION = 1;

const COUNTER_KEYS = Object.freeze([
  "nextLocalAdminSendNumber",
  "nextLocalCardNumber",
  "nextLocalClientDecisionNumber",
  "nextLocalWorkerSubmitNumber",
  "nextLocalWorkerUpdateNumber",
]);

export function createModuleCardStoreState(seed = mvpSeed) {
  const state = {
    version: MODULE_CARD_STORE_VERSION,
    moduleCards: cloneRecords(seed.moduleCards),
    comments: cloneRecords(seed.comments),
    activities: cloneRecords(seed.activities),
  };

  return {
    ...state,
    counters: createModuleCardStoreCounters(state),
  };
}

export function normalizeModuleCardStoreState(value) {
  if (!value || value.version !== MODULE_CARD_STORE_VERSION) {
    return null;
  }

  const moduleCards = normalizeRecords(value.moduleCards);
  const comments = normalizeRecords(value.comments);
  const activities = normalizeRecords(value.activities);

  if (!moduleCards || !comments || !activities) {
    return null;
  }

  const state = {
    version: MODULE_CARD_STORE_VERSION,
    moduleCards,
    comments,
    activities,
  };

  if (!isValidStoreState(state)) {
    return null;
  }

  return {
    ...state,
    counters: normalizeCounters(value.counters, state),
  };
}

export function readStoredModuleCardStore(storage = getBrowserStorage()) {
  if (!storage) {
    return createModuleCardStoreState();
  }

  const rawValue = storage.getItem(MODULE_CARD_STORE_STORAGE_KEY);

  if (!rawValue) {
    return createModuleCardStoreState();
  }

  try {
    const state = normalizeModuleCardStoreState(JSON.parse(rawValue));

    if (!state) {
      storage.removeItem(MODULE_CARD_STORE_STORAGE_KEY);
      return createModuleCardStoreState();
    }

    return state;
  } catch {
    storage.removeItem(MODULE_CARD_STORE_STORAGE_KEY);
    return createModuleCardStoreState();
  }
}

export function saveModuleCardStoreState(
  state,
  storage = getBrowserStorage(),
) {
  if (!storage) {
    return false;
  }

  const normalizedState = normalizeModuleCardStoreState({
    ...state,
    version: MODULE_CARD_STORE_VERSION,
  });

  if (!normalizedState) {
    storage.removeItem(MODULE_CARD_STORE_STORAGE_KEY);
    return false;
  }

  try {
    storage.setItem(
      MODULE_CARD_STORE_STORAGE_KEY,
      JSON.stringify(normalizedState),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearStoredModuleCardStore(storage = getBrowserStorage()) {
  if (!storage) {
    return;
  }

  storage.removeItem(MODULE_CARD_STORE_STORAGE_KEY);
}

export function createModuleCardStoreCounters(state) {
  return {
    nextLocalAdminSendNumber: getNextSequenceFromIds(
      state.activities,
      "event-admin-send-local-",
    ),
    nextLocalCardNumber: Math.max(
      state.moduleCards.length + 1,
      getNextSequenceFromIds(state.moduleCards, "card-local-"),
    ),
    nextLocalClientDecisionNumber: getNextSequenceFromIds(
      state.activities,
      "event-client-decision-local-",
    ),
    nextLocalWorkerSubmitNumber: getNextSequenceFromIds(
      state.activities,
      "event-submit-local-",
    ),
    nextLocalWorkerUpdateNumber: getNextSequenceFromIds(
      state.activities,
      "event-worker-local-",
    ),
  };
}

function normalizeCounters(value, state) {
  const derivedCounters = createModuleCardStoreCounters(state);
  const source = value && typeof value === "object" ? value : {};

  return Object.fromEntries(
    COUNTER_KEYS.map((key) => [
      key,
      normalizeCounter(source[key], derivedCounters[key]),
    ]),
  );
}

function normalizeCounter(value, fallback) {
  const number = Number(value);

  if (Number.isInteger(number) && number > 0) {
    return Math.max(number, fallback);
  }

  return fallback;
}

function normalizeRecords(records) {
  if (!Array.isArray(records)) {
    return null;
  }

  const normalizedRecords = records.map((record) => normalizeRecord(record));

  if (normalizedRecords.some((record) => !record)) {
    return null;
  }

  if (!hasUniqueIds(normalizedRecords)) {
    return null;
  }

  return normalizedRecords;
}

function normalizeRecord(record) {
  if (!record || typeof record !== "object" || typeof record.id !== "string") {
    return null;
  }

  return cloneRecord(record);
}

function isValidStoreState(state) {
  const validActivityTypes = new Set(Object.values(ACTIVITY_TYPES));
  const validPriorities = new Set(PRIORITIES);
  const validQcStatuses = new Set(Object.values(QC_STATUS));
  const validStatuses = new Set(Object.values(MODULE_STATUS));
  const userIds = new Set(mvpSeed.users.map((user) => user.id));
  const cardIds = new Set(state.moduleCards.map((card) => card.id));

  return (
    state.moduleCards.every((card) =>
      isValidModuleCard(card, {
        userIds,
        validPriorities,
        validQcStatuses,
        validStatuses,
      }),
    ) &&
    state.comments.every((comment) => isValidComment(comment, { cardIds, userIds })) &&
    state.activities.every((activity) =>
      isValidActivity(activity, {
        cardIds,
        userIds,
        validActivityTypes,
        validStatuses,
      }),
    )
  );
}

function isValidModuleCard(
  card,
  { userIds, validPriorities, validQcStatuses, validStatuses },
) {
  return Boolean(
    validStatuses.has(card.status) &&
      validPriorities.has(card.priority) &&
      validQcStatuses.has(card.qcStatus) &&
      userIds.has(card.clientId) &&
      userIds.has(card.createdBy) &&
      (!card.assigneeId || userIds.has(card.assigneeId)) &&
      Number.isFinite(card.estimateHours) &&
      card.estimateHours > 0 &&
      Number.isFinite(card.loggedHours) &&
      card.loggedHours >= 0 &&
      Number.isFinite(card.progress) &&
      card.progress >= 0 &&
      card.progress <= 100 &&
      Array.isArray(card.deliverables) &&
      Array.isArray(card.tags),
  );
}

function isValidComment(comment, { cardIds, userIds }) {
  return Boolean(
    cardIds.has(comment.cardId) &&
      userIds.has(comment.authorId) &&
      typeof comment.body === "string",
  );
}

function isValidActivity(
  activity,
  { cardIds, userIds, validActivityTypes, validStatuses },
) {
  return Boolean(
    cardIds.has(activity.cardId) &&
      userIds.has(activity.actorId) &&
      validActivityTypes.has(activity.type) &&
      (!activity.fromStatus || validStatuses.has(activity.fromStatus)) &&
      (!activity.toStatus || validStatuses.has(activity.toStatus)),
  );
}

function getNextSequenceFromIds(records, prefix) {
  return records.reduce((nextNumber, record) => {
    const id = String(record.id || "");

    if (!id.startsWith(prefix)) {
      return nextNumber;
    }

    const sequence = Number(id.slice(prefix.length));

    if (!Number.isInteger(sequence) || sequence < 1) {
      return nextNumber;
    }

    return Math.max(nextNumber, sequence + 1);
  }, 1);
}

function hasUniqueIds(records) {
  return new Set(records.map((record) => record.id)).size === records.length;
}

function cloneRecords(records) {
  return records.map((record) => cloneRecord(record));
}

function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record));
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
