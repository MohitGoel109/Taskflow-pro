import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { findTheme } from "./themes.js";

const ThemeContext = createContext(null);

const STORAGE_KEY = "taskflow-pro-theme"; // { categoryKey, themeKey } or null

function applyVars(vars) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

function clearVars(vars) {
  const root = document.documentElement;
  for (const key of Object.keys(vars)) {
    root.style.removeProperty(key);
  }
}

function replayThemeMotion() {
  const body = document.body;
  if (!body) return;
  body.classList.remove("tf-theme-transition");
  void body.offsetWidth;
  body.classList.add("tf-theme-transition");
  window.setTimeout(() => body.classList.remove("tf-theme-transition"), 900);
}

export function ThemeProvider({ children }) {
  const [selection, setSelection] = useState(null); // { categoryKey, themeKey } | null

  // Restore a saved theme on first load.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const found = findTheme(saved.categoryKey, saved.themeKey);
        if (found) {
          applyVars(found.vars);
          replayThemeMotion();
          setSelection(saved);
        }
      }
    } catch {
      // Corrupt/absent localStorage value — just fall back to the default look.
    }
  }, []);

  const selectTheme = useCallback((categoryKey, themeKey) => {
    const found = findTheme(categoryKey, themeKey);
    if (!found) return;
    applyVars(found.vars);
    replayThemeMotion();
    const next = { categoryKey, themeKey };
    setSelection(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage might be unavailable (private browsing, etc.) — theme still
      // applies for this session, it just won't persist across a refresh.
    }
  }, []);

  const resetTheme = useCallback(() => {
    if (selection) {
      const found = findTheme(selection.categoryKey, selection.themeKey);
      if (found) clearVars(found.vars);
    }
    setSelection(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [selection]);

  const active = selection ? findTheme(selection.categoryKey, selection.themeKey) : null;

  return (
    <ThemeContext.Provider value={{ selection, active, selectTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside a ThemeProvider");
  return ctx;
}
