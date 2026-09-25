import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard.jsx";

// Reuses EXISTING theme variables (not new per-theme data) so every one of
// the 20 themes automatically gets sensibly-colored column accents for free.
const COLUMN_ACCENT_VAR = {
  Backlog: "--tf-subtext",
  "In Progress": "--tf-accent",
  Review: "--tf-critical-border",
  Done: "--tf-status-done-text",
};

export default function Column({
  id,
  title,
  tasks,
  onOpenTask,
  onStatusChange,
  criticalIds,
  onAddTask,
  draggingTask,
  getBlockedBy,
}) {
  const accentVar = COLUMN_ACCENT_VAR[id] || "--tf-subtext";

  return (
    <div
      className="tf-column flex w-72 shrink-0 flex-col"
      style={{ borderLeftWidth: "4px", borderLeftColor: `var(${accentVar})` }}
    >
      <div className="tf-column-header flex items-center justify-between px-3 py-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wide">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="tf-column-count text-xs">{tasks.length}</span>
          {id === "Backlog" && (
            <button
              onClick={onAddTask}
              title="Add task"
              className="tf-btn-secondary h-5 w-5 rounded-md border text-sm leading-5"
            >
              +
            </button>
          )}
        </div>
      </div>
      <Droppable droppableId={id}>
        {(provided, snapshot) => {
          // While something is being dragged, preview whether THIS column
          // would accept it: a Blocked task can only land back in Backlog.
          let dropState = "";
          if (snapshot.isDraggingOver && draggingTask) {
            const wouldBeRejected = draggingTask.status === "Blocked" && id !== "Backlog";
            dropState = wouldBeRejected ? "is-over-invalid" : "is-over-valid";
          }
          return (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={[
                "kanban-scroll tf-column-dropzone flex-1 space-y-2 overflow-y-auto p-2.5 min-h-[120px]",
                dropState,
              ].join(" ")}
            >
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onOpen={onOpenTask}
                  onStatusChange={onStatusChange}
                  isCritical={criticalIds.has(task.id)}
                  blockedBy={getBlockedBy(task)}
                />
              ))}
              {provided.placeholder}
            </div>
          );
        }}
      </Droppable>
    </div>
  );
}
