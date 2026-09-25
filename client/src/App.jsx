import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { ThemeProvider } from "./ThemeContext.jsx";
import Header from "./components/Header.jsx";
import Board from "./components/Board.jsx";
import TaskModal from "./components/TaskModal.jsx";
import AISuggestPanel from "./components/AISuggestPanel.jsx";
import BoardSkeleton from "./components/BoardSkeleton.jsx";
import EmptyState from "./components/EmptyState.jsx";
import CriticalPathPanel from "./components/CriticalPathPanel.jsx";
import ThemeEffects from "./components/ThemeEffects.jsx";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [banner, setBanner] = useState(null); // transient info/error banner

  const [editingTaskId, setEditingTaskId] = useState(undefined); // undefined = closed, null = create, id = edit
  const [modalError, setModalError] = useState(null);

  const [criticalPathOn, setCriticalPathOn] = useState(false);
  const [criticalIds, setCriticalIds] = useState(new Set());
  const [criticalPath, setCriticalPath] = useState([]); // ordered ids, for the panel
  const [criticalPathLength, setCriticalPathLength] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const loadBoard = useCallback(async () => {
    try {
      const data = await api.getBoard();
      setTasks(data.tasks);
      setEdges(data.edges);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  function showBanner(message, kind = "info") {
    setBanner({ message, kind });
    setTimeout(() => setBanner(null), 4000);
  }

  // ---------- Drag and drop ----------
  function handleDragStart(start) {
    setDraggingTaskId(start.draggableId);
  }

  async function handleDragEnd(result) {
    setDraggingTaskId(null);
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find((t) => t.id === draggableId);
    const destColumn = destination.droppableId;

    // Guard: a Blocked task can only sit in Backlog — moving it forward
    // manually would contradict what the DAG engine says is actually
    // startable. (Design decision, documented in README.)
    if (task.status === "Blocked" && destColumn !== "Backlog") {
      showBanner(`"${task.title}" is still Blocked — finish its prerequisites first.`, "error");
      return;
    }

    // Optimistic local move for snappy drag feel.
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, column: destColumn } : t))
    );

    try {
      await api.updateTask(draggableId, { column: destColumn });
      await loadBoard(); // pick up any propagated status/date changes downstream
      if (criticalPathOn) await refreshCriticalPath();
    } catch (err) {
      showBanner(err.message, "error");
      await loadBoard(); // revert optimistic update on failure
    }
  }

  // ---------- Task CRUD ----------
  async function handleCreateTask(data) {
    setModalError(null);
    try {
      await api.createTask(data);
      await loadBoard();
      setEditingTaskId(undefined);
    } catch (err) {
      setModalError(err.message);
      throw err;
    }
  }

  async function handleSaveTask(id, data) {
    setModalError(null);
    try {
      await api.updateTask(id, data);
      await loadBoard();
    } catch (err) {
      setModalError(err.message);
      throw err;
    }
  }

  async function handleAddDependency(predecessorId, successorId) {
    setModalError(null);
    try {
      await api.addDependency(predecessorId, successorId);
      await loadBoard();
      if (criticalPathOn) await refreshCriticalPath();
    } catch (err) {
      setModalError(err.message);
      throw err;
    }
  }

  async function handleRemoveDependency(predecessorId, successorId) {
    try {
      await api.removeDependency(predecessorId, successorId);
      await loadBoard();
      if (criticalPathOn) await refreshCriticalPath();
    } catch (err) {
      showBanner(err.message, "error");
    }
  }

  // ---------- Critical path ----------
  async function refreshCriticalPath() {
    try {
      const result = await api.getCriticalPath();
      setCriticalIds(new Set(result.path));
      setCriticalPath(result.path);
      setCriticalPathLength(result.length);
    } catch (err) {
      showBanner(err.message, "error");
    }
  }

  async function handleToggleCriticalPath() {
    if (!criticalPathOn) {
      await refreshCriticalPath();
      setCriticalPathOn(true);
    } else {
      setCriticalPathOn(false);
      setCriticalIds(new Set());
      setCriticalPath([]);
      setCriticalPathLength(null);
    }
  }

  // ---------- AI suggestions ----------
  async function handleSuggestAI() {
    setAiLoading(true);
    try {
      const result = await api.suggestDependencies();
      setAiResult(result);
    } catch (err) {
      showBanner(err.message, "error");
    } finally {
      setAiLoading(false);
    }
  }

  // ---------- Demo data ----------
  async function handleLoadDemoData() {
    setSeeding(true);
    try {
      const data = await api.seedDemoData();
      setTasks(data.tasks);
      setEdges(data.edges);
      setLoadError(null);
    } catch (err) {
      showBanner(err.message, "error");
    } finally {
      setSeeding(false);
    }
  }

  const tasksById = Object.fromEntries(tasks.map((t) => [t.id, t]));
  const editingTask =
    editingTaskId && editingTaskId !== null ? tasksById[editingTaskId] : null;
  const modalOpen = editingTaskId !== undefined;
  const draggingTask = draggingTaskId ? tasksById[draggingTaskId] : null;

  return (
    <ThemeProvider>
      <ThemeEffects />
      <div className="min-h-screen">
        <Header
          onSuggestAI={handleSuggestAI}
          aiLoading={aiLoading}
          criticalPathOn={criticalPathOn}
          onToggleCriticalPath={handleToggleCriticalPath}
          criticalPathLength={criticalPathLength}
        />

        {loading ? (
          <BoardSkeleton />
        ) : loadError ? (
          <div className="p-10 text-center" style={{ color: "var(--tf-status-blocked-text)" }}>
            Couldn&rsquo;t reach the server: {loadError}
            <br />
            <span className="text-xs" style={{ color: "var(--tf-subtext)" }}>
              Make sure the API is running (see server/README) and VITE_API_BASE is correct.
            </span>
          </div>
        ) : (
          <>
            {banner && (
              <div
                className={`px-6 py-2 text-xs font-medium ${
                  banner.kind === "error" ? "tf-banner-error" : "tf-banner-info"
                }`}
              >
                {banner.message}
              </div>
            )}

            {criticalPathOn && (
              <CriticalPathPanel
                path={criticalPath}
                tasksById={tasksById}
                totalLength={criticalPathLength}
              />
            )}

            {tasks.length === 0 ? (
              <EmptyState
                onLoadDemo={handleLoadDemoData}
                onAddTask={() => setEditingTaskId(null)}
                seeding={seeding}
              />
            ) : (
              <Board
                tasks={tasks}
                edges={edges}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onOpenTask={(task) => setEditingTaskId(task.id)}
                onAddTask={() => setEditingTaskId(null)}
                criticalIds={criticalPathOn ? criticalIds : new Set()}
                draggingTask={draggingTask}
              />
            )}
          </>
        )}

        {modalOpen && (
          <TaskModal
            task={editingTask}
            allTasks={tasks}
            edges={edges}
            error={modalError}
            onClose={() => {
              setEditingTaskId(undefined);
              setModalError(null);
            }}
            onCreate={handleCreateTask}
            onSave={handleSaveTask}
            onAddDependency={handleAddDependency}
            onRemoveDependency={handleRemoveDependency}
          />
        )}

        {aiResult && (
          <AISuggestPanel
            tasksById={tasksById}
            initialResult={aiResult}
            onAccept={handleAddDependency}
            onClose={() => setAiResult(null)}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
