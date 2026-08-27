/* =============================================================
   STARRY SKY BIRTHDAY — SCRIPT.JS
   -------------------------------------------------------------
   HOW TO CUSTOMIZE THIS FILE
   1. Edit the CONFIG object below with names & messages.
   2. Edit the MEMORIES array with your own titles/photos/messages.
      (8–12 items works best. Positions are auto-generated, or you
       can set your own — see comments inside MEMORIES.)
   3. Drop your own photos into assets/photos/ and update the
      `image` path for each memory.
   4. Drop a song into assets/music/birthday.mp3 (optional).
   Everything else below CONFIG/MEMORIES is the engine — you
   shouldn't need to touch it to personalize the site.
   ============================================================= */

const CONFIG = {
  sisterName: "Sister's Name",       // shown on the opening + final scene
  yourName: "Your Name",              // shown in the closing signature
  musicEnabled: true,                 // set false to hide music controls entirely
  musicSrc: "assets/music/birthday.mp3",
  constellationShape: "heart",        // "heart" is built in; see buildHeartPositions() to customize
};

/**
 * Each memory needs: title, image, message.
 * `image` is a relative path — replace with your own photos.
 * Feel free to add/remove entries (aim for 8–12 total).
 */
const MEMORIES = [
  { title: "Our Childhood 💕",              image: "assets/photos/memory1.jpg",  message: "Those little moments became some of my favorite memories." },
  { title: "That Crazy Day 😂",              image: "assets/photos/memory2.jpg",  message: "I still laugh whenever I remember this." },
  { title: "One of My Favorite Memories ✨", image: "assets/photos/memory3.jpg",  message: "I'll always be grateful that I got to experience this with you." },
  { title: "The Trip We Never Forgot 🚗",    image: "assets/photos/memory4.jpg",  message: "Replace this with a memory only the two of you would understand." },
  { title: "Late Night Talks 🌙",            image: "assets/photos/memory5.jpg",  message: "Some of our best conversations happened long after midnight." },
  { title: "The Silly Nickname 🤭",          image: "assets/photos/memory6.jpg",  message: "You know exactly which one I mean." },
  { title: "When You Were There For Me 🤍",  image: "assets/photos/memory7.jpg",  message: "I don't think I ever properly thanked you for that." },
  { title: "Our Favorite Song 🎶",           image: "assets/photos/memory8.jpg",  message: "It still comes on at the most random times." },
  { title: "The Photo We Took 📸",           image: "assets/photos/memory9.jpg",  message: "A tiny moment that means more than you know." },
  { title: "Today ✨",                       image: "assets/photos/memory10.jpg", message: "And here's to every memory still waiting to happen." },
];

/* =============================================================
   STATE
   ============================================================= */
const state = {
  scene: "opening",
  foundMemories: new Set(),
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  pageVisible: true,
  pointer: { x: 0, y: 0 }, // -1..1 range, used for parallax
};

/* =============================================================
   DOM REFS
   ============================================================= */
const els = {
  canvas: document.getElementById("bg-canvas"),
  sceneOpening: document.getElementById("scene-opening"),
  sceneSky: document.getElementById("scene-sky"),
  sceneWish: document.getElementById("scene-wish"),
  sceneFinal: document.getElementById("scene-final"),
  enterBtn: document.getElementById("enter-btn"),
  progressCount: document.getElementById("progress-count"),
  progressTotal: document.getElementById("progress-total"),
  progressIndicator: document.getElementById("progress-indicator"),
  skyHint: document.getElementById("sky-hint"),
  starsLayer: document.getElementById("memory-stars-layer"),
  constellationSvg: document.getElementById("constellation-svg"),
  constellationMessage: document.getElementById("constellation-message"),
  modal: document.getElementById("memory-modal"),
  modalTitle: document.getElementById("modal-title"),
  modalImage: document.getElementById("modal-image"),
  modalMessage: document.getElementById("modal-message"),
  candleBtn: document.getElementById("candle-btn"),
  musicControls: document.getElementById("music-controls"),
  musicToggle: document.getElementById("music-toggle"),
  musicIcon: document.getElementById("music-icon"),
  volumeSlider: document.getElementById("volume-slider"),
  audio: document.getElementById("bg-audio"),
};

/* =============================================================
   PERSONALIZATION APPLY
   ============================================================= */
