export default function CriticalPathPanel({ path, tasksById, totalLength }) {
  if (!path || path.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-6 py-2.5 text-xs"
      style={{
        backgroundColor: "var(--tf-surface)",
        borderBottom: "1px solid var(--tf-surface-border)",
        color: "var(--tf-text)",
      }}
    >
      <span className="font-semibold" style={{ color: "var(--tf-critical-border)" }}>
        &#9733; Critical Path:
      </span>
      {path.map((id, i) => (
        <span key={id} className="flex items-center gap-2">
          <span className="tf-pill rounded-md px-2 py-0.5">
            {tasksById[id]?.title || id}
          </span>
          {i < path.length - 1 && <span className="tf-card-subtext">&rarr;</span>}
        </span>
      ))}
      <span className="tf-card-subtext ml-1">
        &bull; {totalLength} {totalLength === 1 ? "day" : "days"} total
      </span>
    </div>
  );
}
