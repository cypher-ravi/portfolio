// The garden: one bonsai that follows the reader down the page.
// The page tells it which scene is in view; it eases between the poses below, grows with the
// career in Experience, turns when dragged, sways toward the cursor, and drops leaves when tapped.
// Framework-free: pass in THREE (the site passes the trimmed build in three-lite.ts).

import { createBonsai } from './scenes/bonsai.js';

export const SCENES = ['hero', 'experience', 'projects', 'ai', 'contact'];

// Pose per scene: x, y as fractions of the half-view (+x right, +y up), s scale, o opacity.
const WIDE = {
  hero: { x: 0.5, y: -0.04, s: 1, o: 1 },
  experience: { x: -0.56, y: 0.02, s: 0.78, o: 1 },
  projects: { x: 0.8, y: -0.68, s: 0.32, o: 0.45 },
  ai: { x: 0.56, y: -0.04, s: 0.95, o: 1 },
  contact: { x: 0.52, y: -0.02, s: 1, o: 1 },
};
const NARROW = {
  hero: { x: 0, y: 0.36, s: 0.72, o: 1 },
  experience: { x: 0.35, y: 0.1, s: 0.8, o: 0.12 },
  projects: { x: 0.35, y: 0.3, s: 0.6, o: 0.08 },
  ai: { x: 0.35, y: 0.1, s: 0.8, o: 0.12 },
  contact: { x: 0, y: 0.4, s: 0.55, o: 0.9 },
};
const KEYS = ['x', 'y', 's', 'o'];

const MODEL_H = 6.6, MODEL_W = 7, MODEL_MID = 2.3; // rough bounds of the bonsai, pot included
const clamp = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);

/**
 * @param {{ THREE: any, canvas: HTMLCanvasElement, reducedMotion: boolean,
 *           onChapter?: (label: string) => void }} o
 */