function applyConfig() {
  document.querySelectorAll(".sister-name").forEach(el => { el.textContent = CONFIG.sisterName; });
  document.querySelectorAll(".your-name").forEach(el => { el.textContent = CONFIG.yourName; });
  els.progressTotal.textContent = MEMORIES.length;
  document.title = `Happy Birthday, ${CONFIG.sisterName} ✨`;

  if (CONFIG.musicEnabled) {
    els.audio.querySelector("source").src = CONFIG.musicSrc;
    els.audio.load();
  } else {
    els.musicControls.hidden = true;
  }
}

/* =============================================================
   SCENE MANAGER
   ============================================================= */
const sceneEls = {
  opening: els.sceneOpening,
  sky: els.sceneSky,
  wish: els.sceneWish,
  final: els.sceneFinal,
};

function goToScene(name) {
  const next = sceneEls[name];
  if (!next) return;

  Object.values(sceneEls).forEach(el => {
    if (el === next) return;
    if (!el.hidden) {
      el.classList.add("is-leaving");
      el.classList.remove("is-active");
      window.setTimeout(() => { el.hidden = true; el.classList.remove("is-leaving"); }, 900);
    }
  });

  next.hidden = false;
  // Force reflow so the fade-in transition actually plays
  void next.offsetWidth;
  next.classList.add("is-active");
  state.scene = name;
}

/* =============================================================
   BACKGROUND CANVAS ENGINE
   (ambient starfield, nebula glow, shooting stars, fireworks)
   ============================================================= */
const ctx = els.canvas.getContext("2d");
let width = 0, height = 0, dpr = 1;
let ambientStars = [];
let shootingStars = [];
let fireworks = [];
let fireworkParticles = [];
let mode = "sky"; // "sky" | "dark" | "fireworks"
let rafId = null;

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  els.canvas.width = width * dpr;
  els.canvas.height = height * dpr;
  els.canvas.style.width = width + "px";
  els.canvas.style.height = height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildAmbientStars();
  layoutMemoryStars();
  if (state.scene === "sky" && state.foundMemories.size === MEMORIES.length) {
    drawConstellationLines();
  }
}

function buildAmbientStars() {
  const density = state.reducedMotion ? 0.00009 : 0.00016;
  const count = Math.round(width * height * density);
  ambientStars = new Array(count).fill(0).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.3 + 0.3,
    baseAlpha: Math.random() * 0.5 + 0.35,
    twinkleSpeed: Math.random() * 0.015 + 0.004,
    twinklePhase: Math.random() * Math.PI * 2,
    parallaxDepth: Math.random() * 0.6 + 0.1, // farther stars move less
  }));
}

function maybeSpawnShootingStar() {
  if (state.reducedMotion) return;
  if (mode !== "sky") return;
  if (Math.random() < 0.006 && shootingStars.length < 2) {
    const startX = Math.random() * width * 0.6 + width * 0.2;
    shootingStars.push({
      x: startX,
      y: -20,
      vx: -4 - Math.random() * 3,
      vy: 5 + Math.random() * 3,
      len: 90 + Math.random() * 60,
      life: 1,
    });
  }
}

function drawNebula() {
  const g1 = ctx.createRadialGradient(width * 0.25, height * 0.2, 0, width * 0.25, height * 0.2, width * 0.55);
  g1.addColorStop(0, "rgba(94,124,255,0.10)");
  g1.addColorStop(1, "rgba(94,124,255,0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, width, height);

  const g2 = ctx.createRadialGradient(width * 0.78, height * 0.7, 0, width * 0.78, height * 0.7, width * 0.5);
  g2.addColorStop(0, "rgba(169,139,255,0.10)");
  g2.addColorStop(1, "rgba(169,139,255,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, width, height);

  const g3 = ctx.createRadialGradient(width * 0.5, height * 0.85, 0, width * 0.5, height * 0.85, width * 0.4);
  g3.addColorStop(0, "rgba(255,139,216,0.05)");
  g3.addColorStop(1, "rgba(255,139,216,0)");
  ctx.fillStyle = g3;
  ctx.fillRect(0, 0, width, height);
}

let t = 0;
function drawSky() {
  ctx.clearRect(0, 0, width, height);
  drawNebula();

  const px = state.pointer.x, py = state.pointer.y;

  for (const s of ambientStars) {
    s.twinklePhase += s.twinkleSpeed;
    const alpha = s.baseAlpha + Math.sin(s.twinklePhase) * 0.25;
    const ox = px * 14 * s.parallaxDepth;
    const oy = py * 14 * s.parallaxDepth;
    ctx.beginPath();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = "#FFFFFF";
    ctx.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  maybeSpawnShootingStar();
  shootingStars.forEach(s => {
    ctx.save();
    ctx.globalAlpha = s.life;
    const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * (s.len / 6), s.y - s.vy * (s.len / 6));
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * (s.len / 6), s.y - s.vy * (s.len / 6));
    ctx.stroke();
    ctx.restore();
    s.x += s.vx;
    s.y += s.vy;
    s.life -= 0.012;
  });
  shootingStars = shootingStars.filter(s => s.life > 0 && s.y < height + 50);
}

function drawDark() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#02030D";
  ctx.fillRect(0, 0, width, height);
}

