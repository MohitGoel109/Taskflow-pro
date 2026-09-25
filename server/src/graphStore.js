/**
 * Bridges the pure DAG engine (dag.js) to Postgres via Prisma.
 *
 * DESIGN: a single in-memory TaskGraph is the process's source of truth for
 * all dependency/schedule computation. It's hydrated from the DB once at
 * startup, and every mutation is written through to Postgres immediately
 * after (write-through cache). Reads (GET /board) are served straight from
 * memory — fast, and always reflects the latest computed state without
 * re-running the graph algorithms on every request.
 *
 * KNOWN LIMITATION (documented, matches the README): there's no distributed
 * transaction between the in-memory graph and the DB. Routes are written so
 * validation happens BEFORE any DB write, and the DB write happens BEFORE
 * the in-memory mutation, to minimize the chance of drift — but if a DB
 * write fails outright, restarting the server (which re-runs hydrate())
 * is the recovery path for this hackathon-scoped MVP.
 */
const { PrismaClient } = require("@prisma/client");
const { TaskGraph } = require("./dag/dag");

const prisma = new PrismaClient();
const graph = new TaskGraph();

async function hydrate() {
  const [tasks, deps] = await Promise.all([
    prisma.task.findMany(),
    prisma.dependency.findMany(),
  ]);

  graph.tasks.clear();
  graph.edges.length = 0;

  for (const t of tasks) {
    graph.addTask({
      id: t.id,
      title: t.title,
      description: t.description,
      column: t.column,
      status: t.status,
      startDate: t.startDate,
      endDate: t.endDate,
      durationDays: t.durationDays,
    });
  }
  for (const d of deps) {
    // Edges were already cycle-validated once, when originally created via
    // the API — re-adding raw here avoids redundant re-validation on boot.
    graph.edges.push({
      predecessorId: d.predecessorId,
      successorId: d.successorId,
    });
  }
  graph.recomputeAllStatuses();

  console.log(
    `Hydrated graph: ${graph.tasks.size} tasks, ${graph.edges.length} dependencies.`
  );
}

/** Writes the CURRENT in-memory state of the given task ids back to Postgres. */
async function persistTasks(taskIds) {
  await Promise.all(
    taskIds.map((id) => {
      const t = graph.getTask(id);
      return prisma.task.update({
        where: { id },
        data: {
          title: t.title,
          description: t.description,
          column: t.column,
          status: t.status,
          startDate: t.startDate,
          endDate: t.endDate,
          durationDays: t.durationDays,
        },
      });
    })
  );
}

module.exports = { prisma, graph, hydrate, persistTasks };
