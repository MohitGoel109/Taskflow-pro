# TaskFlow Pro Design Document

## Architecture

The React/Vite client renders the Kanban board and sends mutations to the Express API. The API hydrates a framework-free `TaskGraph` from PostgreSQL through Prisma. The graph is the scheduling authority: requests are validated against it before persistence, and affected tasks are recalculated before the board is returned.

```text
React UI
  -> Express REST API
      -> TaskGraph DAG engine
      -> Prisma
          -> PostgreSQL
```

The client uses a clickable workflow stepper for fast status changes, while the existing drag-and-drop path remains available. Theme selection updates CSS variables and rebuilds the theme-aware Canvas particle/cursor layer. The Canvas is capped at 48 particles and honors `prefers-reduced-motion`.

## Data model

`Task` stores `id`, `title`, `description`, `column`, `status`, `startDate`, `durationDays`, and `endDate`.

`Dependency` stores `predecessorId` and `successorId`. The pair is unique, and both fields reference `Task` with cascading cleanup.

A dependency `A -> B` means B is finish-to-start dependent on A. Dates are integer project-day offsets rather than calendar dates, which keeps the scheduling algorithm deterministic.

## Dependency engine

1. Before adding an edge, the engine checks whether the proposed successor can already reach the proposed predecessor. If so, the edge would create a cycle and is rejected before any mutation.
2. A task with no prerequisites, or with all prerequisites complete, is `Ready`.
3. A task with at least one incomplete prerequisite is `Blocked`.
4. `Done` is a manual fact and is not automatically reverted.
5. Downstream dates use the maximum prerequisite finish date, preventing diamond-shaped dependencies from compounding one delay more than once.
6. The critical path is the longest duration-weighted chain through the DAG.

## AI responsibility

The AI feature suggests candidate dependencies only. The prompt is closed-set and receives the current tasks and edges; it is not allowed to invent task identifiers. The server independently validates every suggestion for real IDs, duplicates, and cycles. Suggestions are labeled unconfirmed and require explicit human acceptance. Accepted edges go through the normal cycle-safe dependency route. If no API key is configured or the model call fails, the deterministic heuristic fallback is labeled clearly.

No user data or secrets are sent by the client directly to the model. The API key remains server-side in environment configuration.

## Security and production readiness

- Helmet sets standard security headers.
- `x-powered-by` is disabled.
- JSON request bodies are capped at 100 KB.
- General API traffic is rate-limited to 120 requests per minute.
- AI suggestions are rate-limited to 12 requests per minute.
- CORS can be restricted with the comma-separated `CORS_ORIGIN` environment variable.
- Secrets are stored in `.env`, which is ignored; only `.env.example` is committed.

Remaining production work includes authentication, authorization, project-level tenancy, persistent rate-limit storage, audit logging, and database transactions across graph and persistence updates.

## Testing evidence

- `node server/src/dag/verify.js`: 12/12 dependency-engine checks pass.
- `cd server && npm test -- --runInBand`: 12/12 Jest tests pass.
- `cd client && npm test`: workflow-stepper transition tests pass.
- `cd client && npm run build`: production client build passes.

The frontend tests cover allowed workflow movement, blocked-task restrictions, current-stage disabling, and unknown-stage rejection. Browser end-to-end coverage is a future improvement.

## Known limitations

This is a single-instance MVP with one in-memory graph hydrated from PostgreSQL at startup. It supports one shared board and does not yet provide user accounts or concurrent-edit conflict resolution. The AI fallback is deterministic and useful for demos, but it is not a substitute for domain review. These boundaries are explicit so the prototype can be extended safely rather than implying production guarantees it does not yet provide.
