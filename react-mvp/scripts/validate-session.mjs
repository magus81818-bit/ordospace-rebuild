import assert from "node:assert/strict";

import { mvpSeed } from "../src/data/mvp-seed.mjs";
import { ROLES } from "../src/domain/module-card.model.mjs";
import {
  SESSION_STORAGE_KEY,
  clearStoredSession,
  createSession,
  getSafePostLoginPath,
  getSessionUser,
  getUserById,
  getUsersByRole,
  getWorkspacePathForRole,
  readStoredSession,
  saveSession,
} from "../src/session/session.service.mjs";

const storage = createMemoryStorage();
const admin = getUsersByRole(ROLES.ADMIN)[0];
const worker = getUsersByRole(ROLES.WORKER)[0];
const client = getUsersByRole(ROLES.CLIENT)[0];

assert.equal(mvpSeed.users.length, 4);
assert.equal(getUserById(admin.id).role, ROLES.ADMIN);
assert.equal(getWorkspacePathForRole(ROLES.WORKER), "/workspace/worker");

const session = createSession(worker.id, new Date("2026-06-30T00:00:00.000Z"));
saveSession(session, storage);

const storedSession = readStoredSession(storage);
assert.equal(storedSession.userId, worker.id);
assert.equal(storedSession.role, ROLES.WORKER);
assert.equal(getSessionUser(storedSession).email, worker.email);

assert.equal(
  getSafePostLoginPath("/workspace/admin", worker.role),
  "/workspace/worker",
);
assert.equal(getSafePostLoginPath("/workspace/client", client.role), "/workspace/client");
assert.equal(getSafePostLoginPath("/", admin.role), "/");

storage.setItem(
  SESSION_STORAGE_KEY,
  JSON.stringify({ version: 1, userId: "missing-user", role: ROLES.ADMIN }),
);
assert.equal(readStoredSession(storage), null);
assert.equal(storage.getItem(SESSION_STORAGE_KEY), null);

clearStoredSession(storage);
assert.equal(readStoredSession(storage), null);

console.log(
  JSON.stringify(
    {
      ok: true,
      users: mvpSeed.users.length,
      testedRoles: Object.values(ROLES),
      storageKey: SESSION_STORAGE_KEY,
    },
    null,
    2,
  ),
);

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}
