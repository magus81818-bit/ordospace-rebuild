import { mvpSeed } from "../data/mvp-seed.mjs";

export const SESSION_STORAGE_KEY = "ordospace.reactMvp.session.v1";
export const SESSION_VERSION = 1;

export function getUserById(userId) {
  return mvpSeed.users.find((user) => user.id === userId) ?? null;
}

export function getUsersByRole(role) {
  return mvpSeed.users.filter((user) => user.role === role);
}

export function createSession(userId, now = new Date()) {
  const user = getUserById(userId);

  if (!user) {
    throw new Error(`Cannot create a session for unknown user ${userId}`);
  }

  return {
    version: SESSION_VERSION,
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    signedInAt: now.toISOString(),
  };
}

export function normalizeSession(value) {
  if (!value || value.version !== SESSION_VERSION || !value.userId) {
    return null;
  }

  const user = getUserById(value.userId);

  if (!user || user.role !== value.role) {
    return null;
  }

  return {
    version: SESSION_VERSION,
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    signedInAt:
      typeof value.signedInAt === "string"
        ? value.signedInAt
        : new Date().toISOString(),
  };
}

export function readStoredSession(storage = getBrowserStorage()) {
  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(SESSION_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const session = normalizeSession(JSON.parse(rawValue));

    if (!session) {
      storage.removeItem(SESSION_STORAGE_KEY);
    }

    return session;
  } catch {
    storage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function saveSession(session, storage = getBrowserStorage()) {
  if (!storage) {
    return;
  }

  const normalizedSession = normalizeSession(session);

  if (!normalizedSession) {
    storage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalizedSession));
}

export function clearStoredSession(storage = getBrowserStorage()) {
  if (!storage) {
    return;
  }

  storage.removeItem(SESSION_STORAGE_KEY);
}

export function getSessionUser(session) {
  return session ? getUserById(session.userId) : null;
}

export function getWorkspacePathForRole(role) {
  return role ? `/workspace/${role}` : "/auth";
}

export function getSafePostLoginPath(requestedPath, role) {
  const workspacePath = getWorkspacePathForRole(role);

  if (!requestedPath || requestedPath === "/auth") {
    return workspacePath;
  }

  if (requestedPath === "/" || requestedPath === workspacePath) {
    return requestedPath;
  }

  if (requestedPath.startsWith(`${workspacePath}/`)) {
    return requestedPath;
  }

  return workspacePath;
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
