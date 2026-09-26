import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";

const STATUS_CLASS = {
  Blocked: "tf-badge-blocked",
  Ready: "tf-badge-ready",
  Done: "tf-badge-done",
};

// Small icon alongside color so status is scannable without relying on
// color alone (also just faster to read at a glance during a demo).
const STATUS_ICON = {
  Blocked: "\uD83D\uDD12", // lock
  Ready: "\u25CF", // dot
  Done: "\u2713", // check
};
import { WORKFLOW_STAGES, canMoveTask } from "../workflow.js";

export default function TaskCard({ task, index, onOpen, onStatusChange, isCritical, blockedBy = [] }) {
  const [showReason, setShowReason] = useState(false);
  const [stepperOpen, setStepperOpen] = useState(false);
  const isBlocked = task.status === "Blocked";

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpen(task)}
          className={[
            "tf-card p-3 cursor-pointer transition",
            "hover:-translate-y-0.5",
            snapshot.isDragging ? "is-dragging" : "",
            isCritical ? "is-critical" : "",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-snug">
              {task.title}
            </p>
            {isCritical && (
              <span
                title="On the critical path"
                className="shrink-0 text-xs font-bold"
                style={{ color: "var(--tf-critical-border)" }}
              >
                &#9733;
              </span>
            )}
          </div>
          {task.description && (
            <p className="tf-card-subtext mt-1 text-xs line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              aria-expanded={stepperOpen}
              aria-label={`Change workflow stage for ${task.title}`}
              onClick={(event) => {
                event.stopPropagation();
                setStepperOpen((open) => !open);
              }}
              className={`tf-badge tf-status-trigger inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASS[task.status] || ""}`}
            >
              <span aria-hidden="true">{STATUS_ICON[task.status]}</span>
              {task.status}
            </button>
            <span className="tf-card-subtext text-[11px]">
              day {task.startDate}&ndash;{task.endDate}
            </span>
          </div>

          {stepperOpen && (
            <div className="tf-workflow-stepper" onClick={(event) => event.stopPropagation()}>
              {WORKFLOW_STAGES.map((stage, stageIndex) => {
                const disabled = !canMoveTask(task, stage);
                return (
                  <span key={stage} className="tf-workflow-step-wrap">
                    <button
                      type="button"
                      disabled={disabled || stage === task.column}
                      className={`tf-workflow-step ${stage === task.column ? "is-current" : ""}`}
                      title={disabled ? "Finish prerequisites before moving this task" : `Move to ${stage}`}
                      onClick={() => {
                        setStepperOpen(false);
                        onStatusChange(task.id, stage);
                      }}
                    >
                      {stage}
                    </button>
                    {stageIndex < WORKFLOW_STAGES.length - 1 && <span className="tf-workflow-arrow" aria-hidden="true">&#8594;</span>}
                  </span>
                );
              })}
            </div>
          )}

          {isBlocked && blockedBy.length > 0 && (
            <div className="mt-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // don't also open the task modal
                  setShowReason((prev) => !prev);
                }}
                className="text-[11px] font-medium underline"
                style={{ color: "var(--tf-subtext)" }}
              >
                {showReason ? "Hide reason" : "Why blocked?"}
              </button>
              {showReason && (
                <p className="tf-card-subtext mt-1 text-[11px] leading-snug">
                  Waiting on: {blockedBy.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
