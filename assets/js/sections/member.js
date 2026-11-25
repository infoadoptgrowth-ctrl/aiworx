/* Team member page: portrait + bio, "what I work on" ticks off as it scrolls in, and the cases they worked on
   reveal on their own and count their result up from the "before" number. */
import { $, $$, bootSection, magnetic, whenInView, switchOn, reducedMotion, clamp01 } from '../core.js';

const sec = $('.rwmb');
const list = $('.rwmb-list', sec);
const cases = $('.rwmb-cases', sec);
const RM = reducedMotion();

bootSection(sec);
magnetic(sec);

/* focus list: each item lights as it passes the lower fifth of the screen */
const items = $$('li', list);
if (!RM) {
  items.forEach((li) => li.classList.remove('is-on'));
  let lit = 0;
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        lit = Math.max(lit, Number(e.target.dataset.i || 0) + 1);
        items.forEach((li, i) => li.classList.toggle('is-on', i < lit));
      }),
    { rootMargin: '0px 0px -22% 0px' },
  );
  items.forEach((li) => io.observe(li));
}

/* cases: before → after count-up once the block is in view */
if (cases) {
  const parse = (s) => {
    const m = String(s || '').trim().match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/);
    return m && { pre: m[1], n: parseFloat(m[2].replace(/,/g, '')), dec: (m[2].split('.')[1] || '').length, grp: m[2].includes(','), suf: m[3] };
  };
  const nums = $$('.rwmb-cr em', cases).map((em) => {
    const b = $('b', em);
    const final = b.textContent;
    const from = parse(em.firstChild?.nodeValue?.split('→')[0]);
    return { b, final, to: parse(final), from: from ? from.n : 0 };
  });
  const at = (d, k) =>
    d.to ? `${d.to.pre}${(d.from + (d.to.n - d.from) * k).toLocaleString('en-US', { minimumFractionDigits: d.to.dec, maximumFractionDigits: d.to.dec, useGrouping: d.to.grp || Math.abs(d.to.n) >= 1e4 })}${d.to.suf}` : d.final;
  if (!RM) nums.forEach((d) => (d.b.textContent = at(d, 0)));
  whenInView(cases, () => {
    switchOn(cases);
    if (RM) return;
    const t0 = performance.now();
    const step = (t) => {
      const k = clamp01((t - t0 - 300) / 1500);
      nums.forEach((d) => (d.b.textContent = at(d, 1 - (1 - k) ** 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
