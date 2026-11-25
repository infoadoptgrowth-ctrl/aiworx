/* FAQ: accordion (first answer open) with a lime timeline that fills as you read down the list. */
import { $, $$, win, onTick, bootSection, magnetic, nearViewport, clamp01, reducedMotion } from '../core.js';

const sec = $('.rwfq');
const list = $('.rwfq-list', sec);
const rows = $$('.rwfq-row', sec);
const RM = reducedMotion();

bootSection(sec, { staticFlags: RM ? [] : ['is-set'] });
magnetic(sec);

/* accordion: one open at a time */
let open = rows.findIndex((r) => r.classList.contains('is-open'));
function setOpen(i) {
  open = i;
  rows.forEach((r, k) => {
    const on = k === i;
    r.classList.toggle('is-open', on);
    $('button', r).setAttribute('aria-expanded', String(on));
    $('.rwfq-a', r).setAttribute('aria-hidden', String(!on));
  });
}
rows.forEach((r, i) => $('button', r).addEventListener('click', () => setOpen(open === i ? -1 : i)));

/* timeline fill */
if (!RM) {
  const near = nearViewport(list, '20% 0px 20% 0px');
  let top = 0, h = 1, vh = 1, marks = [], f = -1, last = -1, hit = -2;
  onTick(
    () => {
      if (!near.on) return;
      const target = clamp01((vh * 0.62 - top) / h);
      f = f < 0 ? target : f + (target - f) * 0.18;
      if (Math.abs(f - target) < 5e-4) f = target;
      if (Math.abs(f - last) < 4e-4) return;
      last = f;
      list.style.setProperty('--f', f.toFixed(4));
      let k = -1;
      marks.forEach((m, i) => f >= m && (k = i));
      if (k !== hit) {
        hit = k;
        rows.forEach((r, i) => r.toggleAttribute('data-hit', i <= k));
      }
    },
    () => {
      if (!near.on) return;
      const r = list.getBoundingClientRect();
      top = r.top;
      h = r.height || 1;
      vh = win.innerHeight;
      marks = rows.map((row) => (row.offsetTop + 34) / h);
    },
  );
}
