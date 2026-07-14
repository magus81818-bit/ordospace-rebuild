import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  clearStoredSession,
  createSession,
  getSessionUser,
  readStoredSession,
  saveSession,
} from "./session.service.mjs";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());

  const signIn = useCallback((userId) => {
    const nextSession = createSession(userId);
    saveSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const signOut = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);

  const currentUser = useMemo(() => getSessionUser(session), [session]);

  const value = useMemo(
    () => ({
      session,
      currentUser,
      isAuthenticated: Boolean(session && currentUser),
      signIn,
      signOut,
    }),
    [currentUser, session, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return context;
}
