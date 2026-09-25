const express = require("express");
const { randomUUID } = require("crypto");
const { prisma, graph, persistTasks, hydrate } = require("../graphStore");
const { CycleError } = require("../dag/dag");
const { suggestDependencies } = require("../ai/suggestDependencies");
const { SEED_DEFS, SEED_EDGES } = require("../seedData");

const router = express.Router();

function serializeTask(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    column: t.column,
    status: t.status,
    startDate: t.startDate,
    endDate: t.endDate,
    durationDays: t.durationDays,
  };
}

// ---------- GET /board ----------
// Full board state, served straight from memory: tasks (with live computed
// status/dates) + the dependency edges.
router.get("/board", (_req, res) => {
  const tasks = [...graph.tasks.values()].map(serializeTask);
  res.json({ tasks, edges: graph.edges });
});

// ---------- GET /critical-path ----------
// Bonus feature: longest duration-weighted chain through the DAG.
router.get("/critical-path", (_req, res) => {
  const result = graph.getCriticalPath();
  res.json(result);
});

// ---------- POST /tasks ----------
router.post("/tasks", async (req, res, next) => {
  try {
    const { title, description, column, startDate, durationDays } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }
    const id = randomUUID();
    const start = Number.isFinite(startDate) ? startDate : 0;
    const duration =
      Number.isFinite(durationDays) && durationDays > 0 ? durationDays : 1;
    const col = column || "Backlog";

    await prisma.task.create({
      data: {
        id,
        title: title.trim(),
        description: description || null,
        column: col,
        status: "Ready", // a brand-new task has no dependencies yet
        startDate: start,
        durationDays: duration,
        endDate: start + duration,
      },
    });

    // DB write succeeded — safe to mirror into memory now.
    graph.addTask({
      id,
      title: title.trim(),
      description: description || null,
      column: col,
      status: "Ready",
      startDate: start,
      durationDays: duration,
      endDate: start + duration,
    });

    res.status(201).json(serializeTask(graph.getTask(id)));
  } catch (err) {
    next(err);
  }
});

// ---------- PATCH /tasks/:id ----------
// Handles edits, Kanban column moves (including the Done <-> not-Done
// transitions that drive dependency status), and date/duration changes.
router.patch("/tasks/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!graph.tasks.has(id)) {
      return res.status(404).json({ error: `No task with id ${id}` });
    }
    const { title, description, column, startDate, durationDays } = req.body;
    const task = graph.getTask(id);

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;

    const touched = new Set([id]);

    // Column move: only a transition INTO or OUT OF "Done" affects the DAG.
    if (column !== undefined && column !== task.column) {
      const wasDone = task.column === "Done";
      task.column = column;
      const isDoneNow = column === "Done";
      if (wasDone !== isDoneNow) {
        const { affected } = graph.setTaskCompletion(id, isDoneNow);
        affected.forEach((a) => touched.add(a));
      }
    }

    // Schedule change: re-run the no-compounding propagation from this task.
    if (startDate !== undefined || durationDays !== undefined) {
      const affected = graph.updateTaskDates(id, { startDate, durationDays });
      affected.forEach((a) => touched.add(a));
    }

    await persistTasks([...touched]);

    res.json({
      task: serializeTask(graph.getTask(id)),
      affected: [...touched],
    });
  } catch (err) {
    next(err);
  }
});

// ---------- POST /dependencies ----------
// Validates BEFORE writing anywhere, so a rejected cycle never touches the
// DB or the in-memory graph. Order: validate -> write DB -> mutate memory.
router.post("/dependencies", async (req, res, next) => {
  try {
    const { predecessorId, successorId } = req.body;
    if (!predecessorId || !successorId) {
      return res
        .status(400)
        .json({ error: "predecessorId and successorId are required" });
    }
    if (!graph.tasks.has(predecessorId) || !graph.tasks.has(successorId)) {
      return res.status(404).json({ error: "Both tasks must exist" });
    }
    if (graph.wouldCreateCycle(predecessorId, successorId)) {
      return res.status(409).json({
        error: `Adding "${predecessorId} -> ${successorId}" would create a circular dependency. Rejected — no changes made.`,
      });
    }

    await prisma.dependency.create({ data: { predecessorId, successorId } });

    // DB write succeeded — now safe to mutate the in-memory graph.
    graph.edges.push({ predecessorId, successorId });
    const affected = graph.recomputeFromInclusive(successorId);
    await persistTasks(affected);

    res.status(201).json({ predecessorId, successorId, affected });
  } catch (err) {
    if (err.code === "P2002") {
      // Prisma unique constraint — this exact edge already exists.
      return res.status(409).json({ error: "This dependency already exists." });
    }
    if (err instanceof CycleError) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
});

// ---------- DELETE /dependencies ----------
router.delete("/dependencies", async (req, res, next) => {
  try {
    const { predecessorId, successorId } = req.body;
    if (!predecessorId || !successorId) {
      return res
        .status(400)
        .json({ error: "predecessorId and successorId are required" });
    }
    await prisma.dependency.deleteMany({ where: { predecessorId, successorId } });
    graph.edges = graph.edges.filter(
      (e) =>
        !(e.predecessorId === predecessorId && e.successorId === successorId)
    );
    const affected = graph.recomputeFromInclusive(successorId);
    await persistTasks(affected);
    res.json({ removed: true, affected });
  } catch (err) {
    next(err);
  }
});

// ---------- POST /ai/suggest-dependencies ----------
// AI/LLM usage (mandatory criterion). Returns UNCONFIRMED candidate edges
// only — nothing here writes to the graph or the DB. A human must accept
// each one individually via the existing POST /dependencies route, which
// independently re-validates the cycle check. See src/ai/suggestDependencies.js
// for the grounding technique (closed-set ids + server-side re-validation).
router.post("/ai/suggest-dependencies", async (_req, res, next) => {
  try {
    const tasks = [...graph.tasks.values()].map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
    }));
    const result = await suggestDependencies({
      tasks,
      edges: graph.edges,
      wouldCreateCycle: (p, s) => graph.wouldCreateCycle(p, s),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ---------- POST /seed ----------
// Wipes the board and reloads the 10 realistic demo tasks (same data as
// prisma/seed.js, shared via ../seedData.js). Powers the "Load demo data"
// empty-state button in the UI.
router.post("/seed", async (_req, res, next) => {
  try {
    await prisma.dependency.deleteMany();
    await prisma.task.deleteMany();

    const ids = {};
    for (const d of SEED_DEFS) {
      const id = randomUUID();
      ids[d.key] = id;
      await prisma.task.create({
        data: {
          id,
          title: d.title,
          description: d.description,
          column: d.column,
          status: d.status,
          startDate: d.startDate,
          durationDays: d.durationDays,
          endDate: d.startDate + d.durationDays,
        },
      });
    }
    for (const [predKey, succKey] of SEED_EDGES) {
      await prisma.dependency.create({
        data: { predecessorId: ids[predKey], successorId: ids[succKey] },
      });
    }

    await hydrate(); // refresh the in-memory graph from the freshly-seeded DB

    const tasks = [...graph.tasks.values()].map(serializeTask);
    res.status(201).json({ tasks, edges: graph.edges });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
