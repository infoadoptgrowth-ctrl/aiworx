/* Case study page: before/after viewer (scroll wipes, drag compares, number counts), results strip that draws
   its chart and counts up, and a reading rail that tracks Challenge → What we did → Result. */
import { $, $$, win, onTick, bootSection, magnetic, nearViewport, clamp01, reducedMotion, finePointer } from '../core.js';

const START = 0.85;
const RM = reducedMotion();

const sec = $('.rwcs');
const view = $('.rwcs-view', sec);
const handle = $('.rwcs-handle', sec);
const cursor = $('.rwcs-cur', sec);
const big = $('.rwcs-big', sec);
const strip = $('.rwcs-strip', sec);
const stripNum = $('.rwcs-ba b', sec);
const story = $('.rwcs-grid', sec);
const railItems = $$('.rwcs-rail ol li', sec);
const blocks = $$('.rwcs-blk', sec);

bootSection(sec);
magnetic(sec);

/* ---------------------------------------------------------- numbers */
function parse(s) {
  const m = String(s || '').trim().match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/);
  if (!m) return null;
  return { pre: m[1], n: parseFloat(m[2].replace(/,/g, '')), dec: (m[2].split('.')[1] || '').length, grp: m[2].includes(','), suf: m[3] };
}
const finalText = big?.textContent.trim() || stripNum?.textContent.trim() || '';
const fromText = $('.rwcs-ba s', sec)?.textContent.trim() || '';
const to = parse(finalText), from = parse(fromText);
const valueAt = (k) =>
  to ? `${to.pre}${(from ? from.n + (to.n - from.n) * k : to.n * k).toLocaleString('en-US', { minimumFractionDigits: to.dec, maximumFractionDigits: to.dec, useGrouping: to.grp || Math.abs(to.n) >= 1e4 })}${to.suf}` : finalText;

/* ---------------------------------------------------------- viewer */
const st = { mode: 'scroll', dv: RM ? 0.5 : START, man: 0.5 };
let lastText = '';
function setDv(v) {
  view.style.setProperty('--dv', v.toFixed(4));
  const k = clamp01((START - v) / 0.7);
  view.style.setProperty('--dt', k.toFixed(4));
  const txt = valueAt(k);
  if (big && txt !== lastText) big.textContent = lastText = txt;
  const pct = Math.round(v * 100);
  handle.setAttribute('aria-valuenow', String(pct));
  handle.setAttribute('aria-valuetext', `${100 - pct}% after`);
}
if (RM) {
  view.style.setProperty('--dv', '0.5');
  view.style.setProperty('--dt', '1');
  if (big) big.textContent = finalText;
} else {
  setDv(START);
  const near = nearViewport(view, '10% 0px 10% 0px');
  let top = 0, h = 1, vh = 1, last = -1;
  onTick(
    () => {
      if (!near.on) return;
      const span = Math.max(80, Math.min(vh * 0.76, vh * 0.88 - (vh * 0.7 - h)));
      const sp = clamp01((vh * 0.88 - top) / span);
      const target = st.mode === 'manual' ? st.man : START - 0.7 * sp;
      st.dv = st.mode === 'manual' || last < 0 ? target : st.dv + (target - st.dv) * 0.2;
      if (Math.abs(st.dv - target) < 6e-4) st.dv = target;
      if (Math.abs(st.dv - last) > 4e-4 || (st.dv === target && st.dv !== last)) {
        last = st.dv;
        setDv(st.dv);
      }
    },
    () => {
      if (!near.on) return;
      const r = view.getBoundingClientRect();
      top = r.top;
      h = r.height;
      vh = win.innerHeight || 1;
    },
  );
}

