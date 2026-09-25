// Dependency-free sanity check (uses Node's built-in assert, not Jest),
// since this sandbox has no network access to install packages.
// Mirrors dag.test.js exactly. Run with: node src/dag/verify.js
const assert = require("assert");
const { TaskGraph, CycleError, STATUS } = require("./dag");

function buildLinearChain() {
  const g = new TaskGraph();
  g.addTask({ id: "A", title: "A", startDate: 0, durationDays: 2 });
  g.addTask({ id: "B", title: "B", startDate: 0, durationDays: 3 });
  g.addTask({ id: "C", title: "C", startDate: 0, durationDays: 1 });
  g.addDependency("A", "B");
  g.addDependency("B", "C");
  return g;
}

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log("PASS:", name);
  } catch (e) {
    console.error("FAIL:", name, "\n   ", e.message);
    process.exitCode = 1;
  }
}

check("no prerequisites => Ready", () => {
  const g = new TaskGraph();
  g.addTask({ id: "A", title: "A" });
  assert.strictEqual(g.computeDerivedStatus("A"), STATUS.READY);
});

check("blocked until all prerequisites Done", () => {
  const g = buildLinearChain();
  g.recomputeAllStatuses();
  assert.strictEqual(g.getTask("A").status, STATUS.READY);
  assert.strictEqual(g.getTask("B").status, STATUS.BLOCKED);
  assert.strictEqual(g.getTask("C").status, STATUS.BLOCKED);
});

check("becomes Ready once direct prerequisite Done", () => {
  const g = buildLinearChain();
  g.getTask("A").status = STATUS.DONE;
  g.recomputeAllStatuses();
  assert.strictEqual(g.getTask("B").status, STATUS.READY);
  assert.strictEqual(g.getTask("C").status, STATUS.BLOCKED);
});

check("rejects direct cycle, graph unchanged", () => {
  const g = new TaskGraph();
  g.addTask({ id: "A", title: "A" });
  g.addTask({ id: "B", title: "B" });
  g.addDependency("A", "B");
  assert.throws(() => g.addDependency("B", "A"), CycleError);
  assert.strictEqual(g.edges.length, 1);
});

check("rejects indirect cycle A->B->C->A", () => {
  const g = new TaskGraph();
  ["A", "B", "C"].forEach((id) => g.addTask({ id, title: id }));
  g.addDependency("A", "B");
  g.addDependency("B", "C");
  assert.throws(() => g.addDependency("C", "A"), CycleError);
  assert.strictEqual(g.edges.length, 2);
});

check("rejects self-dependency", () => {
  const g = new TaskGraph();
  g.addTask({ id: "A", title: "A" });
  assert.throws(() => g.addDependency("A", "A"), CycleError);
});

check("DIAMOND: D moves +3 not +6 when A delayed by 3 days", () => {
  const g = new TaskGraph();
  g.addTask({ id: "A", title: "A", startDate: 0, durationDays: 2 });
  g.addTask({ id: "B", title: "B", startDate: 2, durationDays: 3 });
  g.addTask({ id: "C", title: "C", startDate: 2, durationDays: 4 });
  g.addTask({ id: "D", title: "D", startDate: 6, durationDays: 2 });
  g.addDependency("A", "B");
  g.addDependency("A", "C");
  g.addDependency("B", "D");
  g.addDependency("C", "D");

  assert.strictEqual(g.getTask("D").startDate, 6);

  g.updateTaskDates("A", { durationDays: 5 }); // +3 days

  assert.strictEqual(g.getTask("B").startDate, 5);
  assert.strictEqual(g.getTask("B").endDate, 8);
  assert.strictEqual(g.getTask("C").startDate, 5);
  assert.strictEqual(g.getTask("C").endDate, 9);
  assert.strictEqual(g.getTask("D").startDate, 9); // MAX(8,9)
  assert.strictEqual(g.getTask("D").startDate - 6, 3); // +3, NOT +6
});

check("propagation only touches reachable downstream subgraph", () => {
  const g = new TaskGraph();
  g.addTask({ id: "A", title: "A", startDate: 0, durationDays: 2 });
  g.addTask({ id: "B", title: "B", startDate: 2, durationDays: 2 });
  g.addTask({ id: "X", title: "Unrelated", startDate: 0, durationDays: 5 });
  g.addDependency("A", "B");

  const affected = g.updateTaskDates("A", { durationDays: 4 });
  assert.deepStrictEqual(affected, ["B"]);
  assert.strictEqual(g.getTask("X").startDate, 0);
});

check("rollback re-blocks downstream Ready task", () => {
  const g = buildLinearChain();
  g.getTask("A").status = STATUS.DONE;
  g.recomputeAllStatuses();
  assert.strictEqual(g.getTask("B").status, STATUS.READY);

  const { changed } = g.setTaskCompletion("A", false);

  assert.strictEqual(g.getTask("A").status, STATUS.READY);
  assert.strictEqual(g.getTask("B").status, STATUS.BLOCKED);
  assert.ok(changed.includes("B"));
});

check("manually-Done downstream task is not auto-reverted", () => {
  const g = buildLinearChain();
  g.getTask("A").status = STATUS.DONE;
  g.getTask("B").status = STATUS.DONE;
  g.recomputeAllStatuses();

  g.setTaskCompletion("A", false);

  assert.strictEqual(g.getTask("B").status, STATUS.DONE);
  assert.strictEqual(g.getTask("C").status, STATUS.READY);
});

check("recomputeFromInclusive updates the task itself, not just downstream", () => {
  const g = new TaskGraph();
  g.addTask({ id: "A", title: "A", startDate: 0, durationDays: 2 }); // ends 2
  g.addTask({ id: "B", title: "B", startDate: 0, durationDays: 3 }); // no preds yet
  g.addTask({ id: "C", title: "C", startDate: 0, durationDays: 1 });
  g.addDependency("B", "C");

  // Simulate: a NEW dependency A->B is added after B already existed.
  g.edges.push({ predecessorId: "A", successorId: "B" });
  const affected = g.recomputeFromInclusive("B");

  assert.deepStrictEqual(affected, ["B", "C"]);
  assert.strictEqual(g.getTask("B").startDate, 2); // B itself recalculated
  assert.strictEqual(g.getTask("B").endDate, 5);
  assert.strictEqual(g.getTask("C").startDate, 5); // downstream also recalculated
});

check("critical path finds the longest duration-weighted chain", () => {
  const g = new TaskGraph();
  g.addTask({ id: "A", title: "A", durationDays: 2 });
  g.addTask({ id: "B", title: "B", durationDays: 3 });
  g.addTask({ id: "C", title: "C", durationDays: 6 }); // longer alternate path
  g.addTask({ id: "D", title: "D", durationDays: 2 });
  g.addDependency("A", "B");
  g.addDependency("A", "C");
  g.addDependency("B", "D");
  g.addDependency("C", "D");
  // Path A->B->D = 2+3+2 = 7. Path A->C->D = 2+6+2 = 10. Critical path = 10.
  const cp = g.getCriticalPath();
  assert.strictEqual(cp.length, 10);
  assert.deepStrictEqual(cp.path, ["A", "C", "D"]);
});

console.log(`\n${passed}/12 checks passed.`);
