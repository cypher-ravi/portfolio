// The same particle field drawn with the plain 2D canvas, for browsers where WebGL is off
// (for example Chrome with graphics acceleration disabled). Fewer particles, same shapes,
// same poses, same cursor scatter, click burst and drag. It has the same interface as createField.

import { SCENES, WIDE, NARROW, PALETTE, MODEL_H, MODEL_W } from './field.js';
import { sphere, text, cards, brain } from './scenes/shapes.js';

const KEYS = ['x', 'y', 's', 'o'];
const smooth = (t) => t * t * (3 - 2 * t);
const FOV_T = Math.tan((30 * Math.PI) / 360); // matches the WebGL camera (30° fov)
const DIST = 26;
const BUCKETS = 10; // colours per frame, so the canvas state changes rarely

const rgb = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];

/**
 * @param {{ canvas: HTMLCanvasElement, reducedMotion: boolean, font: string }} o
 */
export function createField2D(o) {
  const { canvas } = o;
  const still = o.reducedMotion;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('2D canvas unavailable');

  const N = innerWidth < 700 ? 1800 : 3200;
  const targets = [
    sphere(N),
    text(N, '</>', `700 190px ${o.font}`, 4.4),
    cards(N),
    brain(N),
    text(N, '@', `700 250px ${o.font}`, 4.6),
  ];
  const seed = new Float32Array(N).map(() => Math.random());
  const pos = new Float32Array(targets[0]);
  const off = new Float32Array(N * 3);
  const sx = new Float32Array(N), sy = new Float32Array(N), ss = new Float32Array(N), sb = new Uint8Array(N);
  const colA = rgb(PALETTE[0][0]), colB = rgb(PALETTE[0][1]);

  let w = 1, h = 1, dpr = 1, narrow = false, halfW = 1, halfH = 1, base = 1;
  const pose = { ...WIDE.hero, o: 0 };
  const view = { scene: 0, p: 0, blend: 0 };
  let rotY = 0, rotX = 0, vel = 0, drag = null, hovering = false, pointerIn = false;
  let lean = { x: 0, y: 0 };

  function resize() {
    w = canvas.clientWidth || innerWidth; h = canvas.clientHeight || innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    narrow = w / h < 0.85;
    halfH = FOV_T * DIST;
    halfW = halfH * (w / h);
    base = Math.min((1.1 * halfH) / MODEL_H, ((narrow ? 1.7 : 0.8) * halfW) / MODEL_W);
  }

  // Pointer position on the shape's own plane, or null when it is off the shape.
  function local(x, y) {
    if (pose.o < 0.5) return null;
    const wx = ((x / w) * 2 - 1) * halfW, wy = (1 - (y / h) * 2) * halfH;
    const sc = base * pose.s;
    const lx = (wx - pose.x * halfW) / sc, ly = (wy - pose.y * halfH) / sc / Math.max(0.3, Math.cos(rotX));
    return Math.hypot(lx, ly) < 2.3 ? { x: lx, y: ly } : null;
  }
  const skip = (t) => t instanceof Element && !!t.closest('a, button, input, textarea, select, dialog, label, .card, [data-no-field]');

  addEventListener('pointermove', (e) => {
    lean = { x: (e.clientX / innerWidth) * 2 - 1, y: (e.clientY / innerHeight) * 2 - 1 };
    pointerIn = true;
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x;
      drag.x = e.clientX; drag.moved += Math.abs(dx);
      rotY += dx * 0.008;
      vel = dx * 0.48;
    }
  }, { passive: true });
  document.addEventListener('pointerleave', () => (pointerIn = false));
  addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || skip(e.target) || !local(e.clientX, e.clientY)) return;
    drag = { id: e.pointerId, x: e.clientX, moved: 0, touch: e.pointerType === 'touch', t: performance.now() };
    if (!drag.touch) { e.preventDefault(); document.documentElement.classList.add('field-drag'); }
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.moved < 6 && performance.now() - drag.t < 400 && !still) burst();
    if (drag.touch) vel = 0;
    drag = null;
    document.documentElement.classList.remove('field-drag');
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  function burst(strength = 1) {
    for (let i = 0; i < N; i++) {
      const j = i * 3, L = Math.hypot(pos[j], pos[j + 1], pos[j + 2]) || 1, f = (0.6 + seed[i] * 1.6) * strength;
      off[j] += (pos[j] / L) * f; off[j + 1] += (pos[j + 1] / L) * f; off[j + 2] += (pos[j + 2] / L) * f;
    }
    request();
  }

  function target() {
    const K = narrow ? NARROW : WIDE;
    const a = K[SCENES[view.scene]], b = K[SCENES[Math.min(SCENES.length - 1, view.scene + 1)]];
    const f = smooth(view.blend), t = {};
    for (const k of KEYS) t[k] = a[k] + (b[k] - a[k]) * f;
    return t;
  }

  let running = false, visible = true, raf = 0, last = 0;

  function frame(ms) {
    raf = 0;
    const time = still ? 0 : ms / 1000;
    const dt = still ? 1 : Math.min(0.05, last ? (ms - last) / 1000 : 0.016);
    last = ms;

    const t = target();
    const ease = still ? 1 : Math.min(1, dt * 3);
    for (const k of KEYS) pose[k] += (t[k] - pose[k]) * ease;
    canvas.style.opacity = pose.o.toFixed(3);
    const pScale = Math.min(1.3, Math.max(0.7, innerHeight / 850)) * (0.7 + 0.3 * pose.s);

    const shape = Math.min(SCENES.length - 1, view.scene + (view.blend > 0.5 ? 1 : 0));
    const k = still ? 1 : Math.min(1, dt * 3.2);
    const pa = rgb(PALETTE[shape][0]), pb = rgb(PALETTE[shape][1]);
    for (let c = 0; c < 3; c++) { colA[c] += (pa[c] - colA[c]) * k; colB[c] += (pb[c] - colB[c]) * k; }

    const flat = shape === 1 || shape === 4;
    if (!drag) { vel *= Math.pow(0.05, dt); rotY += vel * dt; }
    if (flat) rotY += (Math.round(rotY / (Math.PI * 2)) * Math.PI * 2 - rotY) * Math.min(1, dt * 1.5);
    const ry = rotY + (still ? 0 : flat ? Math.sin(time * 0.5) * 0.22 : time * 0.22);
    const tilt = shape === 3 ? 0.45 : 0;
    rotX += (tilt + lean.y * 0.12 - rotX) * (still ? 1 : Math.min(1, dt * 2));

    const hp = pointerIn && !still ? local((lean.x + 1) * innerWidth / 2, (lean.y + 1) * innerHeight / 2) : null;
    const hx = hp ? hp.x : 99, hy = hp ? hp.y : 99;
    const relax = still ? 0 : Math.pow(0.08, dt);
    const cy = Math.cos(ry), sy_ = Math.sin(ry), cx = Math.cos(rotX), sx_ = Math.sin(rotX);
    const sc = base * pose.s, tx = pose.x * halfW, ty = pose.y * halfH;
    const toPx = h / 2 / (FOV_T); // screen pixels per unit of x/depth
    const tgt = targets[shape];

    for (let i = 0; i < N; i++) {
      const j = i * 3, sp = still ? 1 : k * (0.45 + seed[i] * 0.9);
      const wob = still ? 0 : 0.025 * Math.sin(time * 1.3 + seed[i] * 40);
      pos[j] += (tgt[j] + wob - pos[j]) * sp;
      pos[j + 1] += (tgt[j + 1] + wob - pos[j + 1]) * sp;
      pos[j + 2] += (tgt[j + 2] - pos[j + 2]) * sp;
      const dx = pos[j] + off[j] - hx, dy = pos[j + 1] + off[j + 1] - hy, d2 = dx * dx + dy * dy;
      if (d2 < 0.45) {
        const f = (1 - d2 / 0.45) * 0.09, d = Math.sqrt(d2) || 1;
        off[j] += (dx / d) * f; off[j + 1] += (dy / d) * f; off[j + 2] += (seed[i] - 0.5) * f;
      }
      off[j] *= relax; off[j + 1] *= relax; off[j + 2] *= relax;

      // Local point, turned (y then x), scaled and placed, then projected like the WebGL camera.
      const px = pos[j] + off[j], py = pos[j + 1] + off[j + 1], pz = pos[j + 2] + off[j + 2];
      const x1 = px * cy + pz * sy_, z1 = -px * sy_ + pz * cy;
      const y2 = py * cx - z1 * sx_, z2 = py * sx_ + z1 * cx;
      const X = x1 * sc + tx, Y = y2 * sc + ty, Z = z2 * sc;
      const depth = Math.max(1, DIST - Z);
      sx[i] = w / 2 + (X / depth) * toPx;
      sy[i] = h / 2 - (Y / depth) * toPx;
      ss[i] = (1.5 + seed[i] * 1.7) * pScale * (DIST / depth) * 0.8;
      sb[i] = Math.max(0, Math.min(BUCKETS - 1, Math.floor(Math.min(1, Math.max(0, py * 0.3 + 0.5 + (seed[i] - 0.5) * 0.4)) * BUCKETS)));
    }

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.75;
    for (let b = 0; b < BUCKETS; b++) {
      const m = (b + 0.5) / BUCKETS;
      g.fillStyle = `rgb(${colA[0] + (colB[0] - colA[0]) * m | 0},${colA[1] + (colB[1] - colA[1]) * m | 0},${colA[2] + (colB[2] - colA[2]) * m | 0})`;
      for (let i = 0; i < N; i++) {
        if (sb[i] !== b) continue;
        const s = ss[i];
        g.fillRect(sx[i] - s / 2, sy[i] - s / 2, s, s);
      }
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;

    const over = !!hp;
    if (over !== hovering) { hovering = over; document.documentElement.classList.toggle('field-hover', over); }
    if (running && visible && !still) raf = requestAnimationFrame(frame);
  }

  function request() { if (!raf) raf = requestAnimationFrame(frame); }

  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
    if (visible) { last = 0; request(); }
  });

  resize();
  return {
    resize() { resize(); request(); },
    setView(sceneIndex, p, blend) {
      view.scene = sceneIndex; view.p = p; view.blend = blend;
      if (still) request();
    },
    burst(strength = 0.6) { if (!still) burst(strength); },
    draw: request,
    start() { if (running) return; running = true; request(); },
  };
}
