// TaskFlow Pro — Theme Registry
// -------------------------------
// 6 categories x 4 sub-themes = 24 total. Each sub-theme is a flat map of
// CSS custom properties applied to :root when selected (see ThemeContext.jsx).
// Deliberately varies palette AND font-pairing AND radius AND shadow style
// AND background pattern per theme so no two ever read as "the same theme,
// different color" — that was the explicit brief.

// Reusable status-badge color trios (blocked/ready/done), picked per theme
// to fit its mood. Palette + font + shape differ per theme regardless, so
// reusing a trio across two themes never makes them look alike overall.
const TRIO_WARM = {
  "--tf-status-blocked-bg": "#3a1414", "--tf-status-blocked-text": "#ff8a80", "--tf-status-blocked-border": "#7a2020",
  "--tf-status-ready-bg": "#2a2410", "--tf-status-ready-text": "#e8d37a", "--tf-status-ready-border": "#5c4d1f",
  "--tf-status-done-bg": "#16321e", "--tf-status-done-text": "#8fd6a0", "--tf-status-done-border": "#2f5c3d",
};
const TRIO_COOL = {
  "--tf-status-blocked-bg": "#3a1420", "--tf-status-blocked-text": "#ff8fae", "--tf-status-blocked-border": "#7a1f3a",
  "--tf-status-ready-bg": "#0f2a3a", "--tf-status-ready-text": "#7ad0f5", "--tf-status-ready-border": "#1f4d6b",
  "--tf-status-done-bg": "#0f3a2e", "--tf-status-done-text": "#7af0c2", "--tf-status-done-border": "#1f6b52",
};
const TRIO_MONO = {
  "--tf-status-blocked-bg": "#2a2a2a", "--tf-status-blocked-text": "#ff6b6b", "--tf-status-blocked-border": "#4a4a4a",
  "--tf-status-ready-bg": "#2a2a2a", "--tf-status-ready-text": "#d0d0d0", "--tf-status-ready-border": "#4a4a4a",
  "--tf-status-done-bg": "#2a2a2a", "--tf-status-done-text": "#7ad67a", "--tf-status-done-border": "#4a4a4a",
};
const TRIO_NEON = {
  "--tf-status-blocked-bg": "#2a0a1e", "--tf-status-blocked-text": "#ff2079", "--tf-status-blocked-border": "#ff2079",
  "--tf-status-ready-bg": "#0a1e2a", "--tf-status-ready-text": "#00e5ff", "--tf-status-ready-border": "#00e5ff",
  "--tf-status-done-bg": "#0a2a14", "--tf-status-done-text": "#39ff6a", "--tf-status-done-border": "#39ff6a",
};
const TRIO_PASTEL = {
  "--tf-status-blocked-bg": "#ffe0e0", "--tf-status-blocked-text": "#c23b5a", "--tf-status-blocked-border": "#ffb3c1",
  "--tf-status-ready-bg": "#fff3d6", "--tf-status-ready-text": "#a8760b", "--tf-status-ready-border": "#ffe08a",
  "--tf-status-done-bg": "#dff5e1", "--tf-status-done-text": "#3d8b53", "--tf-status-done-border": "#b6e6bd",
};
const TRIO_LIGHT = {
  "--tf-status-blocked-bg": "#fde8e8", "--tf-status-blocked-text": "#b91c1c", "--tf-status-blocked-border": "#f5b5b5",
  "--tf-status-ready-bg": "#e8f0fd", "--tf-status-ready-text": "#1d4ed8", "--tf-status-ready-border": "#b8cdf5",
  "--tf-status-done-bg": "#e6f7ec", "--tf-status-done-text": "#15803d", "--tf-status-done-border": "#b3e6c4",
};

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const expanded = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  return [0, 2, 4].map((index) => parseInt(expanded.slice(index, index + 2), 16));
}

function rgbToHsl([red, green, blue]) {
  const values = [red, green, blue].map((value) => value / 255);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const lightness = (max + min) / 2;
  if (max === min) return [0, 0, lightness];

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue;
  if (max === values[0]) hue = (values[1] - values[2]) / delta + (values[1] < values[2] ? 6 : 0);
  else if (max === values[1]) hue = (values[2] - values[0]) / delta + 2;
  else hue = (values[0] - values[1]) / delta + 4;
  return [hue / 6, saturation, lightness];
}

