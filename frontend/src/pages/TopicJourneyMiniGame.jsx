import React, { useEffect, useMemo, useRef, useState } from "react";
import useImage from "../hooks/useImage";
import player  from "../assets/player.png";
import { api } from "../services/api";
import useSprite from "../hooks/useSprite";

import good1 from "../assets/good1.png"
import good2 from "../assets/good2.png"
import good3 from "../assets/good3.png"
import good4 from "../assets/good4.png"
import bad1 from "../assets/bad1.png"
import bad2 from "../assets/bad2.png"
import bad3 from "../assets/bad3.png"
import bad4 from "../assets/bad4.png"
import bg1 from "../assets/bg1.jpg";
import bg2 from "../assets/bg2.png";
import bg3 from "../assets/b3.png";
import bg4 from "../assets/bg4.png";


/**
 * Topic 1: Digital Footprint Trail Run (side runner + "THINK" slow mode + footprints meter)
 * Topic 2: Treasure Guard (top-down + block pirates asking info + deliver treasure)
 * Topic 3: Password Forge (platform-ish lane + collect tiles to build strong passphrase)
 * Topic 4: Privacy Switch Maze (top-down maze + toggle privacy switches to open gates)
 *
 * All:
 * - Big responsive canvas
 * - Keyboard controls + big on-screen controls
 * - Score + End screen
 * - Save score to backend /scores
 */

// ---------- Shared helpers ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const heroImg = new Image();
heroImg.src = player;

const iconCache = {
  good: {},
  bad: {},
};

function getIconImage(topic, type) {
  // type: "good" | "bad"
  const src = GAME_ICONS[topic]?.[type];
  if (!src) return null;

  const bucket = iconCache[type];
  if (bucket[topic]) return bucket[topic];

  const img = new Image();
  img.src = src;
  bucket[topic] = img;
  return img;
}

// -------------------- STATIC CONTENT -------------------- //

const GAME_ICONS = {
  1: { good: good1, bad: bad1 },
  2: { good: good2, bad: bad2 },
  3: { good: good3, bad: bad3 },
  4: { good: good4, bad: bad4 },
};

const GAME_BACKGROUNDS = {
  1: bg1,
  2: bg2,
  3: bg3,
  4: bg4,
};

const bgCache = {};

function getBgImage(topic) {
  const src = GAME_BACKGROUNDS[topic];
  if (!src) return null;

  if (bgCache[topic]) return bgCache[topic];

  const img = new Image();
  img.src = src;
  bgCache[topic] = img;
  return img;
}

function drawBackgroundCover(ctx, img, w, h) {
  if (!img || !img.complete || !img.naturalWidth) return;

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // cover logic
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;

  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;

  ctx.drawImage(img, dx, dy, dw, dh);
}



function useCanvasSize(containerRef, targetAspect = 16 / 9) {
  const [size, setSize] = useState({ w: 1200, h: 675 });

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const ro = new ResizeObserver(() => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;

      // Keep aspect ratio but fill as much as possible
      let w = cw;
      let h = Math.round(w / targetAspect);
      if (h > ch) {
        h = ch;
        w = Math.round(h * targetAspect);
      }

      setSize({ w: Math.max(900, w), h: Math.max(520, h) });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, targetAspect]);

  return size;
}