/* drag / keyboard compare */
const manual = (x) => {
  const r = view.getBoundingClientRect();
  st.mode = 'manual';
  st.man = Math.min(0.97, Math.max(0.03, (x - r.left) / r.width));
  if (RM) setDv(st.man);
};
let pid = -1, sx = 0, sy = 0, dragging = false, cx = 0, cy = 0, tx = 0, ty = 0, inside = false;
view.addEventListener('pointerdown', (e) => {
  if (e.target.closest?.('a')) return;
  pid = e.pointerId;
  sx = e.clientX;
  sy = e.clientY;
  dragging = e.pointerType === 'mouse' || e.target.closest?.('.rwcs-handle') !== null;
  if (!dragging) return;
  try {
    view.setPointerCapture(pid);
  } catch {}
  manual(e.clientX);
  view.classList.add('is-drag');
});
view.addEventListener('pointermove', (e) => {
  const r = view.getBoundingClientRect();
  tx = e.clientX - r.left;
  ty = e.clientY - r.top;
  if (!inside) (cx = tx), (cy = ty);
  inside = true;
  if (e.pointerId !== pid) return;
  if (!dragging && Math.abs(e.clientX - sx) > 8 && Math.abs(e.clientX - sx) > Math.abs(e.clientY - sy)) {
    dragging = true;
    try {
      view.setPointerCapture(pid);
    } catch {}
    view.classList.add('is-drag');
  }
  if (dragging) manual(e.clientX);
});
const end = () => {
  pid = -1;
  dragging = false;
  view.classList.remove('is-drag');
};
view.addEventListener('pointerup', end);
view.addEventListener('pointercancel', end);
view.addEventListener('pointerleave', () => (inside = false));
if (finePointer() && cursor)
  onTick(() => {
    if (!inside) return;
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;
    cursor.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
  });
handle.addEventListener('keydown', (e) => {
  let v = st.mode === 'manual' ? st.man : st.dv;
  const k = e.key;
  if (k === 'ArrowLeft' || k === 'ArrowDown') v -= 0.05;
  else if (k === 'ArrowRight' || k === 'ArrowUp') v += 0.05;
  else if (k === 'Home') v = 0.03;
  else if (k === 'End') v = 0.97;
  else if (k === 'PageDown') v -= 0.2;
  else if (k === 'PageUp') v += 0.2;
  else return;
  e.preventDefault();
  st.mode = 'manual';
  st.man = Math.min(0.97, Math.max(0.03, v));
  if (RM) setDv(st.man);
});

/* ---------------------------------------------------------- results strip */
if (strip && !RM) {
  sec.classList.remove('is-drawn');
  if (stripNum) stripNum.textContent = valueAt(0);
  const io = new IntersectionObserver(
    (e) => {
      if (!e[0].isIntersecting) return;
      io.disconnect();
      sec.classList.add('is-drawn');
      const t0 = performance.now();
      const step = (t) => {
        const k = clamp01((t - t0 - 250) / 1600);
        if (stripNum) stripNum.textContent = valueAt(1 - (1 - k) ** 3);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    { threshold: 0.4 },
  );
  io.observe(strip);
} else sec.classList.add('is-drawn');

/* ---------------------------------------------------------- reading rail */
if (story) {
  if (RM) {
    story.style.setProperty('--rp', '1');
    railItems.forEach((li) => li.classList.add('is-on'));
  } else {
    story.style.setProperty('--rp', '0');
    const near = nearViewport(story, '10% 0px 10% 0px');
    let top = 0, h = 1, vh = 1, tops = [], rp = -1, cur = -1;
    onTick(
      () => {
        if (!near.on) return;
        const p = clamp01((vh * 0.55 - top) / Math.max(1, h - vh * 0.3));
        if (Math.abs(p - rp) > 0.001) {
          rp = p;
          story.style.setProperty('--rp', p.toFixed(4));
        }
        let a = 0;
        tops.forEach((t, i) => t < vh * 0.55 && (a = i));
        if (a !== cur) {
          cur = a;
          railItems.forEach((li, i) => li.classList.toggle('is-on', i <= a));
        }
      },
      () => {
        if (!near.on) return;
        const r = story.getBoundingClientRect();
        top = r.top;
        h = r.height;
        vh = win.innerHeight || 1;
        tops = blocks.map((b) => b.getBoundingClientRect().top);
      },
    );
  }
}
