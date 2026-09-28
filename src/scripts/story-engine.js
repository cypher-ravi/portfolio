// The Signal: the opening story, drawn with Three.js.
//   0 Cosmos – a three-body system in a figure-eight orbit, among scattered stars (space tech)
//   1 Mind   – the stars form the name and breathe on a 4s-in / 4s-out cycle (psychology, mental health)
//   2 Growth – a sunflower spiral with four projects in bloom (life as a force of nature)
//   3 Reply  – everything folds into one beam aimed at the visitor
// Framework-free: pass in THREE so the site (npm) and demos (CDN) share this file.

export const ACTS = ['Cosmos', 'Mind', 'Growth', 'Reply'];
const COLORS = [0x8fd3ff, 0xb7a8ff, 0x9fe3a8, 0xffc46b];
const BODY_COLORS = [0xffc46b, 0x8fd3ff, 0xff9d7a];
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈137.5°, how sunflowers pack seeds

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

function buildShapes(N, word) {
  const cosmos = new Float32Array(N * 3);
  const name = new Float32Array(N * 3);
  const growth = new Float32Array(N * 3);
  const reply = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    const j = i * 3;
    cosmos[j] = rand(-80, 80); cosmos[j + 1] = rand(-50, 50); cosmos[j + 2] = rand(-60, 0);
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
    const q = pts[(Math.random() * pts.length) | 0] || [W / 2, H / 2];
    name[i * 3] = (q[0] - W / 2) * 0.085 + rand(-0.15, 0.15);
    name[i * 3 + 1] = -(q[1] - H / 2) * 0.085 + 8 + rand(-0.15, 0.15);
    name[i * 3 + 2] = rand(-0.8, 0.8);
  }

  // Growth: a phyllotaxis disc, with four denser blooms for the projects.
  const spiralCount = Math.floor(N * 0.78);
  for (let k = 0; k < spiralCount; k++) {
    const r = 0.62 * Math.sqrt(k * (1400 / spiralCount)), ang = k * GOLDEN_ANGLE;
    growth[k * 3] = Math.cos(ang) * r; growth[k * 3 + 1] = Math.sin(ang) * r * 0.9 + 4; growth[k * 3 + 2] = -r * 0.25;
  }
  const blooms = [0, 1, 2, 3].map((b) => [Math.cos(b * Math.PI / 2 + 0.6) * 15, Math.sin(b * Math.PI / 2 + 0.6) * 13.5 + 4, 3]);
  for (let k = spiralCount; k < N; k++) {
    const bl = blooms[k % 4], r = Math.pow(Math.random(), 2) * 3, th = Math.random() * Math.PI * 2, ph = Math.acos(rand(-1, 1));
    growth[k * 3] = bl[0] + r * Math.sin(ph) * Math.cos(th);
    growth[k * 3 + 1] = bl[1] + r * Math.sin(ph) * Math.sin(th);
    growth[k * 3 + 2] = bl[2] + r * Math.cos(ph);
  }

  return [cosmos, name, growth, reply];
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
  const glow = glowTexture(THREE);

  // Story particles.
  const N = window.innerWidth < 700 ? 3000 : 6000;
  const shapes = buildShapes(N, o.word);
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

  let current = 0, running = false, visible = true;

  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const narrow = w / h < 0.8;
    // Beside the headline on wide screens, above it on phones.
    system.position.set(narrow ? 0 : 23, narrow ? 24 : 1, 0);
    system.scale.setScalar(narrow ? 0.9 : 1.3);
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

    // Story particles: morph between shapes, breathing during the Mind act.
    const b = breath(time);
    const scale = 1 + 0.05 * b.v * near(1) + 0.02 * Math.sin(time * 0.6) * near(2);
    const wob = still ? 0 : 0.2 + Math.sin(f * Math.PI) * 2.2;
    for (let k = 0; k < N; k++) {
      const j = k * 3, s = seed[k];
      pos[j] = (A[j] + (B[j] - A[j]) * f) * scale + Math.sin(time * 1.3 + s) * wob * 0.35;
      pos[j + 1] = (A[j + 1] + (B[j + 1] - A[j + 1]) * f) * scale + Math.cos(time * 1.1 + s * 1.7) * wob * 0.35;
      pos[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * f;
    }
    geo.attributes.position.needsUpdate = true;
    mat.color.copy(palette[i]).lerp(palette[i + 1], f);
    mat.opacity = 0.45 + 0.45 * Math.min(1, current); // dim stars behind the orbit, full strength after
    mat.size = 0.5 + Math.max(0, current - 2.2) * 0.4;
    renderer.render(scene, camera);

    o.onFrame?.({ act: Math.min(ACTS.length - 1, Math.round(current)), breath: near(1) > 0.5 && !still ? b.phase : '' });
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
