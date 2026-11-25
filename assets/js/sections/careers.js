/* Careers: open roles light up along a signal wire as they scroll in (--u, data-lit); the perks and the hiring
   process blocks reveal on their own as they arrive. */
import { $, $$, win, onTick, onBreakpoint, bootSection, magnetic, whenInView, switchOn, nearViewport, clamp01, reducedMotion } from '../core.js';

const sec = $('.rwca');
const roles = $$('.rwca-role', sec);
const RM = reducedMotion();

bootSection(sec, { staticFlags: RM ? [] : ['is-set'] });
magnetic(sec);

for (const [el, t] of [[$('.rwca-perks', sec), 0.2], [$('.rwca-proc', sec), 0.3]]) if (el) whenInView(el, () => switchOn(el), t);

let phone = false;
onBreakpoint((v) => (phone = v.ph));

if (RM) roles.forEach((r) => (r.style.setProperty('--u', '1'), r.toggleAttribute('data-lit', true)));
else {
  const near = nearViewport(sec, '20% 0px 20% 0px');
  const last = new WeakMap();
  let tops = [], vh = 1;
  roles.forEach((r) => r.style.setProperty('--u', '0'));
  onTick(
    () => {
      if (!near.on) return;
      roles.forEach((r, i) => {
        const target = clamp01((vh * (phone ? 0.92 : 0.88) - tops[i]) / (vh * (phone ? 0.42 : 0.36)));
        const prev = last.get(r);
        let u = prev === undefined ? target : prev + (target - prev) * 0.2;
        if (Math.abs(target - u) < 0.008) u = target;
        if (prev !== undefined && Math.abs(prev - u) < 0.0015) return;
        last.set(r, u);
        r.style.setProperty('--u', u.toFixed(3));
        const lit = u > 0.985;
        if (lit !== r.hasAttribute('data-lit')) r.toggleAttribute('data-lit', lit);
      });
    },
    () => {
      if (!near.on) return;
      vh = win.innerHeight || 1;
      tops = roles.map((r) => r.getBoundingClientRect().top);
    },
  );
}
