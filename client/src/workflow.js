export const WORKFLOW_STAGES = ["Backlog", "In Progress", "Review", "Done"];

export function canMoveTask(task, stage) {
  if (!WORKFLOW_STAGES.includes(stage)) return false;
  if (task.status === "Blocked" && stage !== "Backlog") return false;
  return stage !== task.column;
}

export function workflowOptions(task) {
  return WORKFLOW_STAGES.map((stage) => ({
    stage,
    disabled: !canMoveTask(task, stage),
  }));
}
