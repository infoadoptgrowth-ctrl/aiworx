/* Team: a lime ring sweeps across the row as you scroll, lighting each specialist it reaches. */
import { $, $$, bootSection, magnetic, scrollProgress, onBreakpoint, clamp01, reducedMotion } from '../core.js';

const sec = $('.rwtm');
const ring = $('.rwtm-ring', sec);
const row = $('.rwtm-row', sec);
const cards = $$('.rwtm-card', sec);
const readN = $('.rwtm-read-n', sec);
const N = cards.length;
const RM = reducedMotion();

bootSection(sec, { staticFlags: RM ? [] : ['is-still'] });
magnetic(sec);

let layout = { cols: N, rows: 1, phone: false };
let litKey = '';
const seenOnPhone = new Set();
let lastLit = [];

function paint(lit) {
  const key = lit.map((v, i) => (v || (layout.phone && seenOnPhone.has(i)) ? '1' : '0')).join('');
  if (key === litKey) return;
  litKey = key;
  let count = 0;
  cards.forEach((c, i) => {
    const on = key[i] === '1';
    c.classList.toggle('is-lit', on);
    if (on) count++;
  });
  if (readN) readN.textContent = String(count).padStart(2, '0');
}

function sweep(p) {
  const { cols, rows, phone } = layout;
  let x = 0, y = 0.44;
  const lit = [];
  if (phone) {
    x = 0.02 + p * 0.96;
    y = 0.4;
    for (let i = 0; i < N; i++) lit.push(i === 0 && x >= 0.4);
  } else {
    const a = p * rows;
    const r = Math.min(rows - 1, Math.floor(a));
    const s = p >= 1 ? 1 : a - r;
    x = -0.04 + (r % 2 ? 1 - s : s) * 1.08;
    y = rows > 1 ? (r + 0.5) / rows : 0.44;
    for (let i = 0; i < N; i++) {
      const cr = Math.floor(i / cols), cx = ((i % cols) + 0.5) / cols;
      lit.push(cr < r || (cr === r && (r % 2 ? x <= cx + 0.03 : x >= cx - 0.03)));
    }
  }
  ring.style.setProperty('--rx', `${(x * 100).toFixed(2)}%`);
  ring.style.setProperty('--ry', `${(y * 100).toFixed(1)}%`);
  lastLit = lit;
  paint(lit);
}

onBreakpoint((v) => {
  const cols = v.ph ? 1 : v.tab ? 3 : Math.max(1, N);
  layout = { cols, rows: v.ph ? 1 : Math.max(1, Math.ceil(N / cols)), phone: v.ph };
  litKey = '';
  if (RM) {
    const last = Math.max(0, N - 1);
    ring.style.setProperty('--rx', `${(v.ph ? 0.42 : ((last % cols) + 0.5) / cols) * 100}%`);
    ring.style.setProperty('--ry', `${(v.ph ? 0.4 : layout.rows > 1 ? (Math.floor(last / cols) + 0.5) / layout.rows : 0.44) * 100}%`);
    paint(cards.map(() => true));
  }
});

if (!RM) scrollProgress(sec, (sp) => sweep(clamp01((sp - 0.2) / 0.42)));

/* phone: the row is a horizontal swiper; cards light as they are swiped into view */
const swipe = new IntersectionObserver(
  (entries) => {
    if (!layout.phone || !sec.classList.contains('is-on')) return;
    entries.forEach((e) => e.isIntersecting && seenOnPhone.add(Number(e.target.dataset.i)));
    litKey = '';
    paint(lastLit.length ? lastLit : cards.map(() => false));
  },
  { root: row, threshold: 0.6 },
);
cards.forEach((c, i) => i > 0 && swipe.observe(c));

/* keep a focused card scrolled into the row */
row.addEventListener('focusin', (e) => {
  const li = e.target.closest?.('li');
  if (!li || !row.contains(li)) return;
  if (row.scrollWidth > row.clientWidth + 1) {
    const pad = parseFloat(getComputedStyle(row).paddingLeft) || 0;
    row.scrollTo({ left: Math.max(0, li.offsetLeft - pad), behavior: 'auto' });
  }
});
