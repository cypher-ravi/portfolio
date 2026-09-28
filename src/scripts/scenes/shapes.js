// Target shapes for the particle field, one per page section. Each returns a Float32Array
// of n xyz points, roughly within ±2.3 wide and ±1.8 tall, centred on the origin.

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Hero: an even sphere of light (Fibonacci lattice). */
export function sphere(n, r = 1.7) {
  const out = new Float32Array(n * 3), ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, rr = Math.sqrt(1 - y * y), th = ga * i;
    out.set([Math.cos(th) * rr * r, y * r, Math.sin(th) * rr * r], i * 3);
  }
  return out;
}

/** Text drawn to a canvas, then sampled where the glyphs are filled. */
export function text(n, str, font, width, seed = 3) {
  const R = rng(seed), W = 640, H = 320;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(str, W / 2, H / 2 + 6);
  const d = g.getImageData(0, 0, W, H).data, pts = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 128) pts.push(x, y);
  const out = new Float32Array(n * 3), m = pts.length / 2 || 1, k = width / W;
  for (let i = 0; i < n; i++) {
    const j = Math.floor(R() * m) * 2;
    out[i * 3] = ((pts[j] ?? W / 2) - W / 2) * k + (R() - 0.5) * 0.03;
    out[i * 3 + 1] = -((pts[j + 1] ?? H / 2) - H / 2) * k + (R() - 0.5) * 0.03;
    out[i * 3 + 2] = (R() - 0.5) * 0.3;
  }
  return out;
}

/** Projects: three cards fanned out in depth, mostly outlines with a light fill. */
export function cards(n, seed = 5) {
  const R = rng(seed), out = new Float32Array(n * 3), w = 1.7, h = 1.1;
  for (let i = 0; i < n; i++) {
    const k = i % 3, edge = R() < 0.65;
    let u = R() * 2 - 1, v = R() * 2 - 1;
    if (edge) { if (R() < 0.5) u = Math.sign(u); else v = Math.sign(v); }
    out.set([(k - 1) * 0.55 + (u * w) / 2, (1 - k) * 0.35 + (v * h) / 2, (k - 1) * 0.6], i * 3);
  }
  return out;
}

/** AI: a brain, two folded hemispheres. */
export function brain(n, seed = 7) {
  const R = rng(seed), out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    let x = R() * 2 - 1, y = R() * 2 - 1, z = R() * 2 - 1;
    const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
    const fold = 1 + 0.07 * Math.sin(y * 14 + z * 9) * Math.sin(z * 12 - y * 5);
    out.set([side * (0.08 + Math.abs(x)) * fold, (y * 0.95 + 0.1) * fold, z * 1.3 * fold], i * 3);
  }
  return out;
}
