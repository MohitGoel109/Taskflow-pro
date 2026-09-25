import { useEffect, useRef } from "react";
import { useTheme } from "../ThemeContext.jsx";

const MAX_PARTICLES = 48;
const MOTION_SCALE = 0.35;
const PROFILES = {
  "samurai/shogun": { kind: "petal", color: "#e0b93a", cursor: "glow", gravity: 0.0003, wind: 0.22 },
  "samurai/ronin": { kind: "mist", color: "#b8c0cc", cursor: "repel", gravity: -0.0002, wind: 0.04 },
  "samurai/sakuraDawn": { kind: "petal", color: "#f39ab4", cursor: "ripple", gravity: 0.0002, wind: 0.32 },
  "samurai/oniWarlord": { kind: "ember", color: "#ff4a3d", cursor: "slash", gravity: -0.0004, wind: 0.08 },
  "assassin/shadowGuild": { kind: "wisp", color: "#956cff", cursor: "attract", gravity: -0.0001, wind: 0.1 },
  "assassin/neonWetwork": { kind: "rain", color: "#00e5ff", secondary: "#ff00aa", cursor: "laser", gravity: 0.0005, wind: 0 },
  "assassin/poisonGarden": { kind: "spore", color: "#39e879", cursor: "gas", gravity: -0.0001, wind: 0.08 },
  "assassin/phantomBlade": { kind: "glint", color: "#dceaff", cursor: "sharp", gravity: 0, wind: 0.04 },
  "scientific/blueprintLab": { kind: "grid", color: "#00c8ff", cursor: "spotlight", gravity: 0, wind: 0 },
  "scientific/quantumCore": { kind: "constellation", color: "#b178ff", cursor: "web", gravity: 0, wind: 0.04 },
  "scientific/terminalHacker": { kind: "matrix", color: "#39ff6a", cursor: "terminal", gravity: 0.0005, wind: 0 },
  "scientific/spaceStation": { kind: "star", color: "#d7e2ff", cursor: "comet", gravity: 0, wind: 0.01 },
  "animated/shonenArena": { kind: "spark", color: "#ff7a36", cursor: "aura", gravity: -0.0005, wind: 0.05 },
  "animated/ghibliCountryside": { kind: "seed", color: "#b4d989", cursor: "repel", gravity: -0.0001, wind: 0.18 },
  "animated/kawaiiDreamscape": { kind: "star", color: "#ff9ed1", secondary: "#a8e6ff", cursor: "sparkle", gravity: -0.0002, wind: 0.08 },
  "animated/studioNoir": { kind: "dust", color: "#d8d8d8", cursor: "spotlight", gravity: 0.0001, wind: 0.02 },
  "horror/gothicCrimson": { kind: "droplet", color: "#a91531", cursor: "mist", gravity: 0.0004, wind: 0.02 },
  "horror/hauntedAsylum": { kind: "static", color: "#8ee85b", cursor: "glitch", gravity: 0, wind: 0 },
  "horror/bloodMoon": { kind: "moon", color: "#e54545", cursor: "ring", gravity: 0, wind: 0.02 },
  "horror/cursedParchment": { kind: "ember", color: "#d9914c", cursor: "ink", gravity: -0.0003, wind: 0.03 },
  "western/dustyTrail": { kind: "dust", color: "#c58b58", cursor: "dust", gravity: 0, wind: 0.42 },
  "western/sheriffOffice": { kind: "mote", color: "#ffd276", cursor: "spotlight", gravity: -0.0001, wind: 0.02 },
  "western/neonSaloon": { kind: "neon", color: "#ff5da8", secondary: "#ffd166", cursor: "laser", gravity: 0.0001, wind: 0.08 },
  "western/outlawSunset": { kind: "dust", color: "#f2b544", secondary: "#ff824d", cursor: "glow", gravity: -0.0001, wind: 0.16 },
};

function rgba(hex, alpha) {
  const value = hex.replace("#", "");
  const parts = value.length === 3 ? value.split("").map((part) => part + part) : [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)];
  return `rgba(${parts.map((part) => parseInt(part, 16)).join(",")},${alpha})`;
}

