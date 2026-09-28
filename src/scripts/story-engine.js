// The opening story, drawn with Three.js: life and technology, grown together.
//   0 Seed    – rising motes of light, and the tree of life growing from seed to now
//   1 Mind   – a connectome: neurons shaped like a brain, firing thoughts; it breathes 4s in / 4s out (psychology, mental health)
//   2 Growth – a tree of life that grows with the career as you scroll, leaves glowing as they open (life as a force of nature)
//   3 Connect – the motes gather into one beam reaching toward the visitor
// Framework-free: pass in THREE so the site (npm) and demos (CDN) share this file.

import { createConnectome } from './scenes/connectome.js';
import { createTree } from './scenes/tree.js';

export const ACTS = ['Seed', 'Mind', 'Growth', 'Connect'];
const COLORS = [0x7fe0c8, 0xb7a8ff, 0x9fe3a8, 0xffc46b];

const rand = (a, b) => a + Math.random() * (b - a);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Box-style breathing: 4 s in, 4 s out. Returns -1..1 and the current phase. */
export function breath(seconds) {
  const a = (seconds / 8) * Math.PI * 2 - Math.PI / 2;
  return { v: Math.sin(a), phase: Math.cos(a) > 0 ? 'Breathe in' : 'Breathe out' };
}

function buildShapes(N) {
  const seedField = new Float32Array(N * 3);
  const drift = new Float32Array(N * 3); // Mind and Growth: motes pull back so the scenes stand out
  const reply = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const j = i * 3;
    seedField[j] = rand(-80, 80); seedField[j + 1] = rand(-50, 50); seedField[j + 2] = rand(-60, 0);
    drift[j] = seedField[j] * 1.3; drift[j + 1] = seedField[j + 1] * 1.3; drift[j + 2] = seedField[j + 2] - 40;
    const t = Math.random(), br = Math.pow(Math.random(), 3) * 1.4 * (1 - t * 0.6), ba = Math.random() * Math.PI * 2;
    reply[j] = Math.cos(ba) * br; reply[j + 1] = Math.sin(ba) * br; reply[j + 2] = -80 + t * 120;
  }
  return [seedField, drift, drift, reply];
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

  // Mind: the connectome. Growth: the tree of life. Both lighter on phones.
  const brain = createConnectome(THREE, glow, { count: small ? 600 : 900 });
  const tree = createTree(THREE, { depth: small ? 7 : 8, leavesPerTip: 1 });
  scene.add(brain.group, tree.group);
  canvas.addEventListener('pointerdown', () => brain.think());
  if (o.reducedMotion) brain.still();

  let current = 0, running = false, visible = true, lastMs = 0, spin = 0, startMs = -1;
  let treeSpots = { hero: [0, 0, 1], growth: [0, 0, 1] };

  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const narrow = w / h < 0.8;
    // Scenes sit opposite their captions: Mind's caption is on the right, Growth's on the left.
    brain.group.position.set(narrow ? 0 : -21, narrow ? 16 : 3, 0);
    brain.group.scale.setScalar(narrow ? 13 : 15);
    // The tree appears twice: beside the headline in the hero (above it on phones),
    // and opposite the caption in Growth.
    treeSpots = narrow
      ? { hero: [0, 13, 4], growth: [0, -6, 6.2] }
      : { hero: [22, -18, 7], growth: [20, -20, 7.2] };
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

    // Story particles: motes of light that rise slowly like pollen (or data), pull back for
    // Mind and Growth, then gather into the beam.
    const b = breath(time);
    const wob = still ? 0 : 0.2 + Math.sin(f * Math.PI) * 2.2;
    const rise = still ? 0 : 1 - Math.min(1, Math.max(0, current - 2));
    for (let k = 0; k < N; k++) {
      const j = k * 3, s = seed[k];
      pos[j] = A[j] + (B[j] - A[j]) * f + Math.sin(time * 1.3 + s) * wob * 0.35;
      pos[j + 1] = A[j + 1] + (B[j + 1] - A[j + 1]) * f + Math.cos(time * 1.1 + s * 1.7) * wob * 0.35
        + (((time * 1.1 + s * 7) % 24) - 12) * rise;
      pos[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * f;
    }
    geo.attributes.position.needsUpdate = true;
    mat.color.copy(palette[i]).lerp(palette[i + 1], f);
    const scenes = Math.max(near(1), near(2));
    mat.opacity = (0.25 + 0.65 * Math.min(1, current)) * (1 - 0.6 * scenes);
    mat.size = 0.5 + Math.max(0, current - 2.2) * 0.4;

    // Mind: the connectome turns slowly and breathes with the 8-second cycle.
    const wBrain = Math.pow(near(1), 1.5);
    if (wBrain > 0.01 || !still) {
      spin += dt * 0.12;
      brain.group.rotation.set(0.15, 1.1 + spin, 0);
      brain.group.scale.setScalar((canvas.clientWidth / canvas.clientHeight < 0.8 ? 13 : 15) * (1 + 0.035 * b.v * wBrain));
      brain.update(wBrain > 0.01 ? dt : 0, wBrain);
    }

    // The tree of life. In the hero it grows from seed to now on its own when the page
    // opens; in Growth, scrolling grows it again from 2020, leaves glowing as they open.
    if (startMs < 0) startMs = ms;
    const intro = still ? 1 : Math.min(1, (ms - startMs) / 6000);
    const inHero = current < 1;
    const g = inHero ? intro : Math.min(1, Math.max(0, (current - 1.35) / 0.6));
    const spot = inHero ? treeSpots.hero : treeSpots.growth;
    tree.group.position.set(spot[0], spot[1], 0);
    tree.group.scale.setScalar(spot[2]);
    tree.group.rotation.y = 0.4 + time * 0.08;
    tree.update(g, time, Math.pow(inHero ? near(0) : near(2), 1.2));

    renderer.render(scene, camera);

    const act = Math.min(ACTS.length - 1, Math.round(current));
    const note = act === 1 && !still ? b.phase : act === 0 || act === 2 ? tree.chapter(g) : '';
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
