/**
 * TaskFlow Pro — DAG Engine
 * -------------------------
 * A pure, framework-free module that owns ALL dependency/scheduling logic.
 * No Express, no Prisma, no HTTP in here — this is deliberate, so it can be
 * built and unit-tested completely independently of the UI/DB, per the
 * hackathon's own guidance ("test dependency/scheduling logic separately
 * before wiring it into the frontend").
 *
 * MODELING NOTE (documented assumption):
 * Dates are represented as plain integers ("day offsets from project start"),
 * not JS Date objects. This keeps the propagation math (and the tests) simple
 * and deterministic. Swapping in real calendar dates later only requires
 * changing how startDate/endDate/durationDays are stored — the algorithm
 * itself (MAX of prerequisite finish dates) does not change.
 *
 * STATUS MODEL:
 *   - "Done"    : manually set by the user — represents real, completed work.
 *   - "Ready"   : all direct prerequisites are Done (or task has none).
 *   - "Blocked" : at least one direct prerequisite is not Done.
 *
 * ASSUMPTION (rollback semantics): a task's "Done" status is a human fact
 * about the real world (the work is actually finished) and is therefore
 * NEVER auto-reverted by propagation — only Ready/Blocked are recomputed
 * automatically. If an upstream task regresses from Done back to an earlier
 * column, downstream tasks that were "Ready" (not yet started) correctly
 * flip back to "Blocked". This is called out explicitly in the README as a
 * design decision, since the problem statement is ambiguous on whether an
 * already-"Done" downstream task should also be forced backward.
 */

class CycleError extends Error {
  constructor(message) {
    super(message);
    this.name = "CycleError";
  }
}

const STATUS = Object.freeze({
  BLOCKED: "Blocked",
  READY: "Ready",
  DONE: "Done",
});

const MAX_PROJECT_DAY = 2_147_483_647;

function isValidSchedule(startDate, durationDays) {
  return (
    Number.isInteger(startDate) &&
    startDate >= 0 &&
    Number.isInteger(durationDays) &&
    durationDays > 0 &&
    startDate + durationDays <= MAX_PROJECT_DAY
  );
}

class TaskGraph {
  constructor() {
    /** @type {Map<string, {id:string,title:string,status:string,startDate:number,endDate:number,durationDays:number}>} */
    this.tasks = new Map();
    /** @type {Array<{predecessorId:string, successorId:string}>} */
    this.edges = [];
  }

  // ---------- Basic graph mutation ----------

  addTask(task) {
    if (this.tasks.has(task.id)) {
      throw new Error(`Task ${task.id} already exists`);
    }
    this.tasks.set(task.id, {
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      // "column" (Backlog/In Progress/Review/Done) is a Kanban/UI concept,
      // carried alongside but never read by the DAG algorithms themselves —
      // only "status" (Blocked/Ready/Done) drives dependency logic.
      column: task.column ?? "Backlog",
      status: task.status || STATUS.READY,
      startDate: task.startDate ?? 0,
      durationDays: task.durationDays ?? 1,
      endDate:
        task.endDate ?? (task.startDate ?? 0) + (task.durationDays ?? 1),
    });
  }

  getTask(id) {
    const t = this.tasks.get(id);
    if (!t) throw new Error(`Unknown task: ${id}`);
    return t;
  }

  getPredecessors(taskId) {
    return this.edges
      .filter((e) => e.successorId === taskId)
      .map((e) => e.predecessorId);
  }

  getSuccessors(taskId) {
    return this.edges
      .filter((e) => e.predecessorId === taskId)
      .map((e) => e.successorId);
  }

  // ---------- Cycle-safe dependency creation ----------

  /**
   * Would adding predecessorId -> successorId create a cycle?
   * True if successorId can already reach predecessorId (directly or
   * indirectly) via existing edges — adding the new edge would then close
   * a loop. Runs on the CURRENT graph before any mutation, so callers can
   * reject the edge without ever touching graph state.
   */
  wouldCreateCycle(predecessorId, successorId) {
    if (predecessorId === successorId) return true; // self-dependency
    const visited = new Set();
    const stack = [successorId];
    while (stack.length) {
      const current = stack.pop();
      if (current === predecessorId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const next of this.getSuccessors(current)) stack.push(next);
    }
    return false;
  }

