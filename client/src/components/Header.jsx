import ThemePicker from "./ThemePicker.jsx";

export default function Header({
  onSuggestAI,
  aiLoading,
  criticalPathOn,
  onToggleCriticalPath,
  criticalPathLength,
  tasks,
  scheduleState,
}) {
  const invalidSchedules = tasks.filter(
    ({ startDate, durationDays, endDate }) =>
      !Number.isInteger(startDate) ||
      startDate < 0 ||
      !Number.isInteger(durationDays) ||
      durationDays <= 0 ||
      startDate + durationDays > 2_147_483_647 ||
      endDate !== startDate + durationDays
  ).length;

  const scheduleLabel =
    scheduleState === "loading"
      ? "Checking schedules..."
      : scheduleState === "unavailable"
        ? "Schedule check unavailable"
        : tasks.length === 0
          ? "Schedule checks: no tasks"
          : invalidSchedules === 0
            ? `Schedule checks: ${tasks.length}/${tasks.length} valid`
            : `Schedule issues: ${invalidSchedules} task${invalidSchedules === 1 ? "" : "s"}`;

  const scheduleClass =
    scheduleState !== "ready"
      ? "is-pending"
      : invalidSchedules > 0
        ? "is-invalid"
        : "is-valid";

  return (
    <header className="tf-header flex items-center justify-between px-6 py-3.5">
      <div>
        <h1 className="tf-heading text-xl font-extrabold tracking-tight">TaskFlow Pro</h1>
        <p className="tf-header-subtext text-xs">Dependency-aware Kanban, backed by a DAG engine</p>
        <span
          className={`tf-schedule-health ${scheduleClass}`}
          role="status"
          aria-live="polite"
          title="Checks non-negative whole-day starts, positive whole-day durations, and matching end days."
        >
          {scheduleLabel}
        </span>
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
