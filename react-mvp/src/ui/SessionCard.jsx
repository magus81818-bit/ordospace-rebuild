import { AppLink } from "./Button.jsx";
import { getRoleLabel } from "../domain/module-card.model.mjs";

export function SessionCard({ currentUser, isAuthenticated, onSignOut }) {
  if (isAuthenticated) {
    return (
      <div className="session-card">
        <span className="session-label">Signed in</span>
        <strong>{currentUser.name}</strong>
        <small>{getRoleLabel(currentUser.role)}</small>
        <button className="text-button" type="button" onClick={onSignOut}>
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="session-card">
      <span className="session-label">Session</span>
      <strong>Not signed in</strong>
      <small>Choose a seed account to continue.</small>
      <AppLink to="/auth" variant="text">
        Go to login
      </AppLink>
    </div>
  );
}