export function createGarden(o) {
  const { THREE, canvas } = o;
  const still = o.reducedMotion;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const DIST = 26;
  camera.position.set(0, 2.2, DIST);
  camera.lookAt(0, 0, 0);

  // Warm key from the upper left, a dark warm ground, and a cool rim so the silhouette reads on dark.
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x1a1512, 1.4));
  const key = new THREE.DirectionalLight(0xffe6c7, 2.4);
  key.position.set(-6, 10, 8);
  const rim = new THREE.DirectionalLight(0x9fc0d8, 1.6);
  rim.position.set(6, 4, -10);
  scene.add(key, rim);

  const bonsai = createBonsai(THREE);
  const spin = new THREE.Group(); // drag and idle rotation
  const holder = new THREE.Group(); // scroll pose and sway
  bonsai.group.position.y = -MODEL_MID;
  spin.add(bonsai.group);
  holder.add(spin);
  scene.add(holder);

  let narrow = false, halfW = 1, halfH = 1, base = 1;
  const pose = { ...WIDE.hero, o: 0 }; // fades in on the first frames
  const view = { scene: 0, p: 0, blend: 0 };

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    narrow = w / h < 0.85;
    halfH = Math.tan((camera.fov * Math.PI) / 360) * DIST;
    halfW = halfH * camera.aspect;
    base = Math.min((1.3 * halfH) / MODEL_H, (0.8 * halfW) / MODEL_W);
    if (narrow) base = Math.min((1.3 * halfH) / MODEL_H, (1.7 * halfW) / MODEL_W);
  }

  // Pointer: sway toward the cursor; drag (mouse/pen) to turn; tap the tree to drop leaves.
  const ndc = new THREE.Vector2(), ray = new THREE.Raycaster();
  let lean = { x: 0, y: 0 }, rotY = 0.5, vel = 0, drag = null, hoverCheck = false, hovering = false;
  const hit = (x, y) => {
    if (pose.o < 0.6) return null;
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(bonsai.targets, false)[0] ?? null;
  };
  const skip = (t) => t instanceof Element && !!t.closest('a, button, input, textarea, select, dialog, label, .card, [data-no-garden]');

  addEventListener('pointermove', (e) => {
    lean = { x: (e.clientX / innerWidth) * 2 - 1, y: (e.clientY / innerHeight) * 2 - 1 };
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x;
      drag.x = e.clientX; drag.moved += Math.abs(dx);
      rotY += dx * 0.008;
      vel = dx * 0.008 * 60;
    } else if (e.pointerType === 'mouse') hoverCheck = true;
  }, { passive: true });

  addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || skip(e.target)) return;
    const h = hit(e.clientX, e.clientY);
    if (!h) return;
    drag = { id: e.pointerId, x: e.clientX, moved: 0, at: h.point.clone(), touch: e.pointerType === 'touch', t: performance.now() };
    if (!drag.touch) { e.preventDefault(); document.documentElement.classList.add('garden-drag'); }
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const tap = drag.moved < 6 && performance.now() - drag.t < 400;
    if (tap && !still) bonsai.burst(bonsai.group.worldToLocal(drag.at), 9);
    if (drag.touch) vel = 0;
    drag = null;
    document.documentElement.classList.remove('garden-drag');
    if (still) draw();
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  let running = false, visible = true, raf = 0, last = 0, startMs = -1, growth = still ? 1 : 0;

  function target() {
    const K = narrow ? NARROW : WIDE;
    const a = K[SCENES[view.scene]], b = K[SCENES[Math.min(SCENES.length - 1, view.scene + 1)]];
    const f = smooth(view.blend);
    const t = {};
    for (const k of KEYS) t[k] = a[k] + (b[k] - a[k]) * f;
    return t;
  }

  function growthTarget(ms) {
    const intro = still ? 1 : clamp((ms - startMs) / 3400);
    const byScene = [smooth(intro), 0.1 + 0.9 * clamp((view.p - 0.04) / 0.82), 1, 1, 1];
    const a = byScene[view.scene], b = byScene[Math.min(4, view.scene + 1)];
    return a + (b - a) * smooth(view.blend);
  }

  function frame(ms) {
    raf = 0;
    if (startMs < 0) startMs = ms;
    const time = still ? 0 : ms / 1000;
    const dt = still ? 0 : Math.min(0.05, last ? (ms - last) / 1000 : 0);
    last = ms;

    const t = target();
    const ease = still ? 1 : Math.min(1, dt * 3.2);
    for (const k of KEYS) pose[k] += (t[k] - pose[k]) * ease;
    holder.position.set(pose.x * halfW, pose.y * halfH, 0);
    holder.scale.setScalar(base * pose.s);
    canvas.style.opacity = pose.o.toFixed(3);

    const gT = growthTarget(ms);
    growth += (gT - growth) * (still ? 1 : Math.min(1, dt * 2.4));

    if (!drag) {
      vel *= Math.pow(0.04, dt); // inertia after a drag
      rotY += (vel + (still ? 0 : 0.12)) * dt;
    }
    spin.rotation.y = rotY;
    const wind = still ? 0 : Math.sin(time * 0.7) * 0.015 + Math.sin(time * 1.9) * 0.006;
    holder.rotation.z += (-lean.x * 0.05 + wind - holder.rotation.z) * (still ? 1 : Math.min(1, dt * 2));
    holder.rotation.x += (lean.y * 0.04 - holder.rotation.x) * (still ? 1 : Math.min(1, dt * 2));

    bonsai.update(growth, time, dt);
    renderer.render(scene, camera);

    if (hoverCheck) {
      hoverCheck = false;
      const now = !!hit((lean.x + 1) * innerWidth / 2, (lean.y + 1) * innerHeight / 2);
      if (now !== hovering) { hovering = now; document.documentElement.classList.toggle('garden-hover', now); }
    }
    o.onChapter?.(bonsai.chapter(growth));
    if (running && visible && !still) raf = requestAnimationFrame(frame);
  }

  function draw() { if (!raf) raf = requestAnimationFrame(frame); }

  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
    if (visible) { last = 0; draw(); }
  });

  resize();
  return {
    resize() { resize(); draw(); },
    /** scene: index into SCENES; p: progress through it; blend: 0..1 toward the next scene. */
    setView(sceneIndex, p, blend) {
      view.scene = sceneIndex; view.p = p; view.blend = blend;
      if (still) draw();
    },
    burst(n = 10) { if (!still) bonsai.burst(null, n); },
    lightStone(i) { bonsai.lightStone(i); if (still) draw(); },
    draw,
    start() { if (running) return; running = true; draw(); },
  };
}
