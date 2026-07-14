import { DataPanel } from "./Panel.jsx";

export function FormFeedback({ errors = [], success = "" }) {
  if (errors.length > 0) {
    return (
      <div className="form-feedback is-error" role="alert">
        <strong>Review the fields</strong>
        <ul>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (success) {
    return (
      <p className="form-feedback is-success" role="status">
        {success}
      </p>
    );
  }

  return null;
}

export function EmptyStatePanel({ actions = null, copy, title }) {
  return (
    <DataPanel className="empty-state-panel">
      <div>
        <span className="card-kicker">Empty state</span>
        <h2>{title}</h2>
        <p className="panel-copy">{copy}</p>
      </div>
      {actions ? <div className="empty-state-actions">{actions}</div> : null}
    </DataPanel>
  );
}
