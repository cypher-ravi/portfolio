// Tree of life: a branching tree whose growth follows Ravi's career, from
// freelance work in 2020 to now. Growth (0..1) is driven by scroll. Leaves appear
// at the branch tips as they finish growing, then keep a soft, living glow.

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Where along the growth each chapter starts, for the HUD.
export const CHAPTERS = [
  { at: 0, label: '2020 · Freelance' },
  { at: 0.45, label: '2023 · Maximize AI' },
  { at: 0.62, label: '2023 · Instahyre' },
  { at: 0.95, label: 'Now · still growing' },
];

export function createTree(THREE, glow, { depth = 8, leavesPerTip = 2 } = {}) {
  const R = rng(42);
  const segs = [];

  // Rotate v around a unit axis (Rodrigues), so we don't need Vector3 here.
  const rotate = (v, k, a) => {
    const c = Math.cos(a), s = Math.sin(a), d = v[0] * k[0] + v[1] * k[1] + v[2] * k[2];
    return [
      v[0] * c + (k[1] * v[2] - k[2] * v[1]) * s + k[0] * d * (1 - c),
      v[1] * c + (k[2] * v[0] - k[0] * v[2]) * s + k[1] * d * (1 - c),
      v[2] * c + (k[0] * v[1] - k[1] * v[0]) * s + k[2] * d * (1 - c),
    ];
  };
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

  function grow(start, dir, len, d, t0) {
    const end = [start[0] + dir[0] * len, start[1] + dir[1] * len, start[2] + dir[2] * len];
    segs.push({ s: start, e: end, t0, t1: t0 + 1, d });
    if (d >= depth) return;
    const kids = d < 2 ? 3 : 2;
    for (let k = 0; k < kids; k++) {
      const axis = norm([R() - 0.5, 0, R() - 0.5]);
      let nd = rotate(dir, axis, 0.35 + R() * 0.45);
      nd = norm([nd[0] * 0.88, nd[1] * 0.88 + 0.12, nd[2] * 0.88]); // lean back toward the light
      grow(end, nd, len * (0.68 + R() * 0.1), d + 1, t0 + 1 + R() * 0.2);
    }
  }
  grow([0, 0, 0], [0, 1, 0], 1.4, 0, 0);
  const tMax = Math.max(...segs.map((s) => s.t1));
  for (const s of segs) { s.t0 /= tMax; s.t1 /= tMax; }

  const group = new THREE.Group();

  // Branches: one LineSegments, coloured from dusk-blue bark to green tips.
  const S = segs.length;
  const lp = new Float32Array(S * 6), lc = new Float32Array(S * 6);
  const bark = new THREE.Color(0x3b4f6e), shoot = new THREE.Color(0x9fe3a8), c = new THREE.Color();
  segs.forEach((s, i) => {
    c.copy(bark).lerp(shoot, s.d / depth);
    lc.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6);
  });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(lg, lineMat);
  lines.frustumCulled = false;
  group.add(lines);

  // Leaves: a few glowing points around each tip (and some on the last forks).
  const holders = segs.filter((s) => s.d >= depth - 1);
  const leaves = [];
  for (const s of holders) {
    const n = s.d === depth ? leavesPerTip : 1;
    for (let k = 0; k < n; k++) {
      const r = 0.12 + R() * 0.22;
      leaves.push({
        p: [s.e[0] + (R() - 0.5) * r * 2, s.e[1] + (R() - 0.3) * r * 2, s.e[2] + (R() - 0.5) * r * 2],
        t: s.t1 + R() * 0.04, // reveal just after the branch finishes
        hue: R(),
        phase: R() * Math.PI * 2,
      });
    }
  }
  const L = leaves.length;
  const leafPos = new Float32Array(L * 3), leafCol = new Float32Array(L * 3);
  leaves.forEach((l, i) => leafPos.set(l.p, i * 3));
  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute('position', new THREE.BufferAttribute(leafPos, 3));
  leafGeo.setAttribute('color', new THREE.BufferAttribute(leafCol, 3));
  const leafMat = new THREE.PointsMaterial({ size: 1.5, map: glow, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const leafPts = new THREE.Points(leafGeo, leafMat);
  leafPts.frustumCulled = false;
  group.add(leafPts);

  const green = new THREE.Color(0x9fe3a8), gold = new THREE.Color(0xffd27a), flash = new THREE.Color(0xffffff);

  return {
    group,
    chapter(g) { let label = CHAPTERS[0].label; for (const ch of CHAPTERS) if (g >= ch.at) label = ch.label; return label; },
    /** g: growth 0..1, time: seconds (0 when still), weight: 0..1 visibility. */
    update(g, time, weight) {
      segs.forEach((s, i) => {
        const k = Math.min(1, Math.max(0, (g - s.t0) / (s.t1 - s.t0)));
        lp.set([s.s[0], s.s[1], s.s[2],
          s.s[0] + (s.e[0] - s.s[0]) * k, s.s[1] + (s.e[1] - s.s[1]) * k, s.s[2] + (s.e[2] - s.s[2]) * k], i * 6);
      });
      lg.attributes.position.needsUpdate = true;

      leaves.forEach((l, i) => {
        const k = Math.min(1, Math.max(0, (g - l.t) / 0.06)); // 0 → hidden, 1 → open
        const pop = k > 0 && k < 1 ? Math.sin(k * Math.PI) * 0.8 : 0; // a bright flash as it opens
        const glowPulse = 0.32 + 0.14 * Math.sin(time * 1.4 + l.phase); // slow breathing glow
        c.copy(green).lerp(gold, l.hue * 0.6).multiplyScalar(k * glowPulse).lerp(flash, pop * 0.5);
        leafCol.set([c.r, c.g, c.b], i * 3);
      });
      leafGeo.attributes.color.needsUpdate = true;

      lineMat.opacity = 0.9 * weight; leafMat.opacity = weight;
      group.visible = weight > 0.01;
    },
  };
}
