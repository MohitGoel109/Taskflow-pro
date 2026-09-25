# TaskFlow Pro Demo Guide

## 3-minute presentation

### 1. The problem (20 seconds)

> Project boards show what people are doing, but they often do not show why work is blocked or which delay will affect the final delivery date.

### 2. The solution (20 seconds)

> TaskFlow Pro is a dependency-aware Kanban board. It combines a familiar workflow board with a DAG scheduling engine that keeps dependencies, blocked states, dates, and the critical path consistent.

### 3. Show the board (30 seconds)

Point out the four columns: Backlog, In Progress, Review, and Done. Explain that every card has a duration, computed dates, and a dependency-aware status.

Click a task's status badge to open the workflow stepper. Choose a stage directly instead of dragging a card. The server saves the transition and reloads the computed board state.

### 4. Prove dependency awareness (45 seconds)

1. Open a blocked task such as `Write Integration Tests`.
2. Click `Why blocked?` to show its unfinished prerequisite.
3. Complete the prerequisite by clicking its status badge and choosing `Done`.
4. Return to the blocked task and show that its status becomes `Ready`.

Say:

> The UI does not guess whether work is startable. The DAG engine checks every direct prerequisite and computes Ready or Blocked after each change.

### 5. Show the critical path (25 seconds)

Click `Critical Path`.

Say:

> This is the longest duration-weighted dependency chain. These tasks have the greatest schedule leverage because a delay here can affect the project finish.

### 6. Show cycle safety (25 seconds)

Open a task's dependency editor and attempt to add a dependency that points back to an existing predecessor.

Say:

> The engine checks reachability before mutation. If the new edge would create a cycle, the API returns a conflict and leaves the graph unchanged.

### 7. Show AI responsibly (25 seconds)

Click `Suggest Dependencies (AI)`. Explain that suggestions are grounded in the existing task set, labeled, and never applied automatically. Accepting a suggestion sends it through the same cycle-safe dependency endpoint.

### 8. Finish with visual polish (20 seconds)

Open `Theme` and show `Quantum Core`, `Blood Moon`, or `Dusty Trail`. Move the cursor across the board.

Say:

> Themes change the visual identity, including typography, canvas particles, cursor interaction, and ambient motion, without changing the scheduling data.

## DAG engine in plain language

The graph stores tasks as nodes and dependencies as directed edges. An edge `A -> B` means B cannot start until A is complete.

- Before adding an edge, the engine checks whether B can already reach A. If yes, the new edge would close a loop, so it is rejected.
- A task with unfinished prerequisites is `Blocked`.
- A task with no prerequisites, or with all prerequisites done, is `Ready`.
- `Done` is treated as a human-confirmed fact and is not silently undone.
- Dates use the maximum finish date of all prerequisites, so a diamond-shaped graph does not compound one delay twice.
- The critical path is the longest duration-weighted chain through the DAG.

## Evidence to mention

- `node src/dag/verify.js` passes 12/12 checks.
- `npm test` runs the standalone DAG test suite.
- `npm run build` passes for the React client.
- The live board is backed by PostgreSQL through Prisma.
- AI suggestions are human-reviewed and cycle-validated before persistence.

## Honest limitations

This is an MVP: it has no authentication, multi-user conflict resolution, or production rate limiting. The next production steps would be role-based access, project-level tenancy, incremental board updates, and browser end-to-end tests.
