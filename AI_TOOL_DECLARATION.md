# AI-Tool Declaration

Required submission artifact per the hackathon problem statement. Fill in
the bracketed bits (team name, dates, any parts you did by hand) before
submitting — this draft reflects the build as of the AI-assisted session
that produced the current codebase.

## 1. AI tool(s) used to build this project

- **Claude (Anthropic)**, via [claude.ai / Claude Code — specify which],
  used throughout the build process for: architecture/schema design
  discussion, generating the DAG engine and its test suite, the Express API
  routes, the React + Tailwind Kanban UI, the AI dependency-suggestion
  module itself, and this documentation.

## 2. What was AI-generated vs. human-reviewed

- All code in this repository was AI-generated in an assistant session and
  then reviewed by the team before submission. [Team: describe what you
  personally read through, changed, or re-tested.]
- Correctness of the DAG engine (cycle detection, no-compounding
  propagation, rollback) was independently verified via two automated test
  runs (`node src/dag/verify.js`, 12/12; `npm test`, 12/12) rather than
  taken on faith.
- The Express API was exercised end-to-end against a live server (task
  creation, dependency creation, cycle rejection, rollback, critical path)
  during the build session using a temporary in-memory database stand-in,
  since a real Postgres instance wasn't available in that sandbox. **The
  team should re-run this against real Postgres** (`docker compose up -d`
  + `npm run seed` + manual exercise, or the equivalent) before treating it
  as fully verified.
- The React client builds and lints cleanly, but has not yet been manually
  clicked through end-to-end in a browser by [team member] as of this
  declaration — recommended before the demo.

## 3. AI/LLM usage *within the product itself* (the mandatory feature)

- `POST /ai/suggest-dependencies` calls the **Anthropic Messages API**
  (`claude-sonnet-4-6`) to suggest missing task dependencies from titles
  and descriptions.
- **Grounding technique:** closed-set prompting — the model receives only
  the exact existing task ids and is forbidden from inventing new ones.
  Every returned suggestion is independently re-validated server-side
  (real id, no duplicate, no cycle) before it is ever shown to a user.
- **Human validation:** the model's output is never auto-applied. Suggested
  edges are returned as `"unconfirmed"`; a person must explicitly accept
  each one, which routes through the same cycle-checked `POST
  /dependencies` endpoint used for manual edits.
- **Failure handling:** if no API key is configured or the call fails, the
  feature falls back to a deterministic keyword heuristic, clearly labeled
  as a fallback (never presented as AI-generated) in both the API response
  and the UI.
- This live LLM call path (as opposed to its fallback) has **not yet been
  executed with a real API key** as of this declaration — the team should
  set `LLM_API_KEY` and confirm it works before the demo.

## 4. Team confirmation

- [ ] We have read through the generated code and understand how it works.
- [ ] We have re-run the setup steps ourselves on our own machine(s).
- [ ] We have tested the AI suggestion feature with a real API key.
- [ ] We can answer questions about any part of this codebase live.

Signed: [team members, date]
