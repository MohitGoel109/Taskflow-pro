import ThemePicker from "./ThemePicker.jsx";

export default function Header({
  onSuggestAI,
  aiLoading,
  criticalPathOn,
  onToggleCriticalPath,
  criticalPathLength,
}) {
  return (
    <header className="tf-header flex items-center justify-between px-6 py-3.5">
      <div>
        <h1 className="tf-heading text-xl font-extrabold tracking-tight">TaskFlow Pro</h1>
        <p className="tf-header-subtext text-xs">Dependency-aware Kanban, backed by a DAG engine</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleCriticalPath}
          className={[
            "tf-btn-secondary rounded-md border px-3 py-1.5 text-xs font-medium transition",
            criticalPathOn ? "is-active" : "",
          ].join(" ")}
        >
          &#9733; Critical Path{criticalPathOn && criticalPathLength != null ? ` (${criticalPathLength}d)` : ""}
        </button>
        <ThemePicker />
        <button
          onClick={onSuggestAI}
          disabled={aiLoading}
          className="tf-btn-primary rounded-md px-3 py-1.5 text-xs font-medium"
        >
          {aiLoading ? "Thinking\u2026" : "Suggest Dependencies (AI)"}
        </button>
      </div>
    </header>
  );
}
