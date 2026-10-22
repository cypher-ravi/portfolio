// The flight drawn as vector shapes (SVG), so it looks the same in every browser with or without a GPU.
// Shaded paint, carbon interstage, plumes, fairing, gold-foil payload.
const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const L = (a, b, k) => a + (b - a) * k;
const f = (n) => n.toFixed(2);

const PANELS = '<rect x="6" y="0" width="42" height="64" fill="url(#mv-cells)" stroke="#c3cad4"/><rect x="50" y="0" width="42" height="64" fill="url(#mv-cells)" stroke="#c3cad4"/><rect x="94" y="0" width="42" height="64" fill="url(#mv-cells)" stroke="#c3cad4"/><path d="M6 21H136M6 43H136M27 0V64M71 0V64M115 0V64" stroke="#5a7cc4" stroke-width=".5" opacity=".7"/><line x1="0" y1="32" x2="6" y2="32" stroke="#c9cdd4" stroke-width="2"/>';
const BELL = (x0, x1, x2, x3, y) => `<path d="M${x0} 838L${x1} 838L${x2} ${y}L${x3} ${y}Z" fill="url(#mv-bell)"/>`;
const FIN = (s) => `<g fill="none" stroke="#3b3e45" stroke-width="1.4"><rect x="${s < 0 ? -52 : 32}" y="324" width="20" height="16"/><path d="M${s * 37} 324V340M${s * 42} 324V340M${s * 47} 324V340M${s * 32} 332H${s * 52}"/></g>`;
const PAINT = (id, w) => `<linearGradient id="${id}" x1="${-w}" x2="${w}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6f6e6a"/><stop offset=".16" stop-color="#b9b8b3"/><stop offset=".36" stop-color="#fbfaf6"/><stop offset=".58" stop-color="#e9e8e3"/><stop offset=".84" stop-color="#a3a29d"/><stop offset="1" stop-color="#5d5c59"/></linearGradient>`;
const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (n) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); };
  return `<circle cx="${f(r(1) * 1280)}" cy="${f(r(2) * 720)}" r="${f(0.5 + r(3) * 0.9)}" opacity="${f(0.3 + r(4) * 0.7)}"/>`;
}).join('');

