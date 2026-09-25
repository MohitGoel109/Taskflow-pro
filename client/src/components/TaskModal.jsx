import { useState } from "react";

export default function TaskModal({
  task, // null => create mode; object => edit mode
  allTasks,
  edges,
  onClose,
  onCreate,
  onSave,
  onAddDependency,
  onRemoveDependency,
  error,
}) {
  const isEdit = Boolean(task);
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [durationDays, setDurationDays] = useState(task?.durationDays || 1);
  const [newPredecessorId, setNewPredecessorId] = useState("");
  const [saving, setSaving] = useState(false);

  const predecessors = isEdit
    ? edges.filter((e) => e.successorId === task.id).map((e) => e.predecessorId)
    : [];
  const successors = isEdit
    ? edges.filter((e) => e.predecessorId === task.id).map((e) => e.successorId)
    : [];

  const candidatePredecessors = isEdit
    ? allTasks.filter((t) => t.id !== task.id && !predecessors.includes(t.id))
    : [];

  const taskById = (id) => allTasks.find((t) => t.id === id);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await onSave(task.id, { title, description, durationDays: Number(durationDays) });
      } else {
        await onCreate({ title, description, durationDays: Number(durationDays) });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPredecessor() {
    if (!newPredecessorId) return;
    await onAddDependency(newPredecessorId, task.id);
    setNewPredecessorId("");
  }

  return (
    <div className="tf-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="tf-modal w-full max-w-lg shadow-xl">
        <div className="tf-modal-header flex items-center justify-between px-5 py-3.5">
          <h3 className="text-base font-semibold">
            {isEdit ? "Edit Task" : "New Task"}
          </h3>
          <button onClick={onClose} className="tf-card-subtext hover:opacity-70">
            &#10005;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {error && (
            <div className="tf-badge-blocked rounded-md border px-3 py-2 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="tf-card-subtext block text-xs font-medium mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="tf-input w-full rounded-md px-3 py-1.5 text-sm"
              placeholder="e.g. Build Backend API"
            />
          </div>

          <div>
            <label className="tf-card-subtext block text-xs font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="tf-input w-full rounded-md px-3 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="tf-card-subtext block text-xs font-medium mb-1">Duration (days)</label>
            <input
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="tf-input w-28 rounded-md px-3 py-1.5 text-sm"
            />
          </div>

          {isEdit && (
            <div className="tf-column rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">
                  Status: <span className="font-normal">{task.status}</span>
                </span>
                <span className="tf-card-subtext text-xs">
                  day {task.startDate}&ndash;{task.endDate}
                </span>
              </div>

              <p className="tf-card-subtext text-[11px] font-medium mb-1">Depends on (predecessors)</p>
              {predecessors.length === 0 && (
                <p className="tf-card-subtext text-xs mb-2">None yet.</p>
              )}
              <ul className="space-y-1 mb-2">
                {predecessors.map((pid) => (
                  <li
                    key={pid}
                    className="tf-pill flex items-center justify-between rounded-md px-2 py-1 text-xs"
                  >
                    <span>{taskById(pid)?.title || pid}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveDependency(pid, task.id)}
                      style={{ color: "var(--tf-status-blocked-text)" }}
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>

              {candidatePredecessors.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={newPredecessorId}
                    onChange={(e) => setNewPredecessorId(e.target.value)}
                    className="tf-input flex-1 rounded-md px-2 py-1 text-xs"
                  >
                    <option value="">Add a predecessor&hellip;</option>
                    {candidatePredecessors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddPredecessor}
                    disabled={!newPredecessorId}
                    className="tf-btn-primary rounded-md px-3 py-1 text-xs font-medium disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              )}

              {successors.length > 0 && (
                <>
                  <p className="tf-card-subtext text-[11px] font-medium mt-3 mb-1">Blocks (successors)</p>
                  <ul className="space-y-1">
                    {successors.map((sid) => (
                      <li key={sid} className="tf-pill rounded-md px-2 py-1 text-xs">
                        {taskById(sid)?.title || sid}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="tf-btn-secondary rounded-md px-3 py-1.5 text-sm"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="tf-btn-primary rounded-md px-4 py-1.5 text-sm font-medium"
            >
              {saving ? "Saving\u2026" : isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
