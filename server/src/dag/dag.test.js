const { TaskGraph, CycleError, STATUS } = require("./dag");

function buildLinearChain() {
  // A -> B -> C
  const g = new TaskGraph();
  g.addTask({ id: "A", title: "A", startDate: 0, durationDays: 2 }); // finishes day 2
  g.addTask({ id: "B", title: "B", startDate: 0, durationDays: 3 });
  g.addTask({ id: "C", title: "C", startDate: 0, durationDays: 1 });
  g.addDependency("A", "B");
  g.addDependency("B", "C");
  return g;
}

describe("status computation", () => {
  test("a task with no prerequisites is Ready", () => {
    const g = new TaskGraph();
    g.addTask({ id: "A", title: "A" });
    expect(g.computeDerivedStatus("A")).toBe(STATUS.READY);
  });

  test("a task is Blocked until ALL prerequisites are Done", () => {
    const g = buildLinearChain();
    g.recomputeAllStatuses();
    expect(g.getTask("A").status).toBe(STATUS.READY);
    expect(g.getTask("B").status).toBe(STATUS.BLOCKED);
    expect(g.getTask("C").status).toBe(STATUS.BLOCKED);
  });

  test("becomes Ready once its direct prerequisite is Done", () => {
    const g = buildLinearChain();
    g.getTask("A").status = STATUS.DONE;
    g.recomputeAllStatuses();
    expect(g.getTask("B").status).toBe(STATUS.READY);
    expect(g.getTask("C").status).toBe(STATUS.BLOCKED); // B not done yet
  });
});

describe("cycle prevention", () => {
  test("rejects a direct cycle and leaves the graph unchanged", () => {
    const g = new TaskGraph();
    g.addTask({ id: "A", title: "A" });
    g.addTask({ id: "B", title: "B" });
    g.addDependency("A", "B");
    expect(() => g.addDependency("B", "A")).toThrow(CycleError);
    expect(g.edges).toEqual([{ predecessorId: "A", successorId: "B" }]);
  });

  test("rejects an indirect cycle A->B->C->A", () => {
    const g = new TaskGraph();
    ["A", "B", "C"].forEach((id) => g.addTask({ id, title: id }));
    g.addDependency("A", "B");
    g.addDependency("B", "C");
    expect(() => g.addDependency("C", "A")).toThrow(CycleError);
    expect(g.edges).toHaveLength(2); // unchanged
  });

  test("rejects a self-dependency", () => {
    const g = new TaskGraph();
    g.addTask({ id: "A", title: "A" });
    expect(() => g.addDependency("A", "A")).toThrow(CycleError);
  });
});

describe("no-compounding propagation (diamond convergence)", () => {
  /**
   * The exact scenario from the problem statement:
   *        ┌──► B ──┐
   *   A ───┤        ├──► D
   *        └──► C ──┘
   * A extended by 3 days must move D by 3 days total — NOT 6 — even
   * though the delay reaches D via two separate paths.
   */
  test("D moves by +3 days, not +6, when A is delayed by 3 days", () => {
    const g = new TaskGraph();
    g.addTask({ id: "A", title: "A", startDate: 0, durationDays: 2 }); // ends day 2
    g.addTask({ id: "B", title: "B", startDate: 2, durationDays: 3 }); // ends day 5
    g.addTask({ id: "C", title: "C", startDate: 2, durationDays: 4 }); // ends day 6
    g.addTask({ id: "D", title: "D", startDate: 6, durationDays: 2 }); // ends day 8
    g.addDependency("A", "B");
    g.addDependency("A", "C");
    g.addDependency("B", "D");
    g.addDependency("C", "D");

    // Sanity check on the initial (pre-delay) schedule.
    expect(g.getTask("D").startDate).toBe(6);

    // Extend A by 3 days (2 -> 5 day duration), then propagate.
    g.updateTaskDates("A", { durationDays: 5 }); // A now ends day 5 (was day 2, +3)

    // B: predecessor A now ends day 5 -> B.start = 5, B.end = 5+3 = 8 (was 2->5, +3)
    expect(g.getTask("B").startDate).toBe(5);
    expect(g.getTask("B").endDate).toBe(8);

    // C: predecessor A now ends day 5 -> C.start = 5, C.end = 5+4 = 9 (was 2->6, +3)
    expect(g.getTask("C").startDate).toBe(5);
    expect(g.getTask("C").endDate).toBe(9);

    // D: predecessors B(end 8) and C(end 9) -> D.start = MAX(8,9) = 9
    // Originally D started at 6. New start is 9 => moved by +3, NOT +6.
    expect(g.getTask("D").startDate).toBe(9);
    expect(g.getTask("D").startDate - 6).toBe(3);
  });

  test("propagation only touches the reachable downstream subgraph", () => {
    const g = new TaskGraph();
    g.addTask({ id: "A", title: "A", startDate: 0, durationDays: 2 });
    g.addTask({ id: "B", title: "B", startDate: 2, durationDays: 2 });
    g.addTask({ id: "X", title: "Unrelated", startDate: 0, durationDays: 5 });
    g.addDependency("A", "B");

    const affected = g.updateTaskDates("A", { durationDays: 4 });
    expect(affected).toEqual(["B"]); // X is untouched, not even visited
    expect(g.getTask("X").startDate).toBe(0); // unchanged
  });
});

