// The Signal: one particle system that tells the story in five acts.
//   0 Cosmos  – scattered stars (space tech)
//   1 Pulse   – rings and an ECG trace beating at 60 bpm (healthcare)
//   2 Mind    – the name, breathing on a slow 4s-in / 4s-out cycle (psychology, mental health)
//   3 Growth  – a sunflower spiral with four projects in bloom (life as a force of nature)
//   4 Reply   – everything folds into one beam aimed at the visitor
// Framework-free: pass in THREE so the site (npm) and demos (CDN) share this file.

export const ACTS = ['Cosmos', 'Pulse', 'Mind', 'Growth', 'Reply'];
const COLORS = [0x8fd3ff, 0xff8a80, 0xb7a8ff, 0x9fe3a8, 0xffc46b];
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈137.5°, how sunflowers pack seeds

const rand = (a, b) => a + Math.random() * (b - a);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Lub-dub at 60 bpm: a strong beat, then a softer one 0.22 s later. Returns 0..1. */
export function heartbeat(seconds) {
  const t = seconds % 1;
  return Math.exp(-((t / 0.05) ** 2)) + 0.6 * Math.exp(-(((t - 0.22) / 0.05) ** 2));
}

/** Box-style breathing: 4 s in, 4 s out. Returns -1..1 and the current phase. */
export function breath(seconds) {
  const v = Math.sin((seconds / 8) * Math.PI * 2 - Math.PI / 2);
  return { v, phase: Math.cos((seconds / 8) * Math.PI * 2 - Math.PI / 2) > 0 ? 'Breathe in' : 'Breathe out' };
}

function ecgY(x) {
  // One heartbeat every 24 units: P wave, QRS spike, T wave.
  const u = (((x % 24) + 24) % 24) - 12;
  return 1.2 * Math.exp(-(((u + 6) / 1.2) ** 2)) - 1.5 * Math.exp(-(((u + 0.8) / 0.35) ** 2)) + 9 * Math.exp(-((u / 0.45) ** 2)) - 2.2 * Math.exp(-(((u - 0.9) / 0.4) ** 2)) + 2 * Math.exp(-(((u - 6) / 1.8) ** 2));
}

function buildShapes(N, word) {
  const cosmos = new Float32Array(N * 3);
  const pulse = new Float32Array(N * 3);
  const name = new Float32Array(N * 3);
  const growth = new Float32Array(N * 3);
  const reply = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    const j = i * 3;
    cosmos[j] = rand(-70, 70); cosmos[j + 1] = rand(-45, 45); cosmos[j + 2] = rand(-40, 20);

    if (i % 10 < 3) { // ECG trace across the screen
      const x = rand(-60, 60);
      pulse[j] = x; pulse[j + 1] = ecgY(x) - 16; pulse[j + 2] = rand(-0.3, 0.3);
    } else {
      const ring = i % 5, r = 4 + ring * 5 + rand(-0.25, 0.25), a = Math.random() * Math.PI * 2;
      pulse[j] = Math.cos(a) * r; pulse[j + 1] = Math.sin(a) * r + 6; pulse[j + 2] = rand(-0.5, 0.5) - ring * 0.8;
    }

    const t = Math.random(), br = Math.pow(Math.random(), 3) * 1.4 * (1 - t * 0.6), ba = Math.random() * Math.PI * 2;
    reply[j] = Math.cos(ba) * br; reply[j + 1] = Math.sin(ba) * br; reply[j + 2] = -80 + t * 120;
  }

  // Name: sample lit pixels from 2D text.
  const c = document.createElement('canvas'), W = 600, H = 180;
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '800 150px "Segoe UI", Arial, sans-serif';
  g.fillText(word, W / 2, H / 2);
  const d = g.getImageData(0, 0, W, H).data, pts = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
  for (let i = 0; i < N; i++) {
    const p = pts[(Math.random() * pts.length) | 0] || [W / 2, H / 2];
    name[i * 3] = (p[0] - W / 2) * 0.085 + rand(-0.15, 0.15);
    name[i * 3 + 1] = -(p[1] - H / 2) * 0.085 + 8 + rand(-0.15, 0.15);
    name[i * 3 + 2] = rand(-0.8, 0.8);
  }

  // Growth: a phyllotaxis disc, with four denser blooms for the projects.
  const blooms = [];
  const spiralCount = Math.floor(N * 0.78);
  for (let k = 0; k < spiralCount; k++) {
    const r = 0.62 * Math.sqrt(k * (1400 / spiralCount)), a = k * GOLDEN_ANGLE;
    growth[k * 3] = Math.cos(a) * r; growth[k * 3 + 1] = Math.sin(a) * r * 0.9 + 4; growth[k * 3 + 2] = -r * 0.25;
  }
  for (let b = 0; b < 4; b++) {
    const a = b * (Math.PI / 2) + 0.6, r = 15;
    blooms.push([Math.cos(a) * r, Math.sin(a) * r * 0.9 + 4, 3]);
  }
  for (let k = spiralCount; k < N; k++) {
    const bl = blooms[k % 4], r = Math.pow(Math.random(), 2) * 3, th = Math.random() * Math.PI * 2, ph = Math.acos(rand(-1, 1));
    growth[k * 3] = bl[0] + r * Math.sin(ph) * Math.cos(th);
    growth[k * 3 + 1] = bl[1] + r * Math.sin(ph) * Math.sin(th);
    growth[k * 3 + 2] = bl[2] + r * Math.cos(ph);
  }

  return [cosmos, pulse, name, growth, reply];
}

