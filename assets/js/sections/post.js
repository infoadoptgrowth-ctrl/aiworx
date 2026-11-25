/* Blog article: share links (X, LinkedIn, copy link with a "Copied" confirmation) and a floating reading-progress
   ring that shows how far through the article you are and scrolls back to the top when tapped. */
import { $, win, onTick, bootSection, magnetic, clamp01, reducedMotion, scrollToTarget, whenInView, scrollProgress, onBreakpoint } from '../core.js';

const sec = $('.rwpo');
const art = $('.rwpo-art', sec);
const RM = reducedMotion();
const ICON_LINK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>';
const ICON_OK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

bootSection(sec, { staticFlags: RM ? [] : ['is-set'], threshold: 0.05 });
magnetic(sec);

/* ---------------------------------------------------------- cover: opens from a circle, then drifts with scroll */
const um = $('.rwpo-cov .rw-um', sec);
if (um) {
  const open = () => {
    um.style.clipPath = um.style.webkitClipPath = 'circle(75% at 50% 55%)';
    um.classList.add('is-on');
  };
  if (RM) open();
  else {
    whenInView(um.parentElement, open, 0.15); // observe the frame: the clipped image itself never "intersects"
    scrollProgress(um, null, { targets: [um] });
  }
}

/* ---------------------------------------------------------- share rail: a sticky column on desktop, a row above the text below 1100px */
const side = $('.rwpo-side', sec);
if (side) onBreakpoint((v) => side.classList.toggle('is-row', v.w < 1100));

/* ---------------------------------------------------------- share */
const url = location.href;
const title = $('.rwpo-h', sec)?.getAttribute('aria-label') || document.title;
const [x, li] = sec.querySelectorAll('.rwpo-sh a.rwpo-si');
if (x) x.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
if (li) li.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

const copy = $('.rwpo-copy', sec);
if (copy) {
  let timer = 0;
  copy.addEventListener('click', async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      // fallback for browsers without async clipboard access
      const ta = Object.assign(document.createElement('textarea'), { value: url });
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand('copy');
      } catch {}
      ta.remove();
    }
    if (!ok) return;
    copy.classList.add('is-ok');
    $('.rwpo-ci', copy).innerHTML = ICON_OK;
    $('.rwpo-ct', copy).textContent = 'Copied';
    clearTimeout(timer);
    timer = setTimeout(() => {
      copy.classList.remove('is-ok');
      $('.rwpo-ci', copy).innerHTML = ICON_LINK;
      $('.rwpo-ct', copy).textContent = 'Copy link';
    }, 2200);
  });
}

/* ---------------------------------------------------------- reading progress ring (fixed, bottom corner) */
if (art) {
  const C = 2 * Math.PI * 26;
  const ring = document.createElement('button');
  ring.type = 'button';
  ring.className = 'rwpo-ring';
  ring.dataset.on = '0';
  ring.tabIndex = -1;
  ring.setAttribute('aria-label', 'Back to top');
  ring.style.setProperty('--rp', '0');
  ring.innerHTML = `<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26" class="rwpo-rb"></circle><circle cx="30" cy="30" r="26" class="rwpo-rf" style="stroke-dasharray:${C};--c:${C}"></circle></svg>
    <span class="rwpo-rn f-m"><b>0</b><small>%</small></span>
    <span class="rwpo-ru" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></span>`;
  document.body.appendChild(ring);
  ring.addEventListener('click', () => scrollToTarget(sec));
  const num = $('b', ring);
  let top = 0, h = 1, vh = 1, p = -1, shown = '', pct = -1;
  onTick(
    () => {
      const t = clamp01((vh * 0.55 - top) / h);
      const on = top < vh * 0.7 && top + h > vh * 0.25 ? '1' : '0';
      if (on !== shown) {
        shown = on;
        ring.dataset.on = on;
        ring.tabIndex = on === '1' ? 0 : -1;
      }
      if (Math.abs(t - p) < 0.001) return;
      p = t;
      ring.style.setProperty('--rp', t.toFixed(4));
      const n = Math.round(t * 100);
      if (n !== pct) num.textContent = String((pct = n));
    },
    () => {
      const r = art.getBoundingClientRect();
      top = r.top;
      h = r.height || 1;
      vh = win.innerHeight || 1;
    },
  );
}
