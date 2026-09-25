# Client (Phase 3 — built)

React + Vite + Tailwind Kanban UI, wired to the server API.

## What's here

- **Kanban board** — four columns (Backlog / In Progress / Review / Done).
  Click a task's status badge to open the animated workflow stepper and
  change its stage directly. The legacy drag-and-drop path remains available
  for spatial board editing.
- **Blocked-task guard** — a task with unsatisfied prerequisites can only
  move to Backlog; the stepper disables later stages and dragging it further shows an inline warning instead of
  silently letting you "start" blocked work. (Documented design decision —
  the problem statement doesn't forbid this, but allowing it would
  contradict what the DAG engine says is actually startable.)
- **Task modal** — create a task, or open one to edit it and manage its
  dependencies (add/remove predecessors, see what it blocks).
- **AI Dependency Suggestions** — button in the header calls
  `POST /ai/suggest-dependencies` and shows each candidate edge with an
  Accept/Reject action. Nothing is added to the graph until you click
  Accept, which goes through the normal `POST /dependencies` route (full
  cycle-check included).
- **Critical Path toggle** — highlights the longest duration-weighted chain
  (gold border + star) across all four columns at once.
- **Theme-aware canvas effects** — each theme has a distinct low-motion
  particle composition and cursor interaction, with a reduced-motion fallback.

## Run it

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`. In dev, `/api/*` requests are proxied to
`http://localhost:4000` (see `vite.config.js`) — make sure the server
(`../server`) is running first.

For production, set `VITE_API_BASE` (see `.env.example`) to your deployed
server's URL instead of relying on the dev proxy.

## Key assumptions (carry into the top-level README too)

- After every mutation (status stepper, drag, dependency add/remove, task edit) the client
  refetches the whole board rather than patching local state manually.
  Simpler and less error-prone for an MVP; a larger board would want
  incremental updates instead.
- No optimistic update for dependency add/remove, status stepper, or task edits (only for
  the drag itself) — those are comparatively rare, deliberate actions
  where waiting for a server round-trip is an acceptable trade-off.
