// The Signal: the opening story, drawn with Three.js.
//   0 Cosmos – a three-body system in a figure-eight orbit, among scattered stars (space tech)
//   1 Mind   – a connectome: neurons shaped like a brain, firing thoughts; it breathes 4s in / 4s out (psychology, mental health)
//   2 Growth – a tree of life that grows with the career as you scroll, leaves glowing as they open (life as a force of nature)
//   3 Reply  – the stars fold into one beam aimed at the visitor
// Framework-free: pass in THREE so the site (npm) and demos (CDN) share this file.

import { createConnectome } from './scenes/connectome.js';
import { createTree } from './scenes/tree.js';

export const ACTS = ['Cosmos', 'Mind', 'Growth', 'Reply'];
const COLORS = [0x8fd3ff, 0xb7a8ff, 0x9fe3a8, 0xffc46b];
const BODY_COLORS = [0xffc46b, 0x8fd3ff, 0xff9d7a];

const rand = (a, b) => a + Math.random() * (b - a);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Box-style breathing: 4 s in, 4 s out. Returns -1..1 and the current phase. */
export function breath(seconds) {
  const a = (seconds / 8) * Math.PI * 2 - Math.PI / 2;
  return { v: Math.sin(a), phase: Math.cos(a) > 0 ? 'Breathe in' : 'Breathe out' };
}

/**
 * Three equal masses on the figure-eight orbit (Chenciner & Montgomery, 2000):
 * one of the few stable solutions to the three-body problem. Units: G = m = 1.
 * Integrated with velocity Verlet, which keeps the orbit from drifting.
 */
export function createThreeBody() {
  const p = [[-0.97000436, 0.24308753], [0.97000436, -0.24308753], [0, 0]];
  const v3 = [-0.93240737, -0.86473146];
  const v = [[-v3[0] / 2, -v3[1] / 2], [-v3[0] / 2, -v3[1] / 2], [v3[0], v3[1]]];

  function accel() {
    const a = [[0, 0], [0, 0], [0, 0]];
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      const dx = p[j][0] - p[i][0], dy = p[j][1] - p[i][1];
      const r2 = dx * dx + dy * dy + 1e-6, f = 1 / (r2 * Math.sqrt(r2));
      a[i][0] += dx * f; a[i][1] += dy * f;
      a[j][0] -= dx * f; a[j][1] -= dy * f;
    }
    return a;
  }

  let a = accel();
  return {
    positions: p,
    step(dt) {
      for (let i = 0; i < 3; i++) {
        v[i][0] += 0.5 * dt * a[i][0]; v[i][1] += 0.5 * dt * a[i][1];
        p[i][0] += dt * v[i][0]; p[i][1] += dt * v[i][1];
      }
      a = accel();
      for (let i = 0; i < 3; i++) { v[i][0] += 0.5 * dt * a[i][0]; v[i][1] += 0.5 * dt * a[i][1]; }
    },
  };
}

function buildShapes(N) {
  const cosmos = new Float32Array(N * 3);
  const drift = new Float32Array(N * 3); // Mind and Growth: stars pull back so the scenes stand out
  const reply = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const j = i * 3;
    cosmos[j] = rand(-80, 80); cosmos[j + 1] = rand(-50, 50); cosmos[j + 2] = rand(-60, 0);
    drift[j] = cosmos[j] * 1.3; drift[j + 1] = cosmos[j + 1] * 1.3; drift[j + 2] = cosmos[j + 2] - 40;
    const t = Math.random(), br = Math.pow(Math.random(), 3) * 1.4 * (1 - t * 0.6), ba = Math.random() * Math.PI * 2;
    reply[j] = Math.cos(ba) * br; reply[j + 1] = Math.sin(ba) * br; reply[j + 2] = -80 + t * 120;
  }
  return [cosmos, drift, drift, reply];
}