/**
 * @param {{ THREE: any, canvas: HTMLCanvasElement, word: string, reducedMotion: boolean,
 *           getProgress: () => number, onFrame?: (info: { act: number, breath: string }) => void }} o
 */
export function createStory(o) {
  const { THREE, canvas } = o;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x05070a, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

  const N = window.innerWidth < 700 ? 3000 : 6000;
  const shapes = buildShapes(N, o.word);
  const pos = new Float32Array(shapes[0]);
  const seed = new Float32Array(N).map(() => Math.random() * 1000);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const sc = document.createElement('canvas');
  sc.width = sc.height = 64;
  const sg = sc.getContext('2d'), grad = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,.55)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  sg.fillStyle = grad; sg.fillRect(0, 0, 64, 64);
  const mat = new THREE.PointsMaterial({ size: 0.55, map: new THREE.CanvasTexture(sc), color: COLORS[0], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  const palette = COLORS.map((c) => new THREE.Color(c));

  let current = 0, running = false, visible = true;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 0, w / h < 0.8 ? 95 : 60);
    camera.updateProjectionMatrix();
  }

  function frame(ms) {
    const still = o.reducedMotion;
    const target = o.getProgress() * (shapes.length - 1);
    current += (target - current) * (still ? 1 : 0.08);
    const i = Math.min(shapes.length - 2, Math.floor(current));
    const f = ease(Math.min(1, Math.max(0, current - i)));
    const A = shapes[i], B = shapes[i + 1];
    const time = still ? 0 : ms * 0.001;

    // Each act has its own rhythm, weighted by how close we are to it.
    const near = (k) => Math.max(0, 1 - Math.abs(current - k));
    const beat = heartbeat(time) * near(1);
    const b = breath(time);
    const scale = 1 + 0.07 * beat + 0.05 * b.v * near(2) + 0.02 * Math.sin(time * 0.6) * near(3);
    const wob = still ? 0 : 0.2 + Math.sin(f * Math.PI) * 2.2;

    for (let k = 0; k < N; k++) {
      const j = k * 3, s = seed[k];
      pos[j] = (A[j] + (B[j] - A[j]) * f) * scale + Math.sin(time * 1.3 + s) * wob * 0.35;
      pos[j + 1] = (A[j + 1] + (B[j + 1] - A[j + 1]) * f) * scale + Math.cos(time * 1.1 + s * 1.7) * wob * 0.35;
      pos[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * f;
    }
    geo.attributes.position.needsUpdate = true;

    points.rotation.y = Math.sin(time * 0.2) * 0.12;
    points.rotation.z = time * 0.05 * near(3); // the spiral turns slowly, like growth
    mat.color.copy(palette[i]).lerp(palette[i + 1], f);
    mat.size = 0.55 + 0.25 * beat + Math.max(0, current - 3.2) * 0.4;
    renderer.render(scene, camera);

    o.onFrame?.({ act: Math.min(ACTS.length - 1, Math.round(current)), breath: near(2) > 0.5 && !still ? b.phase : '' });
    if (running && visible && !still) requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  resize();
  return {
    resize() { resize(); requestAnimationFrame(frame); },
    setVisible(v) { const was = visible; visible = v; if (v && !was) requestAnimationFrame(frame); },
    /** For reduced motion: draw once per scroll instead of looping. */
    draw() { requestAnimationFrame(frame); },
    start,
  };
}
