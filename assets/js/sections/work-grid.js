/* Work page grid: case cards in a two-column staggered layout. Each cover wipes from grey "before" to colour "after"
   as it scrolls up, and the result counts up. Channel chips filter the grid with a FLIP animation. */
import { $, $$, win, onTick, onBreakpoint, bootSection, magnetic, nearViewport, clamp01, reducedMotion } from '../core.js';

const sec = $('.rwwg');
const grid = $('.rwwg-grid', sec);
const chips = $$('.rwwg-chip', sec);
const countEl = $('.rwwg-count b', sec);
const cards = $$('.rwwg-card', sec).sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i));
const RM = reducedMotion();

bootSection(sec);
magnetic(sec);

/* ---------------------------------------------------------- numbers */
function parse(s) {
  const m = String(s || '').trim().match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/);
  if (!m) return null;
  return { pre: m[1], n: parseFloat(m[2].replace(/,/g, '')), dec: (m[2].split('.')[1] || '').length, grp: m[2].includes(','), suf: m[3] };
}
const fmt = (v, p) => `${p.pre}${v.toLocaleString('en-US', { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec, useGrouping: p.grp || Math.abs(v) >= 1e4 })}${p.suf}`;
const data = cards.map((card) => {
  const after = $('.rwwg-after', card);
  const to = parse(after.textContent), from = parse($('.rwwg-ba s', card).textContent);
  const services = $$('.rwwg-svs li', card).map((li) => li.textContent.trim());
  return { card, after, final: after.textContent, to, from: from ? from.n : 0, services, k: -1, t0: 0, done: RM };
});
const valueAt = (d, k) => (d.to ? fmt(d.from + (d.to.n - d.from) * k, d.to) : d.final);

/* ---------------------------------------------------------- layout */
let filter = '';
let phone = false;
const shape = (i) => (phone ? 'ph' : i % 2 === 0 ? (Math.floor(i / 2) % 2 === 0 ? 'wide' : 'sq') : Math.floor(i / 2) % 2 === 0 ? 'tall' : 'land');

function layout(animate) {
  const before = new Map();
  if (animate && !RM) data.forEach((d) => d.card.isConnected && before.set(d.card, d.card.getBoundingClientRect()));
  const shown = data.filter((d) => !filter || d.services.includes(filter));
  const cols = phone ? [document.createElement('div')] : [document.createElement('div'), document.createElement('div')];
  cols.forEach((c) => (c.className = 'rwwg-colm'));
  shown.forEach((d, i) => {
    d.card.className = `rwwg-card rv is-${shape(i)}${d.card.classList.contains('is-ptr') ? ' is-ptr' : ''}`;
    d.card.dataset.i = i;
    $$('.rwwg-svs li', d.card).forEach((li) => li.classList.toggle('is-on', li.textContent.trim() === filter));
    (phone ? cols[0] : cols[i % 2]).appendChild(d.card);
  });
  grid.replaceChildren(...cols);
  countEl.textContent = String(shown.length).padStart(2, '0');
  if (!animate || RM) return;
  shown.forEach((d, n) => {
    const r0 = before.get(d.card), r1 = d.card.getBoundingClientRect();
    try {
      if (r0) {
        const dx = r0.left - r1.left, dy = r0.top - r1.top, s = r0.width / Math.max(1, r1.width);
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(1 - s) * 100 < 1) return;
        d.card.animate([{ transform: `translate(${dx}px,${dy}px) scale(${s})`, transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }], { duration: 760, easing: 'cubic-bezier(.7,0,.2,1)' });
      } else
        d.card.animate([{ opacity: 0, transform: 'translateY(40px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 120 + n * 60, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    } catch {}
  });
}

onBreakpoint((v) => {
  phone = v.ph;
  layout(false);
});

chips.forEach((chip) =>
  chip.addEventListener('click', () => {
    const label = $('span', chip).textContent.trim();
    const next = label === 'All' ? '' : label;
    if (next === filter) return;
    filter = next;
    chips.forEach((c) => {
      const on = c === chip;
      c.classList.toggle('is-sel', on);
      c.setAttribute('aria-pressed', String(on));
    });
    layout(true);
  }),
);
/* keep a focused chip visible in the scrolling chip row */
$('.rwwg-chips', sec)?.addEventListener('focusin', (e) => e.target.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }));

/* ---------------------------------------------------------- pointer spotlight */
data.forEach(({ card }) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--cx', `${Math.round(e.clientX - r.left)}px`);
    card.style.setProperty('--cy', `${Math.round(e.clientY - r.top)}px`);
    card.classList.add('is-ptr');
  });
  card.addEventListener('pointerleave', () => card.classList.remove('is-ptr'));
});

/* ---------------------------------------------------------- scroll wipe + count */
if (RM) {
  data.forEach((d) => d.card.style.setProperty('--k', '1'));
} else {
  data.forEach((d) => (d.after.textContent = valueAt(d, 0)));
  const near = nearViewport(grid, '20% 0px 20% 0px');
  let ks = [];
  onTick(
    (t) => {
      for (const { d, k } of ks) {
        if (Math.abs(k - d.k) > 0.002) {
          d.k = k;
          d.card.style.setProperty('--k', k.toFixed(4));
        }
        if (!d.t0 && k > 0.5) d.t0 = t;
        if (d.t0 && !d.done) {
          const p = clamp01((t - d.t0) / 1500);
          const txt = valueAt(d, 1 - (1 - p) ** 3);
          if (d.after.textContent !== txt) d.after.textContent = txt;
          if (p >= 1) d.done = true;
        }
      }
    },
    () => {
      if (!near.on) {
        ks = [];
        return;
      }
      const vh = win.innerHeight || 1;
      ks = data
        .filter((d) => d.card.isConnected)
        .map((d) => {
          const r = ($('.rwwg-cov', d.card) || d.card).getBoundingClientRect();
          return { d, k: clamp01((vh * 0.94 - r.top) / Math.max(120, Math.min(r.height * 1.05, vh * 0.62))) };
        });
    },
  );
}
