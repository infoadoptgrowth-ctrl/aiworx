/* About page: hero with photos that unmask and drift; "our story" timeline — a pinned horizontal heartbeat line on
   desktop/tablet, a vertical line on phones — with milestones lighting up as the signal passes; values + hiring. */
import { $, $$, win, onTick, onBreakpoint, magnetic, whenInView, switchOn, scrollProgress, nearViewport, clamp01, reducedMotion } from '../core.js';

const sec = $('.rwab');
const hero = $('.rwab-hero', sec);
const dark = $('.rwab-dark', sec);
const vals = $('.rwab-vals', sec);
const vwrap = $('.rwab-vwrap', sec);
const vlist = $('.rwab-vl', sec);
const shl = $('.rwab-shl', sec);
const RM = reducedMotion();

sec.classList.remove('is-fin');
magnetic(sec);

/* each block reveals on its own */
for (const [el, t] of [[hero, 0.16], [dark, 0.05], [vals, 0.16]]) if (el) whenInView(el, () => switchOn(el), t);

/* ---------------------------------------------------------- hero photos */
const SHAPES = { up: ['inset(100% 0 0 0)', 'inset(0 0 0 0)'], arch: ['inset(100% 0 0 0 round 999px 999px 0 0)', 'inset(0 0 0 0 round 999px 999px 0 0)'] };
const ums = $$('.rwab-um', hero);
const reveal = () =>
  ums.forEach((um, i) => {
    const s = SHAPES[i === 1 ? 'arch' : 'up'];
    um.style.clipPath = um.style.webkitClipPath = s[1];
    um.classList.add('is-on');
  });
if (RM) reveal();
else hero.addEventListener('rw:on', reveal);
if (!RM) scrollProgress(hero, null, { targets: ums });

/* ---------------------------------------------------------- story timeline */
const items = $$('.rwab-vm', sec).map((li) => ({ yr: $('.rwab-yr', li).textContent, tx: $('.rwab-tx', li)?.textContent || '' }));
const L = items.length;
const heartbeat = (xs, K) => {
  let d = 'M0,50';
  for (const t of xs) d += ` L${t - 30},50 L${t - 18},40 L${t - 9},64 L${t},14 L${t + 9},70 L${t + 18},46 L${t + 26},50`;
  return d + ` L${K},50`;
};

let pin = null, stopPin = () => {};
function buildPin(v) {
  const U = Math.max(320, v.w);
  const W = Math.round(U * (v.tab ? 0.2 : 0.16));
  const G = Math.round(Math.max(v.tab ? 300 : 360, U * (v.tab ? 0.4 : 0.3)));
  const K = W * 2 + Math.max(0, L - 1) * G;
  const xs = items.map((_, t) => W + t * G);
  const path = heartbeat(xs, K);
  const el = document.createElement('div');
  el.className = 'rwab-pin';
  el.style.height = `${Math.round(Math.max(2.2, 0.36 * L + 0.6) * 100)}svh`;
  el.innerHTML = `<div class="rwab-stage"><div class="rw-wrap rwab-sh"><p class="rwab-read f-m" aria-hidden="true"><span class="rwab-read-y f-d">${items[0]?.yr || ''}</span><span>01 / ${String(L).padStart(2, '0')}</span></p></div>
  <div class="rwab-track" style="width:${K}px;--tx:0px;--hx:${W}px">
    <svg class="rwab-tr rwab-tr-o" width="${K}" height="100" viewBox="0 0 ${K} 100" aria-hidden="true"><path d="${path}"/></svg>
    <div class="rwab-lit" aria-hidden="true"><svg class="rwab-tr rwab-tr-l" width="${K}" height="100" viewBox="0 0 ${K} 100"><path d="${path}"/></svg></div>
    <i class="rwab-head" aria-hidden="true"><i></i><i></i></i>
    <ol class="rwab-ms">${items.map((it, t) => `<li class="rwab-m${t === L - 1 ? ' is-last' : ''}" style="left:${xs[t]}px"><span class="rwab-yr f-d">${it.yr}</span><i class="rwab-dot" aria-hidden="true"><i></i></i>${it.tx ? `<span class="rwab-tx">${it.tx}</span>` : ''}</li>`).join('')}</ol>
  </div>
  <p class="rwab-hint f-m" aria-hidden="true"><i></i>Scroll to follow the signal</p></div>`;
  $('.rwab-sh', el).prepend(shl);
  const track = $('.rwab-track', el), ms = $$('.rwab-m', el), readY = $('.rwab-read-y', el), readN = $('.rwab-read span + span', el);
  let hit = -1;
  const stop = scrollProgress(el, (_, pp) => {
    const r = clamp01((pp - 0.05) / 0.86);
    const tx = K > U ? -r * (K - U) : (U - K) / 2;
    const hx = W + r * (K - 2 * W);
    track.style.setProperty('--tx', `${tx.toFixed(1)}px`);
    track.style.setProperty('--hx', `${hx.toFixed(1)}px`);
    const n = xs.filter((x) => hx >= x - 2).length;
    if (n === hit) return;
    hit = n;
    ms.forEach((m, i) => m.classList.toggle('is-hit', i < n));
    readY.textContent = items[Math.max(0, n - 1)]?.yr || '';
    readN.textContent = `${String(Math.max(1, n)).padStart(2, '0')} / ${String(L).padStart(2, '0')}`;
  });
  return { el, stop };
}

/* vertical list (phones): the line fills as you read; milestones light as it reaches them */
const vms = $$('.rwab-vm', sec);
let stopV = () => {};
function runVertical() {
  if (RM) {
    vlist.style.setProperty('--fv', '1');
    vms.forEach((m) => m.classList.add('is-hit'));
    return () => {};
  }
  const near = nearViewport(vlist, '10% 0px 10% 0px');
  let top = 0, h = 1, vh = 1, offs = [], fv = -1, hit = -1;
  return onTick(
    () => {
      if (!near.on) return;
      const t = clamp01((vh * 0.68 - top) / Math.max(1, h));
      if (Math.abs(t - fv) > 0.001) {
        fv = t;
        vlist.style.setProperty('--fv', t.toFixed(4));
      }
      const n = offs.filter((o) => o <= t * h + 1).length;
      if (n !== hit) {
        hit = n;
        vms.forEach((m, i) => m.classList.toggle('is-hit', i < n));
      }
    },
    () => {
      if (!near.on) return;
      const r = vlist.getBoundingClientRect();
      top = r.top;
      h = r.height;
      vh = win.innerHeight || 1;
      offs = Array.from(vlist.children).map((c) => c.offsetTop + 24);
    },
  );
}

onBreakpoint((v) => {
  const pinned = !v.ph && !RM;
  stopPin();
  stopV();
  if (pin) {
    vwrap.prepend(shl);
    pin.remove();
    pin = null;
  }
  sec.classList.toggle('is-pin', pinned);
  if (pinned) {
    const b = buildPin(v);
    pin = b.el;
    stopPin = b.stop;
    vwrap.before(pin);
    vwrap.hidden = true;
  } else {
    vwrap.hidden = false;
    stopV = runVertical();
  }
});
/* the pinned track is sized from the viewport width */
let rw = win.innerWidth;
win.addEventListener('resize', () => {
  if (!pin || Math.abs(win.innerWidth - rw) < 40) return;
  rw = win.innerWidth;
  const v = { w: rw, tab: rw < 1100, ph: rw < 810 };
  if (v.ph) return;
  stopPin();
  vwrap.prepend(shl);
  pin.remove();
  const b = buildPin(v);
  pin = b.el;
  stopPin = b.stop;
  vwrap.before(pin);
});
