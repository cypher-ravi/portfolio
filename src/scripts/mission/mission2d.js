// The same flight on a 2D canvas, for browsers without WebGL (Chrome with graphics acceleration off, for one).
// Same interface as the 3D scene: setProgress, resize, start, draw.
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** @param {{ canvas: HTMLCanvasElement, events: Record<string, number>, reducedMotion: boolean }} o */
export function createMission2D({ canvas, events: ev, reducedMotion }) {
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, target = 0, p = 0, dim = 0, dimTarget = 0, running = false;
  const stars = Array.from({ length: 320 }, () => [Math.random(), Math.random(), Math.random()]);

  function resize() {
    const d = Math.min(devicePixelRatio, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * d); canvas.height = Math.round(H * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  function tank(x, y, w, h, label) {
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, '#9c9b97'); g.addColorStop(0.35, '#f4f3ef'); g.addColorStop(0.6, '#e2e1dd'); g.addColorStop(1, '#6f6e6a');
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, y, w, h);
    if (!label) return;
    ctx.save(); ctx.translate(x, y + h / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#16181c'; ctx.font = `700 ${w * 0.42}px "Space Grotesk Variable", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0); ctx.restore();
  }
  function flame(x, y, w, len, vac, t) {
    const f = ctx.createLinearGradient(0, y, 0, y + len);
    f.addColorStop(0, vac ? 'rgba(210,225,255,.95)' : 'rgba(255,245,220,1)');
    f.addColorStop(0.25, vac ? 'rgba(130,160,255,.5)' : 'rgba(255,160,70,.75)');
    f.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = f;
    const spread = vac ? 2.6 : 1.3, j = 1 + Math.sin(t * 40) * 0.04;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w * spread * j, y + len); ctx.lineTo(x - w * spread * j, y + len); ctx.closePath(); ctx.fill();
    const g = ctx.createRadialGradient(x, y, 0, x, y, w * 2.4);
    g.addColorStop(0, vac ? 'rgba(200,215,255,.8)' : 'rgba(255,220,170,.9)'); g.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, w * 2.4, 0, 7); ctx.fill();
  }

  function draw(time = performance.now() / 1000) {
    p += (target - p) * (reducedMotion ? 1 : 0.1);
    dim += (dimTarget - dim) * 0.06;
    ctx.fillStyle = '#020305'; ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
      ctx.fillStyle = `rgba(235,240,255,${0.2 + 0.6 * s[2] * s[2]})`;
      ctx.fillRect(s[0] * W, (s[1] * H + p * 500 * s[2]) % H, s[2] > 0.9 ? 2 : 1.2, s[2] > 0.9 ? 2 : 1.2);
    }
    // Earth drops away below.
    const er = Math.max(W, H) * 1.5, ex = W / 2, ey = H * 0.84 + Math.pow(p, 0.6) * H * 1.7 + er;
    const eg = ctx.createRadialGradient(ex - er * 0.2, ey - er * 0.3, er * 0.2, ex, ey, er);
    eg.addColorStop(0, '#1d4f86'); eg.addColorStop(0.9, '#0d2b52'); eg.addColorStop(1, '#071427');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 7); ctx.fill();
    const atm = ctx.createRadialGradient(ex, ey, er * 0.985, ex, ey, er * 1.03);
    atm.addColorStop(0, 'rgba(120,180,255,.55)'); atm.addColorStop(1, 'rgba(120,180,255,0)');
    ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(ex, ey, er * 1.03, 0, 7); ctx.fill();

    const s = Math.min(W, H) / 24;
    const cx = W >= 900 ? W * 0.68 : W * 0.5, base = (W < 760 ? H * 0.5 : H * 0.72) - sstep(0, 0.1, p) * H * 0.12;
    const sep1 = p >= ev.sep1, fair = p >= ev.fair, sep2 = p >= ev.sep2;
    const shake = !sep1 && p > 0.001 && !reducedMotion ? Math.sin(time * 50) * 0.8 : 0;
    ctx.save();
    ctx.translate(cx + shake, base); ctx.rotate(sstep(0.03, ev.sep1, p) * 0.38); ctx.translate(-cx, -base);
    // Stage 1 (falls back and tumbles once separated)
    ctx.save();
    const d1 = sep1 ? (p - ev.sep1) : 0;
    ctx.translate(cx - d1 * W * 0.6, base + d1 * H * 2.4); ctx.rotate(d1 * 7); ctx.translate(-cx, -base);
    tank(cx, base - s * 5.2, s, s * 5.2, 'RAVI-1');
    ctx.fillStyle = '#16181c'; ctx.fillRect(cx - s / 2, base - s * 6.1, s, s * 0.9);
    if (!sep1 && p > 0.001) flame(cx, base, s * 0.8, s * (5 + sstep(0, ev.sep1, p) * 4), false, time);
    ctx.restore();
    // Stage 2
    ctx.save();
    const d2 = sep2 ? (p - ev.sep2) : 0;
    ctx.translate(cx - d2 * W * 0.4, base + d2 * H * 2); ctx.rotate(-d2 * 6); ctx.translate(-cx, -base);
    tank(cx, base - s * 8.5, s, s * 2.4, '2023');
    const hot = sep2 ? Math.max(0, 1 - (p - ev.sep2) * 12) : p > ev.sep1 ? 1 : 0;
    ctx.fillStyle = `rgb(${60 + hot * 190 | 0},${45 + hot * 70 | 0},${40})`;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.12, base - s * 6.1); ctx.lineTo(cx + s * 0.12, base - s * 6.1); ctx.lineTo(cx + s * 0.42, base - s * 5.1); ctx.lineTo(cx - s * 0.42, base - s * 5.1); ctx.fill();
    if (p > ev.sep1 + 0.015 && !sep2) flame(cx, base - s * 5.1, s * 0.84, s * 6, true, time);
    ctx.restore();
    // Payload with arrays
    ctx.fillStyle = '#d9a441'; ctx.fillRect(cx - s * 0.34, base - s * 9.6, s * 0.68, s * 0.9);
    const dep = sstep(ev.arr0, ev.arr1, p);
    if (dep > 0) {
      ctx.fillStyle = '#16305e'; ctx.strokeStyle = '#c3cad4'; ctx.lineWidth = 1;
      for (const side of [-1, 1]) for (let k = 0; k < 3; k++) {
        const x = cx + side * (s * 0.4 + k * s * 0.64 * dep) - (side < 0 ? s * 0.62 * dep : 0);
        ctx.fillRect(x, base - s * 9.45, s * 0.62 * dep, s * 0.6); ctx.strokeRect(x, base - s * 9.45, s * 0.62 * dep, s * 0.6);
      }
    }
    // Fairing halves
    for (const side of [-1, 1]) {
      const df = fair ? p - ev.fair : 0;
      ctx.save();
      ctx.translate(cx + side * (s * 0.56 + df * W * 1.4), base - s * 8.5 + df * H * 0.6);
      ctx.rotate(side * Math.min(1, df * 26) * 0.9 + side * df * 4);
      ctx.fillStyle = '#efeeea';
      // Hinge at the outer edge; the half runs in to the centreline and up to the nose.
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-side * s * 0.56, 0); ctx.lineTo(-side * s * 0.56, -s * 2.9);
      ctx.quadraticCurveTo(0, -s * 2.5, 0, -s * 1.05); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    canvas.style.opacity = String(1 - dim * 0.72);
  }

  function loop(t) { if (!running) return; draw(t / 1000); requestAnimationFrame(loop); }
  resize();
  return {
    setProgress(next, past) { target = Math.min(1, Math.max(0, next)); dimTarget = past ? 1 : 0; if (reducedMotion) draw(); },
    resize() { resize(); draw(); },
    start() { running = true; requestAnimationFrame(loop); },
    draw: () => draw(),
  };
}
