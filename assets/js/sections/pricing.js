/* Pricing: three cards stacked as a deck that fan out as you scroll; monthly / quarterly toggle rolls the prices. */
import { $, $$, bootSection, magnetic, scrollProgress, onBreakpoint, clamp01, reducedMotion, rollTo } from '../core.js';

const PLANS = [
  { monthly: '1900', quarterly: '1700' },
  { monthly: '3900', quarterly: '3500' },
  { monthly: '7500', quarterly: '6750' },
];
const RM = reducedMotion();

const sec = $('.rwpr');
const rowEl = $('.rwpr-row', sec);
const cards = $$('.rwpr-card', sec); // original order: Starter, Growth (featured), Scale
const toggles = $$('.rwpr-tb', sec);
const knob = $('.rwpr-tk', sec);

bootSection(sec, { staticFlags: [] });
magnetic(sec);

const easeIO = (v) => {
  const t = clamp01(v);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

/* ---------------------------------------------------------- layout per breakpoint */
let phone = false;
onBreakpoint((v) => {
  phone = v.ph;
  sec.classList.toggle('is-set', phone || RM);
  const order = phone ? [cards[1], cards[0], cards[2]] : cards;
  order.forEach((c, n) => {
    rowEl.appendChild(c);
    const d = phone ? 0 : n - (order.length - 1) / 2;
    const feat = c.classList.contains('is-feat');
    c.style.setProperty('--d', d);
    c.style.setProperty('--z', feat ? 5 : 3 - Math.abs(Math.round(d)));
    $('.rwpr-no', c).textContent = String(n + 1).padStart(2, '0');
    c.classList.toggle('rv', phone);
    c.style.setProperty('--rvd', `${120 + n * 90}ms`);
    c.style.setProperty('--rvy', '30px');
  });
});

/* ---------------------------------------------------------- scroll fan-out */
if (!RM)
  scrollProgress(sec, (sp) => {
    if (phone) return;
    sec.style.setProperty('--f', easeIO((sp - 0.08) / 0.3).toFixed(4));
    sec.style.setProperty('--k', clamp01((sp - 0.22) / 0.26).toFixed(4));
  });

/* ---------------------------------------------------------- billing toggle */
const fmt = (s) => Math.round(parseFloat(s)).toLocaleString('en-US');
function setQuarterly(q) {
  toggles.forEach((b, i) => {
    const on = (i === 1) === q;
    b.classList.toggle('is-act', on);
    b.setAttribute('aria-pressed', String(on));
  });
  knob.style.translate = q ? '100% 0' : '0 0';
  cards.forEach((c, i) => {
    rollTo($('.rwpr-roll', c), fmt(q ? PLANS[i].quarterly : PLANS[i].monthly), 'rwpr');
    const bill = $('.rwpr-bill', c);
    bill.firstElementChild.className = q ? 'is-q' : '';
    bill.lastChild.nodeValue = q ? 'Billed every 3 months' : 'Billed monthly · cancel anytime';
  });
}
toggles[0].addEventListener('click', () => setQuarterly(false));
toggles[1].addEventListener('click', () => setQuarterly(true));