function hslToHex([hue, saturation, lightness]) {
  const hueToRgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (saturation === 0) {
    const value = Math.round(lightness * 255).toString(16).padStart(2, "0");
    return `#${value}${value}${value}`;
  }
  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const red = Math.round(hueToRgb(p, q, hue + 1 / 3) * 255).toString(16).padStart(2, "0");
  const green = Math.round(hueToRgb(p, q, hue) * 255).toString(16).padStart(2, "0");
  const blue = Math.round(hueToRgb(p, q, hue - 1 / 3) * 255).toString(16).padStart(2, "0");
  return `#${red}${green}${blue}`;
}

function uniqueStatusTrio(accent, bg) {
  const [accentHue] = rgbToHsl(hexToRgb(accent));
  const [, , backgroundLightness] = rgbToHsl(hexToRgb(bg));
  const dark = backgroundLightness < 0.5;
  const toneShift = backgroundLightness * 0.08;
  const make = (hue, lightness) => hslToHex([
    ((accentHue + hue) % 1 + 1) % 1,
    dark ? 0.52 : 0.62,
    Math.max(0.08, Math.min(0.92, lightness + toneShift)),
  ]);
  const backgroundLight = dark ? 0.16 : 0.92;
  const textLight = dark ? 0.78 : 0.32;
  const borderLight = dark ? 0.44 : 0.68;
  return {
    "--tf-status-blocked-bg": make(0.92, backgroundLight), "--tf-status-blocked-text": make(0.92, textLight), "--tf-status-blocked-border": make(0.92, borderLight),
    "--tf-status-ready-bg": make(0.12, backgroundLight), "--tf-status-ready-text": make(0.12, textLight), "--tf-status-ready-border": make(0.12, borderLight),
    "--tf-status-done-bg": make(0.38, backgroundLight), "--tf-status-done-text": make(0.38, textLight), "--tf-status-done-border": make(0.38, borderLight),
  };
}

function cursorForAccent(accent) {
  const color = accent.replace("#", "%23");
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'%3E%3Cpath d='M3 2l11 7-5 1-2 5z' fill='%23000' stroke='%23${color.slice(3)}' stroke-width='1.4'/%3E%3C/svg%3E") 2 2, auto`;
}

function motionForAccent(accent) {
  const [hue] = rgbToHsl(hexToRgb(accent));
  if (hue < 0.08 || hue >= 0.92) return { card: "tf-card-rise", screen: "tf-screen-breathe", duration: "8s" };
  if (hue < 0.25) return { card: "tf-card-sway", screen: "tf-screen-drift", duration: "14s" };
  if (hue < 0.48) return { card: "tf-card-lift", screen: "tf-screen-sweep", duration: "18s" };
  if (hue < 0.72) return { card: "tf-card-glow", screen: "tf-screen-drift", duration: "22s" };
  return { card: "tf-card-fade", screen: "tf-screen-flicker", duration: "11s" };
}

function theme({
  label, bg, bgImage = "none", surface, surfaceBorder, text, subtext,
  cardBg, cardBorder, cardShadow, radius, accent, accentHover, accentText,
  criticalBorder, trio, fontHeading, fontBody, overlay, dropzoneBg, secondaryHover,
  screenEffect, cursorEffect,
}) {
  const motion = motionForAccent(accent);
  return {
    label,
    vars: {
      "--tf-bg": bg,
      "--tf-bg-image": bgImage,
      "--tf-surface": surface,
      "--tf-surface-border": surfaceBorder,
      "--tf-text": text,
      "--tf-subtext": subtext,
      "--tf-card-bg": cardBg,
      "--tf-card-border": cardBorder,
      "--tf-card-shadow": cardShadow,
      "--tf-radius": radius,
      "--tf-accent": accent,
      "--tf-accent-hover": accentHover,
      "--tf-accent-text": accentText,
      "--tf-critical-border": criticalBorder,
      "--tf-font-heading": fontHeading,
      "--tf-font-body": fontBody,
      "--tf-modal-overlay": overlay,
      "--tf-dropzone-bg": dropzoneBg,
      "--tf-secondary-hover": secondaryHover,
      "--tf-screen-effect": screenEffect || (bgImage !== "none"
        ? bgImage
        : "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--tf-accent) 18%, transparent), transparent 60%)"),
      "--tf-cursor": cursorEffect || cursorForAccent(accent),
      "--tf-card-animation": motion.card,
      "--tf-screen-animation": motion.screen,
      "--tf-motion-duration": motion.duration,
      ...uniqueStatusTrio(accent, bg),
    },
  };
}

