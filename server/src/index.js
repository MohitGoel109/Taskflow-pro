require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { hydrate } = require("./graphStore");
const apiRouter = require("./routes/api");

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed"));
  },
}));
app.use(express.json({ limit: "100kb" }));
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
}));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "taskflow-pro-server" });
});

app.use("/", apiRouter);

// Centralized error handler — anything an individual route didn't already
// turn into a specific status code (cycle rejection, validation, etc.)
// lands here as a generic 500 rather than crashing the process.
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.message === "Origin is not allowed") {
    return res.status(403).json({ error: "Origin is not allowed" });
  }
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
