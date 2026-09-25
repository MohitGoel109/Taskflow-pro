// Thin fetch wrapper around the TaskFlow Pro server.
// In dev, Vite proxies /api -> http://localhost:4000 (see vite.config.js).
// In prod, set VITE_API_BASE to the deployed server URL (e.g. on Vercel/Render).

const BASE = import.meta.env.VITE_API_BASE || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    const message = body?.error || `Request failed: ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export const api = {
  getBoard: () => request("/board"),
  getCriticalPath: () => request("/critical-path"),
  createTask: (data) =>
    request("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id, data) =>
    request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  addDependency: (predecessorId, successorId) =>
    request("/dependencies", {
      method: "POST",
      body: JSON.stringify({ predecessorId, successorId }),
    }),
  removeDependency: (predecessorId, successorId) =>
    request("/dependencies", {
      method: "DELETE",
      body: JSON.stringify({ predecessorId, successorId }),
    }),
  suggestDependencies: () =>
    request("/ai/suggest-dependencies", { method: "POST" }),
  seedDemoData: () => request("/seed", { method: "POST" }),
};