export const THEME_CATEGORIES = [
  {
    key: "samurai",
    label: "Samurai",
    emoji: "\u2694\uFE0F",
    themes: {
      shogun: theme({
        label: "Shogun",
        bg: "#170d0a",
        bgImage: "radial-gradient(circle at 20% -10%, rgba(201,162,39,0.15), transparent 60%)",
        surface: "#241512", surfaceBorder: "#5c2a1f",
        text: "#f3e3c3", subtext: "#c9a97a",
        cardBg: "#2c1a15", cardBorder: "#6b2f22", cardShadow: "0 4px 16px rgba(0,0,0,0.6)",
        radius: "4px",
        accent: "#c9a227", accentHover: "#e0b93a", accentText: "#1a0f0a",
        criticalBorder: "#e0b93a", trio: TRIO_WARM,
        fontHeading: "'Shippori Mincho', serif", fontBody: "'Noto Serif', serif",
        overlay: "rgba(10,5,3,0.75)", dropzoneBg: "rgba(201,162,39,0.12)", secondaryHover: "rgba(255,255,255,0.05)",
      }),
      ronin: theme({
        label: "Ronin",
        bg: "#1c1e22",
        bgImage: "none",
        surface: "#25282d", surfaceBorder: "#3a3f47",
        text: "#dfe3e8", subtext: "#8b93a0",
        cardBg: "#2a2e34", cardBorder: "#3a3f47", cardShadow: "0 1px 3px rgba(0,0,0,0.4)",
        radius: "2px",
        accent: "#6b7684", accentHover: "#8590a0", accentText: "#12141a",
        criticalBorder: "#8590a0", trio: TRIO_MONO,
        fontHeading: "'Cormorant Garamond', serif", fontBody: "'Inter', sans-serif",
        overlay: "rgba(10,12,15,0.7)", dropzoneBg: "rgba(139,147,160,0.10)", secondaryHover: "rgba(255,255,255,0.04)",
      }),
      sakuraDawn: theme({
        label: "Sakura Dawn",
        bg: "#fff3f6",
        bgImage: "radial-gradient(circle at 90% 0%, rgba(255,183,206,0.35), transparent 55%)",
        surface: "#ffffff", surfaceBorder: "#ffd6e2",
        text: "#5c2a3a", subtext: "#a86b80",
        cardBg: "#ffffff", cardBorder: "#ffd6e2", cardShadow: "0 2px 10px rgba(255,150,180,0.18)",
        radius: "16px",
        accent: "#e8779a", accentHover: "#d95f85", accentText: "#ffffff",
        criticalBorder: "#e8779a", trio: TRIO_PASTEL,
        fontHeading: "'Kosugi Maru', sans-serif", fontBody: "'Nunito', sans-serif",
        overlay: "rgba(92,42,58,0.35)", dropzoneBg: "rgba(232,119,154,0.10)", secondaryHover: "rgba(232,119,154,0.06)",
      }),
      oniWarlord: theme({
        label: "Oni Warlord",
        bg: "#1a0505",
        bgImage: "radial-gradient(circle at 50% 0%, rgba(139,0,0,0.35), transparent 60%)",
        surface: "#240a0a", surfaceBorder: "#5c1414",
        text: "#f5d9d9", subtext: "#c98a8a",
        cardBg: "#2b0c0c", cardBorder: "#6b1a1a", cardShadow: "0 6px 20px rgba(0,0,0,0.7)",
        radius: "2px",
        accent: "#b91c1c", accentHover: "#d92a2a", accentText: "#fff5f5",
        criticalBorder: "#e0b93a", trio: TRIO_WARM,
        fontHeading: "'Cinzel Decorative', serif", fontBody: "'Zilla Slab', serif",
        overlay: "rgba(10,2,2,0.8)", dropzoneBg: "rgba(185,28,28,0.14)", secondaryHover: "rgba(255,255,255,0.05)",
      }),
    },
  },
  {
    key: "assassin",
    label: "Assassin",
    emoji: "\uD83D\uDDDD\uFE0F",
    themes: {
      shadowGuild: theme({
        label: "Shadow Guild",
        bg: "#0d0d12",
        bgImage: "radial-gradient(circle at 15% 20%, rgba(90,60,140,0.18), transparent 55%)",
        surface: "#16161d", surfaceBorder: "#2a2a36",
        text: "#e2e2ea", subtext: "#8a8a9a",
        cardBg: "#1a1a22", cardBorder: "#2e2e3c", cardShadow: "0 4px 18px rgba(0,0,0,0.6)",
        radius: "6px",
        accent: "#7c5cff", accentHover: "#9478ff", accentText: "#0d0d12",
        criticalBorder: "#7c5cff", trio: TRIO_COOL,
        fontHeading: "'Oswald', sans-serif", fontBody: "'Work Sans', sans-serif",
        overlay: "rgba(5,5,8,0.8)", dropzoneBg: "rgba(124,92,255,0.12)", secondaryHover: "rgba(255,255,255,0.05)",
      }),
      neonWetwork: theme({
        label: "Neon Wetwork",
        bg: "#0a0014",
        bgImage: "repeating-linear-gradient(115deg, rgba(255,0,170,0.05) 0 2px, transparent 2px 14px)",
        surface: "#160022", surfaceBorder: "#3a0a5c",
        text: "#f5e6ff", subtext: "#c98fff",
        cardBg: "#1c0030", cardBorder: "#4a1470", cardShadow: "0 0 20px rgba(255,0,170,0.25)",
        radius: "2px",
        accent: "#ff00aa", accentHover: "#ff33bd", accentText: "#0a0014",
        criticalBorder: "#00e5ff", trio: TRIO_NEON,
        fontHeading: "'Orbitron', sans-serif", fontBody: "'Rajdhani', sans-serif",
        overlay: "rgba(5,0,10,0.85)", dropzoneBg: "rgba(255,0,170,0.14)", secondaryHover: "rgba(255,255,255,0.06)",
      }),
      poisonGarden: theme({
        label: "Poison Garden",
        bg: "#061516",
        bgImage: "radial-gradient(circle at 80% 100%, rgba(0,210,170,0.18), transparent 55%)",
        surface: "#0b2424", surfaceBorder: "#18534d",
        text: "#d8fff4", subtext: "#72c7b5",
        cardBg: "#0d2d2b", cardBorder: "#20736a", cardShadow: "0 4px 18px rgba(0,210,170,0.16)",
        radius: "8px",
        accent: "#00d2aa", accentHover: "#32e8c2", accentText: "#041211",
        criticalBorder: "#f1d45b", trio: TRIO_WARM,
        fontHeading: "'UnifrakturCook', cursive", fontBody: "'Mulish', sans-serif",
        overlay: "rgba(3,14,14,0.8)", dropzoneBg: "rgba(0,210,170,0.12)", secondaryHover: "rgba(255,255,255,0.05)",
      }),
      phantomBlade: theme({
        label: "Phantom Blade",
        bg: "#10141c",
        bgImage: "radial-gradient(circle at 50% 0%, rgba(160,190,230,0.12), transparent 60%)",
        surface: "#181d27", surfaceBorder: "#2b3242",
        text: "#e6ecf5", subtext: "#8f9bb3",
        cardBg: "#1c222e", cardBorder: "#2f3849", cardShadow: "0 2px 14px rgba(120,160,220,0.15)",
        radius: "3px",
        accent: "#9fb8e0", accentHover: "#b9cdf0", accentText: "#10141c",
        criticalBorder: "#c9d8f0", trio: TRIO_COOL,
        fontHeading: "'Marcellus', serif", fontBody: "'Karla', sans-serif",
        overlay: "rgba(5,7,12,0.75)", dropzoneBg: "rgba(159,184,224,0.10)", secondaryHover: "rgba(255,255,255,0.04)",
      }),
    },
  },
  {
    key: "scientific",
    label: "Scientific",
    emoji: "\uD83E\uDDEA",
    themes: {
      blueprintLab: theme({
        label: "Blueprint Lab",
        bg: "#0b2136",
        bgImage:
          "repeating-linear-gradient(0deg, rgba(0,200,255,0.07) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, rgba(0,200,255,0.07) 0 1px, transparent 1px 24px)",
        surface: "#0f2c46", surfaceBorder: "#1c4a6e",
        text: "#dff2ff", subtext: "#7fb8db",
        cardBg: "#123354", cardBorder: "#215a82", cardShadow: "0 2px 12px rgba(0,180,255,0.15)",
        radius: "2px",
        accent: "#00c8ff", accentHover: "#33d4ff", accentText: "#0b2136",
        criticalBorder: "#ffcc00", trio: TRIO_COOL,
        fontHeading: "'Share Tech Mono', monospace", fontBody: "'IBM Plex Sans', sans-serif",
        overlay: "rgba(4,12,20,0.8)", dropzoneBg: "rgba(0,200,255,0.10)", secondaryHover: "rgba(255,255,255,0.05)",
      }),
      quantumCore: theme({
        label: "Quantum Core",
        bg: "#120a24",
        bgImage: "radial-gradient(circle at 50% 20%, rgba(130,60,255,0.28), transparent 60%)",
        surface: "#1a1030", surfaceBorder: "#3a2166",
        text: "#ece3ff", subtext: "#a893e0",
        cardBg: "#20143a", cardBorder: "#442a7a", cardShadow: "0 0 24px rgba(140,60,255,0.3)",
        radius: "10px",
        accent: "#a259ff", accentHover: "#b87aff", accentText: "#120a24",
        criticalBorder: "#00e5ff", trio: TRIO_NEON,
        fontHeading: "'Audiowide', sans-serif", fontBody: "'Exo 2', sans-serif",
        overlay: "rgba(6,3,14,0.82)", dropzoneBg: "rgba(162,89,255,0.14)", secondaryHover: "rgba(255,255,255,0.06)",
      }),
      terminalHacker: theme({
        label: "Terminal Hacker",
        bg: "#020403",
        bgImage: "none",
        surface: "#050a05", surfaceBorder: "#0f3d0f",
        text: "#4dff4d", subtext: "#2fa62f",
        cardBg: "#040a04", cardBorder: "#155c15", cardShadow: "0 0 12px rgba(0,255,0,0.15)",
        radius: "0px",
        accent: "#00ff41", accentHover: "#4dff7a", accentText: "#020403",
        criticalBorder: "#ffee00", trio: TRIO_MONO,
        fontHeading: "'VT323', monospace", fontBody: "'Space Mono', monospace",
        overlay: "rgba(0,5,0,0.85)", dropzoneBg: "rgba(0,255,65,0.08)", secondaryHover: "rgba(0,255,65,0.05)",
      }),
      spaceStation: theme({
        label: "Space Station",
        bg: "#060915",
        bgImage: "radial-gradient(1px 1px at 20% 30%, #fff 100%, transparent), radial-gradient(1px 1px at 70% 60%, #fff 100%, transparent), radial-gradient(1px 1px at 40% 80%, #fff 100%, transparent)",
        surface: "#0c1226", surfaceBorder: "#1f2c4a",
        text: "#e2e8ff", subtext: "#8894c2",
        cardBg: "#10173056", cardBorder: "#263762", cardShadow: "0 2px 14px rgba(80,120,255,0.2)",
        radius: "6px",
        accent: "#4d7cff", accentHover: "#6d94ff", accentText: "#060915",
        criticalBorder: "#ffb84d", trio: TRIO_COOL,
        fontHeading: "'Michroma', sans-serif", fontBody: "'Titillium Web', sans-serif",
        overlay: "rgba(2,4,10,0.8)", dropzoneBg: "rgba(77,124,255,0.12)", secondaryHover: "rgba(255,255,255,0.05)",
      }),
    },
  },
  {
    key: "animated",
    label: "Animated",
    emoji: "\uD83C\uDFAC",
    themes: {
      shonenArena: theme({
        label: "Shonen Arena",
        bg: "#1a1210",
        bgImage: "repeating-linear-gradient(100deg, rgba(255,80,40,0.06) 0 3px, transparent 3px 20px)",
        surface: "#241614", surfaceBorder: "#5c2318",
        text: "#fdece5", subtext: "#e0a68f",
        cardBg: "#2b1917", cardBorder: "#6b2a1c", cardShadow: "0 4px 14px rgba(0,0,0,0.5)",
        radius: "3px",
        accent: "#ff4d1c", accentHover: "#ff6a3d", accentText: "#1a1210",
        criticalBorder: "#ffcc00", trio: TRIO_WARM,
        fontHeading: "'Bangers', cursive", fontBody: "'Inter', sans-serif",
        overlay: "rgba(15,8,6,0.75)", dropzoneBg: "rgba(255,77,28,0.14)", secondaryHover: "rgba(255,255,255,0.05)",
      }),
      ghibliCountryside: theme({
        label: "Ghibli Countryside",
        bg: "#f3f7e8",
        bgImage: "radial-gradient(circle at 85% 5%, rgba(255,230,150,0.4), transparent 55%)",
        surface: "#ffffff", surfaceBorder: "#dce8c4",
        text: "#3f4a2e", subtext: "#7c8a63",
        cardBg: "#ffffff", cardBorder: "#dce8c4", cardShadow: "0 2px 10px rgba(120,140,80,0.15)",
        radius: "18px",
        accent: "#7fa650", accentHover: "#6c9140", accentText: "#ffffff",
        criticalBorder: "#e0b93a", trio: TRIO_PASTEL,
        fontHeading: "'Baloo 2', cursive", fontBody: "'Comfortaa', sans-serif",
        overlay: "rgba(63,74,46,0.3)", dropzoneBg: "rgba(127,166,80,0.10)", secondaryHover: "rgba(127,166,80,0.06)",
      }),
      kawaiiDreamscape: theme({
        label: "Kawaii Dreamscape",
        bg: "#fdf1ff",
        bgImage: "radial-gradient(circle at 10% 90%, rgba(190,170,255,0.3), transparent 55%)",
        surface: "#ffffff", surfaceBorder: "#f0d6ff",
        text: "#5a3d6b", subtext: "#a883bd",
        cardBg: "#ffffff", cardBorder: "#f0d6ff", cardShadow: "0 3px 14px rgba(220,170,255,0.25)",
        radius: "22px",
        accent: "#d879e8", accentHover: "#c85fdb", accentText: "#ffffff",
        criticalBorder: "#ff9ecf", trio: TRIO_PASTEL,
        fontHeading: "'Fredoka', sans-serif", fontBody: "'Quicksand', sans-serif",
        overlay: "rgba(90,61,107,0.32)", dropzoneBg: "rgba(216,121,232,0.10)", secondaryHover: "rgba(216,121,232,0.06)",
      }),
      studioNoir: theme({
        label: "Studio Noir",
        bg: "#f4f4f4",
        bgImage:
          "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)",
        surface: "#ffffff", surfaceBorder: "#1a1a1a",
        text: "#111111", subtext: "#555555",
        cardBg: "#ffffff", cardBorder: "#1a1a1a", cardShadow: "3px 3px 0 #1a1a1a",
        radius: "0px",
        accent: "#111111", accentHover: "#333333", accentText: "#ffffff",
        criticalBorder: "#111111", trio: TRIO_LIGHT,
        fontHeading: "'Bebas Neue', sans-serif", fontBody: "'Inter', sans-serif",
        overlay: "rgba(0,0,0,0.5)", dropzoneBg: "rgba(0,0,0,0.06)", secondaryHover: "rgba(0,0,0,0.05)",
      }),
    },
  },
  {
    key: "horror",
    label: "Horror",
    emoji: "\uD83D\uDC7B",
    themes: {
      gothicCrimson: theme({
        label: "Gothic Crimson",
        bg: "#120608",
        bgImage: "radial-gradient(circle at 50% 100%, rgba(120,0,20,0.35), transparent 60%)",
        surface: "#1c0a0d", surfaceBorder: "#4a1018",
        text: "#f0dcdc", subtext: "#b3808a",
        cardBg: "#220c10", cardBorder: "#5c141c", cardShadow: "0 4px 20px rgba(0,0,0,0.7)",
        radius: "2px",
        accent: "#8b0020", accentHover: "#b0002a", accentText: "#f0dcdc",
        criticalBorder: "#c9a227", trio: TRIO_WARM,
        fontHeading: "'Pirata One', cursive", fontBody: "'EB Garamond', serif",
        overlay: "rgba(6,2,3,0.85)", dropzoneBg: "rgba(139,0,32,0.14)", secondaryHover: "rgba(255,255,255,0.05)",
      }),
      hauntedAsylum: theme({
        label: "Haunted Asylum",
        bg: "#12140f",
        bgImage: "repeating-linear-gradient(45deg, rgba(150,170,120,0.04) 0 2px, transparent 2px 16px)",
        surface: "#1a1d16", surfaceBorder: "#3a4030",
        text: "#dbe0d0", subtext: "#8f9a80",
        cardBg: "#1e2118", cardBorder: "#454c38", cardShadow: "0 4px 16px rgba(0,0,0,0.6)",
        radius: "1px",
        accent: "#7a8a5a", accentHover: "#93a56e", accentText: "#12140f",
        criticalBorder: "#c9c04a", trio: TRIO_MONO,
        fontHeading: "'Creepster', cursive", fontBody: "'Special Elite', monospace",
        overlay: "rgba(5,6,4,0.85)", dropzoneBg: "rgba(122,138,90,0.10)", secondaryHover: "rgba(255,255,255,0.04)",
      }),
      bloodMoon: theme({
        label: "Blood Moon",
        bg: "#0a0505",
        bgImage: "radial-gradient(circle at 80% 15%, rgba(200,20,20,0.4), transparent 50%)",
        surface: "#160a0a", surfaceBorder: "#4a1414",
        text: "#f5dede", subtext: "#c98080",
        cardBg: "#1c0d0d", cardBorder: "#5c1a1a", cardShadow: "0 0 24px rgba(200,20,20,0.25)",
        radius: "50% 4px 50% 4px",
        accent: "#d91c1c", accentHover: "#f03535", accentText: "#0a0505",
        criticalBorder: "#ff5252", trio: TRIO_WARM,
        fontHeading: "'Nosifer', cursive", fontBody: "'Crimson Text', serif",
        overlay: "rgba(4,2,2,0.88)", dropzoneBg: "rgba(217,28,28,0.14)", secondaryHover: "rgba(255,255,255,0.05)",
      }),
      cursedParchment: theme({
        label: "Cursed Parchment",
        bg: "#e8dcc0",
        bgImage: "radial-gradient(circle at 30% 20%, rgba(120,90,40,0.12), transparent 50%), radial-gradient(circle at 80% 80%, rgba(80,60,30,0.1), transparent 50%)",
        surface: "#ddcfa9", surfaceBorder: "#a8926a",
        text: "#3a2c18", subtext: "#6b5836",
        cardBg: "#e2d4ae", cardBorder: "#a8926a", cardShadow: "2px 3px 0 rgba(60,44,24,0.3)",
        radius: "1px",
        accent: "#5c3a1e", accentHover: "#77502c", accentText: "#e8dcc0",
        criticalBorder: "#8b0020", trio: TRIO_PASTEL,
        fontHeading: "'IM Fell English SC', serif", fontBody: "'IM Fell English', serif",
        overlay: "rgba(40,28,14,0.55)", dropzoneBg: "rgba(92,58,30,0.12)", secondaryHover: "rgba(92,58,30,0.08)",
      }),
    },
  },
  {
    key: "western",
    label: "Western",
    emoji: "\uD83E\uDD20",
    themes: {
      dustyTrail: theme({
        label: "Dusty Trail",
        bg: "#21150f",
        bgImage: "repeating-linear-gradient(12deg, rgba(214,151,76,0.06) 0 2px, transparent 2px 18px)",
        surface: "#302017", surfaceBorder: "#785033",
        text: "#f7e3c4", subtext: "#c99a67",
        cardBg: "#382419", cardBorder: "#8d5b36", cardShadow: "4px 5px 0 rgba(0,0,0,0.32)",
        radius: "3px",
        accent: "#d89445", accentHover: "#f0ad5e", accentText: "#21150f",
        criticalBorder: "#e65f3d", trio: TRIO_WARM,
        fontHeading: "'Rye', cursive", fontBody: "'Roboto Slab', serif",
        overlay: "rgba(28,15,8,0.72)", dropzoneBg: "rgba(216,148,69,0.14)", secondaryHover: "rgba(255,235,200,0.07)",
      }),
      sheriffOffice: theme({
        label: "Sheriff Office",
        bg: "#e8e0cf",
        bgImage: "linear-gradient(rgba(92,73,45,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(92,73,45,0.04) 1px, transparent 1px)",
        surface: "#f7f0df", surfaceBorder: "#b9a47d",
        text: "#30291e", subtext: "#75654b",
        cardBg: "#fff9e9", cardBorder: "#b9a47d", cardShadow: "3px 3px 0 rgba(92,73,45,0.18)",
        radius: "2px",
        accent: "#1f5f78", accentHover: "#2c7f9d", accentText: "#ffffff",
        criticalBorder: "#b23a32", trio: TRIO_LIGHT,
        fontHeading: "'Rye', cursive", fontBody: "'Roboto Slab', serif",
        overlay: "rgba(70,52,30,0.28)", dropzoneBg: "rgba(31,95,120,0.10)", secondaryHover: "rgba(70,52,30,0.06)",
      }),
      neonSaloon: theme({
        label: "Neon Saloon",
        bg: "#160b18",
        bgImage: "radial-gradient(circle at 18% 10%, rgba(255,93,168,0.2), transparent 36%), repeating-linear-gradient(90deg, rgba(255,193,77,0.04) 0 1px, transparent 1px 12px)",
        surface: "#261126", surfaceBorder: "#713052",
        text: "#ffe8f1", subtext: "#d995b4",
        cardBg: "#30152f", cardBorder: "#91406d", cardShadow: "0 0 22px rgba(255,93,168,0.18)",
        radius: "10px",
        accent: "#ff5da8", accentHover: "#ff83bb", accentText: "#260916",
        criticalBorder: "#ffd166", trio: TRIO_NEON,
        fontHeading: "'Rye', cursive", fontBody: "'Barlow Condensed', sans-serif",
        overlay: "rgba(18,5,20,0.82)", dropzoneBg: "rgba(255,93,168,0.13)", secondaryHover: "rgba(255,255,255,0.06)",
      }),
      outlawSunset: theme({
        label: "Outlaw Sunset",
        bg: "#32140e",
        bgImage: "radial-gradient(circle at 80% 0%, rgba(255,190,70,0.3), transparent 52%), linear-gradient(160deg, rgba(185,52,48,0.16), transparent 58%)",
        surface: "#4a1c13", surfaceBorder: "#a64b2f",
        text: "#fff0d1", subtext: "#e3a36f",
        cardBg: "#552016", cardBorder: "#c25d38", cardShadow: "0 5px 20px rgba(0,0,0,0.4)",
        radius: "14px 3px 14px 3px",
        accent: "#f2b544", accentHover: "#ffd16b", accentText: "#32140e",
        criticalBorder: "#57c7b1", trio: TRIO_PASTEL,
        fontHeading: "'Rye', cursive", fontBody: "'Barlow Condensed', sans-serif",
        overlay: "rgba(42,12,7,0.76)", dropzoneBg: "rgba(242,181,68,0.14)", secondaryHover: "rgba(255,240,200,0.08)",
      }),
    },
  },
];

