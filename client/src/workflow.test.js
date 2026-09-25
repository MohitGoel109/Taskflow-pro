import assert from "node:assert/strict";
import test from "node:test";
import { canMoveTask, workflowOptions } from "./workflow.js";

test("ready task can move between workflow stages", () => {
  const task = { column: "Backlog", status: "Ready" };
  assert.equal(canMoveTask(task, "In Progress"), true);
  assert.equal(canMoveTask(task, "Done"), true);
});

test("blocked task can only remain in or return to Backlog", () => {
  const task = { column: "Backlog", status: "Blocked" };
  assert.equal(canMoveTask(task, "Backlog"), false);
  assert.equal(canMoveTask(task, "In Progress"), false);
  assert.equal(canMoveTask(task, "Review"), false);
  assert.equal(canMoveTask(task, "Done"), false);
});

test("current and unknown stages are disabled", () => {
  const options = workflowOptions({ column: "Review", status: "Ready" });
  assert.equal(options.find((option) => option.stage === "Review").disabled, true);
  assert.equal(canMoveTask({ column: "Review", status: "Ready" }, "Unknown"), false);
});
