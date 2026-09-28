// Headings marked data-decode resolve out of noise, like a signal locking in.
// The real text is in the HTML from the start, so no-JS readers, crawlers and
// reduced-motion users just see it.

const NOISE = '▚▞▖▗▘▝░▒▓01';
const DURATION_MS = 700;

function scramble(el: HTMLElement) {
  const target = el.textContent ?? '';
  if (!target.trim()) return;
  el.setAttribute('aria-label', target);
  const start = performance.now();

  const frame = (now: number) => {
    const progress = Math.min(1, (now - start) / DURATION_MS);
    const locked = Math.floor(target.length * progress);
    let out = target.slice(0, locked);
    for (let i = locked; i < target.length; i++) {
      out += target[i] === ' ' ? ' ' : NOISE[(Math.random() * NOISE.length) | 0];
    }
    el.textContent = out;
    if (progress < 1) requestAnimationFrame(frame);
    else {
      el.textContent = target;
      el.removeAttribute('aria-label');
    }
  };
  requestAnimationFrame(frame);
}

export function decodeAll() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = document.querySelectorAll<HTMLElement>('[data-decode]');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        scramble(e.target as HTMLElement);
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => io.observe(el));
}