function drawParallaxBackground(ctx, w, h, t, variant = "ocean") {
  // sky gradient
  const g = ctx.createLinearGradient(0, 0, 0, h);
  if (variant === "ocean") {
    g.addColorStop(0, "#061a2b");
    g.addColorStop(1, "#030712");
  } else if (variant === "forge") {
    g.addColorStop(0, "#120a24");
    g.addColorStop(1, "#050512");
  } else {
    // city
    g.addColorStop(0, "#0b1020");
    g.addColorStop(1, "#020617");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // stars
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 80; i++) {
    ctx.beginPath();
    ctx.arc((i * 97) % w, (i * 61 + t * 0.3) % (h * 0.65), 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // far hills / waves
  ctx.fillStyle =
    variant === "ocean" ? "rgba(34,197,94,0.10)" :
    variant === "forge" ? "rgba(168,85,247,0.10)" :
    "rgba(99,102,241,0.10)";

  for (let i = 0; i < 7; i++) {
    const x = ((i * 260 + t * 0.8) % (w + 400)) - 200;
    const y = h * (0.62 + (i % 2) * 0.05);
    ctx.beginPath();
    ctx.ellipse(x, y, 180, 60, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // foreground blobs
  ctx.fillStyle =
    variant === "ocean" ? "rgba(14,165,233,0.10)" :
    variant === "forge" ? "rgba(251,146,60,0.10)" :
    "rgba(34,197,94,0.08)";

  for (let i = 0; i < 6; i++) {
    const x = ((i * 340 - t * 1.2) % (w + 500)) - 250;
    const y = h * (0.78 + (i % 2) * 0.04);
    ctx.beginPath();
    ctx.ellipse(x, y, 220, 72, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIcon(ctx, img, x, y, size = 34) {
  if (!img) return;
  ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
}


function BigControls({ keysRef, disabled }) {
  // Big on-screen buttons for kids / mobile
  const setKey = (name, val) => {
    if (!keysRef.current) return;
    keysRef.current[name] = val;
  };

  return (
    <div style={ui.controlsWrap}>
      <div style={ui.controlsCol}>
        <button
          disabled={disabled}
          style={ui.bigBtn}
          onMouseDown={() => setKey("up", true)}
          onMouseUp={() => setKey("up", false)}
          onMouseLeave={() => setKey("up", false)}
          onTouchStart={() => setKey("up", true)}
          onTouchEnd={() => setKey("up", false)}
        >
          ⬆
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            disabled={disabled}
            style={ui.bigBtn}
            onMouseDown={() => setKey("left", true)}
            onMouseUp={() => setKey("left", false)}
            onMouseLeave={() => setKey("left", false)}
            onTouchStart={() => setKey("left", true)}
            onTouchEnd={() => setKey("left", false)}
          >
            ⬅
          </button>
          <button
            disabled={disabled}
            style={ui.bigBtn}
            onMouseDown={() => setKey("right", true)}
            onMouseUp={() => setKey("right", false)}
            onMouseLeave={() => setKey("right", false)}
            onTouchStart={() => setKey("right", true)}
            onTouchEnd={() => setKey("right", false)}
          >
            ➡
          </button>
        </div>
        <button
          disabled={disabled}
          style={ui.bigBtn}
          onMouseDown={() => setKey("down", true)}
          onMouseUp={() => setKey("down", false)}
          onMouseLeave={() => setKey("down", false)}
          onTouchStart={() => setKey("down", true)}
          onTouchEnd={() => setKey("down", false)}
        >
          ⬇
        </button>
      </div>

      <div style={ui.controlsCol}>
        <button
          disabled={disabled}
          style={{ ...ui.bigBtn, width: 160 }}
          onMouseDown={() => setKey("action", true)}
          onMouseUp={() => setKey("action", false)}
          onMouseLeave={() => setKey("action", false)}
          onTouchStart={() => setKey("action", true)}
          onTouchEnd={() => setKey("action", false)}
        >
          ⭐ ACTION
        </button>

        <button
          disabled={disabled}
          style={{ ...ui.bigBtn, width: 160 }}
          onMouseDown={() => setKey("think", true)}
          onMouseUp={() => setKey("think", false)}
          onMouseLeave={() => setKey("think", false)}
          onTouchStart={() => setKey("think", true)}
          onTouchEnd={() => setKey("think", false)}
        >
          🧠 THINK
        </button>
      </div>
    </div>
  );
}

async function saveScoreToBackend({ userId, gameId, score }) {
  if (!userId || !gameId) return;
  try {
    await api.post("/scores", { user_id: userId, game_id: gameId, score });
  } catch (e) {
    // don’t break gameplay UI if backend fails
    console.error("Score save failed:", e?.response?.data || e.message);
  }
}

// ---------- A shared “mission frame” ----------
function MissionFrame({
    title,
    subtitle,
    instructions,
    badgeLeft,
    badgeRight,
    children,
    onBack,
    theme = "ocean",
    embedded = false, // ✅ NEW
  }) {
    const themeVars = theme === "ocean" ? ui.themeOcean : ui.themeSunset;
  
    // ✅ EMBEDDED: no full-page chrome
    if (embedded) {
      return (
        <div style={{ ...ui.embedWrap, ...themeVars }}>
          {/* compact header row */}
          <div style={ui.embedTop}>
            <div style={ui.embedTitle}>
              <div style={ui.embedTitleMain}>{title}</div>
              <div style={ui.embedTitleSub}>{subtitle}</div>
            </div>
            <div style={ui.embedBadges}>
              <div style={ui.embedBadge}>{badgeLeft}</div>
              <div style={ui.embedBadge}>{badgeRight}</div>
            </div>
          </div>
  
          {/* compact goal */}
          <div style={ui.embedGoal}>{instructions}</div>
  
          {children}
        </div>
      );
    }
  
    // FULL PAGE (optional)
    return (
      <div style={{ ...ui.page, ...themeVars }}>
        <div style={ui.topBar}>
          <button style={ui.backBtn} onClick={onBack}>
            ⬅ Back
          </button>
  
          <div style={ui.titleBlock}>
            <div style={ui.title}>{title}</div>
            <div style={ui.subTitle}>{subtitle}</div>
          </div>
  
          <div style={ui.badges}>
            <div style={ui.badge}>{badgeLeft}</div>
            <div style={ui.badge}>{badgeRight}</div>
          </div>
        </div>
  
        <div style={ui.instructionsCard}>
          <div style={ui.instructionsTitle}>🎯 Goal + Controls</div>
          <div style={ui.instructionsText}>{instructions}</div>
        </div>
  
        {children}
      </div>
    );
  }

  // --- Canvas helpers: roundRect polyfill + floating POP text ---
function ensureRoundRect(ctx) {
  if (!ctx.roundRect) {
    ctx.roundRect = function (x, y, w, h, r) {
      const rr = typeof r === "number" ? { tl: r, tr: r, br: r, bl: r } : r;
      this.beginPath();
      this.moveTo(x + rr.tl, y);
      this.lineTo(x + w - rr.tr, y);
      this.quadraticCurveTo(x + w, y, x + w, y + rr.tr);
      this.lineTo(x + w, y + h - rr.br);
      this.quadraticCurveTo(x + w, y + h, x + w - rr.br, y + h);
      this.lineTo(x + rr.bl, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - rr.bl);
      this.lineTo(x, y + rr.tl);
      this.quadraticCurveTo(x, y, x + rr.tl, y);
      this.closePath();
      return this;
    };
  }
}

function spawnPop(popList, {
  x,
  y,
  text = "+80",
  good = true,
  emoji = good ? "✨" : "💥",
}) {
  popList.push({
    id: Math.random().toString(36).slice(2),
    x, y,
    vx: rand(-0.6, 0.6),
    vy: rand(-2.2, -1.4),
    life: 42,
    max: 42,
    text,
    emoji,
    good,
  });
}

function drawPops(ctx, pops, w) {
  if (!Array.isArray(pops)) return; 

  for (const p of pops) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.03;
    p.life -= 1;

    const a = clamp(p.life / p.max, 0, 1);

    ctx.save();
    ctx.globalAlpha = a;

    ctx.shadowColor = p.good ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)";
    ctx.shadowBlur = 18;

    const fontSize = Math.round(w * 0.02);
    ctx.font = `900 ${fontSize}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#e2e8f0";

    ctx.fillText(`${p.emoji} ${p.text}`, p.x, p.y);
    ctx.restore();
  }

  for (let i = pops.length - 1; i >= 0; i--) {
    if (pops[i].life <= 0) pops.splice(i, 1);
  }
}

const MAX_LEVEL = 2;

function levelBadge(level) {
  return `🧭 Level: ${level}/${MAX_LEVEL}`;
}



  
// ============================================================
// TOPIC 1 — Digital Footprint Trail Run
// mechanic: side-runner journey, jump with ACTION, THINK slows time,
// collect ✅ “Good Posts” to increase score, avoid ❌ “Overshare” traps,
// reach finish line. Footprint meter punishes mistakes.
// NOW includes: Levels + 3 lives (hearts)
// ============================================================
export function DigitalFootprintJourney2D({ userId, gameId, onBack, embedded = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const keys = useRef({ left: false, right: false, up: false, down: false, action: false, think: false });

  const { w, h } = useCanvasSize(containerRef, 16 / 9);

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  // score/penalties
  const [score, setScore] = useState(0);
  const [footprints, setFootprints] = useState(0);

  // lives (3 hearts)
  const [hp, setHp] = useState(3);

  // levels
  const MAX_LEVEL = 2;
  const [level, setLevel] = useState(1);

  // between-level screen
  const [betweenLevels, setBetweenLevels] = useState(false);
  const [levelSummary, setLevelSummary] = useState(null); // { level, safeScore, footprints, hp }

  // Refs for stable gameplay logic inside RAF loop
  const scoreRef = useRef(0);
  const footprintsRef = useRef(0);
  const hpRef = useRef(3);
  const levelRef = useRef(1);

  const setScoreInstant = (v) => { scoreRef.current = v; setScore(v); };
  const setFootprintsInstant = (v) => { footprintsRef.current = v; setFootprints(v); };
  const setHpInstant = (v) => { hpRef.current = v; setHp(v); };
  const setLevelInstant = (v) => { levelRef.current = v; setLevel(v); };

  const levelCfg = useMemo(() => {
    return level === 1
      ? { finishX: 4200, baseSpeed: 0.9, badChance: 0.30, label: "Warm-up Run" }
      : { finishX: 5600, baseSpeed: 3.4, badChance: 0.42, label: "Speed Run" };
  }, [level]);

  // world state
  const stateRef = useRef({
    t: 0,
    player: { x: 120, y: 0, vy: 0, grounded: true },
    items: [],
    clouds: [],
    finishX: 5200,
    pops: [],
  });

  const theme = "ocean";

  // ✅ HERO IMAGE
  const heroRef = useRef(null);
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.src = player;
    img.onload = () => {
      heroRef.current = img;
      setHeroReady(true);
    };
  }, []);

  // keyboard listeners
  useEffect(() => {
    const down = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = true;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = true;
      if (e.code === "Space") keys.current.action = true;
      if (e.key === "Shift") keys.current.think = true;
    };
    const up = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = false;
      if (e.code === "Space") keys.current.action = false;
      if (e.key === "Shift") keys.current.think = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const safeScoreNow = () => Math.max(0, scoreRef.current - footprintsRef.current * 10);

  const reset = (startLevel = 1) => {
    // clear overlays
    setBetweenLevels(false);
    setLevelSummary(null);
    setDone(false);

    // set level
    setLevelInstant(startLevel);

    // reset score and lives ONLY when starting from level 1
    if (startLevel === 1) {
      setScoreInstant(0);
      setFootprintsInstant(0);
      setHpInstant(3);
    }

    // compute cfg (don’t rely on stale levelCfg)
    const cfg = startLevel === 1
      ? { finishX: 4200, baseSpeed: 3.2, badChance: 0.30 }
      : { finishX: 5600, baseSpeed: 5.4, badChance: 0.42 };

    stateRef.current = {
      t: 0,
      player: { x: 120, y: 0, vy: 0, grounded: true },
      items: [],
      clouds: Array.from({ length: 10 }).map((_, i) => ({
        x: i * 600 + rand(0, 300),
        y: rand(40, 160),
        s: rand(0.3, 0.7),
      })),
      finishX: cfg.finishX,
      pops: [],
    };

    setRunning(true);
  };

  // spawn items (per level)
  const ensureItems = () => {
    const st = stateRef.current;
    if (st.items.length > 0) return;

    const goodWords = ["Be kind ✅", "Ask first ✅", "Think ✅", "Privacy ✅", "Positive ✅"];
    const badWords = ["Overshare ❌", "Post ID ❌", "Live location ❌", "DM stranger ❌", "Click now ❌"];

    // IMPORTANT: use current level config reliably
    const badChance = levelRef.current === 1 ? 0.30 : 0.42;

    for (let x = 450; x < st.finishX - 200; x += 260) {
      const isBad = Math.random() < badChance;
      st.items.push({
        id: Math.random().toString(36).slice(2),
        x,
        y: 0,
        r: 22,
        type: isBad ? "bad" : "good",
        text: isBad
          ? badWords[Math.floor(rand(0, badWords.length))]
          : goodWords[Math.floor(rand(0, goodWords.length))],
      });
    }
  };

  const finishFinal = async () => {
    setRunning(false);
    setBetweenLevels(false);
    setDone(true);

    setSaving(true);
    await saveScoreToBackend({ userId, gameId, score: safeScoreNow() });
    setSaving(false);
  };

  const finishLevel = async () => {
    // died
    if (hpRef.current <= 0) {
      await finishFinal();
      return;
    }

    const summary = {
      level: levelRef.current,
      safeScore: safeScoreNow(),
      footprints: footprintsRef.current,
      hp: hpRef.current,
    };

    // more levels
    if (levelRef.current < MAX_LEVEL) {
      setRunning(false);
      setDone(false);
      setLevelSummary(summary);
      setBetweenLevels(true);
      return;
    }

    // last level
    await finishFinal();
  };

  const nextLevel = () => {
    const next = Math.min(MAX_LEVEL, levelRef.current + 1);
    setBetweenLevels(false);
    setLevelSummary(null);
    reset(next);
  };

  useEffect(() => {
    if (!running) return;
    ensureItems();

    let raf;
    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      const st = stateRef.current;
      st.t += 1;

      const slow = keys.current.think ? 0.45 : 1;
      const dt = 1 * slow;

      const groundY = h * 0.72;

      // movement
      const cfg = levelRef.current === 1
        ? { baseSpeed: 3.2 }
        : { baseSpeed: 5.4 };

      let speed = cfg.baseSpeed * dt;

      st.player.x += speed + (keys.current.right ? 2.0 * dt : 0) - (keys.current.left ? 2.4 * dt : 0);

      // jump (ACTION)
      if (keys.current.action && st.player.grounded) {
        st.player.vy = -15.5;
        st.player.grounded = false;
      }

      // gravity
      st.player.vy += 0.8 * dt;
      st.player.y += st.player.vy * dt;

      if (st.player.y > 0) {
        st.player.y = 0;
        st.player.vy = 0;
        st.player.grounded = true;
      }

      // collisions
      const px = st.player.x;
      const camX = clamp(px - w * 0.35, 0, st.finishX - w * 0.2);
      const py = groundY - 55 - st.player.y;

      for (const item of st.items) {
        if (item.hit) continue;
        const ix = item.x;
        const iy = groundY - 25;

        if (dist(px, py - 40, ix, iy) < 60) {
          item.hit = true;

          const popX = ix - camX;
          const popY = iy - 30;

          if (item.type === "good") {
            setScoreInstant(scoreRef.current + 80);
            spawnPop(st.pops, { x: popX, y: popY, text: "+80", good: true, emoji: "✅" });
          } else {
            setFootprintsInstant(footprintsRef.current + 1);
            setScoreInstant(Math.max(0, scoreRef.current - 30));
            setHpInstant(Math.max(0, hpRef.current - 1));
            spawnPop(st.pops, { x: popX, y: popY, text: "-1 LIFE", good: false, emoji: "💥" });

            // if died, end immediately
            if (hpRef.current <= 0) {
              finishLevel();
              return;
            }
          }
        }
      }

      // finish line
      if (st.player.x >= st.finishX) {
        finishLevel();
        return;
      }

      // draw
      ctx.clearRect(0, 0, w, h);
      const bgImg = getBgImage(1);
      drawBackgroundCover(ctx, bgImg, w, h);

      // optional: keep your parallax overlay on top (nice effect)
     // drawParallaxBackground(ctx, w, h, st.t, "ocean");

      // stars
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let i = 0; i < 90; i++) {
        ctx.beginPath();
        ctx.arc((i * 97) % w, (i * 61 + st.t * 0.6) % (h * 0.7), 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // road
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, groundY, w, h - groundY);

      // dashed line
      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.lineWidth = 3;
      ctx.setLineDash([18, 14]);
      ctx.beginPath();
      ctx.moveTo(0, groundY + 42);
      ctx.lineTo(w, groundY + 42);
      ctx.stroke();
      ctx.setLineDash([]);

      // items
      for (const item of st.items) {
        if (item.hit) continue;
        const x = item.x - camX;
        if (x < -80 || x > w + 80) continue;

        ctx.beginPath();
        ctx.fillStyle = item.type === "good" ? "#22c55e" : "#ef4444";
        ctx.arc(x, groundY - 25, item.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0b1020";
        ctx.font = `700 ${Math.round(w * 0.016)}px system-ui`;
        ctx.textAlign = "center";
        const goodIcon = getIconImage(1, "good");
        const badIcon  = getIconImage(1, "bad");

        drawIcon(ctx, item.type === "good" ? goodIcon : badIcon, x, groundY - 25, 28);


        // label pill
        const label = item.text;

        ctx.save();
        ctx.font = `900 ${Math.round(w * 0.018)}px system-ui`;
        const tw = ctx.measureText(label).width;
        const padX = 16;
        const pillW = tw + padX * 2;
        const pillH = 34;
        const pillX = x - pillW / 2;
        const pillY = groundY - 92;

        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "rgba(2,6,23,0.85)";
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 16);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = item.type === "good" ? "rgba(34,197,94,0.55)" : "rgba(239,68,68,0.55)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#e2e8f0";
        ctx.textAlign = "center";
        ctx.fillText(label, x, pillY + 24);
        ctx.restore();
      }

      // finish flag
      const fx = st.finishX - camX;
      if (fx > -100 && fx < w + 100) {
        ctx.fillStyle = "#eab308";
        ctx.fillRect(fx - 10, groundY - 170, 8, 170);
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(fx - 2, groundY - 160);
        ctx.lineTo(fx + 70, groundY - 135);
        ctx.lineTo(fx - 2, groundY - 110);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = `800 ${Math.round(w * 0.022)}px system-ui`;
        ctx.textAlign = "left";
        ctx.fillText("FINISH", fx + 80, groundY - 130);
      }

      // player sprite
      const rx = px - camX;
      const HERO_W = 120;
      const HERO_H = 140;

      if (heroReady && heroRef.current) {
        ctx.drawImage(heroRef.current, rx - HERO_W / 2, py - HERO_H, HERO_W, HERO_H);
      } else {
        ctx.fillStyle = "#60a5fa";
        ctx.beginPath();
        ctx.roundRect(rx - 24, py - 70, 48, 70, 14);
        ctx.fill();
      }

      drawPops(ctx, st.pops, w);

      // HUD
      ctx.fillStyle = "rgba(2,6,23,0.5)";
      ctx.fillRect(18, 18, w - 36, 78);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `800 ${Math.round(w * 0.02)}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillText("👣 Digital Footprint Trail Run", 32, 52);

      // HUD right
      ctx.font = `700 ${Math.round(w * 0.016)}px system-ui`;
      ctx.textAlign = "right";
      ctx.fillText(`Level: ${levelRef.current}/${MAX_LEVEL}`, w - 28, 44);
      ctx.fillText(`Lives: ${"❤️".repeat(hpRef.current)}`, w - 28, 66);
      ctx.fillText(`Score: ${safeScoreNow()}`, w - 28, 88);

      // progress bar
      const pct = clamp((px / st.finishX) * 100, 0, 100);
      ctx.fillStyle = "rgba(148,163,184,0.25)";
      ctx.fillRect(32, 102, w - 64, 10);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(32, 102, ((w - 64) * pct) / 100, 10);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, w, h, heroReady]);

  const safeScore = Math.max(0, score - footprints * 10);

  const instructions = (
    <>
      <b>Goal:</b> Run to the FINISH while keeping your digital footprint clean. <br />
      <b>Collect:</b> ✅ Good choices (privacy, kindness, think before posting). <br />
      <b>Avoid:</b> ⚠️ Oversharing traps (ID, live location, strangers). <br />
      <b>Controls:</b> ⬅➡ move (A/D), ⭐ ACTION = jump (Space), 🧠 THINK = slow-motion (Shift). <br />
      <b>Lives:</b> You have 3 ❤️. Each bad item costs 1 life.
    </>
  );

  return (
    <MissionFrame
      embedded={embedded}
      title="Topic 1 Mini-Game"
      subtitle={`My Digital Footprint — ${levelCfg.label}`}
      instructions={instructions}
      badgeLeft={`🧭 Level: ${level}/${MAX_LEVEL} | ❤️ ${hp}`}
      badgeRight={`🏆 Score: ${safeScore}`}
      onBack={onBack || (() => window.history.back())}
      theme={theme}
    >
      <div ref={containerRef} style={ui.gameArea}>
        <div style={ui.canvasShell}>
          <canvas ref={canvasRef} width={w} height={h} style={ui.canvas} />

          {/* Start overlay */}
          {!running && !done && !betweenLevels && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Ready to run? 🏃‍♂️✨</div>
                <div style={ui.overlayText}>
                  Collect good choices, avoid oversharing traps, and reach the finish!
                </div>
                <button style={ui.primaryBtn} onClick={() => reset(1)}>
                  🚀 Start Level 1
                </button>
              </div>
            </div>
          )}

          {/* Between Levels overlay */}
          {betweenLevels && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Level {levelSummary?.level} Complete! ✅</div>
                <div style={ui.overlayText}>
                  Score so far: <b>{levelSummary?.safeScore}</b>
                  <br />
                  Footprints: <b>{levelSummary?.footprints}</b>
                  <br />
                  Lives left: <b>{levelSummary?.hp}</b>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button style={ui.primaryBtn} onClick={nextLevel}>
                    ➡ Next Level
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Final done overlay */}
          {done && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>
                  {hp > 0 ? "Mission Complete! 🎉" : "Game Over 💥"}
                </div>
                <div style={ui.overlayText}>
                  Final Score: <b>{safeScore}</b>
                  <br />
                  Footprints: <b>{footprints}</b>
                  <br />
                  Lives left: <b>{hp}</b>
                </div>
                <div style={ui.overlaySmall}>{saving ? "Saving score..." : "Score saved ✅"}</div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button style={ui.primaryBtn} onClick={() => reset(1)}>
                    🔁 Play Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <BigControls keysRef={keys} disabled={!running} />
      </div>
    </MissionFrame>
  );
}

// ============================================================
// TOPIC 2 — Personal Info Treasure Guard (WITH LEVELS + NEXT BUTTON)
// - Level 1 -> interval -> Next Level -> Level 2
// - 3 hearts (lives). Pirate touch = -1 life
// - Save score ONLY after last level (or if you die)
// ============================================================
export function PersonalInfoJourney2D({ userId, gameId, onBack, embedded = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const keys = useRef({ left: false, right: false, up: false, down: false, action: false, think: false });
  const { w, h } = useCanvasSize(containerRef, 16 / 9);

  const MAX_LEVEL = 2;

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);

  const [betweenLevels, setBetweenLevels] = useState(false);
  const [levelSummary, setLevelSummary] = useState(null);

  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(3);

  const scoreRef = useRef(0);
  const hpRef = useRef(3);

  const setScoreInstant = (v) => { scoreRef.current = v; setScore(v); };
  const setHpInstant = (v) => { hpRef.current = v; setHp(v); };
  const setLevelInstant = (v) => { levelRef.current = v; setLevel(v); };

  const levelCfg = useMemo(() => {
    return level === 1
      ? { exitX: 2600, pirates: 10, pirateSpeed: [0.6, 1.2], goodies: 14, label: "Harbor Patrol" }
      : { exitX: 3200, pirates: 14, pirateSpeed: [0.9, 1.7], goodies: 18, label: "Open Sea Rush" };
  }, [level]);

  const stRef = useRef({
    t: 0,
    player: { x: 180, y: 220, r: 18 },
    treasure: { x: 160, y: 240, carried: true },
    exit: { x: 2600, y: 320, r: 36 },
    pirates: [],
    goodies: [],
    shield: { active: false, t: 0 },
    camX: 0,
    pops: [],
  });

  // ✅ HERO IMAGE
  const heroRef = useRef(null);
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.src = player;
    img.onload = () => { heroRef.current = img; setHeroReady(true); };
  }, []);

  useEffect(() => {
    const down = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = true;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = true;
      if (e.code === "Space") keys.current.action = true;
      if (e.key === "Shift") keys.current.think = true;
    };
    const up = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = false;
      if (e.code === "Space") keys.current.action = false;
      if (e.key === "Shift") keys.current.think = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const spawnLevel = (startLevel) => {
    const PATH_Y_MIN = 120;       // ✅ inside playable area
    const PATH_Y_MAX = h - 140;   // ✅ inside playable area
  
    const cfg = startLevel === 1
      ? { exitX: 2600, pirates: 10, pirateSpeed: [0.6, 1.2], goodies: 14 }
      : { exitX: 3200, pirates: 14, pirateSpeed: [0.9, 1.7], goodies: 18 };

    stRef.current = {
      t: 0,
      player: { x: 180, y: 220, r: 18 },
      treasure: { x: 160, y: 240, carried: true },
      exit: { x: cfg.exitX, y: 320, r: 36 },
      pirates: Array.from({ length: cfg.pirates }).map((_, i) => ({
        id: "p" + i,
        x: 520 + i * 220 + rand(-40, 40),
        y: rand(PATH_Y_MIN, PATH_Y_MAX),
        r: 18,
        speed: rand(cfg.pirateSpeed[0], cfg.pirateSpeed[1]),
        msg: ["Name?", "Birthday?", "School?", "Address?", "Password?"][Math.floor(rand(0, 5))],
        hit: false,
      })),
      goodies: Array.from({ length: cfg.goodies }).map((_, i) => ({
        id: "g" + i,
        x: 360 + i * 170 + rand(-30, 30),
        y:rand(PATH_Y_MIN, PATH_Y_MAX),
        r: 14,
        taken: false,
      })),
      shield: { active: false, t: 0 },
      camX: 0,
      pops: [],
    };
  };

  const reset = (startLevel = 1) => {
    const PATH_Y_MIN = 120;       // ✅ inside playable area
    const PATH_Y_MAX = h - 140;   // ✅ inside playable area
  
    setBetweenLevels(false);
    setLevelSummary(null);
    setDone(false);

    setLevelInstant(startLevel);

    // reset score/hp ONLY when starting from level 1
    if (startLevel === 1) {
      setScoreInstant(0);
      setHpInstant(3);
    }

    spawnLevel(startLevel);
    setRunning(true);
  };

  const finishFinal = async () => {
    setRunning(false);
    setBetweenLevels(false);
    setDone(true);

    setSaving(true);
    await saveScoreToBackend({ userId, gameId, score: scoreRef.current });
    setSaving(false);
  };

  const finishLevel = async () => {
    // died
    if (hpRef.current <= 0) {
      await finishFinal();
      return;
    }

    const summary = {
      level: levelRef.current,
      score: scoreRef.current,
      hp: hpRef.current,
    };

    if (levelRef.current < MAX_LEVEL) {
      setRunning(false);
      setDone(false);
      setLevelSummary(summary);
      setBetweenLevels(true);
      return;
    }

    await finishFinal();
  };

  const nextLevel = () => {
    const next = Math.min(MAX_LEVEL, levelRef.current + 1);
    setBetweenLevels(false);
    setLevelSummary(null);
    reset(next);
  };

  useEffect(() => {
    if (!running) return;

    let raf;
    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      const st = stRef.current;
      st.t++;

      const slow = keys.current.think ? 0.5 : 1;
      const dt = 1 * slow;

      // player move
      let vx = 0, vy = 0;
      if (keys.current.left) vx -= 4.4 * dt;
      if (keys.current.right) vx += 4.4 * dt;
      if (keys.current.up) vy -= 4.0 * dt;
      if (keys.current.down) vy += 4.0 * dt;

      st.player.x += vx;
      st.player.y += vy;

      // bounds
      st.player.y = clamp(st.player.y, 100, h - 120);

      // carry treasure
      if (st.treasure.carried) {
        st.treasure.x = st.player.x - 26;
        st.treasure.y = st.player.y + 16;
      }

      // action = shield pulse
      if (keys.current.action && !st.shield.active) {
        st.shield.active = true;
        st.shield.t = 24;
      }
      if (st.shield.active) {
        st.shield.t -= 1;
        if (st.shield.t <= 0) st.shield.active = false;
      }

      // camera follow
      const camX = st.camX;
      st.camX = clamp(st.player.x - w * 0.35, 0, st.exit.x - w * 0.3);

      // goodies
      for (const g of st.goodies) {
        if (g.taken) continue;
        if (dist(st.player.x, st.player.y, g.x, g.y) < st.player.r + g.r + 6) {
          g.taken = true;
          setScoreInstant(scoreRef.current + 60);
        }
      }

      // pirates chase
      for (const p of st.pirates) {
        if (p.hit) continue;

        const dx = st.player.x - p.x;
        const dy = st.player.y - p.y;
        const L = Math.max(1, Math.hypot(dx, dy));
        p.x += (dx / L) * p.speed * dt;
        p.y += (dy / L) * p.speed * dt;

        if (st.shield.active && dist(st.player.x, st.player.y, p.x, p.y) < 70) {
          p.hit = true;
          setScoreInstant(scoreRef.current + 120);
          spawnPop(st.pops, { x: (p.x - camX), y: p.y - 30, text: "+120 NO!", good: true, emoji: "🛡️" });
        } else if (dist(st.player.x, st.player.y, p.x, p.y) < st.player.r + p.r + 6) {
          p.hit = true;
          setHpInstant(Math.max(0, hpRef.current - 1));
          spawnPop(st.pops, { x: (p.x - camX), y: p.y - 30, text: "-1 LIFE", good: false, emoji: "💥" });

          if (hpRef.current <= 0) {
            finishLevel();
            return;
          }
        }
      }

      // win condition: reach exit with treasure
      if (dist(st.player.x, st.player.y, st.exit.x, st.exit.y) < st.exit.r + 22) {
        setScoreInstant(scoreRef.current + 200);
        finishLevel();
        return;
      }

      // draw
      ctx.clearRect(0, 0, w, h);

      // background
      const bgImg = getBgImage(2);
      drawBackgroundCover(ctx, bgImg, w, h);

      // path
      ctx.fillStyle = "rgba(234,179,8,0.12)";
      ctx.fillRect(0, 110, w, h - 200);

      // islands
      ctx.fillStyle = "rgba(34,197,94,0.22)";
      for (let i = 0; i < 8; i++) {
        const ix = ((i * 380 + st.t * 0.4) % (w + 400)) - 200;
        ctx.beginPath();
        ctx.ellipse(ix, 180 + (i % 3) * 140, 90, 36, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const cam = st.camX;

      // exit
      const ex = st.exit.x - cam;
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(ex, st.exit.y, st.exit.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.font = `900 ${Math.round(w * 0.02)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("SAFE", ex, st.exit.y + 8);

      // goodies
      for (const k of st.goodies) {
        if (k.taken) continue;
        const x = k.x - cam;
        if (x < -80 || x > w + 80) continue;
        ctx.fillStyle = "#93c5fd";
        ctx.beginPath();
        ctx.arc(x, k.y, k.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0b1020";
        ctx.font = `900 ${Math.round(w * 0.018)}px system-ui`;
        const goodIcon = getIconImage(2, "good");
        drawIcon(ctx, goodIcon, x, k.y, 26);        
      }

      // pirates
      for (const p of st.pirates) {
        if (p.hit) continue;
        const x = p.x - cam;
        if (x < -120 || x > w + 120) continue;

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0b1020";
        ctx.font = `900 ${Math.round(w * 0.018)}px system-ui`;
        ctx.textAlign = "center";
        const badIcon = getIconImage(2, "bad");
        drawIcon(ctx, badIcon, x, p.y, 28);


        ctx.fillStyle = "rgba(226,232,240,0.95)";
        ctx.font = `800 ${Math.round(w * 0.014)}px system-ui`;
        ctx.fillText(p.msg, x, p.y - 26);
      }

      // treasure
      const tx = st.treasure.x - cam;
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.roundRect(tx - 18, st.treasure.y - 14, 36, 28, 10);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("💎", tx, st.treasure.y + 6);

      // player (sprite)
      const px = st.player.x - cam;
      const HERO_W = 90;
      const HERO_H = 110;

      if (heroReady && heroRef.current) {
        ctx.drawImage(heroRef.current, px - HERO_W / 2, st.player.y - HERO_H / 2, HERO_W, HERO_H);
      } else {
        ctx.fillStyle = "#60a5fa";
        ctx.beginPath();
        ctx.roundRect(px - 18, st.player.y - 22, 36, 44, 12);
        ctx.fill();
      }

      // shield
      if (st.shield.active) {
        ctx.strokeStyle = "rgba(34,197,94,0.85)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(px, st.player.y, 58, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(226,232,240,0.9)";
        ctx.font = `900 ${Math.round(w * 0.02)}px system-ui`;
        ctx.fillText("NO!", px, st.player.y - 60);
      }

      drawPops(ctx, st.pops, w);

      // HUD
      ctx.fillStyle = "rgba(2,6,23,0.55)";
      ctx.fillRect(18, 18, w - 36, 72);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `900 ${Math.round(w * 0.02)}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillText("🧰 Personal Info Treasure Guard", 32, 52);

      ctx.textAlign = "right";
      ctx.font = `800 ${Math.round(w * 0.016)}px system-ui`;
      ctx.fillText(`Level: ${levelRef.current}/${MAX_LEVEL}`, w - 28, 44);
      ctx.fillText(`Score: ${scoreRef.current}`, w - 28, 66);
      ctx.fillText(`Lives: ${"❤️".repeat(hpRef.current)}`, w - 28, 88);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, w, h, heroReady]);

  const instructions = (
    <>
      <b>Goal:</b> Escort the 💎 treasure to the SAFE zone without giving info to pirates. <br />
      <b>Collect:</b> 🔑 Keys for bonus points. <br />
      <b>Danger:</b> 🏴‍☠️ Pirates ask “Name? Birthday? Address?” — don’t let them touch you. <br />
      <b>Controls:</b> Move with arrows. ⭐ ACTION (Space) = shield “NO!” blast. 🧠 THINK (Shift) = slow mode.
    </>
  );

  return (
    <MissionFrame
      embedded={embedded}
      title="Topic 2 Mini-Game"
      subtitle={`Personal Information — ${levelCfg.label}`}
      instructions={instructions}
      badgeLeft={`🧭 Level: ${level}/${MAX_LEVEL} | ❤️ ${hp}`}
      badgeRight={`🏆 Score: ${score}`}
      onBack={onBack || (() => window.history.back())}
      theme="ocean"
    >
      <div ref={containerRef} style={ui.gameArea}>
        <div style={ui.canvasShell}>
          <canvas ref={canvasRef} width={w} height={h} style={ui.canvas} />

          {!running && !done && !betweenLevels && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Guard your treasure! 💎</div>
                <div style={ui.overlayText}>
                  Pirates want your personal info. Use your shield to block them and reach the SAFE zone.
                </div>
                <button style={ui.primaryBtn} onClick={() => reset(1)}>🧭 Start Level 1</button>
              </div>
            </div>
          )}

          {betweenLevels && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Level {levelSummary?.level} Complete! ✅</div>
                <div style={ui.overlayText}>
                  Score so far: <b>{levelSummary?.score}</b><br />
                  Lives left: <b>{levelSummary?.hp}</b>
                </div>
                <button style={ui.primaryBtn} onClick={nextLevel}>➡ Next Level</button>
              </div>
            </div>
          )}

          {done && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>{hp > 0 ? "You made it! 🎉" : "Game Over 💥"}</div>
                <div style={ui.overlayText}>Final Score: <b>{score}</b></div>
                <div style={ui.overlaySmall}>{saving ? "Saving score..." : "Score saved ✅"}</div>
                <button style={ui.primaryBtn} onClick={() => reset(1)}>🔁 Play Again</button>
              </div>
            </div>
          )}
        </div>

        <BigControls keysRef={keys} disabled={!running} />
      </div>
    </MissionFrame>
  );
}
// ============================================================
// TOPIC 3 — Password Forge (WITH LEVELS + NEXT BUTTON)
// - Level 1 -> interval -> Next Level -> Level 2
// - Level affects: forward speed, gate distance, reuse chance, item density
// - You ONLY advance levels if you WIN (all 4 parts before gate)
// - Save score ONLY after last level
// ============================================================
export function PasswordsJourney2D({ userId, gameId, onBack, embedded = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const keys = useRef({ left: false, right: false, up: false, down: false, action: false, think: false });
  const { w, h } = useCanvasSize(containerRef, 16 / 9);

  const MAX_LEVEL = 2;

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);

  const [betweenLevels, setBetweenLevels] = useState(false);
  const [levelSummary, setLevelSummary] = useState(null);

  const [score, setScore] = useState(0);
  const [parts, setParts] = useState({ length: false, symbol: false, number: false, unique: false });
  const [strikes, setStrikes] = useState(0);

  const scoreRef = useRef(0);
  const strikesRef = useRef(0);
  const partsRef = useRef({ length: false, symbol: false, number: false, unique: false });

  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState(null); // "win" | "locked"
  const MAX_LIVES = 3;

  const [lives, setLives] = useState(MAX_LIVES);
  const livesRef = useRef(MAX_LIVES);
  
  const setLivesInstant = (v) => { livesRef.current = v; setLives(v); };


  const setScoreInstant = (v) => { scoreRef.current = v; setScore(v); };
  const setStrikesInstant = (v) => { strikesRef.current = v; setStrikes(v); };
  const setPartsInstant = (v) => { partsRef.current = v; setParts(v); };
  const setLevelInstant = (v) => { levelRef.current = v; setLevel(v); };

  const levelCfg = useMemo(() => {
    return level === 1
      ? { gateX: 3600, speed: 6.0, reuseChance: 0.22, step: 200, label: "Training Forge" }
      : { gateX: 4300, speed: 7.3, reuseChance: 0.33, step: 170, label: "Master Forge" };
  }, [level]);

  const stRef = useRef({
    t: 0,
    lane: 1,
    x: 0,
    items: [],
    gateX: 3600,
    pops: [],
  });

  // ✅ HERO IMAGE
  const heroRef = useRef(null);
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.src = player;
    img.onload = () => { heroRef.current = img; setHeroReady(true); };
  }, []);

  useEffect(() => {
    const down = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = true;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = true;
      if (e.code === "Space") keys.current.action = true;
      if (e.key === "Shift") keys.current.think = true;
    };
    const up = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = false;
      if (e.code === "Space") keys.current.action = false;
      if (e.key === "Shift") keys.current.think = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const allCompleteNow = () => {
    const p = partsRef.current;
    return p.length && p.symbol && p.number && p.unique;
  };

  const spawnItemsForLevel = (startLevel) => {
    const cfg = startLevel === 1
      ? { gateX: 3600, reuseChance: 0.22, step: 200 }
      : { gateX: 4300, reuseChance: 0.33, step: 170 };

    stRef.current = { t: 0, lane: 1, x: 0, gateX: cfg.gateX, items: [], pops: [] };

    const types = [
      { k: "length", label: "LONG", emoji: "📏", good: true },
      { k: "symbol", label: "SYMBOL", emoji: "✨", good: true },
      { k: "number", label: "NUMBER", emoji: "🔢", good: true },
      { k: "unique", label: "UNIQUE", emoji: "🧬", good: true },
      { k: "reuse", label: "REUSE!", emoji: "👾", good: false },
    ];

    for (let x = 280; x < cfg.gateX - 200; x += cfg.step) {
      const lane = Math.floor(rand(0, 3));
      const pick = Math.random() < cfg.reuseChance
        ? types.find((t) => t.k === "reuse")
        : types[Math.floor(rand(0, 4))];

      stRef.current.items.push({
        id: Math.random().toString(36).slice(2),
        x,
        lane,
        type: pick.k,
        label: pick.label,
        emoji: pick.emoji,
        good: pick.good,
        taken: false,
      });
    }
  };

  const reset = (startLevel = 1) => {
    setBetweenLevels(false);
    setLevelSummary(null);
    setDone(false);
    setResult(null);
    setPaused(false);

    setLevelInstant(startLevel);

    // reset score/parts/strikes ONLY if starting from level 1
    if (startLevel === 1) {
      setScoreInstant(0);
      setStrikesInstant(0);
      setLivesInstant(MAX_LIVES);
      setPartsInstant({ length: false, symbol: false, number: false, unique: false });
    } else {
      // keep score; but new level requires new parts
      setPartsInstant({ length: false, symbol: false, number: false, unique: false });
    }

    spawnItemsForLevel(startLevel);
    setRunning(true);
  };

  const finishFinalWin = async () => {
    setRunning(false);
    setBetweenLevels(false);
    setDone(true);
    setResult("win");

    setSaving(true);
    await saveScoreToBackend({ userId, gameId, score: scoreRef.current });
    setSaving(false);
  };

  const finishWinLevel = async () => {
    const summary = {
      level: levelRef.current,
      score: scoreRef.current,
      strikes: strikesRef.current,
    };

    if (levelRef.current < MAX_LEVEL) {
      setRunning(false);
      setDone(false);
      setResult(null);
      setLevelSummary(summary);
      setBetweenLevels(true);
      return;
    }

    await finishFinalWin();
  };

  const finishLocked = () => {
    setRunning(false);
    setDone(true);
    setResult("locked");
  };

  const nextLevel = () => {
    const next = Math.min(MAX_LEVEL, levelRef.current + 1);
    setBetweenLevels(false);
    setLevelSummary(null);
    reset(next);
  };

  useEffect(() => {
    if (!running) return;

    let raf;
    const loop = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      const st = stRef.current;
      st.t++;

      const slow = keys.current.think ? 0.20 : 0.75;
      const dt = 1 * slow;

      // lane change
      if (keys.current.up) { st.lane = clamp(st.lane - 1, 0, 2); keys.current.up = false; }
      if (keys.current.down) { st.lane = clamp(st.lane + 1, 0, 2); keys.current.down = false; }

      // ACTION toggles pause
      if (keys.current.action) {
        setPaused((p) => !p);
        keys.current.action = false;
      }

      // forward speed by level
      const speed = (levelRef.current === 1 ? 6.0 : 7.3);
      if (!paused) st.x += speed * dt;

      const laneY = (lane) => h * (0.34 + lane * 0.18);
      const playerX = st.x;
      const cam = st.x;

      // collisions
      for (const it of st.items) {
        if (it.taken) continue;
        const dx = Math.abs(it.x - playerX);
        const dy = Math.abs(laneY(it.lane) - laneY(st.lane));
        if (dx < 34 && dy < 18) {
          it.taken = true;

          const popX = (it.x - cam + 140);
          const popY = laneY(it.lane) - 40;

          if (it.good) {
            const nextParts = { ...partsRef.current, [it.type]: true };
            setPartsInstant(nextParts);
            setScoreInstant(scoreRef.current + 120);
            spawnPop(st.pops, { x: popX, y: popY, text: "+120", good: true, emoji: "✨" });
          } else {
            // bad pickup
            setStrikesInstant(strikesRef.current + 1);
            setScoreInstant(Math.max(0, scoreRef.current - 80));
          
            const nextLives = Math.max(0, livesRef.current - 1);
            setLivesInstant(nextLives);
          
            spawnPop(st.pops, { x: popX, y: popY, text: "-80", good: false, emoji: "👾" });
          
            // if no lives left, end run immediately
            if (nextLives <= 0) {
              setTimeout(() => finishLocked(), 0);
              return;
            }
          }
          
        }
      }

      // gate check
      if (st.x >= st.gateX) {
        if (allCompleteNow()) {
          setScoreInstant(scoreRef.current + 250);
          // tiny defer so UI updates cleanly
          setTimeout(() => finishWinLevel(), 0);
        } else {
          finishLocked();
        }
        return;
      }

      // draw
      ctx.clearRect(0, 0, w, h);
      const bgImg = getBgImage(3);
      drawBackgroundCover(ctx, bgImg, w, h);
    //  drawParallaxBackground(ctx, w, h, st.t, "forge"); // optional overlay


      // track
      ctx.fillStyle = "rgba(148,163,184,0.10)";
      ctx.fillRect(0, h * 0.24, w, h * 0.56);

      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = "rgba(226,232,240,0.12)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h * (0.34 + i * 0.18));
        ctx.lineTo(w, h * (0.34 + i * 0.18));
        ctx.stroke();
      }

      // items
      for (const it of st.items) {
        if (it.taken) continue;
        const x = it.x - cam + 140;
        if (x < -120 || x > w + 120) continue;
        const y = laneY(it.lane);

        ctx.save();
        ctx.shadowColor = it.good ? "rgba(34,197,94,0.55)" : "rgba(239,68,68,0.55)";
        ctx.shadowBlur = 18;
        ctx.fillStyle = it.good ? "#22c55e" : "#ef4444";
        ctx.beginPath();
        ctx.roundRect(x - 34, y - 26, 68, 52, 14);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "#0b1020";
        ctx.font = `900 ${Math.round(w * 0.022)}px system-ui`;
        ctx.textAlign = "center";
        const goodIcon = getIconImage(3, "good");
        const badIcon  = getIconImage(3, "bad");
        drawIcon(ctx, it.good ? goodIcon : badIcon, x, y, 30);


        const label = it.label;
        ctx.save();
        ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
        const tw = ctx.measureText(label).width;
        const padX = 14;
        const pillW = tw + padX * 2;
        const pillH = 30;
        const pillX = x - pillW / 2;
        const pillY = y - 64;

        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(2,6,23,0.85)";
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 14);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = it.good ? "rgba(34,197,94,0.55)" : "rgba(239,68,68,0.55)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#e2e8f0";
        ctx.textAlign = "center";
        ctx.fillText(label, x, pillY + 21);
        ctx.restore();
      }

      // gate
      const openGate = allCompleteNow();
      const gateX = st.gateX - cam + 140;
      ctx.fillStyle = openGate ? "#22c55e" : "#f59e0b";
      ctx.fillRect(gateX - 18, h * 0.24, 36, h * 0.56);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = `900 ${Math.round(w * 0.02)}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillText(openGate ? "OPEN!" : "LOCKED", gateX + 30, h * 0.18);

      // player
      const py = laneY(st.lane);
      const HERO_W = 90;
      const HERO_H = 110;
      const drawX = 140;

      if (heroReady && heroRef.current) {
        ctx.drawImage(heroRef.current, drawX - HERO_W / 2, py - HERO_H / 2, HERO_W, HERO_H);
      } else {
        ctx.fillStyle = "#60a5fa";
        ctx.beginPath();
        ctx.roundRect(drawX - 32, py - 26, 64, 52, 16);
        ctx.fill();
      }

      drawPops(ctx, st.pops, w);

      // HUD
      ctx.fillStyle = "rgba(2,6,23,0.60)";
      ctx.fillRect(18, 18, w - 36, 100);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `900 ${Math.round(w * 0.02)}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillText("🏰 Password Forge Journey", 32, 52);

      ctx.textAlign = "right";
      ctx.font = `800 ${Math.round(w * 0.016)}px system-ui`;
      ctx.fillText(`Level: ${levelRef.current}/${MAX_LEVEL}`, w - 28, 44);
      ctx.fillText(`Score: ${scoreRef.current}`, w - 28, 70);
      ctx.fillText(`Lives: ${livesRef.current} ❤️ | Strikes: ${strikesRef.current}`, w - 28, 94);

      // parts bar
      const partChip = (ok, label, x) => {
        ctx.fillStyle = ok ? "#22c55e" : "rgba(148,163,184,0.25)";
        ctx.beginPath();
        ctx.roundRect(x, 76, 140, 34, 14);
        ctx.fill();
        ctx.fillStyle = ok ? "#0b1020" : "rgba(226,232,240,0.9)";
        ctx.font = `900 ${Math.round(w * 0.013)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(label, x + 70, 100);
      };

      const pr = partsRef.current;
      partChip(pr.length, "📏 LENGTH", 32);
      partChip(pr.symbol, "✨ SYMBOL", 184);
      partChip(pr.number, "🔢 NUMBER", 336);
      partChip(pr.unique, "🧬 UNIQUE", 488);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, w, h, heroReady, paused]);

  const instructions = (
    <>
      <b>Goal:</b> Collect all 4 parts: 📏 LENGTH, ✨ SYMBOL, 🔢 NUMBER, 🧬 UNIQUE. <br />
      <b>Avoid:</b> 👾 REUSE traps. <br />
      <b>Controls:</b> ⬆⬇ switch lanes. ⭐ ACTION = Pause/Resume. 🧠 THINK = slow mode. <br />
      <b>Finish:</b> Gate opens ONLY when all 4 parts are collected.
    </>
  );

  return (
    <MissionFrame
      embedded={embedded}
      title="Topic 3 Mini-Game"
      subtitle={`Passwords — ${levelCfg.label}`}
      instructions={instructions}
      badgeLeft={`🧭 Level: ${level}/${MAX_LEVEL} | ❤️ Lives: ${lives} | 🧩 Parts: ${Object.values(parts).filter(Boolean).length}/4`}
      badgeRight={`🏆 Score: ${score}`}
      onBack={onBack || (() => window.history.back())}
      theme="ocean"
    >
      <div ref={containerRef} style={ui.gameArea}>
        <div style={ui.canvasShell}>
          <canvas ref={canvasRef} width={w} height={h} style={ui.canvas} />

          {!running && !done && !betweenLevels && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Forge your password! 🔐</div>
                <div style={ui.overlayText}>
                  Collect all 4 ingredients to unlock the gate. Avoid “REUSE” monsters!
                </div>
                <button style={ui.primaryBtn} onClick={() => reset(1)}>⚒ Start Level 1</button>
              </div>
            </div>
          )}

          {betweenLevels && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Level {levelSummary?.level} Complete! ✅</div>
                <div style={ui.overlayText}>
                  Score so far: <b>{levelSummary?.score}</b><br />
                  Strikes: <b>{levelSummary?.strikes}</b>
                </div>
                <button style={ui.primaryBtn} onClick={nextLevel}>➡ Next Level</button>
              </div>
            </div>
          )}

          {done && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>
                  {result === "win" ? "Forge Complete! 🎉" : "Gate Locked! 🔒"}
                </div>

                {result === "win" ? (
                  <div style={ui.overlayText}>
                    You unlocked the gate! Final Score: <b>{score}</b>
                  </div>
                ) : (
                  <div style={ui.overlayText}>
                    You reached the gate, but your password is missing parts.
                    <br />
                    Collect all 4 parts and try again!
                  </div>
                )}

                <div style={ui.overlaySmall}>
                  {result === "win"
                    ? (saving ? "Saving score..." : "Score saved ✅")
                    : "Score not saved (incomplete) ❗"}
                </div>

                <button style={ui.primaryBtn} onClick={() => reset(1)}>🔁 Play Again</button>
              </div>
            </div>
          )}
        </div>

        <BigControls keysRef={keys} disabled={!running} />
      </div>
    </MissionFrame>
  );
}

// ============================================================
// TOPIC 4 — Social Media Privacy Switch Maze (NOW WITH LEVELS)
// - Level 1 -> Between screen (Next Level) -> Level 2 -> Final save
// - Level 2 has more strangers + more pickups + extra gate/switch and longer exit distance
// - Score carries over across levels
// ============================================================
export function SocialMediaJourney2D({ userId, gameId, onBack, embedded = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const keys = useRef({ left: false, right: false, up: false, down: false, action: false, think: false });
  const { w, h } = useCanvasSize(containerRef, 16 / 9);

  const MAX_LEVEL = 2;

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const setScoreInstant = (v) => {
    scoreRef.current = v;
    setScore(v);
  };

  const [privacy, setPrivacy] = useState("public"); // public/private
  const [saving, setSaving] = useState(false);

  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  const setLevelInstant = (v) => {
    levelRef.current = v;
    setLevel(v);
  };

  // between-level screen
  const [betweenLevels, setBetweenLevels] = useState(false);
  const [levelSummary, setLevelSummary] = useState(null); // { level, score, privacy }

  const levelCfg = useMemo(() => {
    return level === 1
      ? {
          label: "Warm-up Maze",
          exitX: 2600,
          strangers: 7,
          pickups: 10,
          switches: [
            { x: 700, y: 220, flipped: false },
            { x: 1500, y: 420, flipped: false },
            { x: 2100, y: 260, flipped: false },
          ],
          gates: [
            { x: 980, y: 180, w: 28, h: 260, needs: "private" },
            { x: 1760, y: 330, w: 28, h: 260, needs: "private" },
          ],
        }
      : {
          label: "Hard Maze",
          exitX: 3400,
          strangers: 10,
          pickups: 14,
          // extra switch + gate
          switches: [
            { x: 700, y: 220, flipped: false },
            { x: 1500, y: 420, flipped: false },
            { x: 2100, y: 260, flipped: false },
            { x: 2850, y: 220, flipped: false },
          ],
          gates: [
            { x: 980, y: 180, w: 28, h: 260, needs: "private" },
            { x: 1760, y: 330, w: 28, h: 260, needs: "private" },
            { x: 2560, y: 180, w: 28, h: 260, needs: "private" },
          ],
        };
  }, [level]);

  // world state
  const stRef = useRef({
    t: 0,
    player: { x: 160, y: 220, r: 18 },
    exit: { x: 2600, y: 420, r: 36 },
    switches: [],
    gates: [],
    strangers: [],
    pickups: [],
    camX: 0,
  });

  // ✅ HERO IMAGE (loads once and works in Vite/React)
  const heroRef = useRef(null);
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = player;
    img.onload = () => {
      heroRef.current = img;
      setHeroReady(true);
    };
  }, []);

  // keyboard listeners
  useEffect(() => {
    const down = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = true;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = true;
      if (e.code === "Space") keys.current.action = true;
      if (e.key === "Shift") keys.current.think = true;
    };
    const up = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = false;
      if (e.code === "Space") keys.current.action = false;
      if (e.key === "Shift") keys.current.think = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const buildLevelState = (lvl) => {
    const cfg =
      lvl === 1
        ? {
            exitX: 2600,
            strangers: 7,
            pickups: 10,
            switches: [
              { x: 700, y: 220, flipped: false },
              { x: 1500, y: 420, flipped: false },
              { x: 2100, y: 260, flipped: false },
            ],
            gates: [
              { x: 980, y: 180, w: 28, h: 260, needs: "private" },
              { x: 1760, y: 330, w: 28, h: 260, needs: "private" },
            ],
          }
        : {
            exitX: 3400,
            strangers: 10,
            pickups: 14,
            switches: [
              { x: 700, y: 220, flipped: false },
              { x: 1500, y: 420, flipped: false },
              { x: 2100, y: 260, flipped: false },
              { x: 2850, y: 220, flipped: false },
            ],
            gates: [
              { x: 980, y: 180, w: 28, h: 260, needs: "private" },
              { x: 1760, y: 330, w: 28, h: 260, needs: "private" },
              { x: 2560, y: 180, w: 28, h: 260, needs: "private" },
            ],
          };

    stRef.current = {
      t: 0,
      player: { x: 160, y: 220, r: 18 },
      exit: { x: cfg.exitX, y: 420, r: 36 },
      switches: cfg.switches,
      gates: cfg.gates,
      strangers: Array.from({ length: cfg.strangers }).map((_, i) => ({
        x: 520 + i * 260 + rand(-40, 40),
        y: rand(150, 520),
        r: 18,
        alive: true,
        msg: ["DM?", "Follow me!", "Click link!", "Add me!", "Where do you live?"][Math.floor(rand(0, 5))],
      })),
      pickups: Array.from({ length: cfg.pickups }).map((_, i) => {
        const worldX = 360 + i * 220 + rand(-30, 30);
        return {
          worldX,                    x: worldX,       
          y: rand(160, 520),
          r: 14,
          taken: false,
        };
      }),
      
      camX: 0,
    };
  };

  const reset = (startLevel = 1) => {
    setBetweenLevels(false);
    setLevelSummary(null);
    setDone(false);

    setLevelInstant(startLevel);

    // reset score only when starting from level 1
    if (startLevel === 1) {
      setScoreInstant(0);
    }

    setPrivacy("public");
    buildLevelState(startLevel);

    setRunning(true);
  };

  const canPassGate = (gate) => privacy === gate.needs;

  const isBehindLockedGate = (worldX) => {
    const st = stRef.current;
    for (const g of st.gates) {
      // if object is to the RIGHT of the gate AND gate is locked, it's unreachable
      if (worldX > g.x && !canPassGate(g)) return true;
    }
    return false;
  c};


  const finishFinal = async () => {
    setRunning(false);
    setBetweenLevels(false);
    setDone(true);
    setSaving(true);
    await saveScoreToBackend({ userId, gameId, score: scoreRef.current });
    setSaving(false);
  };

  const finishLevel = async () => {
    const summary = {
      level: levelRef.current,
      score: scoreRef.current,
      privacy,
    };

    if (levelRef.current < MAX_LEVEL) {
      setRunning(false);
      setDone(false);
      setLevelSummary(summary);
      setBetweenLevels(true);
      return;
    }

    await finishFinal();
  };

  const nextLevel = () => {
    const next = Math.min(MAX_LEVEL, levelRef.current + 1);
    setBetweenLevels(false);
    setLevelSummary(null);
    reset(next);
  };

  useEffect(() => {
    if (!running) return;

    let raf;
    const loop = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      const st = stRef.current;
      st.t++;

      const slow = keys.current.think ? 0.55 : 1;
      const dt = 1 * slow;

      // move
      let nx = st.player.x;
      let ny = st.player.y;
      if (keys.current.left) nx -= 4.4 * dt;
      if (keys.current.right) nx += 4.4 * dt;
      if (keys.current.up) ny -= 4.1 * dt;
      if (keys.current.down) ny += 4.1 * dt;

      ny = clamp(ny, 110, h - 120);

      // gate collision block if privacy not correct
      const tryMove = (tx, ty) => {
        for (const g of st.gates) {
          const gx = g.x;
          const gy = g.y;
          const gw = g.w;
          const gh = g.h;

          const px = tx, py = ty, pr = st.player.r;
          const hit =
            px + pr > gx &&
            px - pr < gx + gw &&
            py + pr > gy &&
            py - pr < gy + gh;

          if (hit && !canPassGate(g)) return { x: st.player.x, y: st.player.y };
        }
        return { x: tx, y: ty };
      };

      const moved = tryMove(nx, ny);
      st.player.x = moved.x;
      st.player.y = moved.y;

      // camera
      st.camX = clamp(st.player.x - w * 0.35, 0, st.exit.x - w * 0.3);

      // pickups
      for (const p of st.pickups) {
        if (p.taken) continue;
        if (isBehindLockedGate(p.worldX ?? p.x)) continue; //
        if (dist(st.player.x, st.player.y, p.x, p.y) < st.player.r + p.r + 6) {
          p.taken = true;
          setScoreInstant(scoreRef.current + 80);
        }
      }
      

      // strangers: penalty while public
      for (const s of st.strangers) {
        if (!s.alive) continue;
        if (isBehindLockedGate(s.worldX ?? s.x)) continue;
        if (dist(st.player.x, st.player.y, s.x, s.y) < 58) {
          if (privacy === "public") {
            s.alive = false;
            setScoreInstant(Math.max(0, scoreRef.current - 100));
          }
        }
      }
      

      // action near switch toggles to private (one way per switch)
      if (keys.current.action) {
        for (const sw of st.switches) {
          if (!sw.flipped && dist(st.player.x, st.player.y, sw.x, sw.y) < 60) {
            sw.flipped = true;
            setPrivacy("private");
            setScoreInstant(scoreRef.current + 120);
          }
        }
      }

      // win: reach exit
      if (dist(st.player.x, st.player.y, st.exit.x, st.exit.y) < st.exit.r + 22) {
        setScoreInstant(scoreRef.current + 200);
        finishLevel();
        return;
      }

      // draw
      ctx.clearRect(0, 0, w, h);
      const bgImg = getBgImage(4);
      drawBackgroundCover(ctx, bgImg, w, h);
   //   drawParallaxBackground(ctx, w, h, st.t, "city"); // optional overlay


      // city blocks
      ctx.fillStyle = "rgba(99,102,241,0.08)";
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.roundRect(((i * 260 + st.t * 0.5) % (w + 400)) - 200, 120 + (i % 4) * 120, 160, 64, 18);
        ctx.fill();
      }

      const cam = st.camX;

      // gates
      for (const g2 of st.gates) {
        const x = g2.x - cam;
        ctx.fillStyle = canPassGate(g2) ? "rgba(34,197,94,0.55)" : "rgba(245,158,11,0.55)";
        ctx.fillRect(x, g2.y, g2.w, g2.h);

        ctx.fillStyle = "rgba(226,232,240,0.9)";
        ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(canPassGate(g2) ? "✅" : "🔒", x + g2.w / 2, g2.y - 10);
      }

      // switches
      for (const sw of st.switches) {
        const x = sw.x - cam;
        ctx.fillStyle = sw.flipped ? "#22c55e" : "#93c5fd";
        ctx.beginPath();
        ctx.roundRect(x - 22, sw.y - 18, 44, 36, 10);
        ctx.fill();

        ctx.fillStyle = "#0b1020";
        ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
        ctx.textAlign = "center";
        const goodIcon = getIconImage(4, "good");
        drawIcon(ctx, goodIcon, x, sw.y, 24);

      }

      // pickups

      for (const p2 of st.pickups) {
        if (p2.taken) continue;
        if (isBehindLockedGate(p2.worldX ?? p2.x)) continue; // ✅ NEW
      
        const x = p2.x - cam;
        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.arc(x, p2.y, p2.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0b1020";
        ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText("⚙️", x, p2.y + 6);
      }


      // strangers
    
      for (const s2 of st.strangers) {
        if (!s2.alive) continue;
        if (isBehindLockedGate(s2.worldX ?? s2.x)) continue; // ✅ NEW
      
        const x = s2.x - cam;
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(x, s2.y, s2.r, 0, Math.PI * 2);
        ctx.fill();
      
        ctx.fillStyle = "#0b1020";
        ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
        ctx.textAlign = "center";
        const badIcon = getIconImage(4, "bad");
        drawIcon(ctx, badIcon, x, s2.y, 26);
      
        ctx.fillStyle = "rgba(226,232,240,0.95)";
        ctx.font = `800 ${Math.round(w * 0.013)}px system-ui`;
        ctx.fillText(s2.msg, x, s2.y - 28);
      }


      // exit
      const ex = st.exit.x - cam;
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(ex, st.exit.y, st.exit.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.font = `900 ${Math.round(w * 0.018)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("🏁", ex, st.exit.y + 8);

      // player icon
      const px = st.player.x - cam;
      const HERO_W = 90;
      const HERO_H = 110;

      if (heroReady && heroRef.current) {
        ctx.drawImage(heroRef.current, px - HERO_W / 2, st.player.y - HERO_H / 2, HERO_W, HERO_H);
      } else {
        ctx.fillStyle = "#60a5fa";
        ctx.beginPath();
        ctx.roundRect(px - 18, st.player.y - 22, 36, 44, 12);
        ctx.fill();
      }

      // privacy badge above player
      ctx.fillStyle = privacy === "private" ? "rgba(34,197,94,0.9)" : "rgba(245,158,11,0.9)";
      ctx.beginPath();
      ctx.roundRect(px - 54, st.player.y - 62, 108, 28, 12);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.font = `900 ${Math.round(w * 0.013)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText(privacy.toUpperCase(), px, st.player.y - 42);

      // HUD
      ctx.fillStyle = "rgba(2,6,23,0.60)";
      ctx.fillRect(18, 18, w - 36, 78);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `900 ${Math.round(w * 0.02)}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillText("🧭 Privacy Switch Maze Journey", 32, 52);

      ctx.textAlign = "right";
      ctx.font = `800 ${Math.round(w * 0.016)}px system-ui`;
      ctx.fillText(`Level: ${levelRef.current}/${MAX_LEVEL}`, w - 28, 44);
      ctx.fillText(`Score: ${scoreRef.current}`, w - 28, 68);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, w, h, privacy, heroReady]);

  const instructions = (
    <>
      <b>Goal:</b> Reach the 🏁 exit by turning your account PRIVATE and opening locked gates. <br />
      <b>Danger:</b> 👤 Strangers drain score when you are PUBLIC. <br />
      <b>Controls:</b> ⬅⬆⬇➡ move, ⭐ ACTION (Space) on a switch = turn PRIVATE, 🧠 THINK (Shift) = slow mode. <br />
      <b>Tip:</b> Go PRIVATE early to stay safe and pass 🔒 gates.
    </>
  );

  return (
    <MissionFrame
      embedded={embedded}
      title="Topic 4 Mini-Game"
      subtitle={`Social Media Safety — ${levelCfg.label}`}
      instructions={instructions}
      badgeLeft={`🧭 Level: ${level}/${MAX_LEVEL} | 🔐 ${privacy.toUpperCase()}`}
      badgeRight={`🏆 Score: ${score}`}
      onBack={onBack || (() => window.history.back())}
      theme="ocean"
    >
      <div ref={containerRef} style={ui.gameArea}>
        <div style={ui.canvasShell}>
          <canvas ref={canvasRef} width={w} height={h} style={ui.canvas} />

          {/* Start overlay */}
          {!running && !done && !betweenLevels && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Set your privacy! 🔒</div>
                <div style={ui.overlayText}>
                  Find switches to turn PRIVATE and unlock gates. Avoid strangers when PUBLIC.
                  <br />
                  <b>2 Levels:</b> Level 2 is harder!
                </div>
                <button style={ui.primaryBtn} onClick={() => reset(1)}>🧩 Start Level 1</button>
              </div>
            </div>
          )}

          {/* Between levels */}
          {betweenLevels && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Level {levelSummary?.level} Complete! ✅</div>
                <div style={ui.overlayText}>
                  Score so far: <b>{levelSummary?.score}</b>
                  <br />
                  Mode: <b>{(levelSummary?.privacy || "public").toUpperCase()}</b>
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button style={ui.primaryBtn} onClick={nextLevel}>➡ Next Level</button>
                </div>
              </div>
            </div>
          )}

          {/* Final done */}
          {done && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Great job! 🎉</div>
                <div style={ui.overlayText}>Final Score: <b>{score}</b></div>
                <div style={ui.overlaySmall}>{saving ? "Saving score..." : "Score saved ✅"}</div>
                <button style={ui.primaryBtn} onClick={() => reset(1)}>🔁 Play Again</button>
              </div>
            </div>
          )}
        </div>

        <BigControls keysRef={keys} disabled={!running} />
      </div>
    </MissionFrame>
  );
}

