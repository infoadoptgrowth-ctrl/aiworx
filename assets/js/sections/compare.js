/* Pricing page — compare plans. Rows light up one by one as you scroll; the header sticks under the nav.
   On phones the three-column table becomes plan tabs + a one-column table, built from the desktop table. */
import { $, $$, win, onTick, onBreakpoint, bootSection, magnetic, nearViewport, reducedMotion } from '../core.js';

const STICKY_TOP = 84;
const sec = $('.rwcm');
const wrap = $('.rwcm-tw', sec);
const table = $('.rwcm-t', wrap);
const RM = reducedMotion();
let lit = RM ? Infinity : 0; // rows lit so far (declared early: the breakpoint callback below already uses it)

bootSection(sec);
magnetic(sec);

/* ---------------------------------------------------------- data from the desktop table */
const heads = $$('thead .rwcm-ph', table);
const featured = heads.findIndex((h) => h.classList.contains('is-f'));
const plans = heads.map((h) => ({ head: $('.rwcm-phi', h).innerHTML, name: $('.rwcm-pn', h).textContent }));
const bodyRows = $$('tbody tr:not(.rwcm-fr)', table).map((tr) => ({
  label: $('.rwcm-rl', tr).outerHTML,
  cells: $$('td', tr).map((td) => td.innerHTML),
}));
const buttons = $$('.rwcm-fr td', table).map((td) => td.innerHTML);
const featLabel = $('.rwcm-th0', table).textContent;

/* ---------------------------------------------------------- phone: tabs + one column */
let mobile = null;
let current = featured >= 0 ? featured : 0;
function renderMobile() {
  const f = current === featured ? ' is-f' : '';
  mobile.innerHTML = `
    <div class="rwcm-tabs" role="group" aria-label="${featLabel}">${plans
      .map((p, i) => `<button type="button" class="f-m${i === current ? ' is-sel' : ''}" aria-pressed="${i === current}">${p.name}${i === featured ? '<i aria-hidden="true"></i>' : ''}</button>`)
      .join('')}</div>
    <div class="rwcm-mh${f}" aria-live="polite">${plans[current].head}</div>
    <table class="rwcm-t rwcm-t1"><thead class="rw-sr"><tr><th scope="col">${featLabel}</th><th scope="col">${plans[current].name}</th></tr></thead>
      <tbody>${bodyRows.map((r) => `<tr data-cmr="true"><th scope="row" class="f-d">${r.label}</th><td class="${current === featured ? 'is-f' : ''}">${r.cells[current]}</td></tr>`).join('')}</tbody></table>
    <div class="rwcm-mb">${buttons[current] || ''}</div>`;
  $$('.rwcm-tx, .rwcm-yes, .rwcm-no', mobile).forEach((el) => el.style.setProperty('--k', '0'));
  const tabs = $$('.rwcm-tabs button', mobile);
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', (e) => {
      const n = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
      if (n < 0) return;
      e.preventDefault();
      select(n);
      $$('.rwcm-tabs button', mobile)[n]?.focus();
    });
  });
  litRows();
}
function select(i) {
  if (i === current) return;
  current = i;
  renderMobile();
}

onBreakpoint((v) => {
  if (v.ph && !mobile) {
    mobile = document.createElement('div');
    mobile.className = 'rwcm-m';
    wrap.after(mobile);
    renderMobile();
  }
  wrap.hidden = v.ph;
  if (mobile) mobile.hidden = !v.ph;
});

/* ---------------------------------------------------------- rows light up as they pass 70% of the screen */
function litRows() {
  const scope = mobile && !mobile.hidden ? mobile : table;
  $$('[data-cmr]', scope).forEach((tr, i) => tr.classList.toggle('is-lit', i < lit));
}
if (!RM) {
  litRows();
  const near = nearViewport(sec, '30% 0px 30% 0px');
  let tops = [], vh = 1, top = 0, stuck = false;
  onTick(
    () => {
      if (!near.on) return;
      let n = 0;
      for (const t of tops) if (t < vh * 0.7) n++;
      else break;
      if (n > lit) {
        lit = n;
        litRows();
      }
      const s = top < STICKY_TOP - 2;
      if (s !== stuck) {
        stuck = s;
        wrap.classList.toggle('is-stuck', s);
      }
    },
    () => {
      if (!near.on) return;
      vh = win.innerHeight || 1;
      const scope = mobile && !mobile.hidden ? mobile : table;
      tops = $$('[data-cmr]', scope).map((r) => r.getBoundingClientRect().top);
      top = wrap.getBoundingClientRect().top;
    },
  );
}