  /**
   * Adds a validated dependency edge. Throws CycleError (graph left
   * completely unchanged) if the edge would create a cycle, per the
   * "No Cycles" requirement: reject + notify, do not persist, existing
   * graph stays valid.
   */
  addDependency(predecessorId, successorId) {
    if (!this.tasks.has(predecessorId) || !this.tasks.has(successorId)) {
      throw new Error("Both tasks must exist before adding a dependency");
    }
    const alreadyExists = this.edges.some(
      (e) =>
        e.predecessorId === predecessorId && e.successorId === successorId
    );
    if (alreadyExists) return; // idempotent no-op

    if (this.wouldCreateCycle(predecessorId, successorId)) {
      throw new CycleError(
        `Adding "${predecessorId} -> ${successorId}" would create a circular dependency. ` +
          `Rejected — existing graph is unchanged.`
      );
    }
    this.edges.push({ predecessorId, successorId });
  }

  // ---------- Topological ordering ----------

  topologicalOrder() {
    const visited = new Set();
    const visiting = new Set();
    const result = [];

    const visit = (id) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        // Should be unreachable if addDependency's cycle check is always
        // used, but guarded here too since this method is also useful for
        // validating a graph loaded fresh from the database.
        throw new CycleError(`Cycle detected while sorting graph at "${id}"`);
      }
      visiting.add(id);
      for (const succ of this.getSuccessors(id)) visit(succ);
      visiting.delete(id);
      visited.add(id);
      result.push(id);
    };

    for (const id of this.tasks.keys()) visit(id);
    return result.reverse(); // predecessors before successors
  }

  /** All task ids reachable downstream from startId (exclusive), in topo order. */
  downstreamSubgraphTopo(startId) {
    const reachable = new Set();
    const stack = [startId];
    while (stack.length) {
      const current = stack.pop();
      for (const succ of this.getSuccessors(current)) {
        if (!reachable.has(succ)) {
          reachable.add(succ);
          stack.push(succ);
        }
      }
    }
    const fullOrder = this.topologicalOrder();
    return fullOrder.filter((id) => reachable.has(id));
  }

  // ---------- Status computation ----------

  /**
   * Computes what a task's status SHOULD be, given its direct prerequisites.
   * Does not mutate. "Done" is never overridden here — see module doc.
   */
  computeDerivedStatus(taskId) {
    const task = this.getTask(taskId);
    if (task.status === STATUS.DONE) return STATUS.DONE;
    const preds = this.getPredecessors(taskId);
    if (preds.length === 0) return STATUS.READY;
    const allDone = preds.every((pid) => this.getTask(pid).status === STATUS.DONE);
    return allDone ? STATUS.READY : STATUS.BLOCKED;
  }

  /**
   * Recomputes Ready/Blocked for every task whose status isn't manually
   * "Done", in topological order (so a task's own recompute always sees
   * its predecessors' up-to-date status first).
   */
  recomputeAllStatuses() {
    const order = this.topologicalOrder();
    const changed = [];
    for (const id of order) {
      const task = this.getTask(id);
      if (task.status === STATUS.DONE) continue; // human fact, not overridden
      const next = this.computeDerivedStatus(id);
      if (next !== task.status) {
        task.status = next;
        changed.push(id);
      }
    }
    return changed;
  }

  // ---------- Scheduling propagation (no compounding) ----------

  /**
   * THE core "no compounding" rule:
   *   successor.start = MAX(finish dates of ALL direct prerequisites)
   *
   * Because every node derives its date once from the CURRENT state of its
   * own direct prerequisites — not by summing every path that leads into
   * it — converging paths (e.g. A->B->D and A->C->D) collapse to a single,
   * correct impact at D instead of compounding per path.
   *
   * Only the downstream subgraph reachable from changedTaskId is touched
   * (O(affected nodes), not O(all tasks) on the board), and it's processed
   * in topological order so each node sees already-updated predecessors.
   */
  propagateSchedule(changedTaskId) {
    const affected = this.downstreamSubgraphTopo(changedTaskId);
    for (const id of affected) {
      const task = this.getTask(id);
      const preds = this.getPredecessors(id);
      if (preds.length === 0) continue;
      const latestFinish = Math.max(
        ...preds.map((pid) => this.getTask(pid).endDate)
      );
      task.startDate = latestFinish; // finish-to-start, no lag, for MVP
      task.endDate = task.startDate + task.durationDays;
    }
    this.recomputeAllStatuses();
    return affected;
  }

  /**
   * Like propagateSchedule, but INCLUDES taskId itself in the recompute —
   * needed when a task just gained a brand-new predecessor (e.g. a fresh
   * dependency edge was added) and its OWN schedule/status must be
   * recalculated, not just everything downstream of it.
   */
  recomputeFromInclusive(taskId) {
    const downstream = this.downstreamSubgraphTopo(taskId);
    const affected = [taskId, ...downstream];
    for (const id of affected) {
      const task = this.getTask(id);
      const preds = this.getPredecessors(id);
      if (preds.length === 0) continue;
      const latestFinish = Math.max(
        ...preds.map((pid) => this.getTask(pid).endDate)
      );
      task.startDate = latestFinish;
      task.endDate = task.startDate + task.durationDays;
    }
    this.recomputeAllStatuses();
    return affected;
  }

  /**
   * BONUS: Critical Path — the longest duration-weighted chain through the
   * DAG. Classic DP over a topological order: longest[node] = duration[node]
   * + max(longest[pred]) across its direct prerequisites (0 if none).
   * Returns { length, path } for the single longest chain in the graph.
   */
  getCriticalPath() {
    const order = this.topologicalOrder();
    const best = new Map(); // taskId -> { length, path }
    for (const id of order) {
      const task = this.getTask(id);
      const preds = this.getPredecessors(id);
      if (preds.length === 0) {
        best.set(id, { length: task.durationDays, path: [id] });
        continue;
      }
      let winner = null;
      for (const pid of preds) {
        const predBest = best.get(pid);
        const candidate = predBest.length + task.durationDays;
        if (!winner || candidate > winner.length) {
          winner = { length: candidate, path: [...predBest.path, id] };
        }
      }
      best.set(id, winner);
    }
    let overall = { length: 0, path: [] };
    for (const [, val] of best) {
      if (val.length > overall.length) overall = val;
    }
    return overall;
  }

  /**
   * Convenience: change a task's own dates (e.g. user edits it directly),
   * then propagate the effect downstream.
   */
  updateTaskDates(taskId, { startDate, durationDays }) {
    const task = this.getTask(taskId);
    if (startDate !== undefined) task.startDate = startDate;
    if (durationDays !== undefined) task.durationDays = durationDays;
    task.endDate = task.startDate + task.durationDays;
    return this.propagateSchedule(taskId);
  }

  /**
   * Rollback: move a task's status backward (e.g. Done -> In Progress).
   * "In Progress" and "Backlog"/"Review" are Kanban COLUMN concepts, not
   * dependency-STATUS concepts — but the one column transition that matters
   * to the DAG is "no longer Done". Callers pass isStillDone=false when a
   * previously-Done task is dragged back to any earlier column.
   */
  setTaskCompletion(taskId, isDone) {
    const task = this.getTask(taskId);
    task.status = isDone ? STATUS.DONE : STATUS.BLOCKED; // placeholder; recompute below fixes non-Done case
    if (!isDone) {
      // Let recompute decide Ready vs Blocked based on ITS OWN prerequisites
      task.status = this.getPredecessors(taskId).length
        ? this.computeDerivedStatus(taskId)
        : STATUS.READY;
    }
    // Downstream tasks may now be blocked because this task is no longer Done.
    const affected = this.downstreamSubgraphTopo(taskId);
    const changed = this.recomputeAllStatuses();
    return { affected, changed };
  }
}

module.exports = { TaskGraph, CycleError, STATUS, isValidSchedule };
