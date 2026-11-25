/* Footer: revealed from under the page (curtain), giant wordmark sized to the width, lime spotlight follows the cursor. */
import { $, win, doc, onTick, bootSection, magnetic, clamp01, reducedMotion, finePointer, clock, SITE } from '../core.js';

const rev = $('.rw-rev');
const revIn = $('.rw-rev-in', rev);
const revSp = $('.rw-rev-sp', rev);
const sec = $('.rwft');
const wmWrap = $('.rwft-wm', sec);
const wmText = $('.rwft-wm-t', sec);
const RM = reducedMotion();

bootSection(sec, { staticFlags: RM ? [] : ['is-still'], threshold: 0.05 });
magnetic(sec);

/* year + clock */
$('[data-year]', sec).textContent = String(new Date().getFullYear());
const clk = $('[data-clock]', sec);
const tickClock = () => (clk.textContent = clock(SITE.tz));
tickClock();
setInterval(tickClock, 15000);

/* curtain reveal: the footer sits sticky under the last section, which lifts away */
if (!RM) {
  const setH = () => rev.style.setProperty('--h', `${revIn.offsetHeight}px`);
  setH();
  new ResizeObserver(setH).observe(revIn);
  rev.classList.add('is-act');
  let near = true, rv = -1, last = -1, h = 0, vh = 1, top = 0, ok = false;
  new IntersectionObserver((e) => (near = e[0].isIntersecting), { rootMargin: '30% 0px 30% 0px' }).observe(rev);
  onTick(
    () => {
      if (!ok || !h) return;
      const t = clamp01((vh - h - top) / h);
      rv = rv < 0 ? t : rv + (t - rv) * 0.2;
      if (Math.abs(t - rv) < 5e-4) rv = t;
      if (Math.abs(rv - last) < 4e-4) return;
      last = rv;
      rev.style.setProperty('--rv', rv.toFixed(4));
    },
    () => {
      if (!near) {
        ok = false;
        return;
      }
      h = revSp.offsetHeight;
      vh = win.innerHeight;
      top = rev.getBoundingClientRect().top;
      ok = true;
    },
  );
  /* keyboard focus inside a covered footer scrolls it fully into view */
  rev.addEventListener(
    'focus',
    (e) => {
      const r = rev.getBoundingClientRect();
      const sp = revSp.offsetHeight;
      const y = Math.max(0, Math.min(doc.documentElement.scrollHeight - win.innerHeight, r.top + win.scrollY - win.innerHeight + 2 * sp));
      if (Math.abs(win.scrollY - y) > 4) {
        const l = win.__aiLenis;
        l ? l.scrollTo(y, { immediate: true, force: true }) : win.scrollTo(0, y);
      }
      requestAnimationFrame(() => e.target.scrollIntoView?.({ block: 'nearest' }));
    },
    true,
  );
}

/* wordmark fills the row exactly */
const fit = () => {
  wmText.style.fontSize = '100px';
  const w = wmText.offsetWidth || 1, room = wmWrap.clientWidth || 1;
  wmWrap.style.setProperty('--wf', `${Math.max(40, Math.floor(((100 * room) / w) * 0.995))}px`);
  wmText.style.fontSize = '';
};
fit();
new ResizeObserver(fit).observe(wmWrap);
setTimeout(fit, 900);
doc.fonts?.ready?.then(fit).catch(() => {});

/* spotlight that reveals the outlined wordmark */
if (!RM) {
  const fine = finePointer();
  let vis = false, W = 1, H = 1, L = 0, T = 0, tx = 0, ty = 0, x = -999, y = -999, r = 0, tr = 0, inside = false, key = '';
  const t0 = performance.now();
  new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(wmWrap);
  if (fine) {
    wmWrap.addEventListener('pointermove', (e) => {
      inside = true;
      tx = e.clientX - L;
      ty = e.clientY - T;
      if (x < -900) {
        x = tx;
        y = ty;
      }
    });
    wmWrap.addEventListener('pointerleave', () => (inside = false));
  }
  onTick(
    (now) => {
      if (!vis) return;
      if (!fine) {
        const s = (now - t0) / 1000;
        tx = W * (0.5 + 0.42 * Math.sin(s * 0.45));
        ty = H * (0.52 + 0.1 * Math.sin(s * 0.9));
        tr = H * (0.42 + 0.16 * Math.sin(s * 2.1));
        if (x < -900) {
          x = tx;
          y = ty;
        }
      } else tr = inside ? H * 0.55 : 0;
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      r += (tr - r) * 0.12;
      const k = `${x.toFixed(1)},${y.toFixed(1)},${r.toFixed(1)}`;
      if (k === key) return;
      key = k;
      wmWrap.style.setProperty('--fx', `${x.toFixed(1)}px`);
      wmWrap.style.setProperty('--fy', `${y.toFixed(1)}px`);
      wmWrap.style.setProperty('--fr', `${Math.max(0, r).toFixed(1)}px`);
    },
    () => {
      if (!vis) return;
      const b = wmWrap.getBoundingClientRect();
      W = b.width;
      H = b.height;
      L = b.left;
      T = b.top;
    },
  );
}
