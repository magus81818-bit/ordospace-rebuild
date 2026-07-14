export function StatusCard({ meta, title, value }) {
  return (
    <article className="status-card">
      <span>{title}</span>
      <strong>{value}</strong>
      {meta ? <small>{meta}</small> : null}
    </article>
  );
}

export function StatusGrid({ ariaLabel, children, compact = false }) {
  return (
    <div
      aria-label={ariaLabel}
      className={compact ? "status-grid compact-grid" : "status-grid"}
    >
      {children}
    </div>
  );
}
