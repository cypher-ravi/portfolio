// The page's motion, in one place: smooth scrolling, headlines that rise word by word,
// sections that fade up once, and a header that settles in after the hero.
// Everything is skipped under prefers-reduced-motion, and content is visible without JS.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Run work once the browser is idle, after first paint. */
export function revealAfter(fn: () => void) {
  if ('requestIdleCallback' in window) requestIdleCallback(() => fn(), { timeout: 1200 });
  else setTimeout(fn, 200);
}

// Wrap each word of [data-split] in a mask so it can slide up into view. Keeps inline tags such as <em>.
function split(el: HTMLElement) {
  let i = 0;
  const walk = (node: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const part of (child.textContent ?? '').split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { frag.append(part); continue; }
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('span');
          inner.textContent = part;
          inner.style.setProperty('--i', String(i++));
          w.append(inner);
          frag.append(w);
        }
        child.replaceWith(frag);
      } else walk(child);
    }
  };
  walk(el);
}

export function initMotion() {
  // Header: transparent over the hero, a quiet bar after it.
  const bar = document.getElementById('bar');
  const onScroll = () => bar?.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (reduced() || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js-reveal');
  document.querySelectorAll<HTMLElement>('[data-split]').forEach(split);
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  document.querySelectorAll('[data-reveal], [data-split]').forEach((el) => io.observe(el));

  // Smooth, weighted scrolling. Anchor links glide; a modal dialog pauses it.
  const lenis = new Lenis({ autoRaf: true, anchors: { offset: -64 }, lerp: 0.1, prevent: (n) => !!n.closest('dialog') });
  document.addEventListener('lenis:stop', () => lenis.stop());
  document.addEventListener('lenis:start', () => lenis.start());
}
