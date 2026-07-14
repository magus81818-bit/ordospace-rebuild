import assert from "node:assert/strict";

import { mvpSeed } from "../src/data/mvp-seed.mjs";
import { QC_STATUS, ROLES } from "../src/domain/module-card.model.mjs";
import { CLIENT_DECISIONS } from "../src/cards/module-card-actions.mjs";
import {
  NOTE_MAX_LENGTH,
  validateAdminCreateInput,
  validateClientDecisionInput,
  validateOptionalNote,
  validateWorkerUpdateInput,
} from "../src/cards/module-card-form-validation.mjs";

const workers = mvpSeed.users.filter((user) => user.role === ROLES.WORKER);
const assignedCard = mvpSeed.moduleCards.find((card) => card.id === "card-006");

const validCreateInput = {
  assigneeId: workers[0].id,
  deliverable: "Validation QA memo",
  dueDate: "2026-07-08",
  estimateHours: "8",
  phase: "QA",
  priority: "normal",
  summary: "Verify that validation states are clear before release.",
  title: "Validation polish",
};

assert.deepEqual(
  validateAdminCreateInput(validCreateInput, {
    today: new Date("2026-07-01T09:00:00.000Z"),
    workers,
  }),
  [],
);

const createErrors = validateAdminCreateInput(
  {
    assigneeId: "missing-worker",
    deliverable: "",
    dueDate: "2026-06-30",
    estimateHours: "0",
    phase: "",
    priority: "unknown",
    summary: "Too short",
    title: "No",
  },
  {
    today: new Date("2026-07-01T09:00:00.000Z"),
    workers,
  },
);

assert.equal(createErrors.length, 8);
assert.ok(createErrors.includes("Title must be at least 3 characters."));
assert.ok(createErrors.includes("Worker must be one of the available worker accounts."));
assert.ok(createErrors.includes("Due date cannot be in the past."));
assert.ok(createErrors.includes("Estimate hours must be between 1 and 200."));

assert.deepEqual(
  validateWorkerUpdateInput(
    {
      loggedHours: 3.5,
      note: "Progress validation looks clear.",
      progress: 42,
      qcStatus: QC_STATUS.IN_REVIEW,
    },
    assignedCard,
  ),
  [],
);

const workerErrors = validateWorkerUpdateInput(
  {
    loggedHours: -1,
    note: "x".repeat(NOTE_MAX_LENGTH + 1),
    progress: 120,
    qcStatus: "unknown",
  },
  assignedCard,
);

assert.equal(workerErrors.length, 4);
assert.ok(workerErrors.includes("Progress must be between 0 and 100."));
assert.ok(workerErrors.includes("Logged hours must be 0 or greater."));
assert.ok(workerErrors.includes("QC status is invalid."));
assert.ok(workerErrors.includes(`Team note must be ${NOTE_MAX_LENGTH} characters or fewer.`));

assert.deepEqual(
  validateWorkerUpdateInput(
    {
      loggedHours: assignedCard.loggedHours,
      note: "",
      progress: assignedCard.progress,
      qcStatus: assignedCard.qcStatus,
    },
    assignedCard,
  ),
  ["Change progress, hours, QC status, or add a note before saving."],
);

assert.deepEqual(validateOptionalNote("Short handoff note.", "Submission note"), []);
assert.deepEqual(validateOptionalNote("x".repeat(NOTE_MAX_LENGTH + 1), "Client note"), [
  `Client note must be ${NOTE_MAX_LENGTH} characters or fewer.`,
]);

assert.deepEqual(
  validateClientDecisionInput({
    decision: CLIENT_DECISIONS.APPROVE,
    note: "",
  }),
  [],
);

assert.deepEqual(
  validateClientDecisionInput({
    decision: CLIENT_DECISIONS.REQUEST_REVISION,
    note: "",
  }),
  ["Revision note is required when requesting a revision."],
);

assert.deepEqual(
  validateClientDecisionInput({
    decision: "unknown",
    note: "x".repeat(NOTE_MAX_LENGTH + 1),
  }),
  [
    "Client decision is invalid.",
    `Decision note must be ${NOTE_MAX_LENGTH} characters or fewer.`,
  ],
);

console.log(
  JSON.stringify(
    {
      ok: true,
      createErrorCount: createErrors.length,
      noteLimit: NOTE_MAX_LENGTH,
      workerErrorCount: workerErrors.length,
    },
    null,
    2,
  ),
);
