/* The numbers: lime panel with a dark client report. Odometer digits roll in, sparklines draw,
   hovering a sparkline shows the month value. */
import { $, $$, bootSection, whenInView, scrollProgress, reducedMotion } from '../core.js';

const sec = $('.rwnm');
const dash = $('.rwnm-dash', sec);
const tiles = $$('.rwnm-tile', sec);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RM = reducedMotion();

bootSection(sec);
if (!RM) sec.classList.add('is-live');
sec.addEventListener('rw:on', () => sec.classList.add('is-in'));
/* sparklines draw with scroll — only the four chart svgs receive --sp */
if (!RM) scrollProgress(sec, null, { targets: $$('.rwnm-sp svg', sec) });

/* odometers: reels sit at 0 until the report scrolls in, then step to their digit */
const odos = $$('.rwnm-odo', sec);
function setOdo(odo, on) {
  const text = odo.getAttribute('aria-label') || '';
  const digits = text.split('').filter((c) => /\d/.test(c));
  $$('.rwnm-od > span', odo).forEach((reel, i) => {
    const target = on ? 10 + Number(digits[i]) : 0;
    const steps = Math.max(1, target);
    reel.style.transitionDelay = `${i * 60}ms`;
    reel.style.transitionTimingFunction = `steps(${steps}, end)`;
    reel.style.transitionDuration = `${Math.min(0.95, 0.045 * steps + 0.05)}s`;
    reel.style.transform = `translateY(${-target * 5}%)`;
  });
}
odos.forEach((o) => setOdo(o, RM));
whenInView(
  dash,
  () => {
    dash.classList.add('is-on');
    odos.forEach((o) => setOdo(o, true));
  },
  0.3,
);

/* sparkline data (same seeded curve the paths were drawn from) */
function parse(s) {
  const m = String(s || '').trim().match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/);
  if (!m) return null;
  return { pre: m[1], n: parseFloat(m[2].replace(/,/g, '')), dec: (m[2].split('.')[1] || '').length, suf: m[3] };
}
function hash(s) {
  let t = 11;
  for (let i = 0; i < s.length; i++) t = (t * 33 + s.charCodeAt(i)) >>> 0;
  return t;
}
function series(value, key, up = true) {
  const p = parse(value);
  if (!p) return null;
  const h = hash(key), vals = [];
  for (let e = 0; e < 12; e++) {
    const t = e / 11;
    const base = up ? 0.3 + 0.7 * t ** 1.35 : 1 - 0.55 * t ** 1.2;
    const j = e === 11 ? 0 : ((((h >> (e * 2)) & 7) - 3.5) / 3.5) * 0.06;
    vals.push(p.n * Math.max(0.05, base + j));
  }
  return { vals, p };
}
const fmt = (v, p) => `${p.pre}${v.toLocaleString('en-US', { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec })}${p.suf}`;

tiles.forEach((tile, k) => {
  const svg = $('.rwnm-sp svg', tile);
  if (!svg) return;
  const value = $('.rwnm-odo', tile).getAttribute('aria-label');
  const label = $('.rwnm-lab', tile).lastChild.textContent.trim();
  const s = series(value, label + k, true);
  if (!s) return;
  const hi = Math.max(...s.vals), lo = Math.min(...s.vals) * 0.9;
  const pts = s.vals.map((v, i) => [(i / 11) * 300, 74 - ((v - lo) / Math.max(1e-6, hi - lo)) * 66]);
  const wrap = $('.rwnm-sp', tile);
  let pt = null, tt = null, cur = -1;
  const clear = () => {
    pt?.remove();
    tt?.remove();
    pt = tt = null;
    cur = -1;
  };
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    const i = Math.max(0, Math.min(11, Math.round(((e.clientX - r.left) / Math.max(1, r.width)) * 11)));
    if (i === cur) return;
    cur = i;
    if (!pt) {
      pt = document.createElement('i');
      pt.className = 'rwnm-pt';
      tt = document.createElement('span');
      tt.className = 'rwnm-tt f-m';
      wrap.insertBefore(tt, $('.rwnm-ax', wrap));
      wrap.insertBefore(pt, tt);
    }
    const left = `${(pts[i][0] / 300) * 100}%`, top = `${((pts[i][1] + 4) / 88) * 100}%`;
    pt.style.left = tt.style.left = left;
    pt.style.top = tt.style.top = top;
    tt.textContent = `${MONTHS[i]} · ${fmt(s.vals[i], s.p)}`;
  });
  svg.addEventListener('pointerleave', clear);
});
