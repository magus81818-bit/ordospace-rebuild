import {
  getAvailableTransitions,
  getLifecycleStepForStatus,
  getRoleLabel,
  getStatusLabel,
} from "../domain/module-card.model.mjs";
import { AppLink } from "./Button.jsx";

export function ModulePreviewCard({ assigneeName, card, clientName, detailTo, role }) {
  const lifecycleStep = getLifecycleStepForStatus(card.status);
  const transitions = getAvailableTransitions(card, role);

  return (
    <article className="module-preview">
      <div>
        <span className="card-kicker">{card.phase}</span>
        <h2>{card.title}</h2>
        <p>{card.summary}</p>
      </div>
      <dl className="card-meta">
        <div>
          <dt>Status</dt>
          <dd>{getStatusLabel(card.status)}</dd>
        </div>
        <div>
          <dt>Lifecycle</dt>
          <dd>{lifecycleStep?.label ?? "Unmapped"}</dd>
        </div>
        <div>
          <dt>Actions</dt>
          <dd>{transitions.length}</dd>
        </div>
        <div>
          <dt>Assignee</dt>
          <dd>{assigneeName}</dd>
        </div>
        <div>
          <dt>Client</dt>
          <dd>{clientName}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{getRoleLabel(role)}</dd>
        </div>
      </dl>
      {detailTo ? (
        <div className="module-preview-actions">
          <AppLink to={detailTo}>Open detail</AppLink>
        </div>
      ) : null}
    </article>
  );
}
