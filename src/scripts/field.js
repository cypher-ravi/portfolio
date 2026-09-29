// The field: one cloud of particles that follows the reader down the page and rebuilds itself
// into a new shape for each section: a sphere, </>, three project cards, a brain, and an @.
// The cursor scatters the particles, a click bursts the shape, and a mouse drag turns it.
// Framework-free: pass in THREE (the site passes the trimmed build in three-lite.ts).

import { sphere, text, cards, brain } from './scenes/shapes.js';

export const SCENES = ['hero', 'experience', 'projects', 'ai', 'contact'];

// Pose per scene: x, y as fractions of the half-view (+x right, +y up), s scale, o opacity.
export const WIDE = {
  hero: { x: 0.5, y: 0, s: 1, o: 1 },
  experience: { x: -0.54, y: 0.06, s: 0.8, o: 1 },
  projects: { x: 0.8, y: -0.66, s: 0.36, o: 0.55 },
  ai: { x: 0.55, y: 0, s: 0.95, o: 1 },
  contact: { x: 0.52, y: 0, s: 1, o: 1 },
};
export const NARROW = {
  hero: { x: 0, y: 0.4, s: 0.66, o: 1 },
  experience: { x: 0.3, y: 0.1, s: 0.8, o: 0.16 },
  projects: { x: 0.3, y: 0.3, s: 0.6, o: 0.1 },
  ai: { x: 0.3, y: 0.1, s: 0.8, o: 0.16 },
  contact: { x: 0, y: 0.42, s: 0.56, o: 0.9 },
};
const KEYS = ['x', 'y', 's', 'o'];

// Two colours per scene; particles mix between them by height. The first is always close to the site accent.
export const PALETTE = [
  [0x9ab8ff, 0xd9c8ff],
  [0x8fe8d0, 0x9ab8ff],
  [0x9ab8ff, 0xffc2a8],
  [0xb9a4ff, 0x86d6ff],
  [0x9ab8ff, 0xf3e6c8],
];

export const MODEL_H = 3.8, MODEL_W = 4.8; // rough bounds of the shapes
const smooth = (t) => t * t * (3 - 2 * t);

/**
 * @param {{ THREE: any, canvas: HTMLCanvasElement, reducedMotion: boolean, font: string }} o
 */
