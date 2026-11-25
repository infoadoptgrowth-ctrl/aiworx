/* Services: six-channel accordion. Scroll switches channels; hover / click / arrow keys pick one.
   The open channel's mock UI plays its little story (SERP climb, likes, ad gauges, article typing). */
import { $, $$, win, onTick, onBreakpoint, bootSection, magnetic, clamp01, reducedMotion, finePointer, nearViewport } from '../core.js';
import { playStory } from '../stories.js';

const sec = $('.rwsv');
const acc = $('.rwsv-acc', sec);
const panels = $$('.rwsv-p', acc);
const buttons = panels.map((p) => $('.rwsv-sp', p));
const contents = panels.map((p) => $('.rwsv-pc', p));
const segs = $$('.rwsv-seg i', sec);
const now = $('.rwsv-now', sec);
const N = panels.length;
const RM = reducedMotion();
const names = panels.map((p) => $('.rwsv-vt', p).textContent);

bootSection(sec);
magnetic(sec);

let wide = true;
let active = panels.findIndex((p) => p.classList.contains('is-open'));
if (active < 0) active = 0;
let holdUntil = 0;
let keyboard = false;
let stopRun = () => {};

/* ------------------------------------------------------------- layout */
function measure() {
  if (wide) {
    const cw = parseFloat(getComputedStyle(acc).getPropertyValue('--cw')) || 92;
    acc.style.setProperty('--ow', `${Math.max(320, acc.clientWidth - (N - 1) * (cw + 8) - cw)}px`);
  } else {
    let h = 0;
    $$('.rwsv-pin', acc).forEach((p) => (h = Math.max(h, p.scrollHeight)));
    if (h > 0) acc.style.setProperty('--oh', `${Math.ceil(h)}px`);
  }
}
const ro = new ResizeObserver(measure);
ro.observe(acc);
$$('.rwsv-pin', acc).forEach((p) => ro.observe(p));
onBreakpoint((v) => {
  wide = v.w >= 1240;
  sec.classList.toggle('is-h', wide);
  sec.classList.toggle('is-v', !wide);
  measure();
});
win.addEventListener('resize', () => {
  const w = win.innerWidth >= 1240;
  if (w !== wide) {
    wide = w;
    sec.classList.toggle('is-h', wide);
    sec.classList.toggle('is-v', !wide);
  }
  measure();
});

/* ------------------------------------------------------------- state */
function render() {
  panels.forEach((p, i) => {
    const open = i === active;
    p.classList.toggle('is-open', open);
    buttons[i].setAttribute('aria-expanded', String(open));
    contents[i].inert = !open;
  });
  segs.forEach((s, i) => (s.className = i === active ? 'is-on' : i < active ? 'is-past' : ''));
  if (now) now.innerHTML = `<b>${String(active + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}</b>${names[active]}`;
  play();
}
function select(i) {
  if (i === active || i < 0 || i >= N) return;
  active = i;
  render();
}
function pick(i, hold = 4000) {
  holdUntil = keyboard ? Infinity : performance.now() + hold;
  select(i);
}

buttons.forEach((b, i) => {
  b.addEventListener('click', () => pick(i));
  b.addEventListener('focus', (e) => {
    if (e.target.matches(':focus-visible')) {
      keyboard = true;
      holdUntil = Infinity;
    }
  });
  b.addEventListener('keydown', (e) => {
    const k = e.key;
    let n = -1;
    if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % N;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i - 1 + N) % N;
    else if (k === 'Home') n = 0;
    else if (k === 'End') n = N - 1;
    if (n < 0) return;
    e.preventDefault();
    pick(n);
    buttons[n].focus();
  });
});

/* hover-to-open on wide desktop with a fine pointer */
if (finePointer()) {
  let hoverIdx = -1, timer = 0;
  panels.forEach((p, i) =>
    p.addEventListener('pointermove', (e) => {
      if (!wide || !(e.movementX || e.movementY)) return;
      keyboard = false;
      holdUntil = performance.now() + 4000;
      if (i === active) {
        hoverIdx = i;
        clearTimeout(timer);
      } else if (hoverIdx !== i) {
        hoverIdx = i;
        clearTimeout(timer);
        timer = setTimeout(() => hoverIdx === i && select(i), 140);
      }
    }),
  );
  acc.addEventListener('pointerleave', () => {
    clearTimeout(timer);
    hoverIdx = -1;
  });
}

/* scroll drives the active channel */
if (!RM && N > 1) {
  const near = nearViewport(acc, '20% 0px 20% 0px');
  let top = 0, h = 1, vh = 1, ok = false, lastAp = -1, lastIdx = -1;
  onTick(
    () => {
      if (!ok) return;
      const ap = clamp01((vh * 0.72 - top) / (h + vh * 0.54));
      if (Math.abs(ap - lastAp) <= 0.002) return;
      lastAp = ap;
      const idx = Math.min(N - 1, Math.floor(ap * N));
      if (idx !== lastIdx) {
        lastIdx = idx;
        if (performance.now() > holdUntil) select(idx);
      }
    },
    () => {
      if (!near.on) {
        ok = false;
        return;
      }
      const r = acc.getBoundingClientRect();
      top = r.top;
      h = r.height;
      vh = win.innerHeight || 1;
      ok = true;
    },
  );
}

const near = nearViewport(sec, '0px');
function play() {
  stopRun();
  stopRun = () => {};
  const run = sec.classList.contains('is-on') && !RM;
  stopRun = playStory($('.rwsv-ui', panels[active]), run ? 'run' : 'end');
}

/* initial: every non-active UI shows its end state; the active one plays once the section is on */
panels.forEach((p) => playStory($('.rwsv-ui', p), 'end'));
render();
sec.addEventListener('rw:on', play);
void near;
