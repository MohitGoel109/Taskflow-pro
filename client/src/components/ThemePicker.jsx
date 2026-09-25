import { useEffect, useRef, useState } from "react";
import { THEME_CATEGORIES } from "../themes.js";
import { useTheme } from "../ThemeContext.jsx";

export default function ThemePicker() {
  const { selection, active, selectTheme, resetTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [viewCategory, setViewCategory] = useState(null); // null = level 1 (categories)
  const popoverRef = useRef(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) setViewCategory(null); // always reopen at level 1
      return next;
    });
  }

  function handlePickCategory(category) {
    setViewCategory(category);
  }

  function handlePickTheme(themeKey) {
    selectTheme(viewCategory.key, themeKey);
    setOpen(false);
  }

  function handleBack() {
    setViewCategory(null);
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={toggleOpen}
        className="tf-btn-secondary rounded-md border px-3 py-1.5 text-xs font-medium transition"
      >
        {"\uD83C\uDFA8"} Theme{active ? `: ${active.label}` : ""}
      </button>

      {open && (
        <div className="tf-popover absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-lg border shadow-xl">
          {viewCategory === null ? (
            <>
              <div className="tf-popover-header px-3 py-2 text-xs font-semibold">
                Choose a category
              </div>
              <div className="grid grid-cols-1 gap-1 p-2">
                {THEME_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => handlePickCategory(cat)}
                    className="tf-popover-item flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm"
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
                {selection && (
                  <button
                    onClick={() => {
                      resetTheme();
                      setOpen(false);
                    }}
                    className="tf-popover-item mt-1 rounded-md px-3 py-2 text-left text-xs opacity-80"
                  >
                    Reset to default look
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="tf-popover-header flex items-center gap-2 px-3 py-2 text-xs font-semibold">
                <button onClick={handleBack} className="tf-popover-back" aria-label="Back">
                  {"\u2190"}
                </button>
                <span>{viewCategory.emoji} {viewCategory.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2">
                {Object.entries(viewCategory.themes).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => handlePickTheme(key)}
                    className="tf-swatch flex flex-col items-start gap-1 rounded-md border p-2 text-left"
                    style={{
                      background: t.vars["--tf-bg"],
                      color: t.vars["--tf-text"],
                      borderColor: t.vars["--tf-surface-border"],
                    }}
                  >
                    <span
                      className="h-5 w-full rounded"
                      style={{ background: t.vars["--tf-accent"] }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ fontFamily: t.vars["--tf-font-heading"] }}
                    >
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