export function createField(o) {
  const { THREE, canvas } = o;
  const still = o.reducedMotion;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const DIST = 26;
  camera.position.set(0, 0, DIST);

  const N = innerWidth < 700 ? 8000 : 15000;
  const targets = [
    sphere(N),
    text(N, '</>', `700 190px ${o.font}`, 4.4),
    cards(N),
    brain(N),
    text(N, '@', `700 250px ${o.font}`, 4.6),
  ];
  const seed = new Float32Array(N).map(() => Math.random());
  const pos = new Float32Array(targets[0]); // eases toward the current shape
  const off = new Float32Array(N * 3); // cursor and click pushes, which relax back to zero
  const draw = new Float32Array(targets[0]); // what is drawn: pos + off

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(draw, 3));
  geo.setAttribute('aT', new THREE.BufferAttribute(seed, 1));
  const colA = new THREE.Color(PALETTE[0][0]), colB = new THREE.Color(PALETTE[0][1]), tmp = new THREE.Color();
  const uniforms = { uA: { value: colA }, uB: { value: colB }, uPR: { value: renderer.getPixelRatio() }, uScale: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aT; uniform vec3 uA; uniform vec3 uB; uniform float uPR; uniform float uScale; varying vec3 vC;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.5 + aT * 1.7) * uPR * uScale * (${DIST.toFixed(1)} / -mv.z);
        vC = mix(uA, uB, clamp(position.y * 0.3 + 0.5 + (aT - 0.5) * 0.4, 0.0, 1.0)) * (0.7 + aT * 0.6);
      }`,
    fragmentShader: `
      varying vec3 vC;
      void main() { float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vC * a, a); }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const spin = new THREE.Group(); // drag and idle turn
  const holder = new THREE.Group(); // scroll pose and cursor tilt
  spin.add(points);
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
    base = Math.min((1.1 * halfH) / MODEL_H, ((narrow ? 1.7 : 0.8) * halfW) / MODEL_W);
  }

  // Pointer: particles scatter from the cursor; a mouse drag turns the shape; a click bursts it.
  const ndc = new THREE.Vector2(), ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3(), inv = new THREE.Matrix4();
  let lean = { x: 0, y: 0 }, pointerIn = false, rotY = 0, vel = 0, drag = null, hovering = false;

  // Where the pointer falls in the shape's own space, or null when it is off the shape.
  function local(x, y) {
    if (pose.o < 0.5) return null;
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    inv.copy(points.matrixWorld).invert();
    const r = ray.ray.clone().applyMatrix4(inv);
    if (!r.intersectPlane(plane, hit)) return null;
    return Math.hypot(hit.x, hit.y) < 2.3 ? hit : null;
  }
  const skip = (t) => t instanceof Element && !!t.closest('a, button, input, textarea, select, dialog, label, .card, [data-no-field]');

  addEventListener('pointermove', (e) => {
    lean = { x: (e.clientX / innerWidth) * 2 - 1, y: (e.clientY / innerHeight) * 2 - 1 };
    pointerIn = true;
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x;
      drag.x = e.clientX; drag.moved += Math.abs(dx);
      rotY += dx * 0.008;
      vel = dx * 0.48; // rad per second at 60fps
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
    draw_();
  }

  let running = false, visible = true, raf = 0, last = 0;

  function target() {
    const K = narrow ? NARROW : WIDE;
    const a = K[SCENES[view.scene]], b = K[SCENES[Math.min(SCENES.length - 1, view.scene + 1)]];
    const f = smooth(view.blend), t = {};
    for (const k of KEYS) t[k] = a[k] + (b[k] - a[k]) * f;
    return t;
  }

  function frame(ms) {
    raf = 0;
    const time = still ? 0 : ms / 1000;
    const dt = still ? 1 : Math.min(0.05, last ? (ms - last) / 1000 : 0.016);
    last = ms;

    const t = target();
    const ease = still ? 1 : Math.min(1, dt * 3);
    for (const k of KEYS) pose[k] += (t[k] - pose[k]) * ease;
    holder.position.set(pose.x * halfW, pose.y * halfH, 0);
    holder.scale.setScalar(base * pose.s);
    canvas.style.opacity = pose.o.toFixed(3);
    uniforms.uScale.value = Math.min(1.3, Math.max(0.7, innerHeight / 850)) * (0.7 + 0.3 * pose.s);

    // The shape switches halfway through the hand-off to the next section.
    const shape = Math.min(SCENES.length - 1, view.scene + (view.blend > 0.5 ? 1 : 0));
    const k = still ? 1 : Math.min(1, dt * 3.2);
    colA.lerp(tmp.set(PALETTE[shape][0]), k);
    colB.lerp(tmp.set(PALETTE[shape][1]), k);

    // Text shapes stay facing the reader; the others turn slowly.
    const flat = shape === 1 || shape === 4;
    if (!drag) { vel *= Math.pow(0.05, dt); rotY += vel * dt; }
    if (flat) rotY += (Math.round(rotY / (Math.PI * 2)) * Math.PI * 2 - rotY) * Math.min(1, dt * 1.5);
    spin.rotation.y = rotY + (still ? 0 : flat ? Math.sin(time * 0.5) * 0.22 : time * 0.22);
    const tilt = shape === 3 ? 0.45 : 0; // look down on the brain so its halves read
    holder.rotation.x += (tilt + lean.y * 0.12 - holder.rotation.x) * (still ? 1 : Math.min(1, dt * 2));
    holder.updateMatrixWorld();

    const tgt = targets[shape];
    const h = pointerIn && !still ? local((lean.x + 1) * innerWidth / 2, (lean.y + 1) * innerHeight / 2) : null;
    const hx = h ? h.x : 99, hy = h ? h.y : 99;
    const relax = still ? 0 : Math.pow(0.08, dt);
    for (let i = 0; i < N; i++) {
      const j = i * 3, sp = still ? 1 : k * (0.45 + seed[i] * 0.9);
      const w = still ? 0 : 0.025 * Math.sin(time * 1.3 + seed[i] * 40);
      pos[j] += (tgt[j] + w - pos[j]) * sp;
      pos[j + 1] += (tgt[j + 1] + w - pos[j + 1]) * sp;
      pos[j + 2] += (tgt[j + 2] - pos[j + 2]) * sp;
      const dx = pos[j] + off[j] - hx, dy = pos[j + 1] + off[j + 1] - hy, d2 = dx * dx + dy * dy;
      if (d2 < 0.45) {
        const f = (1 - d2 / 0.45) * 0.09, d = Math.sqrt(d2) || 1;
        off[j] += (dx / d) * f; off[j + 1] += (dy / d) * f; off[j + 2] += (seed[i] - 0.5) * f;
      }
      off[j] *= relax; off[j + 1] *= relax; off[j + 2] *= relax;
    }
    draw_();
    renderer.render(scene, camera);

    const over = !!h;
    if (over !== hovering) { hovering = over; document.documentElement.classList.toggle('field-hover', over); }
    if (running && visible && !still) raf = requestAnimationFrame(frame);
  }

  function draw_() {
    for (let i = 0; i < N * 3; i++) draw[i] = pos[i] + off[i];
    geo.attributes.position.needsUpdate = true;
  }

  function request() { if (!raf) raf = requestAnimationFrame(frame); }

  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
    if (visible) { last = 0; request(); }
  });

  resize();
  return {
    resize() { resize(); request(); },
    /** scene: index into SCENES; p: progress through it; blend: 0..1 toward the next scene. */
    setView(sceneIndex, p, blend) {
      view.scene = sceneIndex; view.p = p; view.blend = blend;
      if (still) request();
    },
    burst(strength = 0.6) { if (!still) burst(strength); },
    draw: request,
    start() { if (running) return; running = true; request(); },
  };
}
