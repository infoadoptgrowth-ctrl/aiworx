/* 404 "Signal lost": a radar whose search light drifts on its own (or follows the cursor), a live bearing
   readout, and the two buttons light the matching blip when hovered or focused. */
import { $, $$, onTick, bootSection, magnetic, reducedMotion, finePointer, nearViewport } from '../core.js';

const sec = $('.rw4');
const src = $('.rw4-src', sec);
const brg = $('.rw4-brg b', sec) || $('.rw4-brg span:last-child', sec);
const RM = reducedMotion();

bootSection(sec, { staticFlags: RM ? [] : ['is-park'], threshold: 0.05 });
magnetic(sec);
if (!RM) sec.classList.add('is-mv');

/* hovering / focusing a button "finds" its blip */
$$('.rw4-bw', sec).forEach((w, i) => {
  const key = i === 0 ? 'a' : 'b';
  const on = () => sec.classList.add('is-found', `is-f${key}`);
  const off = () => sec.classList.remove('is-found', 'is-fa', 'is-fb');
  w.addEventListener('pointerenter', on);
  w.addEventListener('pointerleave', off);
  w.addEventListener('focusin', on);
  w.addEventListener('focusout', off);
});

if (!RM) {
  const fine = finePointer();
  const near = nearViewport(sec, '10% 0px 10% 0px');
  const t0 = performance.now();
  let tx = -1, ty = -1, x = -1, y = -1, W = 1, H = 1, lastMove = -1e9, deg = -1;
  if (fine)
    sec.addEventListener('pointermove', (e) => {
      const r = sec.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      lastMove = performance.now();
    });
  onTick(
    (t) => {
      if (!near.on) return;
      const auto = !fine || t - lastMove > 2600;
      if (auto) {
        const k = ((t - t0) / 1000) * 0.21;
        tx = W * (0.5 + 0.3 * Math.sin(k * 1.3));
        ty = H * (0.52 + 0.24 * Math.sin(k * 0.9 + 1.1));
      }
      if (x < 0) (x = tx), (y = ty);
      else {
        const e = auto ? 0.03 : 0.16;
        x += (tx - x) * e;
        y += (ty - y) * e;
      }
      if (src) src.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      const d = Math.floor((((t - t0) / 7200) * 360) % 360);
      if (d !== deg && brg) brg.textContent = `${String((deg = d)).padStart(3, '0')}°`;
    },
    () => {
      if (!near.on) return;
      W = sec.offsetWidth;
      H = sec.offsetHeight;
    },
  );
}
