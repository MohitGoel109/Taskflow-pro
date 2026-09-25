# AI-Tool Declaration

This declaration documents the AI tools used by Mohit during development,
what was AI-assisted, what was reviewed and tested, and how AI is used
responsibly inside the product.

## 1. AI tool(s) used to build this project

- **GitHub Copilot**, used through AI-assisted development sessions,
  used throughout the build process for: architecture/schema design
  discussion, generating the DAG engine and its test suite, the Express API
  routes, the React + Tailwind Kanban UI, the AI dependency-suggestion
  module itself, and this documentation.

## 2. What was AI-generated vs. human-reviewed

- Code was AI-assisted and then reviewed by Mohit before submission. Mohit
  reviewed the DAG engine, API routes, database setup, React UI, theme and
  canvas effects, security changes, documentation, and test results.
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
- The React client builds and lints cleanly, and Mohit should complete one
  final manual browser walkthrough before the demo.

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

Additional responsible-AI details, including grounding, validation,
human-in-the-loop review, fallback behavior, and known limitations, are in
`DESIGN_DOCUMENT.md`.

## 4. Individual confirmation — Mohit

- [ ] I have read through the generated code and understand how it works.
- [ ] I have re-run the setup steps on my machine.
- [ ] I have tested the AI suggestion feature with a real API key.
- [ ] I can answer questions about any part of this codebase live.

Signed: Mohit, 2026-09-25
