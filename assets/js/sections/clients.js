/* Clients: radar sweep driven by scroll + time; blips light up (and report) as the beam passes. */
import { $, $$, onTick, bootSection, scrollProgress, reducedMotion, nearViewport } from '../core.js';

const sec = $('.rwcl');
const scope = $('.rwcl-scope', sec);
const sweep = $('.rwcl-sweep', sec);
const readout = $('.rwcl-read-v', sec);
const blips = $$('.rwcl-blip', sec);

bootSection(sec, { staticFlags: reducedMotion() ? [] : ['is-park'] });

if (!reducedMotion()) {
  sec.classList.add('is-mv');
  blips.forEach((b) => b.classList.remove('is-hit'));

  /* blip angles from their polar placement (left/top in %) */
  const angles = blips.map((b) => {
    const x = parseFloat(b.style.left) - 50;
    const y = parseFloat(b.style.top) - 50;
    return ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
  });
  const names = blips.map((b) => $('.rwcl-nm', b)?.textContent || '');
  const badges = blips.map((b) => $('.rwcl-bdg', b)?.textContent || '');

  let sp = 0.5;
  scrollProgress(sec, (s) => (sp = s));

  const near = nearViewport(scope, '10% 0px 10% 0px');
  const hitAt = blips.map(() => -99);
  const lit = blips.map(() => false);
  let spin = 0, last = 0, prev = 0, angle = 0, primed = false;

  onTick((t) => {
    if (!near.on) {
      last = t;
      return;
    }
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    spin += dt * 9;
    const target = sp * 540 + spin - 120;
    angle = primed ? angle + (target - angle) * 0.2 : target;
    sweep.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    if (primed) {
      const lo = Math.min(prev, angle), hi = Math.max(prev, angle);
      angles.forEach((a, i) => {
        let crossed = hi - lo >= 360;
        if (!crossed) {
          const k = Math.ceil((lo - a) / 360);
          const at = a + 360 * k;
          crossed = at > lo && at <= hi;
        }
        if (crossed) {
          hitAt[i] = t;
          const txt = `${names[i]} · ${badges[i]}`;
          if (readout.textContent !== txt) readout.textContent = txt;
        }
      });
    }
    prev = angle;
    primed = true;
    blips.forEach((b, i) => {
      const on = t - hitAt[i] < 1500;
      if (on !== lit[i]) {
        lit[i] = on;
        b.classList.toggle('is-hit', on);
      }
    });
  });
}