describe("recomputeFromInclusive (new dependency edge added)", () => {
  test("updates the task itself, not just its downstream", () => {
    const g = new TaskGraph();
    g.addTask({ id: "A", title: "A", startDate: 0, durationDays: 2 });
    g.addTask({ id: "B", title: "B", startDate: 0, durationDays: 3 });
    g.addTask({ id: "C", title: "C", startDate: 0, durationDays: 1 });
    g.addDependency("B", "C");

    g.edges.push({ predecessorId: "A", successorId: "B" }); // new edge added
    const affected = g.recomputeFromInclusive("B");

    expect(affected).toEqual(["B", "C"]);
    expect(g.getTask("B").startDate).toBe(2);
    expect(g.getTask("B").endDate).toBe(5);
    expect(g.getTask("C").startDate).toBe(5);
  });
});

describe("critical path (bonus)", () => {
  test("finds the longest duration-weighted chain", () => {
    const g = new TaskGraph();
    g.addTask({ id: "A", title: "A", durationDays: 2 });
    g.addTask({ id: "B", title: "B", durationDays: 3 });
    g.addTask({ id: "C", title: "C", durationDays: 6 });
    g.addTask({ id: "D", title: "D", durationDays: 2 });
    g.addDependency("A", "B");
    g.addDependency("A", "C");
    g.addDependency("B", "D");
    g.addDependency("C", "D");

    const cp = g.getCriticalPath();
    expect(cp.length).toBe(10);
    expect(cp.path).toEqual(["A", "C", "D"]);
  });
});

describe("rollback on regression", () => {
  test("reverting a Done prerequisite re-blocks a downstream Ready task", () => {
    const g = buildLinearChain(); // A -> B -> C
    g.getTask("A").status = STATUS.DONE;
    g.recomputeAllStatuses();
    expect(g.getTask("B").status).toBe(STATUS.READY);

    // A is dragged back from Done to an earlier column.
    const { changed } = g.setTaskCompletion("A", false);

    expect(g.getTask("A").status).toBe(STATUS.READY); // A itself has no prereqs
    expect(g.getTask("B").status).toBe(STATUS.BLOCKED); // re-blocked
    expect(changed).toEqual(expect.arrayContaining(["B"]));
  });

  test("a manually-Done downstream task is not auto-reverted (documented assumption)", () => {
    const g = buildLinearChain();
    g.getTask("A").status = STATUS.DONE;
    g.getTask("B").status = STATUS.DONE; // user marked B done too
    g.recomputeAllStatuses();

    g.setTaskCompletion("A", false);

    // B's own completion is a human fact (real, finished work) and is
    // preserved even though ITS prerequisite (A) regressed...
    expect(g.getTask("B").status).toBe(STATUS.DONE);
    // ...and because B is still Done, C (whose only direct prerequisite is
    // B, not A) correctly stays Ready — status only looks at DIRECT
    // prerequisites, so A's regression does not reach past B.
    expect(g.getTask("C").status).toBe(STATUS.READY);
  });
});