// ---------- UI styles (colors match your logo vibe: dark navy + sky/teal) ----------
const ui = {
  themeOcean: {
    background:
      "radial-gradient(1200px 700px at 15% 20%, rgba(98,174,218,0.20), transparent 60%), radial-gradient(900px 600px at 85% 10%, rgba(34,197,94,0.14), transparent 55%), linear-gradient(180deg, #050a12, #070f1b)",
  },
  themeSunset: {
    background:
      "radial-gradient(1200px 700px at 20% 10%, rgba(251,146,60,0.18), transparent 60%), radial-gradient(900px 600px at 85% 30%, rgba(99,102,241,0.18), transparent 55%), linear-gradient(180deg, #070a12, #0b1020)",
  },
  page: {
    minHeight: "100vh",
    width: "100%",
    padding: "18px 18px 28px",
    boxSizing: "border-box",
    color: "#e2e8f0",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  backBtn: {
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(2,6,23,0.5)",
    color: "#e2e8f0",
    borderRadius: 14,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  titleBlock: { flex: 1, minWidth: 260 },
  title: { fontSize: 26, fontWeight: 900, letterSpacing: 0.2 },
  subTitle: { opacity: 0.85, marginTop: 2, fontSize: 14, fontWeight: 600 },
  badges: { display: "flex", gap: 10 },
  badge: {
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.45)",
    borderRadius: 16,
    padding: "10px 12px",
    fontWeight: 800,
    minWidth: 140,
    textAlign: "center",
  },
  instructionsCard: {
    marginTop: 14,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.48)",
    borderRadius: 18,
    padding: "12px 14px",
  },
  instructionsTitle: { fontWeight: 900, fontSize: 14, marginBottom: 6 },
  instructionsText: { fontSize: 14, lineHeight: 1.35, opacity: 0.95 },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: "rgba(2,6,23,0.50)",
    backdropFilter: "blur(6px)",
  },
  overlayCard: {
    width: "min(520px, 92%)",
    borderRadius: 18,
    background: "rgba(2,6,23,0.88)",
    border: "1px solid rgba(148,163,184,0.28)",
    padding: "18px 18px 16px",
    textAlign: "center",
    boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
  },
  overlayTitle: {
    fontSize: 26,              
    fontWeight: 900,
    marginBottom: 8,
    color: "#eaf6ff",           
    textShadow: `
      0 2px 8px rgba(56,189,248,0.35),
      0 0 18px rgba(59,130,246,0.25)
    `,
    letterSpacing: "0.3px",
  },
  overlayText: {
    fontSize: 15,
    lineHeight: 1.5,
    marginBottom: 14,
    color: "#dbeafe",          
    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
  },
  overlaySmall: { opacity: 0.8, marginBottom: 10, fontSize: 12 },
  primaryBtn: {
    border: "none",
    borderRadius: 999,
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: 900,
    color: "#04111c",
    background: "linear-gradient(135deg, #62aeda, #22c55e)",
    boxShadow: "0 16px 40px rgba(98,174,218,0.25)",
  },

  controlsCol: { display: "flex", flexDirection: "column", gap: 10, alignItems: "center" },
 

