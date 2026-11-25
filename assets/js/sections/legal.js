/* Privacy / Terms / Cookies: a sticky contents rail (desktop) or a fold-out contents box (tablet/phone) that
   tracks the section you are reading, a reading-progress bar, and smooth jumps to each heading. */
import { $, $$, win, onTick, onBreakpoint, bootSection, magnetic, clamp01, reducedMotion, scrollToTarget } from '../core.js';

const sec = $('.rwlg', document);
const side = $('.rwlg-side', sec);
const body = $('.rwlg-body', sec);
const toc = $('.rwlg-toc', sec);
const k = $('.rwlg-k', sec)?.textContent || 'On this page';
const RM = reducedMotion();

bootSection(sec, { threshold: 0.02 });
magnetic(sec);

/* the Privacy / Terms / Cookies switcher marks the current page */
// compare without ".html": hosts with clean URLs (Vercel) serve privacy.html at /privacy
const bare = (p) => p.split(/[?#]/)[0].split('/').pop().replace(/\.html$/, '') || 'index';
const here = bare(location.pathname);
$$('.rwlg-pages a', sec).forEach((a) => (bare(a.getAttribute('href')) === here ?a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));

const items = $$('li', toc);
const targets = items.map((li) => document.getElementById($('a', li).getAttribute('href').slice(1))).filter(Boolean);

/* tablet / phone: contents live in a <details> fold above the text */
let fold = null;
function buildFold() {
  fold = document.createElement('details');
  fold.className = 'rwlg-fold';
  fold.innerHTML = `<summary class="f-m"><span>${k}</span><span class="rwlg-fc">${targets.length}</span><span class="rwlg-fcur"></span><i aria-hidden="true"></i></summary><div hidden></div>`;
  const box = $('div', fold);
  fold.addEventListener('toggle', () => (box.hidden = !fold.open));
  body.prepend(fold);
}
onBreakpoint((v) => {
  const compact = v.w < 1100;
  if (compact && !fold) buildFold();
  if (compact) $('div', fold).appendChild(toc);
  else if (side) $('.rwlg-rail', side).appendChild(toc);
  if (side) side.hidden = compact;
  if (fold) fold.hidden = !compact;
});

/* jump to a heading, leaving room for the header */
toc.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  const t = document.getElementById(a.getAttribute('href').slice(1));
  if (!t) return;
  e.preventDefault();
  e.stopPropagation();
  const l = win.__aiLenis;
  if (l) l.scrollTo(t, { offset: -120 });
  else win.scrollTo({ top: t.getBoundingClientRect().top + win.scrollY - 120, behavior: RM ? 'auto' : 'smooth' });
  try {
    history.replaceState(null, '', a.getAttribute('href'));
  } catch {}
  if (fold) fold.open = false;
});
void scrollToTarget;

/* current section + reading progress */
let cur = -1, rp = -1, tops = [], top = 0, h = 1, vh = 1, ok = false;
const setCur = (n) => {
  if (n === cur) return;
  cur = n;
  items.forEach((li, i) => {
    li.className = i === n ? 'is-cur' : i < n ? 'is-past' : '';
    const a = $('a', li);
    i === n ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current');
  });
  const fc = fold && $('.rwlg-fcur', fold);
  if (fc) fc.textContent = $('.rwlg-tt', items[n])?.textContent || '';
};
onTick(
  () => {
    if (!ok) return;
    const line = Math.min(180, vh * 0.3);
    let n = 0;
    tops.forEach((t, i) => t < line && (n = i));
    if (tops.length && top + h < vh * 0.9) n = tops.length - 1;
    setCur(n);
    const p = clamp01((line - top) / Math.max(1, h - vh * 0.5));
    if (Math.abs(p - rp) > 0.001) {
      rp = p;
      // only the progress rail (desktop) and the fold (compact) read --rp
      for (const el of [side, fold]) el?.style.setProperty('--rp', p.toFixed(4));
    }
  },
  () => {
    vh = win.innerHeight;
    const r = body.getBoundingClientRect();
    ok = !(r.bottom < -200 || r.top > vh + 200);
    if (!ok) return;
    top = r.top;
    h = r.height;
    tops = targets.map((t) => t.getBoundingClientRect().top);
  },
);