function spawnFirework(x, y) {
  const hueOptions = [
    { r: 94, g: 124, b: 255 },
    { r: 169, g: 139, b: 255 },
    { r: 255, g: 139, b: 216 },
    { r: 255, g: 255, b: 255 },
  ];
  const color = hueOptions[Math.floor(Math.random() * hueOptions.length)];
  const count = state.reducedMotion ? 18 : 46;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
    const speed = 1.5 + Math.random() * 3.2;
    fireworkParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.008 + Math.random() * 0.01,
      color,
      r: 1.4 + Math.random() * 1.4,
    });
  }
}

function drawFireworks() {
  ctx.fillStyle = "rgba(2,3,13,0.22)";
  ctx.fillRect(0, 0, width, height);

  // ambient stars remain faintly visible behind fireworks
  for (const s of ambientStars) {
    ctx.beginPath();
    ctx.globalAlpha = s.baseAlpha * 0.5;
    ctx.fillStyle = "#FFFFFF";
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (Math.random() < (state.reducedMotion ? 0.01 : 0.045)) {
    spawnFirework(width * (0.15 + Math.random() * 0.7), height * (0.18 + Math.random() * 0.4));
  }

  fireworkParticles.forEach(p => {
    ctx.beginPath();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = `rgb(${p.color.r},${p.color.g},${p.color.b})`;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.02; // gentle gravity
    p.life -= p.decay;
  });
  ctx.globalAlpha = 1;
  fireworkParticles = fireworkParticles.filter(p => p.life > 0);
}

function tick() {
  if (!state.pageVisible) { rafId = requestAnimationFrame(tick); return; }
  t += 1;
  if (mode === "sky") drawSky();
  else if (mode === "dark") drawDark();
  else if (mode === "fireworks") drawFireworks();
  rafId = requestAnimationFrame(tick);
}

/* =============================================================
   POINTER / TOUCH PARALLAX
   ============================================================= */
function onPointerMove(clientX, clientY) {
  state.pointer.x = (clientX / width) * 2 - 1;
  state.pointer.y = (clientY / height) * 2 - 1;
}
window.addEventListener("mousemove", e => onPointerMove(e.clientX, e.clientY), { passive: true });
window.addEventListener("touchmove", e => {
  if (e.touches[0]) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
window.addEventListener("deviceorientation", e => {
  if (e.gamma == null || e.beta == null) return;
  state.pointer.x = Math.max(-1, Math.min(1, e.gamma / 30));
  state.pointer.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
}, { passive: true });

document.addEventListener("visibilitychange", () => {
  state.pageVisible = document.visibilityState === "visible";
});

window.addEventListener("resize", resizeCanvas);

/* =============================================================
   MEMORY STARS — layout, scatter & heart-shape target positions
   ============================================================= */
let starEls = [];

/** Deterministic-ish scatter so stars aren't stacked, but still feel random. */
function buildScatterPositions(n) {
  const positions = [];
  const cols = Math.ceil(Math.sqrt(n * 1.6));
  const rows = Math.ceil(n / cols);
  const cellW = 100 / cols;
  const cellH = 70 / rows; // keep within upper 70% so stars avoid the bottom hint area
  let i = 0;
  for (let r = 0; r < rows && i < n; r++) {
    for (let c = 0; c < cols && i < n; c++) {
      const jitterX = (Math.random() - 0.5) * cellW * 0.7;
      const jitterY = (Math.random() - 0.5) * cellH * 0.7;
      const x = c * cellW + cellW / 2 + jitterX;
      const y = 10 + r * cellH + cellH / 2 + jitterY;
      positions.push({ x: Math.max(6, Math.min(94, x)), y: Math.max(10, Math.min(84, y)) });
      i++;
    }
  }
  // shuffle so the visual order doesn't match the discovery/heart order
  for (let k = positions.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [positions[k], positions[j]] = [positions[j], positions[k]];
  }
  return positions;
}

/** Parametric heart curve sampled into n evenly-spaced points, as percentages. */
function buildHeartPositions(n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const tt = (i / n) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(tt), 3);
    const y = 13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt);
    pts.push({ x, y });
  }
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return pts.map(p => ({
    x: 26 + ((p.x - minX) / (maxX - minX)) * 48,   // horizontal band: 26%–74%
    y: 16 + ((maxY - p.y) / (maxY - minY)) * 52,    // vertical band: 16%–68%
  }));
}