const TEMPLATE = `
<defs>
<linearGradient id="mv-atmo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a33"/><stop offset=".6" stop-color="#1f4c88"/><stop offset="1" stop-color="#6aa4dc"/></linearGradient>
<radialGradient id="mv-earth" cx=".42" cy=".08" r=".6"><stop offset="0" stop-color="#2f6fb0"/><stop offset=".5" stop-color="#143c6e"/><stop offset="1" stop-color="#061427"/></radialGradient>
${PAINT('mv-paint', 32)}${PAINT('mv-fair', 38)}
<linearGradient id="mv-carbon" x1="-34" x2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0d0e11"/><stop offset=".35" stop-color="#3a3d44"/><stop offset=".55" stop-color="#25272c"/><stop offset="1" stop-color="#08090b"/></linearGradient>
<linearGradient id="mv-soot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2420" stop-opacity="0"/><stop offset=".55" stop-color="#2b2420" stop-opacity=".35"/><stop offset="1" stop-color="#1a1512" stop-opacity=".78"/></linearGradient>
<linearGradient id="mv-bell"><stop offset="0" stop-color="#1c1411"/><stop offset=".4" stop-color="#7d5c4a"/><stop offset=".6" stop-color="#4a3428"/><stop offset="1" stop-color="#120d0b"/></linearGradient>
<linearGradient id="mv-nb"><stop offset="0" stop-color="#2a2a2e"/><stop offset=".45" stop-color="#9a9aa2"/><stop offset="1" stop-color="#1d1d21"/></linearGradient>
<linearGradient id="mv-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5413"/><stop offset=".3" stop-color="#e8b84a"/><stop offset=".5" stop-color="#b8862a"/><stop offset=".75" stop-color="#f3cd6b"/><stop offset="1" stop-color="#6a470f"/></linearGradient>
<linearGradient id="mv-cells" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2f5e"/><stop offset=".5" stop-color="#2c4f96"/><stop offset="1" stop-color="#14244a"/></linearGradient>
<linearGradient id="mv-flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset=".12" stop-color="#ffe2a8"/><stop offset=".4" stop-color="#ff9a3c" stop-opacity=".85"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></linearGradient>
<linearGradient id="mv-vac" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7ff" stop-opacity=".95"/><stop offset=".18" stop-color="#b9c9ff" stop-opacity=".45"/><stop offset="1" stop-color="#6f86ff" stop-opacity="0"/></linearGradient>
<radialGradient id="mv-planet" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffd2a1"/><stop offset=".55" stop-color="#c46a3a"/><stop offset="1" stop-color="#3a160b"/></radialGradient>
<filter id="mv-blur" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="mv-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="mv-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<rect x="-2000" y="-1000" width="5280" height="3000" fill="#030408"/>
<g data-k="stars" fill="#e8ecf2">${STARS}<g transform="translate(1280 0)">${STARS}</g><g transform="translate(-1280 0)">${STARS}</g></g>
<rect data-k="atmo" x="-2000" y="-1000" width="5280" height="3000" fill="url(#mv-atmo)"/>
<circle data-k="earthGlow" fill="none" stroke="#7fb6ff" stroke-width="18" opacity=".35" filter="url(#mv-soft)"/>
<circle data-k="earth" fill="url(#mv-earth)"/>
<circle data-k="earthRim" fill="none" stroke="#a9d2ff" stroke-width="2" opacity=".7"/>
<g data-k="traj">
<path data-k="trajPath" fill="none" stroke="#8fd3ff" stroke-width="1.5" stroke-dasharray="6 8" opacity=".8"/>
<circle cx="1160" cy="150" r="30" fill="url(#mv-planet)"/><circle cx="1160" cy="150" r="34" fill="none" stroke="#ffb35c" opacity=".5"/>
</g>
<g data-k="ground">
<g data-k="tower">
<rect x="866" y="166" width="22" height="434" fill="none" stroke="#b5463a" stroke-width="2"/>
<path d="${Array.from({ length: 20 }, (_, i) => `M${i % 2 ? 888 : 866} ${186 + i * 20}L${i % 2 ? 866 : 888} ${206 + i * 20}`).join('')}" stroke="#b5463a" stroke-width="1.2"/>
<path d="M866 230H842M866 330H842" stroke="#8f3a30" stroke-width="3"/>
<rect x="700" y="600" width="260" height="10" fill="#2a2f38"/>
</g>
<g data-k="smoke" fill="#d9d6d0" filter="url(#mv-soft)"><ellipse data-k="smokeL" cy="596" ry="34"/><ellipse data-k="smokeR" cy="596" ry="34"/><ellipse cx="820" cy="606" rx="120" ry="30"/></g>
</g>
<g data-k="ship">
<g data-k="s1">
<g data-k="p1"><path data-k="p1Outer" fill="url(#mv-flame)" filter="url(#mv-blur)"/><path data-k="p1Core" fill="#fff6e3" filter="url(#mv-glow)"/>
<g data-k="diamonds" fill="#fff" filter="url(#mv-glow)"><ellipse cy="912" rx="9" ry="5"/><ellipse cy="950" rx="7" ry="4"/><ellipse cy="984" rx="5" ry="3"/></g></g>
<rect x="-32" y="372" width="64" height="448" fill="url(#mv-paint)"/><rect x="-32" y="600" width="64" height="220" fill="url(#mv-soot)"/>
<path d="M-32 470H32M-32 640H32" stroke="#8d8c88" stroke-width=".8" opacity=".55"/>
<rect x="-27" y="380" width="5" height="432" fill="#c9c8c3" stroke="#77766f" stroke-width=".6"/>
<text x="0" y="560" transform="rotate(-90 4 560)" text-anchor="middle" font-family="Space Grotesk Variable, sans-serif" font-weight="700" font-size="22" letter-spacing="3" fill="#1a1c20">RAVI-1</text>
<path d="M-32 712L-39 716L-41 836L-32 836ZM32 712L39 716L41 836L32 836Z" fill="url(#mv-carbon)"/>
<rect x="-34" y="820" width="68" height="18" fill="url(#mv-carbon)"/>
${BELL(-27, -17, -14, -30, 870)}${BELL(-8, 8, 11, -11, 872)}${BELL(17, 27, 30, 14, 870)}
<rect data-k="heat1" x="-34" y="836" width="68" height="4" fill="#ff8a3c" filter="url(#mv-glow)"/>
<rect x="-32" y="318" width="64" height="54" fill="url(#mv-carbon)"/>${FIN(-1)}${FIN(1)}
</g>
<g data-k="puff" fill="#eef3ff" filter="url(#mv-glow)"><ellipse data-k="puffL" cx="-44" cy="372" ry="6"/><ellipse data-k="puffR" cx="44" cy="372" ry="6"/></g>
<g data-k="vent" fill="#fff" filter="url(#mv-blur)"><ellipse cx="-46" cy="340" rx="22" ry="10"/><ellipse cx="44" cy="250" rx="18" ry="8"/></g>
<g data-k="s2">
<g data-k="p2"><path data-k="p2Outer" fill="url(#mv-vac)" filter="url(#mv-blur)"/><path data-k="p2Core" fill="#f4f7ff" opacity=".9" filter="url(#mv-glow)"/></g>
<path data-k="mvac" d="M-10 318L10 318L22 372L-22 372Z" fill="url(#mv-nb)"/>
<path data-k="heat2" d="M-10 318L10 318L22 372L-22 372Z" fill="#ff7a2c" filter="url(#mv-glow)"/>
<rect x="-32" y="158" width="64" height="160" fill="url(#mv-paint)"/><path d="M-32 240H32" stroke="#8d8c88" stroke-width=".8" opacity=".6"/>
<rect x="-32" y="150" width="64" height="8" fill="url(#mv-carbon)"/>
</g>
<g>
<path d="M-28 150L28 150L20 138L-20 138Z" fill="url(#mv-carbon)"/>
<rect x="-24" y="56" width="48" height="82" fill="url(#mv-gold)"/>
<path d="M-24 74L24 70M-24 96L24 100M-24 118L24 114" stroke="#8a5f17" stroke-width=".7" opacity=".7"/>
<rect x="-26" y="52" width="52" height="5" fill="#c9cdd4"/><rect x="-28" y="60" width="4" height="70" fill="#1d2c52"/><rect x="24" y="60" width="4" height="70" fill="#1d2c52"/>
<g data-k="dish"><line x1="0" y1="52" x2="0" y2="38" stroke="#c9cdd4" stroke-width="2"/><path d="M-16 38Q0 22 16 38Z" fill="#e7e9ee" stroke="#9aa0aa"/></g>
<g data-k="arrays"><g data-k="wingR">${PANELS}</g><g data-k="wingL">${PANELS}</g></g>
</g>
<g data-k="fairing">
<path data-k="fairL" d="M0 0C-22 10-38 58-38 118L-38 150L0 150Z" fill="url(#mv-fair)"/>
<path data-k="fairR" d="M0 0C22 10 38 58 38 118L38 150L0 150Z" fill="url(#mv-fair)"/>
</g>
</g>`;