//   ------------------------------------------------------------

embedWrap: {
    width: "100%",
    borderRadius: 18,
    padding: 12,
    boxSizing: "border-box",
  },
  embedTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  embedTitle: { minWidth: 240 },
  embedTitleMain: { fontSize: 18, fontWeight: 900, color: "#e2e8f0" },
  embedTitleSub: { fontSize: 12, fontWeight: 700, opacity: 0.85 },
  embedBadges: { display: "flex", gap: 8, flexWrap: "wrap" },
  embedBadge: {
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.45)",
    borderRadius: 14,
    padding: "8px 10px",
    fontWeight: 800,
    fontSize: 12,
    textAlign: "center",
    minWidth: 110,
  },
  embedGoal: {
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2,6,23,0.35)",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 12,
    lineHeight: 1.3,
    marginBottom: 10,
    color: "#e2e8f0",
  },

  gameArea: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // ✅ IMPORTANT: make canvas always stay inside the card
  canvasShell: {
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.22)",
    overflow: "hidden",
    boxShadow: "0 18px 55px rgba(0,0,0,0.35)",
  },
  canvas: {
    display: "block",
    width: "100%",
    height: "auto",
    background: "#020617",
  },

  // ✅ reduce control size in embedded mode (optional)
  controlsWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  bigBtn: {
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.55)",
    color: "#e2e8f0",
    padding: "12px 14px",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
    minWidth: 64,
  },


};