const scatterPositions = buildScatterPositions(MEMORIES.length);
const heartPositions = buildHeartPositions(MEMORIES.length);

function layoutMemoryStars() {
  starEls.forEach((el, i) => {
    const pos = state.foundMemories.size === MEMORIES.length && state.scene === "sky" && state.constellationActive
      ? heartPositions[i]
      : scatterPositions[i];
    el.style.left = pos.x + "%";
    el.style.top = pos.y + "%";
  });
}

function buildMemoryStars() {
  els.starsLayer.innerHTML = "";
  starEls = MEMORIES.map((memory, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "memory-star";
    btn.setAttribute("aria-label", `Memory star: ${memory.title}`);
    btn.style.left = scatterPositions[i].x + "%";
    btn.style.top = scatterPositions[i].y + "%";
    btn.addEventListener("click", () => openMemory(i, btn));
    els.starsLayer.appendChild(btn);
    return btn;
  });
}

/* =============================================================
   MEMORY MODAL
   ============================================================= */
let lastFocusedEl = null;

function openMemory(index, btn) {
  const memory = MEMORIES[index];
  btn.classList.add("is-opening");
  window.setTimeout(() => btn.classList.remove("is-opening"), 350);

  if (!state.foundMemories.has(index)) {
    state.foundMemories.add(index);
    btn.classList.add("is-found");
    updateProgress();
  }

  lastFocusedEl = document.activeElement;
  els.modalTitle.textContent = memory.title;
  els.modalImage.src = memory.image;
  els.modalImage.alt = memory.title;
  els.modalImage.onerror = () => { els.modalImage.style.display = "none"; };
  els.modalImage.onload = () => { els.modalImage.style.display = "block"; };
  els.modalMessage.textContent = memory.message;
  els.modal.hidden = false;
  els.modal.querySelector(".modal-close").focus();

  document.addEventListener("keydown", onModalKeydown);
}

function closeMemory() {
  els.modal.hidden = true;
  document.removeEventListener("keydown", onModalKeydown);
  if (lastFocusedEl) lastFocusedEl.focus();

  // If that was the last memory, move on to the constellation reveal
  if (state.foundMemories.size === MEMORIES.length && !state.constellationTriggered) {
    state.constellationTriggered = true;
    window.setTimeout(startConstellationSequence, 500);
  }
}

function onModalKeydown(e) {
  if (e.key === "Escape") closeMemory();
}

document.querySelectorAll("[data-close-modal]").forEach(el => {
  el.addEventListener("click", closeMemory);
});

function updateProgress() {
  els.progressCount.textContent = state.foundMemories.size;
  if (state.foundMemories.size > 0) {
    els.skyHint.classList.add("is-hidden");
  }
}

/* =============================================================
   CONSTELLATION SEQUENCE (Scene 4)
   ============================================================= */
function startConstellationSequence() {
  state.constellationActive = true;
  layoutMemoryStars(); // animates stars from scatter -> heart via CSS transition

  window.setTimeout(() => {
    showCenterMessage("You found them all&hellip; but there's one more surprise.", () => {
      window.setTimeout(() => {
        hideCenterMessage();
        drawConstellationLines(true);
        window.setTimeout(() => {
          showCenterMessage("Every star holds a memory.", () => {
            window.setTimeout(() => {
              showCenterMessage("And every memory reminds me how lucky I am to have you as my sister. ❤️", () => {
                window.setTimeout(goToWish, 3200);
              });
            }, 2600);
          });
        }, 2200);
      }, 2600);
    });
  }, 1900);
}

