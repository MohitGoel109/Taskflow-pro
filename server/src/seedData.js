// Shared seed data — used by BOTH prisma/seed.js (CLI: npm run seed) and
// the POST /seed API route (the "Load demo data" button in the UI).
// Single source of truth so the two never drift out of sync.

const SEED_DEFS = [
  {
    key: "schema",
    title: "Design Database Schema",
    description: "Define tables for tasks and dependencies.",
    column: "Done",
    status: "Done",
    startDate: 0,
    durationDays: 2,
  },
  {
    key: "backend",
    title: "Build Backend API",
    description: "REST endpoints for tasks, dependencies, and board state.",
    column: "In Progress",
    status: "Ready",
    startDate: 2,
    durationDays: 3,
  },
  {
    key: "auth",
    title: "Build Auth Module",
    description: "Session/JWT-based auth, groundwork for multi-user boards.",
    column: "Backlog",
    status: "Ready",
    startDate: 2,
    durationDays: 2,
  },
  {
    key: "integration",
    title: "Write Integration Tests",
    description: "End-to-end tests across the API, DB, and auth module.",
    column: "Backlog",
    status: "Blocked",
    startDate: 5,
    durationDays: 2,
  },
  {
    key: "uishell",
    title: "Build Frontend UI Shell",
    description: "React app scaffold, routing, and page layout.",
    column: "In Progress",
    status: "Ready",
    startDate: 2,
    durationDays: 3,
  },
  {
    key: "board",
    title: "Build Kanban Task Board",
    description: "Drag-and-drop board with four columns.",
    column: "Backlog",
    status: "Blocked",
    startDate: 5,
    durationDays: 3,
  },
  {
    key: "aisuggest",
    title: "Build AI Dependency Suggestion",
    description: "LLM-assisted dependency suggestions with human confirmation.",
    column: "Backlog",
    status: "Blocked",
    startDate: 5,
    durationDays: 2,
  },
  {
    key: "criticalpath",
    title: "Build Critical Path View",
    description: "Highlight the longest dependency chain on the board.",
    column: "Backlog",
    status: "Blocked",
    startDate: 8,
    durationDays: 1,
  },
  {
    key: "deploy",
    title: "Set Up Deployment",
    description: "Deploy backend + frontend, configure environment variables.",
    column: "Backlog",
    status: "Blocked",
    startDate: 9,
    durationDays: 1,
  },
  {
    key: "readme",
    title: "Write README & Docs",
    description: "Setup instructions, key assumptions, and known limitations.",
    column: "Done",
    status: "Done",
    startDate: 0,
    durationDays: 1,
  },
];

// Diamond #1: schema forks to backend + auth, converges at integration.
// Diamond #2: integration + board converge at criticalpath, which then
// converges again with integration at deploy.
const SEED_EDGES = [
  ["schema", "backend"],
  ["schema", "auth"],
  ["backend", "integration"],
  ["auth", "integration"],
  ["schema", "uishell"],
  ["uishell", "board"],
  ["backend", "aisuggest"],
  ["integration", "criticalpath"],
  ["board", "criticalpath"],
  ["integration", "deploy"],
  ["criticalpath", "deploy"],
];

module.exports = { SEED_DEFS, SEED_EDGES };
