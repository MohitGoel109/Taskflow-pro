# TaskFlow Pro

Dependency-aware Kanban board with a DAG scheduling engine underneath.
Contata NCR Hackathon 2026.

## Live Demo

- **TaskFlow Pro app:** [taskflow-pro-three-inky.vercel.app](https://taskflow-pro-three-inky.vercel.app/)
- **API health:** [taskflow-pro-server-ufxz.onrender.com/health](https://taskflow-pro-server-ufxz.onrender.com/health)
- **Live board JSON:** [taskflow-pro-server-ufxz.onrender.com/board](https://taskflow-pro-server-ufxz.onrender.com/board)

For the judge-facing walkthrough, see [DEMO_GUIDE.md](DEMO_GUIDE.md). The
combined architecture, data model, security, testing, AI, and limitations
write-up is in [DESIGN_DOCUMENT.md](DESIGN_DOCUMENT.md). It
contains a timed presentation script, the dependency-engine explanation,
verification evidence, and the limitations to disclose honestly.

**Status: Phases 1, 2 & 3 complete.** The DAG engine (cycle-safety,
Blocked/Ready status, no-compounding propagation, rollback, bonus Critical
Path) is built and verified. The REST API is wired to it, backed by
Postgres via Prisma, with realistic seed data — verified end-to-end against
a live server. The React Kanban UI is built (drag-and-drop, dependency
editor, Critical Path highlight). The mandatory AI dependency-suggestion
feature is built, grounded, and cycle-safe. Deployment is the only
remaining optional item.

## Stack

- **Frontend:** React + Vite + Tailwind CSS v4, with a clickable workflow stepper and optional drag-and-drop support
- **Backend:** Express (Node.js), REST API wired to the DAG engine
- **Database:** PostgreSQL, via Docker, accessed through Prisma
- **DAG engine:** plain JavaScript, zero framework dependencies, unit-tested standalone
- **AI:** Anthropic Messages API (closed-set grounded prompt), with a labeled
  heuristic fallback if no key is configured

## Project Structure

```
taskflow-pro/
├── docker-compose.yml         # Postgres for local dev
├── server/
│   ├── src/
│   │   ├── dag/
│   │   │   ├── dag.js         # THE core engine — read this first
│   │   │   ├── dag.test.js    # Jest tests
│   │   │   └── verify.js      # Dependency-free check
│   │   ├── ai/
│   │   │   └── suggestDependencies.js   # Grounded LLM prompt + cycle-safe filtering
│   │   ├── graphStore.js      # Bridges the in-memory graph <-> Postgres
│   │   ├── routes/api.js      # REST endpoints, wired to the engine
│   │   └── index.js           # Express app: hydrates graph, mounts routes
│   ├── prisma/
│   │   ├── schema.prisma      # Task + Dependency models
│   │   └── seed.js            # 10 realistic tasks, diamond dependencies
│   ├── .env.example
│   └── package.json
└── client/                    # React + Vite + Tailwind Kanban UI
    ├── src/
    │   ├── components/
    │   │   ├── Board.jsx, Column.jsx, TaskCard.jsx    # Kanban board + workflow stepper
    │   │   ├── TaskModal.jsx      # Create/edit task + dependency editor
    │   │   ├── AISuggestPanel.jsx # AI suggestions, accept/reject
    │   │   ├── Header.jsx         # AI trigger + Critical Path toggle
    │   │   └── ThemeEffects.jsx   # Theme-aware canvas particles and cursor effects
    │   ├── api.js              # Fetch wrapper around the server
    │   └── App.jsx              # Board state, drag handling, modals
    └── .env.example
```

## API Reference

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Server liveness check |
| GET | `/board` | All tasks + dependency edges, with live computed status/dates |
| GET | `/critical-path` | Bonus: longest duration-weighted chain through the DAG |
| POST | `/tasks` | Create a task: `{ title, description?, column?, startDate?, durationDays? }` |
| PATCH | `/tasks/:id` | Edit a task, move columns, or change dates — automatically triggers rollback/propagation as needed |
| POST | `/dependencies` | Add `{ predecessorId, successorId }` — rejects with `409` if it would create a cycle |
| DELETE | `/dependencies` | Remove `{ predecessorId, successorId }` |
| POST | `/ai/suggest-dependencies` | Mandatory AI feature. Returns unconfirmed candidate edges only — never mutates the graph. See `server/src/ai/suggestDependencies.js`. |

## Setup (run these in VS Code's terminal)

### 1. Start Postgres

```bash
docker compose up -d
```

### 2. Install server dependencies

```bash
cd server
npm install
cp .env.example .env
```

Optionally set `LLM_API_KEY` in `.env` (get one from
[console.anthropic.com](https://console.anthropic.com)) to enable real AI
suggestions. Without it, `/ai/suggest-dependencies` still works — it falls
back to a clearly-labeled keyword heuristic, so the demo never breaks.

### 3. Verify the DAG engine works (no DB needed for this)

```bash
node src/dag/verify.js
```

You should see `12/12 checks passed.` — this checks cycle detection, status
propagation, the bonus critical path calculation, and critically, the
**diamond-convergence no-compounding scenario** from the problem statement
(A splits into B and C, both feed D; a 3-day delay on A must move D by 3
days, not 6).

### 4. Run the real Jest test suite (same tests, proper framework)

```bash
npm test
```

### 5. Set up the database

```bash
npm run prisma:generate
npm run prisma:migrate
```

This creates the `Task` and `Dependency` tables in Postgres from
`prisma/schema.prisma`.

### 6. Seed realistic sample data

```bash
npm run seed
```

Adds 10 tasks with a genuine diamond-convergence dependency structure
(mirrors the exact shape from the problem statement).

### 7. Start the server

```bash
npm run dev
```

Visit `http://localhost:4000/health` — you should see `{"status":"ok",...}`.
Then try `http://localhost:4000/board` to see the seeded board as JSON, and
`http://localhost:4000/critical-path` for the bonus feature.

### 8. Start the client (separate terminal)

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173`. The dev server proxies `/api/*` to the
backend on port 4000 — see `client/vite.config.js`.

For the fastest demo, click a task's status badge to open the workflow
stepper, then demonstrate a blocked prerequisite becoming Ready after its
predecessor is marked Done. Finish with Critical Path, AI Suggestions, and
the Theme picker. See [DEMO_GUIDE.md](DEMO_GUIDE.md) for the complete script.

### 9. Try creating a dependency that would cycle

```bash
curl -i -X POST http://localhost:4000/dependencies \
  -H "Content-Type: application/json" \
  -d '{"predecessorId":"<id-1>","successorId":"<id-2>"}'
```

Valid dependencies return `201`. One that would create a cycle returns
`409` with a clear error message, and leaves the existing graph untouched.
(You can also just try it from the UI — the AI panel and dependency editor
both go through this same validated route.)

## What was verified, and how

Real Postgres wasn't available in the environment this was built in, so
correctness was verified two ways instead of guessing:

1. `node src/dag/verify.js` and `npm test` — both 12/12, pure engine logic.
2. A full live run of the **real Express server and real routes**, using a
   temporary in-memory stand-in for Prisma (swapped in, tested, then
   removed — nothing shipped). Exercised: task creation, dependency
   creation, the diamond-convergence date math through the actual API (not
   just the unit test), the cycle-rejection `409`, the Done→rollback path,
   `/board`, `/critical-path`, and `/ai/suggest-dependencies` (fallback
   path — see below).

**Still worth double-checking on your machine:** a real Postgres run via
`docker compose up -d` (the in-memory stand-in proves the *logic* is right,
not the real Prisma/Postgres wiring), and the live LLM call in
`/ai/suggest-dependencies` with a real `LLM_API_KEY` — that path was
reviewed carefully but only the fallback branch could actually be executed
here.

## AI/LLM Usage (mandatory criterion)

`POST /ai/suggest-dependencies` (`server/src/ai/suggestDependencies.js`)
suggests missing predecessor → successor edges from task titles/descriptions.

**Grounding technique:** closed-set prompting. The model is given the exact
list of existing task ids and dependency edges and is explicitly forbidden
from inventing new ones. Every suggestion it returns is then re-validated
server-side — real id, edge doesn't already exist, edge would not create a
cycle — *before* it's ever shown to a person, so a hallucinated id or a
cyclical suggestion never reaches the UI.

**Human in the loop:** nothing here writes to the graph. Suggestions come
back tagged `"unconfirmed"`; the UI shows each one with Accept/Reject, and
Accept goes through the normal `POST /dependencies` route — the same
cycle-checked path a person uses when adding a dependency by hand. The DAG
engine (`dag.js`), not the AI module, remains the sole authority on
graph correctness.

**Graceful degradation:** if `LLM_API_KEY` is unset or the API call fails,
the route falls back to a deterministic keyword heuristic (`schema` before
`api`/`backend`, before `test`, before `deploy`, etc.), clearly labeled as
a fallback in both the API response (`"source": "heuristic-fallback"`) and
the UI copy — it is never presented as if it were the AI.

## Key Assumptions & Limitations (carry these into your final submission)

- Dependencies are **finish-to-start only** — the simplest model that still
  satisfies every requirement in the problem statement.
- Dates are modeled as **integer day-offsets**, not calendar dates, to keep
  the propagation math simple and testable; swapping in real dates later
  only touches how `startDate`/`endDate`/`durationDays` are populated, not
  the algorithm itself.
- A task's `"Done"` status is treated as a **human fact** (the work is
  actually finished) and is never auto-reverted by propagation — only
  `Ready`/`Blocked` are recomputed automatically when an upstream task
  regresses. Documented design decision; the problem statement doesn't
  fully specify whether an already-"Done" downstream task should also be
  forced backward.
- **A Blocked task can only live in the Backlog column** — the UI rejects
  dragging a Blocked task into In Progress/Review/Done rather than letting
  a person "start" work the DAG says isn't actually startable yet. Not
  required by the problem statement, but consistent with it.
- The client refetches the whole board after every mutation rather than
  patching local state incrementally — simpler and safer for an MVP-sized
  board; a larger board would want incremental updates instead.
- Single-assignee, no multi-user concurrent-edit conflict resolution, for
  MVP scope.
- The server keeps a **single in-memory graph as the source of truth**,
  hydrated from Postgres on boot and written through on every mutation
  (validate → write DB → mutate memory, in that order, to minimize drift
  risk). There's no distributed transaction between the two; a DB write
  failure after a validated request would require a server restart
  (which re-runs the hydrate step) to guarantee resync. Acceptable for a
  single-instance hackathon deployment; a production version would need a
  proper transaction boundary or a DB-native recursive query instead.
- The AI suggestion feature's grounding relies on the model following
  instructions to only use given ids — mitigated, not eliminated, by the
  server-side re-validation described above, which is the actual
  correctness guarantee, not the prompt wording.

## What's Left

1. **Deployment** (optional, for bonus credit) — not attempted yet.

---

## Submission Checklist — Contata NCR Hackathon 2026

Keep this section updated; it's the source of truth for what the portal
actually checks before and after you submit.

### Prohibited / Restricted Content (Build Submission — must NOT be present)

Verified clean as of the last build pass (`.gitignore` enforces this going
forward — see repo root):

- [ ] No API keys, passwords, tokens, or certificates
- [ ] No production or confidential business data
- [ ] No malware or unauthorized network tools
- [ ] No virtual environments or dependency directories (`node_modules/`, `venv/`)
- [ ] No pirated licensed software/code
- [ ] No large model weights
- [ ] No large media files
- [ ] No unnecessary build artifacts (`dist/`, `build/`)

Before every push: run `git status` and eyeball the diff — `.env` (not
`.env.example`), `node_modules/`, and `dist/` are the three most common
accidental commits.

### Code Round Scoring Weights (for prioritizing remaining effort)

| Criterion | Weight | What's judged |
|---|---|---|
| Functional Correctness | 20% | Cycle detection, diamond-dependency math, rollback behavior — the exact edge cases in the problem statement |
| Code Quality & Architecture | 20% | Cleanliness, structure, error handling, overall engineering quality |
| AI/LLM Usage | 15% | Quality of the AI feature + responsible, disclosed AI use during development |
| Documentation & Explainability | 13% | Setup/run clarity, architecture docs, demo communication |
| Business Impact & Scalability | 12% | Real-world value, scalability beyond the prototype |
| Feasibility, Security & Production Readiness | 10% | Realistic deployability, sound security, no exposed secrets |
| Testing & Reliability | 10% | Evidence of testing, robustness, graceful failure handling |

**Reading this list:** Functional Correctness + Code Quality are 40% combined
— the DAG engine and its test coverage (`dag.test.js`, `verify.js`) are your
biggest score driver, not the UI polish. Keep prioritizing accordingly.

---

## Deploying (Render + Vercel, both free)

**Honesty check first:** I've configured this correctly based on how both platforms work, but I have not personally deployed it — I have no network access in my build sandbox. Follow the steps below and tell me the exact error if something doesn't work; that's expected to be a normal part of a first deploy, not a sign you did something wrong.

**Before you start:** push this repo to GitHub (both Render and Vercel deploy from a connected Git repo, not a zip upload).

### 1. Backend + database → Render

1. Go to [render.com](https://render.com), sign up (no card required), click **New → Blueprint**.
2. Connect your GitHub repo. Render will detect `render.yaml` at the repo root automatically and show you two services to create: `taskflow-pro-server` and `taskflow-pro-db`.
3. Click **Apply**. Render provisions the free Postgres database and the web service together.
4. Once created, open the `taskflow-pro-server` service → **Environment** tab → add `LLM_API_KEY` with your real key (this is the one variable `render.yaml` deliberately leaves for you to paste manually, so it never sits in the repo).
5. Wait for the first deploy to finish, then open the service's **Logs** tab and confirm you see `TaskFlow Pro server listening on http://localhost:PORT` with no errors.
6. Copy the public URL Render gives the service (looks like `https://taskflow-pro-server.onrender.com`) — you need it for step 2.
7. Once it's live, run the seed data in one of two ways: visit `https://<your-render-url>/health` first to wake the service up (cold start), then either hit `POST /seed` with curl/Postman, or add a temporary "Load demo data" click from the deployed frontend once step 2 is done.

**Free-tier realities to know:** the database expires 30 days after creation (Render emails you a warning first); the web service spins down after 15 minutes idle and takes ~30-60 seconds to wake up on the next request — hit `/health` a minute before you demo to warm it up.

### 2. Frontend → Vercel

1. Go to [vercel.com](https://vercel.com), sign up, click **Add New → Project**, import the same GitHub repo.
2. When asked for the **Root Directory**, set it to `client` (Vercel needs to know the app isn't at the repo root).
3. It should auto-detect Vite; if not, set Build Command to `npm run build` and Output Directory to `dist` (already specified in `client/vercel.json` either way).
4. Under **Environment Variables**, add:
   - `VITE_API_BASE` = the Render URL from step 1.6 above (e.g. `https://taskflow-pro-server.onrender.com`) — no trailing slash, no `/api` suffix (see `client/src/api.js` comment for why).
5. Deploy. Vercel gives you a live `https://<something>.vercel.app` URL — that's your judge-facing demo link.

### 3. Verify end-to-end

Open the Vercel URL, open your browser's dev tools → Network tab, and confirm requests to `/board` etc. are hitting your Render URL and returning data, not failing on CORS or 404. The server's CORS is currently wide open (`cors()` with no origin restriction) specifically so this cross-origin setup works with zero extra config — tighten it later if this goes beyond the hackathon.
