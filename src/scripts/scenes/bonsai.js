// A bonsai in a clay pot: the one living thing on the page. Procedural, so there are no model files.
// Growth (0..1) follows Ravi's career from 2020 to now: the trunk rises, tiers of branches reach out,
// and cloud pads of leaves pop open at the tips. The trunk also thickens as it ages.

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const clamp = (v) => Math.min(1, Math.max(0, v));
const backOut = (k) => (k <= 0 ? 0 : 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2));

// Where along the growth each chapter starts.
export const CHAPTERS = [
  { at: 0, label: '2020 · Freelance' },
  { at: 0.4, label: '2023 · Maximize AI' },
  { at: 0.6, label: '2023 · Instahyre' },
  { at: 0.95, label: 'Now · still growing' },
];

const SOIL = 0.14;
const POT_X = 1.25, POT_Z = 0.9; // an oval pot, as bonsai pots usually are

function shadowTexture(THREE) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d'), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,.75)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}

export function createBonsai(THREE, { accent = 0xb5c99a } = {}) {
  const R = rng(7);
  const UP = new THREE.Vector3(0, 1, 0);
  const segs = [];
  const tips = [];

  const addSeg = (s, dir, len, r, t0) => {
    const seg = { s: s.clone(), q: new THREE.Quaternion().setFromUnitVectors(UP, dir), len, r, t0, t1: t0 + 1 };
    segs.push(seg);
    return s.clone().addScaledVector(dir, len);
  };

  // Side branches lean out and stay fairly flat, which gives the tiered bonsai silhouette.
  function branch(start, dir, len, r, d, t0) {
    const end = addSeg(start, dir, len, r, t0);
    if (d >= 3) { tips.push({ p: end, t: t0 + 1, size: 0.5 + R() * 0.25 }); return; }
    for (let k = 0; k < 2; k++) {
      const axis = new THREE.Vector3(R() - 0.5, 0, R() - 0.5).normalize();
      const nd = dir.clone().applyAxisAngle(axis, 0.45 + R() * 0.4);
      nd.y = nd.y * 0.5 + 0.18;
      branch(end, nd.normalize(), len * (0.66 + R() * 0.12), r * 0.7, d + 1, t0 + 1 + R() * 0.25);
    }
  }

  // Trunk: a few bends, with a tier of branches at each joint, then an apex.
  const bends = [[0.2, 1, 0.05], [-0.36, 1, 0.12], [0.3, 1, -0.1], [-0.12, 1, 0.04]];
  const lens = [1.25, 1.05, 0.9, 0.75];
  let p = new THREE.Vector3(0, SOIL - 0.1, 0), r = 0.46, t = 0;
  bends.forEach((b, i) => {
    const dir = new THREE.Vector3(...b).normalize();
    p = addSeg(p, dir, lens[i], r, t);
    r *= 0.78; t += 1;
    if (i >= 1) {
      const side = i % 2 ? 1 : -1, a = (R() - 0.5) * 0.9;
      const bdir = new THREE.Vector3(side * Math.cos(a), 0.22, Math.sin(a)).normalize();
      branch(p, bdir, 1.45 - i * 0.2, r * 0.75, 1, t);
    }
  });
  branch(p, new THREE.Vector3(0.25, 1, 0.1).normalize(), 0.55, r, 2, t);
  branch(p, new THREE.Vector3(-0.3, 0.9, -0.2).normalize(), 0.5, r * 0.9, 2, t + 0.2);

  const tMax = Math.max(...segs.map((s) => s.t1), ...tips.map((x) => x.t)) + 0.6;
  for (const s of segs) { s.t0 /= tMax; s.t1 /= tMax; }

  // Leaf pads: a flattened cloud of blobs around each tip.
  const blobs = [];
  for (const tip of tips) {
    const n = 4 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) {
      const a = R() * Math.PI * 2, rr = tip.size * (k === 0 ? 0 : 0.5 + R() * 0.6);
      const sc = tip.size * (0.55 + R() * 0.45);
      blobs.push({
        p: new THREE.Vector3(tip.p.x + Math.cos(a) * rr, tip.p.y + 0.12 + (R() - 0.3) * 0.2, tip.p.z + Math.sin(a) * rr * 0.8),
        q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(R(), R(), R()).normalize(), R() * 3),
        s: new THREE.Vector3(sc, sc * 0.55, sc),
        t: tip.t / tMax + R() * 0.04,
        ph: R() * Math.PI * 2,
        tone: R(),
      });
    }
  }

  const group = new THREE.Group(); // pivot at the pot's base

  // Branches: one tapered, faceted cylinder per segment, drawn in a single call.
  const branchGeo = new THREE.CylinderGeometry(0.72, 1, 1, 7, 1);
  branchGeo.translate(0, 0.5, 0);
  const bark = new THREE.MeshStandardMaterial({ color: 0x6e5443, roughness: 0.95, flatShading: true });
  const branches = new THREE.InstancedMesh(branchGeo, bark, segs.length);
  branches.frustumCulled = false;
  // Knuckles: a ball at each joint so bends read as one continuous limb.
  const knuckles = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), bark, segs.length);
  knuckles.frustumCulled = false;
  group.add(branches, knuckles);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, flatShading: true });
  const foliage = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), leafMat, blobs.length);
  foliage.frustumCulled = false;
  const deep = new THREE.Color(0x5f7a4c), light = new THREE.Color(0xa9c28c), c = new THREE.Color();
  blobs.forEach((b, i) => foliage.setColorAt(i, c.copy(deep).lerp(light, b.tone * 0.8 + (b.p.y > 3 ? 0.2 : 0))));
  group.add(foliage);

  // Pot, soil, three stones, and a soft contact shadow.
  const profile = [[0, -0.85], [1.85, -0.85], [2.02, -0.78], [2.18, -0.2], [2.36, 0.12], [2.46, 0.24], [2.28, 0.26], [2.12, SOIL], [0, SOIL]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const pot = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 14),
    new THREE.MeshStandardMaterial({ color: 0xc98b6b, roughness: 0.7, flatShading: true }),
  );
  pot.scale.set(POT_X, 1, POT_Z);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(2.14, 14), new THREE.MeshStandardMaterial({ color: 0x2c211a, roughness: 1 }));
  soil.rotation.x = -Math.PI / 2; soil.position.y = SOIL + 0.01; soil.scale.set(POT_X, POT_Z, 1);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 4),
    new THREE.MeshBasicMaterial({ map: shadowTexture(THREE), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.86;
  group.add(pot, soil, shadow);

  const stoneGlow = new THREE.Color(accent);
  const stones = [[-1.55, 0.55, 0.26], [1.4, -0.7, 0.2], [1.85, 0.5, 0.15]].map(([x, z, s]) => {
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.MeshStandardMaterial({ color: 0x8a847a, roughness: 0.9, flatShading: true, emissive: stoneGlow, emissiveIntensity: 0 }),
    );
    m.position.set(x, SOIL + s * 0.35, z); m.scale.set(s * 1.3, s * 0.8, s); m.rotation.set(R() * 3, R() * 3, R() * 3);
    group.add(m);
    return m;
  });
  let stoneOn = -1;

  // Falling leaves: a small pool reused for every burst.
  const POOL = 40;
  const fallGeo = new THREE.IcosahedronGeometry(1, 0);
  const fallen = new THREE.InstancedMesh(fallGeo, new THREE.MeshStandardMaterial({ color: 0xa9c28c, roughness: 0.8, flatShading: true }), POOL);
  fallen.frustumCulled = false;
  group.add(fallen);
  const drops = Array.from({ length: POOL }, () => ({ live: false, p: new THREE.Vector3(), v: new THREE.Vector3(), rot: new THREE.Euler(), spin: 0, ph: 0, rest: 0 }));
  let nextDrop = 0;

  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), sc3 = new THREE.Vector3(), q = new THREE.Quaternion();
  let lastG = -1;

  function drawBranches(g) {
    const thick = 0.5 + 0.5 * g;
    segs.forEach((s, i) => {
      const k = clamp((g - s.t0) / (s.t1 - s.t0));
      m4.compose(s.s, s.q, sc3.set(s.r * thick, Math.max(1e-4, s.len * k), s.r * thick));
      branches.setMatrixAt(i, m4);
      const kr = s.r * thick * Math.min(1, k * 4) * 0.98;
      m4.compose(s.s, s.q, sc3.set(Math.max(1e-4, kr), Math.max(1e-4, kr), Math.max(1e-4, kr)));
      knuckles.setMatrixAt(i, m4);
    });
    branches.instanceMatrix.needsUpdate = true;
    knuckles.instanceMatrix.needsUpdate = true;
  }

  function drawLeaves(g, time) {
    blobs.forEach((b, i) => {
      const k = backOut(clamp((g - b.t) / 0.08));
      v3.copy(b.p); v3.y += Math.sin(time * 0.9 + b.ph) * 0.025;
      m4.compose(v3, b.q, sc3.copy(b.s).multiplyScalar(Math.max(1e-4, k)));
      foliage.setMatrixAt(i, m4);
    });
    foliage.instanceMatrix.needsUpdate = true;
  }

  function drawDrops(dt, time) {
    for (let i = 0; i < POOL; i++) {
      const d = drops[i];
      let s = 1e-4;
      if (d.live) {
        const inPot = (d.p.x / (2.1 * POT_X)) ** 2 + (d.p.z / (2.1 * POT_Z)) ** 2 < 1;
        const floor = inPot ? SOIL + 0.03 : -0.84;
        if (d.p.y > floor) {
          d.v.y = Math.max(-0.9, d.v.y - 1.6 * dt);
          d.p.x += (d.v.x + Math.sin(time * 3 + d.ph) * 0.5) * dt;
          d.p.z += d.v.z * dt;
          d.p.y = Math.max(floor, d.p.y + d.v.y * dt);
          d.rot.x += d.spin * dt; d.rot.z += d.spin * 0.7 * dt;
        } else {
          d.rest += dt; // settle, then sink away
          d.rot.x *= 0.9;
        }
        s = d.rest > 2.5 ? Math.max(0, 1 - (d.rest - 2.5) / 1.5) : 1;
        if (s <= 0) { d.live = false; s = 1e-4; }
      }
      q.setFromEuler(d.rot);
      m4.compose(d.p, q, sc3.set(0.16 * s, 0.035 * s, 0.1 * s));
      fallen.setMatrixAt(i, m4);
    }
    fallen.instanceMatrix.needsUpdate = true;
  }

  return {
    group,
    /** Meshes a pointer can hit (for drag and tap). */
    targets: [foliage, branches, pot],
    chapter(g) { let label = CHAPTERS[0].label; for (const ch of CHAPTERS) if (g >= ch.at) label = ch.label; return label; },
    /** g: growth 0..1, time and dt in seconds (0 when still). */
    update(g, time, dt) {
      drawBranches(g);
      drawLeaves(g, time);
      if (Math.abs(g - lastG) > 0.002) { foliage.computeBoundingSphere(); branches.computeBoundingSphere(); lastG = g; }
      drawDrops(dt, time);
      stones.forEach((m, i) => {
        const to = i === stoneOn ? 0.55 : 0;
        m.material.emissiveIntensity += (to - m.material.emissiveIntensity) * Math.min(1, dt ? dt * 6 : 1);
      });
    },
    /** Let a few leaves go, near a point in the tree's own space (or anywhere in the canopy). */
    burst(at, n = 8) {
      const open = blobs.filter((b) => b.t < lastG - 0.05);
      if (!open.length) return;
      for (let k = 0; k < n; k++) {
        let from = open[Math.floor(R() * open.length)].p;
        if (at) {
          const near = open.filter((b) => b.p.distanceTo(at) < 1.1);
          if (near.length) from = near[Math.floor(R() * near.length)].p;
        }
        const d = drops[nextDrop]; nextDrop = (nextDrop + 1) % POOL;
        d.live = true; d.rest = 0; d.ph = R() * 6; d.spin = 2 + R() * 4;
        d.p.copy(from).add(v3.set((R() - 0.5) * 0.5, (R() - 0.5) * 0.3, (R() - 0.5) * 0.5));
        d.v.set((R() - 0.5) * 0.6, 0.2 + R() * 0.4, (R() - 0.5) * 0.6);
        d.rot.set(R() * 3, R() * 3, R() * 3);
      }
    },
    /** Light one of the three stones (-1 for none). */
    lightStone(i) { stoneOn = i; },
  };
}