export function findTheme(categoryKey, themeKey) {
  const category = THEME_CATEGORIES.find((c) => c.key === categoryKey);
  if (!category) return null;
  const t = category.themes[themeKey];
  if (!t) return null;
  return { category, themeKey, ...t };
}

// All Google Fonts referenced above, deduped, for the <link> tag in index.html.
export const ALL_FONT_FAMILIES = [
  "Shippori+Mincho:wght@400;600", "Noto+Serif:wght@400;600",
  "Cormorant+Garamond:wght@400;600", "Inter:wght@400;500;600;700",
  "Kosugi+Maru", "Nunito:wght@400;600;700",
  "Cinzel+Decorative:wght@700", "Zilla+Slab:wght@400;600",
  "Oswald:wght@400;500;600", "Work+Sans:wght@400;500;600",
  "Orbitron:wght@500;700", "Rajdhani:wght@400;500;600",
  "UnifrakturCook:wght@700", "Mulish:wght@400;600",
  "Marcellus", "Karla:wght@400;500;600",
  "Share+Tech+Mono", "IBM+Plex+Sans:wght@400;500;600",
  "Audiowide", "Exo+2:wght@400;500;600",
  "VT323", "Space+Mono:wght@400;700",
  "Michroma", "Titillium+Web:wght@400;600;700",
  "Bangers", "Baloo+2:wght@500;700",
  "Comfortaa:wght@400;600", "Fredoka:wght@500;600",
  "Quicksand:wght@400;500;600", "Bebas+Neue",
  "Pirata+One", "EB+Garamond:wght@400;600",
  "Creepster", "Special+Elite",
  "Nosifer", "Crimson+Text:wght@400;600",
  "IM+Fell+English+SC", "IM+Fell+English:ital@0;1",
  "Rye", "Roboto+Slab:wght@400;600", "Barlow+Condensed:wght@400;600",
];