function glowTexture(THREE) {
  const sc = document.createElement('canvas');
  sc.width = sc.height = 64;
  const sg = sc.getContext('2d'), grad = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,.55)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  sg.fillStyle = grad; sg.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(sc);
}

/**
 * @param {{ THREE: any, canvas: HTMLCanvasElement, reducedMotion: boolean,
 *           getProgress: () => number, onFrame?: (info: { act: number, note: string }) => void }} o
 */
export function createStory(o) {
  const { THREE, canvas } = o;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x05070a, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  const glow = glowTexture(THREE);

  // Story particles.
  const small = window.innerWidth < 700;
  const N = small ? 2500 : 5000;
  const shapes = buildShapes(N);
  const pos = new Float32Array(shapes[0]);
  const seed = new Float32Array(N).map(() => Math.random() * 1000);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ size: 0.5, map: glow, color: COLORS[0], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 });
  scene.add(new THREE.Points(geo, mat));
  const palette = COLORS.map((c) => new THREE.Color(c));

  // Three-body system: three suns and their fading trails.
  const sim = createThreeBody();
  const system = new THREE.Group();
  scene.add(system);
  const TRAIL = 420;
  const suns = [], trails = [];
  for (let b = 0; b < 3; b++) {
    const color = new THREE.Color(BODY_COLORS[b]);
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sun.scale.set(3.2, 3.2, 1);
    system.add(sun);
    suns.push(sun);

    const tp = new Float32Array(TRAIL * 3), tc = new Float32Array(TRAIL * 3);
    for (let k = 0; k < TRAIL; k++) {
      const fade = Math.pow(k / (TRAIL - 1), 1.6); // newest point (end) is brightest
      tc[k * 3] = color.r * fade; tc[k * 3 + 1] = color.g * fade; tc[k * 3 + 2] = color.b * fade;
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
    tg.setAttribute('color', new THREE.BufferAttribute(tc, 3));
    const line = new THREE.Line(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    system.add(line);
    trails.push(tp);
  }
  const ORBIT_SCALE = 11;
  const pushTrail = () => {
    for (let b = 0; b < 3; b++) {
      const tp = trails[b];
      tp.copyWithin(0, 3);
      tp[TRAIL * 3 - 3] = sim.positions[b][0] * ORBIT_SCALE;
      tp[TRAIL * 3 - 2] = sim.positions[b][1] * ORBIT_SCALE;
      tp[TRAIL * 3 - 1] = 0;
    }
  };
  // Pre-roll so the trails are full on the first frame, which is also the reduced-motion still.
  for (let k = 0; k < TRAIL; k++) { for (let s = 0; s < 3; s++) sim.step(0.0015); pushTrail(); }

  // Mind: the connectome. Growth: the tree of life. Both lighter on phones.
  const brain = createConnectome(THREE, glow, { count: small ? 600 : 900 });
  const tree = createTree(THREE, { depth: small ? 7 : 8, leavesPerTip: 1 });
  scene.add(brain.group, tree.group);
  canvas.addEventListener('pointerdown', () => brain.think());
  if (o.reducedMotion) brain.still();

  let current = 0, running = false, visible = true, lastMs = 0, spin = 0;

  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const narrow = w / h < 0.8;
    // Beside the headline on wide screens, above it on phones.
    system.position.set(narrow ? 0 : 23, narrow ? 24 : 1, 0);
    system.scale.setScalar(narrow ? 0.9 : 1.3);
    // Scenes sit opposite their captions: Mind's caption is on the right, Growth's on the left.
    brain.group.position.set(narrow ? 0 : -21, narrow ? 16 : 3, 0);
    brain.group.scale.setScalar(narrow ? 13 : 15);
    tree.group.position.set(narrow ? 0 : 20, narrow ? -6 : -20, 0);
    tree.group.scale.setScalar(narrow ? 6.2 : 7.2);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 0, w / h < 0.8 ? 95 : 60);
    camera.updateProjectionMatrix();
    layout();
  }

  function frame(ms) {
    const still = o.reducedMotion;
    const target = o.getProgress() * (shapes.length - 1);
    current += (target - current) * (still ? 1 : 0.08);
    const i = Math.min(shapes.length - 2, Math.floor(current));
    const f = ease(Math.min(1, Math.max(0, current - i)));
    const A = shapes[i], B = shapes[i + 1];
    const time = still ? 0 : ms * 0.001;
    const dt = still ? 0 : Math.min(0.05, lastMs ? (ms - lastMs) / 1000 : 0);
    lastMs = ms;
    const near = (k) => Math.max(0, 1 - Math.abs(current - k));

    // Three-body: advance the orbit and fade it out as the story moves on.
    if (!still) { for (let s = 0; s < 8; s++) sim.step(0.0015); pushTrail(); }
    for (let b = 0; b < 3; b++) {
      suns[b].position.set(sim.positions[b][0] * ORBIT_SCALE, sim.positions[b][1] * ORBIT_SCALE, 0);
      system.children[b * 2 + 1].geometry.attributes.position.needsUpdate = true;
    }
    const sysAlpha = Math.max(0, 1 - current * 1.6);
    system.visible = sysAlpha > 0.01;
    system.children.forEach((c) => { c.material.opacity = sysAlpha; });

    // Story particles: stars that pull back for Mind and Growth, then fold into the reply beam.
    const b = breath(time);
    const wob = still ? 0 : 0.2 + Math.sin(f * Math.PI) * 2.2;
    for (let k = 0; k < N; k++) {
      const j = k * 3, s = seed[k];
      pos[j] = A[j] + (B[j] - A[j]) * f + Math.sin(time * 1.3 + s) * wob * 0.35;
      pos[j + 1] = A[j + 1] + (B[j + 1] - A[j + 1]) * f + Math.cos(time * 1.1 + s * 1.7) * wob * 0.35;
      pos[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * f;
    }
    geo.attributes.position.needsUpdate = true;
    mat.color.copy(palette[i]).lerp(palette[i + 1], f);
    const scenes = Math.max(near(1), near(2));
    mat.opacity = (0.45 + 0.45 * Math.min(1, current)) * (1 - 0.6 * scenes);
    mat.size = 0.5 + Math.max(0, current - 2.2) * 0.4;

    // Mind: the connectome turns slowly and breathes with the 8-second cycle.
    const wBrain = Math.pow(near(1), 1.5);
    if (wBrain > 0.01 || !still) {
      spin += dt * 0.12;
      brain.group.rotation.set(0.15, 1.1 + spin, 0);
      brain.group.scale.setScalar((canvas.clientWidth / canvas.clientHeight < 0.8 ? 13 : 15) * (1 + 0.035 * b.v * wBrain));
      brain.update(wBrain > 0.01 ? dt : 0, wBrain);
    }

    // Growth: scrolling grows the tree from 2020 to now; leaves glow as they open.
    const wTree = Math.pow(near(2), 1.2);
    const g = Math.min(1, Math.max(0, (current - 1.35) / 0.6));
    tree.group.rotation.y = 0.4 + time * 0.08;
    tree.update(g, time, wTree);

    renderer.render(scene, camera);

    const act = Math.min(ACTS.length - 1, Math.round(current));
    const note = act === 1 && !still ? b.phase : act === 2 ? tree.chapter(g) : '';
    o.onFrame?.({ act, note });
    if (running && visible && !still) requestAnimationFrame(frame);
  }

  resize();
  return {
    resize() { resize(); requestAnimationFrame(frame); },
    setVisible(v) { const was = visible; visible = v; if (v && !was && running) requestAnimationFrame(frame); },
    /** For reduced motion: draw once per scroll instead of looping. */
    draw() { requestAnimationFrame(frame); },
    start() { if (running) return; running = true; requestAnimationFrame(frame); },
  };
}
