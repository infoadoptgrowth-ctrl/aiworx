/* How we work: a pinned funnel that fills band by band as you scroll, with particles falling through it.
   Tablet / phone get the stacked-rows version with per-row count-ups. */
import { $, $$, win, onTick, onBreakpoint, bootSection, scrollProgress, whenInView, clamp01, reducedMotion } from '../core.js';

const sec = $('.rwfn');
const pin = $('.rwfn-pin', sec);
const fun = $('.rwfn-fun', sec);
const canvas = $('.rwfn-cv', sec);
const bands = $$('.rwfn-band', sec);
const steps = $$('.rwfn-step', sec);
const rows = $$('.rwfn-row', sec);
const NB = bands.length;
const WIDTHS = [0, 7, 14, 21, 27]; // band insets (%), top → bottom
const PASS = [0.34, 0.3, 0.36]; // share of particles that make it to the next band
const RM = reducedMotion();

bootSection(sec);
if (!RM) sec.classList.add('is-live');

/* ---------------------------------------------------------- numbers */
function parseNum(s) {
  const m = String(s || '').trim().match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/);
  if (!m) return null;
  return { pre: m[1], n: parseFloat(m[2].replace(/,/g, '')), dec: (m[2].split('.')[1] || '').length, grp: m[2].includes(','), suf: m[3] };
}
const fmt = (v, d, g) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: g || Math.abs(v) >= 1e4 });
function makeCounter(span) {
  const final = span.textContent;
  const p = parseNum(final);
  let raf = 0, state = null;
  return (on) => {
    if (!p || RM || state === on) return;
    state = on;
    cancelAnimationFrame(raf);
    if (!on) {
      span.textContent = `${p.pre}${fmt(0, p.dec, p.grp)}${p.suf}`;
      return;
    }
    const t0 = performance.now();
    const step = (t) => {
      const k = clamp01((t - t0) / 1400);
      span.textContent = `${p.pre}${fmt(p.n * (1 - (1 - k) ** 4), p.dec, p.grp)}${p.suf}`;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
}
const bandCounters = bands.map((b) => makeCounter($('.rwfn-band-v span', b)));
const rowCounters = rows.map((r) => makeCounter($('.rwfn-row-top b span', r)));

/* ---------------------------------------------------------- flat rows (tablet / phone) */
rows.forEach((row, i) => {
  rowCounters[i](false);
  whenInView(row, () => {
    row.classList.add('is-on');
    rowCounters[i](true);
  }, 0.5);
});

/* ---------------------------------------------------------- pinned (desktop) */
let pinned = false;
let active = -2;
let fill = 0;
function setActive(a) {
  if (a === active) return;
  active = a;
  bands.forEach((b, i) => {
    b.classList.toggle('is-on', i <= a);
    b.classList.toggle('is-act', i === a);
    bandCounters[i](i <= a);
  });
  steps.forEach((s, i) => {
    s.classList.toggle('is-act', i === a);
    s.classList.toggle('is-done', i < a);
  });
}
function onPin(pp) {
  const n = clamp01((pp - 0.04) / 0.86) * NB;
  fill = n;
  bands.forEach((b, i) => b.style.setProperty('--f', clamp01((n - i) * 1.25).toFixed(4)));
  setActive(n <= 0.02 ? -1 : Math.min(NB - 1, Math.floor(n)));
}

let stopProgress = () => {};
let stopParticles = () => {};
onBreakpoint((v) => {
  const want = !v.ph && !v.tab && !RM;
  if (want === pinned && active !== -2) return;
  pinned = want;
  sec.classList.toggle('is-pin', pinned);
  stopProgress();
  stopParticles();
  if (pinned) {
    setActive(-1);
    stopProgress = scrollProgress(pin, (_, pp) => onPin(pp));
    stopParticles = particles();
  } else {
    fill = NB;
    setActive(NB - 1);
    stopProgress = () => {};
  }
});

/* particles: dots pour in at the top; a share pass each band; "clients" glow green */
function particles() {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const inkProbe = document.createElement('i');
  inkProbe.style.color = 'var(--rw-ink)';
  fun.appendChild(inkProbe);
  const ink = (getComputedStyle(inkProbe).color.match(/[\d.]+/g) || [13, 14, 16]).slice(0, 3).join(',');
  inkProbe.remove();
  const GREEN = '62,118,0';
  let W = 1, H = 1, dpr = 1, lanes = [], visible = false, last = 0, acc = 0;
  const dots = [];
  const measure = () => {
    dpr = Math.min(win.devicePixelRatio || 1, 2);
    W = fun.clientWidth;
    H = fun.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const r = fun.getBoundingClientRect();
    lanes = bands.map((b) => {
      const br = b.getBoundingClientRect();
      return [br.top - r.top, br.bottom - r.top];
    });
  };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(fun);
  const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting), { rootMargin: '10% 0px' });
  io.observe(fun);
  const inset = (y) => {
    for (let i = 0; i < lanes.length; i++) {
      const [a, b] = lanes[i];
      if (y <= b) return y < a ? WIDTHS[i] / 100 : (WIDTHS[i] + (WIDTHS[i + 1] - WIDTHS[i]) * ((y - a) / Math.max(1, b - a))) / 100;
    }
    return WIDTHS[lanes.length] / 100;
  };
  const off = onTick((t) => {
    if (!visible || !lanes.length) {
      last = t;
      return;
    }
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    const lvl = Math.min(lanes.length - 1, Math.floor(Math.max(0, fill)));
    const done = fill >= lanes.length - 0.02;
    for (acc += dt * (26 + 30 * clamp01(fill)); acc > 1; acc--)
      dots.push({ u: 0.04 + Math.random() * 0.92, y: lanes[0][0] - 6, v: 70 + Math.random() * 60, k: 0, die: 0, s: 1.6 + Math.random() * 1.2, ph: Math.random() * 6.28 });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i];
      d.y += d.v * dt * (1 + d.k * 0.25);
      d.u += Math.sin(t / 500 + d.ph) * 9e-4 + (0.5 - d.u) * dt * 0.08 * d.k;
      const lane = lanes[Math.min(d.k, lanes.length - 1)];
      if (!d.die && d.y > lane[1]) {
        const cap = done ? lanes.length - 1 : lvl;
        if (d.k >= cap) {
          if (d.k === lanes.length - 1 && done) {
            d.die = 0.001;
            d.k = 9;
          } else d.die = 0.001;
        } else if (Math.random() < PASS[d.k]) d.k++;
        else d.die = 0.001;
      }
      if (d.die) d.die += dt * 2.2;
      if (d.die > 1 || d.y > H + 10) {
        dots.splice(i, 1);
        continue;
      }
      const ins = inset(d.y);
      const x = W * (ins + d.u * (1 - 2 * ins));
      const a = (1 - (d.die || 0)) * (0.35 + 0.15 * Math.min(3, d.k));
      ctx.beginPath();
      ctx.arc(x, d.y, d.s + (d.k >= 3 ? 1.4 : d.k * 0.3), 0, 6.283);
      ctx.fillStyle = d.k >= 3 ? `rgba(${GREEN},${Math.min(1, a + 0.4)})` : `rgba(${ink},${a})`;
      ctx.fill();
    }
    if (dots.length > 420) dots.splice(0, dots.length - 420);
  });
  return () => {
    off();
    ro.disconnect();
    io.disconnect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}