function makeParticle(width, height, profile) {
  const x = profile.kind === "matrix" ? Math.floor(Math.random() * Math.max(1, width / 24)) * 24 : Math.random() * width;
  return {
    x,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    size: 1.5 + Math.random() * (profile.kind === "mist" ? 9 : 4),
    life: Math.random(),
    angle: Math.random() * Math.PI * 2,
    breezePhase: Math.random() * Math.PI * 2,
    breezeRate: 0.65 + Math.random() * 0.7,
    sway: 0.5 + Math.random() * 0.8,
    color: Math.random() > 0.75 && profile.secondary ? profile.secondary : profile.color,
  };
}

export default function ThemeEffects() {
  const { selection } = useTheme();
  const canvasRef = useRef(null);
  const pointerRef = useRef({ x: -100, y: -100, previousX: -100, previousY: -100, moved: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const profile = (selection && PROFILES[`${selection.categoryKey}/${selection.themeKey}`]) || PROFILES["scientific/blueprintLab"];
    let animationFrame;
    let running = true;
    let width = 0;
    let height = 0;
    let particles = [];
    let trails = [];
    let pulses = [];

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: reducedMotion.matches ? 18 : MAX_PARTICLES }, () => makeParticle(width, height, profile));
    }

    function pointerMove(event) {
      const pointer = pointerRef.current;
      pointer.previousX = pointer.x;
      pointer.previousY = pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.moved = true;
      if (profile.cursor === "ripple" || profile.cursor === "ring" || profile.cursor === "gas") pulses.push({ x: pointer.x, y: pointer.y, age: 0 });
      if (["glow", "slash", "laser", "sharp", "comet", "sparkle", "dust", "ink", "mist", "terminal"].includes(profile.cursor)) {
        trails.push({ x: pointer.x, y: pointer.y, oldX: pointer.previousX, oldY: pointer.previousY, age: 0 });
      }
    }

    function drawParticle(particle, time) {
      const { kind } = profile;
      const alpha = 0.25 + particle.life * 0.65;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.angle);
      context.fillStyle = rgba(particle.color, alpha);
      context.strokeStyle = rgba(particle.color, alpha);
      context.shadowColor = particle.color;
      context.shadowBlur = kind === "ember" || kind === "spark" || kind === "neon" ? 12 : 4;
      if (["petal", "seed", "droplet"].includes(kind)) {
        context.beginPath();
        context.ellipse(0, 0, particle.size * 1.7, particle.size, 0.4, 0, Math.PI * 2);
        context.fill();
        if (kind === "seed") {
          context.strokeStyle = rgba(particle.color, alpha * 0.7);
          context.beginPath(); context.moveTo(-particle.size * 2, 0); context.lineTo(-particle.size * 5, -particle.size * 2); context.stroke();
        }
      } else if (kind === "mist" || kind === "wisp") {
        const mist = context.createRadialGradient(0, 0, 0, 0, 0, particle.size * 3);
        mist.addColorStop(0, rgba(particle.color, alpha * 0.18)); mist.addColorStop(1, rgba(particle.color, 0));
        context.fillStyle = mist; context.beginPath(); context.ellipse(0, 0, particle.size * 3, particle.size * 1.4, 0, 0, Math.PI * 2); context.fill();
      } else if (kind === "spore") {
        context.lineWidth = 1; context.beginPath(); context.arc(0, 0, particle.size * 1.7, 0, Math.PI * 2); context.stroke();
        context.beginPath(); context.arc(0, 0, particle.size * 0.6, 0, Math.PI * 2); context.stroke();
      } else if (["rain", "matrix"].includes(kind)) {
        if (kind === "matrix") {
          context.font = `${Math.max(10, particle.size * 4)}px monospace`; context.fillText(Math.random() > 0.5 ? "0" : "1", 0, 0);
        } else context.fillRect(0, 0, particle.size, 18);
      } else if (["glint", "blade"].includes(kind)) {
        context.lineWidth = 1;
        context.beginPath(); context.moveTo(-particle.size * 3, 0); context.lineTo(particle.size * 3, 0); context.stroke();
      } else if (kind === "grid") {
        context.fillRect(0, 0, 2, 2); context.beginPath(); context.moveTo(-6, 0); context.lineTo(6, 0); context.moveTo(0, -6); context.lineTo(0, 6); context.stroke();
      } else if (kind === "constellation") {
        context.beginPath(); context.moveTo(-particle.size * 2, 0); context.lineTo(particle.size * 2, 0); context.moveTo(0, -particle.size * 2); context.lineTo(0, particle.size * 2); context.stroke();
      } else if (kind === "star") {
        context.beginPath(); for (let point = 0; point < 10; point += 1) { const radius = point % 2 ? particle.size * 0.45 : particle.size * 1.8; const angle = point * Math.PI / 5; context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); } context.closePath(); context.fill();
      } else if (kind === "spark") {
        context.beginPath(); context.moveTo(-particle.size * 2, particle.size * 2); context.quadraticCurveTo(0, -particle.size * 2, particle.size * 2, -particle.size * 3); context.stroke();
      } else if (kind === "dust" || kind === "mote") {
        context.beginPath(); context.ellipse(0, 0, particle.size * 2.8, particle.size * 0.65, 0, 0, Math.PI * 2); context.fill();
      } else if (kind === "moon") {
        context.beginPath(); context.arc(0, 0, particle.size * 2, 0, Math.PI * 2); context.stroke();
      } else if (kind === "static") {
        context.fillRect(0, 0, 2 + Math.random() * 5, 1 + Math.random() * 2);
      } else {
        context.beginPath(); context.moveTo(0, -particle.size * 1.8); context.lineTo(particle.size * 1.4, particle.size * 1.2); context.lineTo(-particle.size * 1.4, particle.size * 1.2); context.closePath(); context.fill();
      }
      context.restore();
    }

    function drawCursor(time) {
      const pointer = pointerRef.current;
      const x = pointer.x;
      const y = pointer.y;
      if (["spotlight", "glow", "aura"].includes(profile.cursor)) {
        const gradient = context.createRadialGradient(x, y, 0, x, y, profile.cursor === "spotlight" ? 100 : 62);
        gradient.addColorStop(0, rgba(profile.color, 0.2)); gradient.addColorStop(1, rgba(profile.color, 0));
        context.fillStyle = gradient; context.beginPath(); context.arc(x, y, 100, 0, Math.PI * 2); context.fill();
      }
      if (["ripple", "ring", "gas"].includes(profile.cursor)) {
        pulses.slice(-4).forEach((pulse) => { const radius = 10 + pulse.age * (profile.cursor === "gas" ? 1.7 : 2.8); context.strokeStyle = rgba(profile.color, Math.max(0, 0.45 - pulse.age / 100)); context.lineWidth = 2; context.beginPath(); context.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2); context.stroke(); });
      }
      if (profile.cursor === "web") {
        particles.filter((particle) => Math.hypot(particle.x - x, particle.y - y) < 170).forEach((particle) => { context.strokeStyle = rgba(profile.color, 0.3); context.lineWidth = 0.7; context.beginPath(); context.moveTo(x, y); context.lineTo(particle.x, particle.y); context.stroke(); });
      }
      if (profile.cursor === "glitch") { context.fillStyle = rgba(profile.color, 0.16); context.fillRect(x - 22, y - 12, 44, 2); context.fillRect(x - 12, y + 8, 26, 2); }
      if (profile.cursor === "attract" || profile.cursor === "repel") { context.strokeStyle = rgba(profile.color, 0.2); context.beginPath(); context.arc(x, y, 38, 0, Math.PI * 2); context.stroke(); }
    }

    function tick(time) {
      if (!running) return;
      context.clearRect(0, 0, width, height);
      const pointer = pointerRef.current;
      if (profile.kind === "static") {
        context.fillStyle = rgba(profile.color, 0.045); for (let y = 0; y < height; y += 5) context.fillRect(0, y, width, 1);
        if (Math.floor(time / 1800) % 5 === 0) { context.fillStyle = rgba(profile.color, 0.05); context.fillRect((time / 9) % width, 0, 2, height); }
      }
      if (profile.kind === "moon") {
        const pulse = 0.5 + Math.sin(time / 2600) * 0.08; context.strokeStyle = rgba(profile.color, pulse * 0.2); context.lineWidth = 18; context.beginPath(); context.arc(width * 0.78, height * 0.18, 110, 0, Math.PI * 2); context.stroke();
      }
      if (profile.kind === "neon") {
        context.strokeStyle = rgba(profile.color, 0.12 + Math.sin(time / 1800) * 0.04); context.lineWidth = 2; context.strokeRect(width * 0.1, height * 0.2, width * 0.3, height * 0.22); context.strokeStyle = rgba(profile.secondary || profile.color, 0.12); context.strokeRect(width * 0.58, height * 0.3, width * 0.28, height * 0.16);
      }
      if (profile.kind === "dust" && profile.secondary) {
        context.strokeStyle = rgba(profile.secondary, 0.08); context.lineWidth = 18; context.beginPath(); context.moveTo(0, height * 0.34 + Math.sin(time / 4000) * 20); context.quadraticCurveTo(width * 0.5, height * 0.2, width, height * 0.38); context.stroke();
      }
      particles.forEach((particle) => {
        const distance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
        if (distance < 120 && profile.cursor === "repel") { particle.vx += (particle.x - pointer.x) / Math.max(distance, 1) * 0.012 * MOTION_SCALE; particle.vy += (particle.y - pointer.y) / Math.max(distance, 1) * 0.012 * MOTION_SCALE; }
        if (distance < 180 && profile.cursor === "attract") { particle.vx += (pointer.x - particle.x) / Math.max(distance, 1) * 0.0008 * MOTION_SCALE; particle.vy += (pointer.y - particle.y) / Math.max(distance, 1) * 0.0008 * MOTION_SCALE; }
        const breezeTime = time / 2200 * particle.breezeRate + particle.breezePhase;
        const breezeX = Math.sin(breezeTime) * 0.24 + Math.cos(breezeTime * 0.47) * 0.12 + profile.wind * 0.18;
        const breezeY = Math.cos(breezeTime * 0.73) * 0.11 * particle.sway + profile.gravity * 40;
        particle.vx += (breezeX - particle.vx) * 0.012;
        particle.vy += (breezeY - particle.vy) * 0.012;
        const speed = Math.hypot(particle.vx, particle.vy);
        if (speed > 0.42) {
          particle.vx = particle.vx / speed * 0.42;
          particle.vy = particle.vy / speed * 0.42;
        }
        particle.x += particle.vx * MOTION_SCALE;
        particle.y += particle.vy * MOTION_SCALE;
        particle.angle += 0.0015 * MOTION_SCALE;
        particle.life += Math.sin(time / 600 + particle.x) * 0.002;
        if (particle.x < -30) particle.x = width + 30;
        if (particle.x > width + 30) particle.x = -30;
        if (particle.y < -30) particle.y = height + 30;
        if (particle.y > height + 30) particle.y = -30;
        drawParticle(particle, time);
      });
      if (profile.kind === "grid") { context.strokeStyle = rgba(profile.color, 0.09); context.lineWidth = 1; for (let x = 0; x < width; x += 42) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); } for (let y = 0; y < height; y += 42) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); } }
      drawCursor(time);
      trails = trails.filter((trail) => { trail.age += 1; context.strokeStyle = rgba(profile.color, Math.max(0, 0.55 - trail.age / 90)); context.lineWidth = profile.cursor === "laser" || profile.cursor === "slash" ? 2 : 1; context.beginPath(); context.moveTo(trail.oldX, trail.oldY); context.lineTo(trail.x, trail.y); context.stroke(); return trail.age < 90; });
      pulses = pulses.filter((pulse) => { pulse.age += 1; return pulse.age < 110; });
      pointer.moved = false;
      animationFrame = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", pointerMove, { passive: true });
    animationFrame = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animationFrame); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", pointerMove); context.clearRect(0, 0, width, height); };
  }, [selection]);

  return <canvas ref={canvasRef} className="tf-theme-effects" aria-hidden="true" />;
}
