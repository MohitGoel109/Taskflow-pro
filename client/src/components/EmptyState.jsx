export default function EmptyState({ onLoadDemo, onAddTask, seeding }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <p className="text-lg font-semibold">The board is empty</p>
      <p className="tf-card-subtext max-w-sm text-sm">
        Get started by adding your first task, or load a realistic demo
        board with dependencies already wired up.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={onAddTask}
          className="tf-btn-secondary rounded-md border px-4 py-2 text-sm font-medium"
        >
          Add a task
        </button>
        <button
          onClick={onLoadDemo}
          disabled={seeding}
          className="tf-btn-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          {seeding ? "Loading\u2026" : "Load demo data"}
        </button>
      </div>
    </div>
  );
}