function showCenterMessage(html, onShown) {
  els.constellationMessage.hidden = false;
  els.constellationMessage.innerHTML = `<p>${html}</p>`;
  if (onShown) window.setTimeout(onShown, state.reducedMotion ? 900 : 2200);
}
function hideCenterMessage() {
  els.constellationMessage.hidden = true;
  els.constellationMessage.innerHTML = "";
}

function drawConstellationLines(animate) {
  const svg = els.constellationSvg;
  svg.innerHTML = "";
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5E7CFF"/>
      <stop offset="50%" stop-color="#A98BFF"/>
      <stop offset="100%" stop-color="#FF8BD8"/>
    </linearGradient>`;
  svg.appendChild(defs);

  const points = heartPositions.map(p => ({ x: (p.x / 100) * width, y: (p.y / 100) * height }));
  let d = `M ${points[0].x} ${points[0].y} `;
  points.slice(1).forEach(p => { d += `L ${p.x} ${p.y} `; });
  d += `Z`;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("class", "constellation-line");
  svg.appendChild(path);

  if (animate && !state.reducedMotion) {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.getBoundingClientRect(); // force reflow
    path.style.transition = "stroke-dashoffset 2.2s ease-in-out";
    requestAnimationFrame(() => { path.style.strokeDashoffset = "0"; });
  }
}

/* =============================================================
   SCENE 5 — MAKE A WISH
   ============================================================= */
function goToWish() {
  goToScene("wish");
}

els.candleBtn.addEventListener("click", blowCandle);
els.candleBtn.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); blowCandle(); }
});

let candleBlown = false;
function blowCandle() {
  if (candleBlown) return;
  candleBlown = true;
  els.candleBtn.classList.add("is-blown");
  mode = "dark";

  window.setTimeout(() => {
    goToScene("final");
    mode = "fireworks";
    fireworkParticles = [];
    // seed a couple of immediate bursts for a satisfying start
    spawnFirework(width * 0.3, height * 0.3);
    window.setTimeout(() => spawnFirework(width * 0.7, height * 0.35), 350);
    window.setTimeout(() => spawnFirework(width * 0.5, height * 0.22), 700);
  }, 1400);
}

/* =============================================================
   MUSIC CONTROLS
   ============================================================= */
function initMusic() {
  if (!CONFIG.musicEnabled) return;
  els.musicControls.hidden = false;
  els.audio.volume = parseFloat(els.volumeSlider.value);

  els.musicToggle.addEventListener("click", () => {
    if (els.audio.paused) {
      els.audio.play().catch(() => { /* file missing or blocked — fail silently */ });
      els.musicIcon.textContent = "❚❚";
      els.musicToggle.setAttribute("aria-pressed", "true");
      els.musicToggle.setAttribute("aria-label", "Pause music");
    } else {
      els.audio.pause();
      els.musicIcon.textContent = "♪";
      els.musicToggle.setAttribute("aria-pressed", "false");
      els.musicToggle.setAttribute("aria-label", "Play music");
    }
  });

  els.volumeSlider.addEventListener("input", () => {
    els.audio.volume = parseFloat(els.volumeSlider.value);
  });

  els.audio.addEventListener("error", () => {
    // No music file provided — hide controls gracefully, no crash.
    els.musicControls.hidden = true;
  });
}

function tryStartMusic() {
  if (!CONFIG.musicEnabled) return;
  els.audio.play()
    .then(() => {
      els.musicIcon.textContent = "❚❚";
      els.musicToggle.setAttribute("aria-pressed", "true");
      els.musicToggle.setAttribute("aria-label", "Pause music");
    })
    .catch(() => { /* autoplay blocked or file missing — user can press play manually */ });
}

/* =============================================================
   ENTRY POINT
   ============================================================= */
els.enterBtn.addEventListener("click", () => {
  goToScene("sky");
  mode = "sky";
  tryStartMusic();
});

function init() {
  applyConfig();
  resizeCanvas();
  buildMemoryStars();
  initMusic();
  tick();
}

init();
