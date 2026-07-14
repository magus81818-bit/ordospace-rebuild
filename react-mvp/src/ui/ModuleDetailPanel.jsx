import {
  getAvailableTransitions,
  getLifecycleStepForStatus,
  getRoleLabel,
  getStatusLabel,
} from "../domain/module-card.model.mjs";
import { DataPanel, MetricList } from "./Panel.jsx";

export function ModuleDetailPanel({
  activities,
  assigneeName,
  card,
  clientName,
  comments,
  role,
}) {
  const lifecycleStep = getLifecycleStepForStatus(card.status);
  const transitions = getAvailableTransitions(card, role);
  const metricRows = [
    { id: "status", label: "Status", value: getStatusLabel(card.status) },
    { id: "phase", label: "Phase", value: card.phase },
    { id: "priority", label: "Priority", value: card.priority },
    { id: "dueDate", label: "Due date", value: card.dueDate },
    { id: "assignee", label: "Assignee", value: assigneeName },
    { id: "client", label: "Client", value: clientName },
    {
      id: "progress",
      label: "Progress",
      value: `${card.progress}%`,
    },
    {
      id: "hours",
      label: "Hours",
      value: `${card.loggedHours}/${card.estimateHours}h`,
    },
    {
      id: "lifecycle",
      label: "Lifecycle",
      value: lifecycleStep?.label ?? "Unmapped",
    },
    {
      id: "openActions",
      label: `${getRoleLabel(role)} available actions`,
      value: String(transitions.length),
    },
  ];

  return (
    <div className="detail-stack">
      <DataPanel>
        <span className="card-kicker">{card.projectName}</span>
        <h2>{card.title}</h2>
        <p className="detail-summary">{card.summary}</p>
        <MetricList rows={metricRows} />
      </DataPanel>

      <DataPanel>
        <h2>Deliverables</h2>
        <ul className="detail-list">
          {card.deliverables.map((deliverable) => (
            <li key={deliverable}>{deliverable}</li>
          ))}
        </ul>
      </DataPanel>

      <DataPanel>
        <h2>Comments</h2>
        <div className="detail-feed">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <article className="feed-item" key={comment.id}>
                <strong>{comment.body}</strong>
                <span>{comment.createdAt}</span>
              </article>
            ))
          ) : (
            <p className="empty-note">No comments yet.</p>
          )}
        </div>
      </DataPanel>

      <DataPanel>
        <h2>Activity</h2>
        <div className="detail-feed">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <article className="feed-item" key={activity.id}>
                <strong>{activity.message}</strong>
                <span>{activity.createdAt}</span>
              </article>
            ))
          ) : (
            <p className="empty-note">No activity yet.</p>
          )}
        </div>
      </DataPanel>
    </div>
  );
}
