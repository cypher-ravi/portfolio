// Connectome: neurons shaped like two hemispheres, with impulses travelling along
// Point sizes are in world units (three.js ignores group scale for points), tuned for the scale the story uses.
// neighbour links. Tapping fires a cascade. Used in the Mind act.
// One Points cloud for neurons, one for impulses, one LineSegments for links.

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function createConnectome(THREE, glow, { count = 900 } = {}) {
  const R = rng(7);
  const N = count;
  const P = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const side = i % 2 ? 1 : -1;
    const u = R() * 2 - 1, th = R() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    let x = s * Math.cos(th), y = u, z = s * Math.sin(th);
    const fold = 1 + 0.07 * Math.sin(9 * th) * Math.sin(7 * y); // gyri-like ripples
    const rr = (0.78 + 0.22 * Math.sqrt(R())) * fold;
    x = Math.abs(x) * 0.66 * rr * side + side * 0.09;
    y *= 0.74 * rr; z *= 1.25 * rr;
    P[i * 3] = x; P[i * 3 + 1] = y * (z < -0.3 ? 0.85 : 1); P[i * 3 + 2] = z;
  }

  // Link each neuron to its 3 nearest neighbours (partial selection, no full sort).
  const nbrs = Array.from({ length: N }, () => []);
  const edges = [];
  for (let i = 0; i < N; i++) {
    const best = [[Infinity, -1], [Infinity, -1], [Infinity, -1]];
    for (let j = 0; j < N; j++) {
      if (j === i) continue;
      const dx = P[i * 3] - P[j * 3], dy = P[i * 3 + 1] - P[j * 3 + 1], dz = P[i * 3 + 2] - P[j * 3 + 2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < best[2][0]) { best[2] = [d, j]; best.sort((a, b) => a[0] - b[0]); }
    }
    for (const [, j] of best) {
      if (j < 0 || nbrs[i].includes(j)) continue;
      nbrs[i].push(j); nbrs[j].push(i);
      edges.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2], P[j * 3], P[j * 3 + 1], P[j * 3 + 2]);
    }
  }

  const group = new THREE.Group();
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edges), 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0x5a4f9c, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
  group.add(new THREE.LineSegments(lineGeo, lineMat));

  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  const nodeCol = new Float32Array(N * 3);
  nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeCol, 3));
  const nodeMat = new THREE.PointsMaterial({ size: 0.9, map: glow, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  group.add(new THREE.Points(nodeGeo, nodeMat));

  const MAXI = 400;
  const impPos = new Float32Array(MAXI * 3);
  const impGeo = new THREE.BufferGeometry();
  impGeo.setAttribute('position', new THREE.BufferAttribute(impPos, 3));
  impGeo.setDrawRange(0, 0);
  const impMat = new THREE.PointsMaterial({ size: 1.5, map: glow, color: 0xe6e0ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const impPts = new THREE.Points(impGeo, impMat);
  impPts.frustumCulled = false;
  group.add(impPts);

  const act = new Float32Array(N);
  let imps = [];
  const fire = (i, gen) => {
    act[i] = 1;
    for (const j of nbrs[i]) if (imps.length < MAXI && R() < 0.55) imps.push({ a: i, b: j, t: 0, gen });
  };
  fire(0, 7);

  const base = new THREE.Color(0x3a3470), hot = new THREE.Color(0xf0ecff), tmp = new THREE.Color();
  let spawn = 0;

  return {
    group,
    /** A visitor's tap: start a few thoughts at once. */
    think() { for (let k = 0; k < 3; k++) fire((R() * N) | 0, 9); },
    /** Reduced motion: a still frame with a scatter of lit neurons. */
    still() { for (let i = 0; i < N; i++) act[i] = R() < 0.08 ? 0.8 : 0; this.update(0, 1); },
    update(dt, weight) {
      spawn += dt;
      if (dt > 0 && spawn > 0.45) { spawn = 0; fire((R() * N) | 0, 5); }
      const next = [];
      let n = 0;
      for (const m of imps) {
        m.t += dt * 2.2;
        if (m.t >= 1) {
          if (m.gen > 0 && act[m.b] < 0.3) fire(m.b, m.gen - 1); else act[m.b] = Math.max(act[m.b], 0.6);
          continue;
        }
        next.push(m);
        const a = m.a * 3, b = m.b * 3;
        impPos[n * 3] = P[a] + (P[b] - P[a]) * m.t;
        impPos[n * 3 + 1] = P[a + 1] + (P[b + 1] - P[a + 1]) * m.t;
        impPos[n * 3 + 2] = P[a + 2] + (P[b + 2] - P[a + 2]) * m.t;
        n++;
      }
      imps = next.slice(0, MAXI);
      impGeo.setDrawRange(0, Math.min(n, MAXI));
      impGeo.attributes.position.needsUpdate = true;
      for (let i = 0; i < N; i++) {
        act[i] *= Math.exp(-dt * 1.6);
        tmp.copy(base).lerp(hot, act[i]);
        nodeCol[i * 3] = tmp.r; nodeCol[i * 3 + 1] = tmp.g; nodeCol[i * 3 + 2] = tmp.b;
      }
      nodeGeo.attributes.color.needsUpdate = true;
      lineMat.opacity = 0.3 * weight; nodeMat.opacity = weight; impMat.opacity = weight;
      group.visible = weight > 0.01;
    },
  };
}