/** @param {{ events: Record<string, number>, reducedMotion: boolean }} o  The caller places `el` in the page. */
export function createMissionVector({ events: ev, reducedMotion }) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'mission-vector');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.innerHTML = TEMPLATE;
  const el = {};
  svg.querySelectorAll('[data-k]').forEach((n) => { el[n.dataset.k] = n; });
  const set = (k, a, v) => el[k].setAttribute(a, v);

  // The page's scroll progress, mapped onto the flight's timeline (the same events the 3D scene uses).
  const knots = [[0, 0.04], [ev.sep1, 0.27], [ev.fair, 0.36], [ev.sep2, 0.6], [ev.arr0, 0.7], [ev.arr1, 0.8], [ev.wide, 0.84], [1, 1]];
  const timeline = (p) => {
    for (let i = 1; i < knots.length; i++) {
      const [p0, t0] = knots[i - 1], [p1, t1] = knots[i];
      if (p <= p1) return L(t0, t1, p1 > p0 ? (p - p0) / (p1 - p0) : 1);
    }
    return 1;
  };

  let target = 0, p = 0, dim = 0, dimTarget = 0, running = false, last = 0, clock = 0, narrow = false;

  function resize() {
    const W = innerWidth, H = innerHeight;
    narrow = W < 760;
    // Wide screens: the ship sits right of the text. Phones: a wider view centred on the ship, high above the copy.
    const vh = narrow ? 1000 : 720, vw = (vh * W) / H;
    const x0 = narrow ? 820 - vw / 2 : 640 - vw / 2;
    svg.setAttribute('viewBox', `${f(x0)} ${narrow ? 60 : 0} ${f(vw)} ${vh}`);
  }

  function frame(t) {
    const flick = 1 + 0.05 * Math.sin(clock * 47) + 0.03 * Math.sin(clock * 83);
    const z = L(L(0.5, 1.05, ss(0.6, 0.72, t)), 0.55, ss(0.84, 0.92, t));
    const pivot = L(434, 100, ss(0.58, 0.68, t));
    const rise = ss(0.07, 0.14, t);
    const shake = t > 0.05 && t < 0.25 && !reducedMotion ? Math.sin(clock * 60) * 0.8 : 0;
    const cx = L(820, narrow ? 820 : 700, ss(0.84, 0.92, t)) + shake;
    const cy = L(L(381, 330, rise), 450, ss(0.84, 0.92, t));
    const pitch = 24 * ss(0.1, 0.3, t) + 22 * ss(0.6, 0.76, t);
    set('ship', 'transform', `translate(${f(cx)} ${f(cy)}) rotate(${f(pitch)}) scale(${f(z)}) translate(0 ${f(-pivot)})`);

    const space = ss(0.08, 0.24, t);
    const earthR = L(9000, 1500, ss(0.07, 0.32, t));
    const horizon = L(600, 690, ss(0.07, 0.32, t)) + L(0, 40, ss(0.84, 0.95, t));
    set('stars', 'opacity', f(L(0.15, 1, space)));
    set('atmo', 'opacity', f(1 - space));
    for (const k of ['earthGlow', 'earth', 'earthRim']) { set(k, 'cx', 640); set(k, 'cy', f(horizon + earthR)); set(k, 'r', f(earthR)); }
    set('ground', 'transform', `translate(0 ${f(1500 * Math.pow(ss(0.07, 0.24, t), 1.4))})`);
    set('tower', 'opacity', f(1 - ss(0.1, 0.16, t)));
    const grow = ss(0.05, 0.16, t);
    set('smoke', 'opacity', f(ss(0.05, 0.075, t) * (1 - ss(0.14, 0.24, t)) * 0.85));
    set('smokeL', 'cx', f(820 - L(60, 300, grow))); set('smokeR', 'cx', f(820 + L(60, 300, grow)));
    set('smokeL', 'rx', f(L(70, 220, grow))); set('smokeR', 'rx', f(L(70, 220, grow)));
    set('vent', 'opacity', f(0.45 * (1 - ss(0.045, 0.06, t))));

    // Stage 1 burns, cuts off, then falls back and tumbles.
    const p1 = ss(0.05, 0.06, t) * (1 - ss(0.245, 0.255, t));
    const air = ss(0.07, 0.25, t);
    const len1 = L(260, 560, air) * flick, w1 = L(80, 380, air);
    const k1 = Math.max(0, t - 0.27);
    set('s1', 'transform', `translate(${f(-380 * k1)} ${f(1800 * k1 + 6000 * k1 * k1)}) rotate(${f(k1 * 260)} 0 600)`);
    set('s1', 'opacity', f(1 - ss(0.33, 0.42, t)));
    set('p1', 'opacity', f(p1));
    set('p1Outer', 'd', `M-34 872L34 872L${f(w1 / 2)} ${f(872 + len1)}L${f(-w1 / 2)} ${f(872 + len1)}Z`);
    set('p1Core', 'd', `M-20 872L20 872L${f(w1 / 7)} ${f(872 + len1 * 0.35)}L${f(-w1 / 7)} ${f(872 + len1 * 0.35)}Z`);
    set('diamonds', 'opacity', f(p1 * (1 - air) * 0.85));
    set('heat1', 'opacity', f(p1 * 0.9));
    set('puff', 'opacity', f(ss(0.266, 0.272, t) * (1 - ss(0.285, 0.31, t))));
    const puff = f(L(6, 30, ss(0.266, 0.31, t)));
    set('puffL', 'rx', puff); set('puffR', 'rx', puff);

    // Stage 2: a wide vacuum plume, cut-off, then it drifts away.
    const p2 = ss(0.3, 0.31, t) * (1 - ss(0.575, 0.585, t));
    const len2 = 600 * flick;
    const k2 = Math.max(0, t - 0.6);
    set('s2', 'transform', `translate(${f(-300 * k2)} ${f(1500 * k2 + 4000 * k2 * k2)}) rotate(${f(-140 * k2)} 0 240)`);
    set('s2', 'opacity', f(1 - ss(0.66, 0.74, t)));
    set('p2', 'opacity', f(p2));
    set('p2Outer', 'd', `M-22 372L22 372L280 ${f(372 + len2)}L-280 ${f(372 + len2)}Z`);
    set('p2Core', 'd', `M-16 372L16 372L6 ${f(372 + len2 * 0.25)}L-6 ${f(372 + len2 * 0.25)}Z`);
    set('mvac', 'opacity', f(ss(0.266, 0.272, t)));
    set('heat2', 'opacity', f(Math.max(p2 * 0.75, t > 0.3 ? 0.6 * (1 - ss(0.58, 0.66, t)) : 0)));

    // The fairing halves swing open on their hinges and drift off.
    const kf = Math.max(0, t - 0.36);
    const open = 75 * ss(0.36, 0.39, t) + kf * 120;
    set('fairing', 'opacity', f(1 - ss(0.43, 0.5, t)));
    set('fairL', 'transform', `translate(${f(-1400 * kf)} ${f(300 * kf)}) rotate(${f(-open)} -38 150)`);
    set('fairR', 'transform', `translate(${f(1400 * kf)} ${f(300 * kf)}) rotate(${f(open)} 38 150)`);

    // Arrays unfold, the dish swings up.
    const d = Math.max(0.01, ss(0.7, 0.8, t)), dish = ss(0.74, 0.82, t);
    set('arrays', 'opacity', d > 0.02 ? 1 : 0);
    set('wingR', 'transform', `translate(28 62) scale(${f(d)} 1)`);
    set('wingL', 'transform', `translate(-28 62) scale(${f(-d)} 1)`);
    set('dish', 'transform', `rotate(${f(L(-90, 0, dish))} 0 52)`);
    set('dish', 'opacity', f(dish));

    set('traj', 'opacity', f(ss(0.84, 0.9, t)));
    set('trajPath', 'd', `M${f(cx)} ${f(cy)}Q980 520 1160 150`);
    svg.style.opacity = String(1 - dim * 0.72);
  }

  function draw() {
    const now = performance.now();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    clock += dt;
    const ease = reducedMotion || !dt ? 1 : 1 - Math.exp(-dt * 6);
    p += (target - p) * ease;
    dim += (dimTarget - dim) * (reducedMotion || !dt ? 1 : 1 - Math.exp(-dt * 4));
    frame(timeline(p));
  }

  function loop() { if (!running) return; draw(); requestAnimationFrame(loop); }
  resize();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else if (!reducedMotion && !running) { running = true; last = 0; requestAnimationFrame(loop); }
  });

  return {
    setProgress(next, past) { target = Math.min(1, Math.max(0, next)); dimTarget = past ? 1 : 0; if (reducedMotion) draw(); },
    resize() { resize(); draw(); },
    start() { running = true; requestAnimationFrame(loop); },
    draw,
    el: svg,
  };
}
