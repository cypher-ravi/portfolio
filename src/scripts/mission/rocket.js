// The Ravi-1 launch vehicle, modelled in code. Local space: y up, the base of stage 1 at y = 0.
// Parts are built separately so the flight can let each one go: stage 1, two fairing halves,
// stage 2 and the payload (which keeps flying).
import * as THREE from 'three';

export const R0 = 0.5; // body radius

function canvasTexture(w, h, draw, color = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Painted body: off-white with faint streaks, panel seams, a name in two places, and soot near the engines.
function bodyMaps(label, { stripe = false, soot = 0 } = {}) {
  const map = canvasTexture(1024, 1024, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#e6e5e1'); g.addColorStop(0.5, '#f2f1ed'); g.addColorStop(1, '#e3e2de');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 3200; i++) {
      c.fillStyle = `rgba(40,36,30,${Math.random() * 0.025})`;
      c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 4 + Math.random() * 40);
    }
    if (soot) {
      const s = c.createLinearGradient(0, h, 0, h * (1 - soot));
      s.addColorStop(0, 'rgba(20,18,16,.85)'); s.addColorStop(0.35, 'rgba(30,26,22,.35)'); s.addColorStop(1, 'rgba(30,26,22,0)');
      c.fillStyle = s; c.fillRect(0, h * (1 - soot), w, h * soot);
    }
    if (stripe) { c.fillStyle = '#15171b'; c.fillRect(0, h * 0.03, w, h * 0.05); }
    c.fillStyle = '#121418';
    c.font = `700 ${h * 0.085}px "Space Grotesk Variable", "Space Grotesk", Arial, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const x of [0.25, 0.75]) {
      if (!label) break;
      c.save(); c.translate(w * x, h * 0.48); c.rotate(-Math.PI / 2); c.fillText(label, 0, 0); c.restore();
    }
    c.fillStyle = '#b8362a'; c.fillRect(w * 0.25 - 9, h * 0.8, 18, 18);
  });
  // Seams as a bump map so they catch the sun.
  const bump = canvasTexture(1024, 1024, (c, w, h) => {
    c.fillStyle = '#808080'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#5a5a5a'; c.lineWidth = 3;
    for (let y = h / 9; y < h; y += h / 9) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.lineWidth = 2; c.strokeStyle = '#6c6c6c';
    for (let x = w / 16; x < w; x += w / 8) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let i = 0; i < 400; i++) { c.fillStyle = '#6a6a6a'; c.beginPath(); c.arc(Math.random() * w, Math.floor(Math.random() * 9) * h / 9 + 6, 1.6, 0, 7); c.fill(); }
  }, false);
  return { map, bump };
}

function paint(label, opts) {
  const { map, bump } = bodyMaps(label, opts);
  return new THREE.MeshPhysicalMaterial({ map, bumpMap: bump, bumpScale: 0.6, roughness: 0.42, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.45 });
}

const carbonTex = canvasTexture(256, 256, (c, w, h) => {
  c.fillStyle = '#131417'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) {
    c.fillStyle = (x + y) % 16 ? '#1b1d21' : '#0f1013';
    c.fillRect(x, y, 8, 8);
  }
});
carbonTex.wrapS = carbonTex.wrapT = THREE.RepeatWrapping; carbonTex.repeat.set(12, 3);

export const materials = {
  carbon: new THREE.MeshPhysicalMaterial({ map: carbonTex, roughness: 0.5, metalness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.38, metalness: 1 }),
  grey: new THREE.MeshStandardMaterial({ color: 0xa3a9b1, roughness: 0.3, metalness: 1 }),
  // Nozzles glow when hot: the flight drives emissiveIntensity.
  nozzle1: new THREE.MeshStandardMaterial({ color: 0x3b3029, roughness: 0.32, metalness: 1, side: THREE.DoubleSide, emissive: new THREE.Color(1, 0.35, 0.08), emissiveIntensity: 0 }),
  nozzle2: new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.28, metalness: 1, side: THREE.DoubleSide, emissive: new THREE.Color(1, 0.32, 0.06), emissiveIntensity: 0 }),
};

function bell(rt, re, h, seg = 48) {
  const pts = [];
  for (let i = 0; i <= 28; i++) { const t = i / 28; pts.push(new THREE.Vector2(rt + (re - rt) * Math.pow(t, 0.62), -t * h)); }
  return new THREE.LatheGeometry(pts, seg);
}

function shadows(g) { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; }

export function stage1() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, 5.2, 96, 1, true), paint('RAVI-1', { soot: 0.22 }));
  body.position.y = 2.6; g.add(body);
  const inter = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, 0.9, 96, 1, true), materials.carbon);
  inter.position.y = 5.65; g.add(inter);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0 * 0.94, 0.14, 96), materials.carbon); g.add(skirt);
  // Nine engines: one centre, eight around it.
  const spots = [[0, 0]];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; spots.push([Math.cos(a) * 0.3, Math.sin(a) * 0.3]); }
  for (const [x, z] of spots) { const b = new THREE.Mesh(bell(0.04, 0.1, 0.32), materials.nozzle1); b.position.set(x, -0.07, z); g.add(b); }
  // Folded landing legs.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.9, 0.05), materials.carbon);
    leg.position.set(Math.cos(a) * (R0 + 0.025), 1.0, Math.sin(a) * (R0 + 0.025)); leg.rotation.y = -a + Math.PI / 2; g.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.07), materials.darkMetal);
    foot.position.set(Math.cos(a) * (R0 + 0.04), 0.06, Math.sin(a) * (R0 + 0.04)); foot.rotation.y = -a + Math.PI / 2; g.add(foot);
  }
  // Grid fins, stowed.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const fin = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.24), materials.darkMetal); fin.add(frame);
    for (let k = -2; k <= 2; k++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.035, 0.24), materials.grey); bar.position.x = k * 0.06; fin.add(bar); }
    fin.position.set(Math.cos(a) * (R0 + 0.16), 5.95, Math.sin(a) * (R0 + 0.16)); fin.rotation.y = -a; fin.rotation.z = 0.0; g.add(fin);
  }
  // Raceway running up the side.
  const rw = new THREE.Mesh(new THREE.BoxGeometry(0.07, 5.0, 0.05), materials.carbon); rw.position.set(0, 2.7, R0 + 0.012); g.add(rw);
  g.userData.nozzle = new THREE.Vector3(0, -0.4, 0);
  return shadows(g);
}

export function stage2() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, 2.4, 96, 1, true), paint('2023', { stripe: true }));
  body.position.y = 7.3; g.add(body);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R0, 48, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), materials.darkMetal);
  dome.scale.y = 0.35; dome.position.y = 6.1; g.add(dome);
  const mvac = new THREE.Mesh(bell(0.08, 0.42, 0.95, 72), materials.nozzle2); mvac.position.y = 6.0; g.add(mvac);
  const turbo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 16), materials.darkMetal); turbo.position.set(0.17, 5.92, 0); g.add(turbo);
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.4, 12), materials.darkMetal); exhaust.position.set(0.24, 5.75, 0); exhaust.rotation.z = 0.3; g.add(exhaust);
  g.userData.nozzle = new THREE.Vector3(0, 5.05, 0);
  return shadows(g);
}

export function fairingHalf(side) {
  const pts = [], H = 2.9, rb = 0.56;
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const r = t < 0.36 ? rb : rb * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.36) / 0.64, 2)));
    pts.push(new THREE.Vector2(Math.max(r, 0.002), t * H));
  }
  const mat = paint('', {}); mat.side = THREE.DoubleSide;
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 64, side > 0 ? 0 : Math.PI, Math.PI), mat);
  const g = new THREE.Group(); g.add(m); g.position.y = 8.5;
  return shadows(g);
}

export function payload() {
  const g = new THREE.Group();
  const adapter = new THREE.Mesh(new THREE.CylinderGeometry(0.34, R0, 0.3, 64), materials.grey); adapter.position.y = 8.65; g.add(adapter);
  // Gold multi-layer insulation: crinkled foil from a noise bump map.
  const crinkle = canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#808080'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) {
      const v = 90 + Math.random() * 90 | 0; c.strokeStyle = `rgb(${v},${v},${v})`; c.lineWidth = 1 + Math.random() * 3;
      c.beginPath(); const x = Math.random() * w, y = Math.random() * h; c.moveTo(x, y); c.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60); c.stroke();
    }
  }, false);
  const gold = new THREE.MeshStandardMaterial({ color: 0xdba84a, metalness: 1, roughness: 0.26, bumpMap: crinkle, bumpScale: 1.4 });
  const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.9, 8), gold); bus.position.y = 9.25; g.add(bus);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.08, 8), new THREE.MeshStandardMaterial({ color: 0xe9e9e9, roughness: 0.5 })); lid.position.y = 9.74; g.add(lid);
  // Star tracker and thrusters.
  const tracker = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.12, 16), materials.darkMetal); tracker.position.set(0.18, 9.82, 0.1); g.add(tracker);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; const t = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 10), materials.grey); t.position.set(Math.cos(a) * 0.35, 8.9, Math.sin(a) * 0.35); t.rotation.z = Math.PI; g.add(t); }
  // High-gain dish on a boom.
  const dishPts = [];
  for (let i = 0; i <= 18; i++) { const r = (i / 18) * 0.26; dishPts.push(new THREE.Vector2(r, r * r * 1.6)); }
  const dish = new THREE.Mesh(new THREE.LatheGeometry(dishPts, 48), new THREE.MeshStandardMaterial({ color: 0xf1f1f1, metalness: 0.25, roughness: 0.35, side: THREE.DoubleSide }));
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), materials.grey); feed.position.y = 0.08; dish.add(feed);
  const dishPivot = new THREE.Group(); dishPivot.position.set(0, 9.8, 0);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 8), materials.grey); boom.position.y = 0.1; dishPivot.add(boom);
  dish.position.y = 0.22; dishPivot.add(dish);
  g.add(dishPivot); g.userData.dish = dishPivot;
  // Two solar wings, three hinged panels each.
  const cells = canvasTexture(256, 512, (c, w, h) => {
    c.fillStyle = '#0b1530'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) {
      c.fillStyle = `rgb(${14 + Math.random() * 10},${30 + Math.random() * 14},${78 + Math.random() * 34})`; c.fillRect(x + 1, y + 1, 14, 14);
    }
    c.strokeStyle = '#c3cad4'; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4);
  });
  const face = new THREE.MeshPhysicalMaterial({ map: cells, metalness: 0.4, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
  const panelMats = [materials.grey, materials.grey, materials.grey, materials.grey, face, face]; // cells on both faces: both are seen in flight
  const wings = [];
  for (const side of [-1, 1]) {
    const root = new THREE.Group(); root.position.set(side * 0.34, 9.25, 0); g.add(root);
    const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.03), materials.grey); yoke.position.x = side * 0.15; root.add(yoke);
    const panels = []; let parent = root, offset = side * 0.3;
    for (let k = 0; k < 3; k++) {
      const hinge = new THREE.Group(); hinge.position.x = offset; parent.add(hinge);
      const pnl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.8), panelMats);
      pnl.rotation.x = Math.PI / 2; pnl.position.x = side * 0.31; hinge.add(pnl);
      panels.push(hinge); parent = hinge; offset = side * 0.62;
    }
    wings.push({ panels, side });
  }
  g.userData.wings = wings;
  return shadows(g);
}

// Fold or unfold the arrays (0 = stowed against the body, 1 = fully open), and swing the dish out.
export function deploy(pay, t) {
  for (const w of pay.userData.wings) {
    w.panels.forEach((h, k) => h.rotation.set(0, k === 0 ? 0 : (1 - t) * (k % 2 ? 1 : -1) * w.side * Math.PI * 0.96, k === 0 ? -(1 - t) * w.side * Math.PI / 2 : 0));
  }
  pay.userData.dish.rotation.z = (1 - t) * 1.2;
}
