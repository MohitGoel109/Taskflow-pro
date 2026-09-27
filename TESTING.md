# Testing & Reliability

## Full suite of test cases run

Two independent checks of the DAG engine, both passing 12/12:

**`node server/src/dag/verify.js`** — dependency-free sanity script, no test
framework required:
1. A task with no prerequisites is Ready.
2. A task is Blocked until ALL prerequisites are Done.
3. Becomes Ready once its direct prerequisite is Done.
4. Rejects a direct cycle (A→B, B→A) and leaves the graph unchanged.
5. Rejects an indirect cycle (A→B→C→A).
6. Rejects a self-dependency.
7. Diamond convergence: D moves by +3 days, not +6, when A is delayed by 3
   days (the no-compounding requirement).
8. Propagation only touches the reachable downstream subgraph.
9. A schedule change updates the task itself, not just its downstream.
10. Critical path finds the longest duration-weighted chain.
11. Reverting a Done prerequisite re-blocks a downstream Ready task
    (rollback).
12. A manually-Done downstream task is not auto-reverted by propagation
    (documented design decision — see Key Assumptions in README).

**`npm test`** (server) — the same 12 cases as a real Jest suite
(`server/src/dag/dag.test.js`), for CI/tooling integration.

**Live API round-trip** (not in CI, run manually during the build): booted
the real Express server against a temporary in-memory Prisma stand-in and
exercised every route with curl — task creation, dependency creation, the
409 cycle-rejection response, the diamond-convergence date math through the
actual HTTP API (not just the unit test), the Done→rollback path, `/board`,
`/critical-path`, and `/ai/suggest-dependencies` (fallback branch). See
"What was verified, and how" in the top-level README for the full account.

**Client:** `npm run build` and `npx oxlint` both pass clean with zero
errors (two benign warnings — a standard fetch-on-mount pattern and a
fast-refresh convention note, neither a bug).

## Known failure cases / limitations

- **No real Postgres run yet in this environment.** All of the above was
  verified with either pure in-memory logic or a temporary in-memory Prisma
  stand-in, because this sandbox couldn't reach a real Postgres instance.
  The Prisma schema and query shapes were reviewed carefully, but a genuine
  `docker compose up -d && npm run seed` run is the one thing not yet
  confirmed end-to-end.
- **AI suggestion feature's live LLM path is untested.** The grounding
  logic, cycle-safe filtering, and fallback path are all verified — but the
  actual Anthropic API call has only been exercised with `LLM_API_KEY`
  unset (i.e. the fallback branch). Needs one real run with a live key
  before demo day.
- **No concurrent-edit handling.** Two people editing the same task/graph
  at once isn't guarded against — last write wins. Acceptable for a single
  demo user, not for multi-user production use.
- **A "Done" task is never auto-reverted downstream**, even if its own
  upstream prerequisite regresses — this is an intentional scope decision
  (see README), not a bug, but it means the rollback guarantee only applies
  to `Ready`/`Blocked` states, not `Done` ones.
- **Dates are integer day-offsets, not calendar dates** — no weekends,
  holidays, or timezones modeled. Fine for a duration-based demo; would
  need real date math for production scheduling.
- **Client refetches the whole board after every mutation** rather than
  patching state incrementally — correct, but not optimized for a
  large board (hundreds of tasks). Fine at hackathon/demo scale.
