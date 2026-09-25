import { DragDropContext } from "@hello-pangea/dnd";
import Column from "./Column.jsx";

const COLUMNS = ["Backlog", "In Progress", "Review", "Done"];

// For a Blocked task, find the titles of its direct predecessors that
// aren't Done yet — this is what powers the "Why blocked?" expand on cards.
function computeBlockedBy(task, edges, tasksById) {
  if (task.status !== "Blocked") return [];
  return edges
    .filter((e) => e.successorId === task.id)
    .map((e) => tasksById[e.predecessorId])
    .filter((p) => p && p.status !== "Done")
    .map((p) => p.title);
}

export default function Board({
  tasks,
  edges,
  onDragEnd,
  onDragStart,
  onOpenTask,
  criticalIds,
  onAddTask,
  draggingTask,
}) {
  const tasksById = Object.fromEntries(tasks.map((t) => [t.id, t]));
  const byColumn = Object.fromEntries(
    COLUMNS.map((c) => [c, tasks.filter((t) => t.column === c)])
  );

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-6">
        {COLUMNS.map((col) => (
          <Column
            key={col}
            id={col}
            title={col}
            tasks={byColumn[col]}
            onOpenTask={onOpenTask}
            criticalIds={criticalIds}
            onAddTask={onAddTask}
            draggingTask={draggingTask}
            getBlockedBy={(task) => computeBlockedBy(task, edges, tasksById)}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
