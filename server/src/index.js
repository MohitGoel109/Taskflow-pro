require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { hydrate } = require("./graphStore");
const apiRouter = require("./routes/api");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "taskflow-pro-server" });
});

app.use("/", apiRouter);

// Centralized error handler — anything an individual route didn't already
// turn into a specific status code (cycle rejection, validation, etc.)
// lands here as a generic 500 rather than crashing the process.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await hydrate(); // load tasks + dependencies from Postgres into memory
  app.listen(PORT, () => {
    console.log(`TaskFlow Pro server listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
