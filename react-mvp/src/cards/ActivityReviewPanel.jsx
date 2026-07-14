import { AppLink, DataPanel, MetricList } from "../ui/index.js";

export function ActivityReviewPanel({ review, role }) {
  return (
    <DataPanel className="activity-review-panel">
      <div>
        <span className="card-kicker">{role} audit</span>
        <h2>Recent lifecycle activity</h2>
        <p className="panel-copy">
          This view is scoped to the ModuleCards available to the signed-in
          role and uses the persisted activity log.
        </p>
      </div>

      <MetricList rows={review.metrics} />

      <div className="activity-review-list">
        {review.items.length > 0 ? (
          review.items.map((item) => (
            <article className="activity-review-item" key={item.id}>
              <div>
                <span>{item.typeLabel}</span>
                <strong>{item.cardTitle}</strong>
                <p>{item.message}</p>
              </div>
              <dl>
                <div>
                  <dt>Actor</dt>
                  <dd>{item.actorLabel}</dd>
                </div>
                <div>
                  <dt>When</dt>
                  <dd>{item.createdAt}</dd>
                </div>
                {item.statusChange ? (
                  <div>
                    <dt>Status</dt>
                    <dd>{item.statusChange}</dd>
                  </div>
                ) : null}
              </dl>
              {item.detailTo ? (
                <div className="activity-review-actions">
                  <AppLink to={item.detailTo} variant="secondary">
                    Open card
                  </AppLink>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p className="empty-note">No visible activity yet.</p>
        )}
      </div>
    </DataPanel>
  );
}
