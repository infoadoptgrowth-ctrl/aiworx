/* Client reviews: a lock-screen where review notifications stack in as you scroll. */
import { $, $$, win, onTick, onBreakpoint, bootSection, magnetic, nearViewport, clamp01, reducedMotion } from '../core.js';

const sec = $('.rwrv');
const lock = $('.rwrv-lock', sec);
const stack = $('.rwrv-stack', sec);
const newCount = $('.rwrv-new b', sec);
const newLabel = $('.rwrv-new', sec);
const notes = $$('.rwrv-note', stack).reverse(); // DOM is newest-last; index = review order
const H = notes.length;
const TIMES = ['now', '2m ago', '9m ago', '26m ago', '1h ago', '3h ago'];
const RM = reducedMotion();

bootSection(sec);
magnetic(sec);

let gap = 168;
let shown = RM ? H : 0;

function layout() {
  notes.forEach((li, t) => {
    const inn = t < shown;
    const r = inn ? shown - 1 - t : -1;
    const depth = Math.max(0, r - 2);
    const y = r < 0 ? -70 : Math.min(r, 2) * gap + Math.min(depth, 3) * 12;
    const sc = r < 0 ? 0.9 : 1 - Math.min(depth, 3) * 0.045;
    const op = r < 0 || depth > 2 ? 0 : 1 - depth * 0.14;
    li.classList.toggle('is-in', inn);
    li.classList.toggle('is-new', r === 0);
    li.tabIndex = inn && r <= 2 ? 0 : -1;
    if (!inn || op === 0) li.setAttribute('aria-hidden', 'true');
    else li.removeAttribute('aria-hidden');
    li.style.transform = `translate3d(0,${y}px,0) scale(${sc})`;
    li.style.opacity = String(op);
    li.style.zIndex = String(20 - Math.max(0, r));
    const when = $('.rwrv-when', li);
    if (when) when.textContent = TIMES[Math.max(0, r)] || TIMES[TIMES.length - 1];
  });
  newCount.textContent = String(shown);
  newLabel.lastChild.nodeValue = shown === 1 ? ' new review' : ' new reviews';
}

onBreakpoint((v) => {
  gap = v.ph ? 204 : 168;
  stack.style.height = `${gap * 2 + 30 + (v.ph ? 196 : 156)}px`;
  layout();
});

if (!RM) {
  let focused = false;
  lock.addEventListener('focusin', () => (focused = true));
  lock.addEventListener('focusout', (e) => !lock.contains(e.relatedTarget) && (focused = false));
  const near = nearViewport(lock, '30% 0px 30% 0px');
  let top = 0, vh = 1;
  onTick(
    () => {
      if (!near.on || focused) return;
      const p = clamp01((vh * 0.9 - top) / (vh * 0.62));
      const n = Math.max(0, Math.min(H, Math.floor(p * H + 0.35)));
      if (n !== shown) {
        shown = n;
        layout();
      }
    },
    () => {
      if (!near.on) return;
      top = lock.getBoundingClientRect().top;
      vh = win.innerHeight || 1;
    },
  );
}
