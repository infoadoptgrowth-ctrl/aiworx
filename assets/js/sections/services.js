/* Services: six-channel accordion. Scroll switches channels; hover / click / arrow keys pick one.
   The open channel's mock UI plays its little story (SERP climb, likes, ad gauges, article typing). */
import { $, $$, win, onTick, onBreakpoint, bootSection, magnetic, clamp01, reducedMotion, finePointer, nearViewport } from '../core.js';

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
const KINDS = ['seo', 'social', 'ads', 'content', 'web', 'brand'];

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

/* ------------------------------------------------------ mock UI stories */
const easeOut = (t) => 1 - (1 - t) ** 3;
function tween(from, to, ms, delay, set) {
  let raf = 0;
  const t0 = performance.now() + delay;
  set(from);
  const step = (t) => {
    const k = clamp01((t - t0) / ms);
    set(from + (to - from) * easeOut(k));
    if (k < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
function counter(max, every, delay, set) {
  let n = 0, iv = 0;
  set(0);
  const to = setTimeout(() => {
    iv = setInterval(() => {
      n++;
      set(n);
      if (n >= max) clearInterval(iv);
    }, every);
  }, delay);
  return () => {
    clearTimeout(to);
    clearInterval(iv);
  };
}

const STORIES = {
  seo(ui, run) {
    const rows = $$('.rwsv-r', ui);
    const rank = $('.rwsv-rank', ui);
    const toast = $('.rwsv-toast', ui);
    const set = (c) => {
      const i = 4 - c;
      rows.forEach((r, e) => {
        const me = e === 4;
        const s = me ? i : e < i ? e : e + 1;
        r.style.top = `${Math.min(4, s) * 20}%`;
        if (me) r.classList.toggle('is-top', i === 0);
      });
      if (rank) rank.textContent = `#${i + 1}`;
      toast?.classList.toggle('is-on', i === 0);
    };
    if (!run) return set(4), () => {};
    return counter(4, 640, 420, set);
  },
  social(ui, run) {
    const likes = $('.rwsv-likes', ui);
    const on = (v) => {
      $('.rwsv-float', ui)?.classList.toggle('is-on', v);
      $('.rwsv-toast-s', ui)?.classList.toggle('is-on', v);
      $('.rwsv-hrt', ui)?.classList.toggle('is-pop', v);
    };
    const setLikes = (v) => likes && (likes.textContent = `${Math.round(v).toLocaleString('en-US')} likes`);
    if (!run) return setLikes(1312), on(true), () => {};
    const a = tween(1184, 1312, 2200, 500, setLikes);
    const b = counter(1, 400, 700, (n) => on(n >= 1));
    return () => (a(), b());
  },
  ads(ui, run) {
    const gauges = $$('.rwsv-g', ui);
    const bars = $('.rwsv-bars', ui);
    const gauge = (g, v, max, txt) => {
      const arc = $('.rwsv-g1', g);
      if (arc) arc.style.strokeDashoffset = String(1 - clamp01(v / max));
      const b = $('b', g);
      if (b) b.textContent = txt;
    };
    const ctr = (v) => gauges[0] && gauge(gauges[0], v, 6, `${v.toFixed(1)}%`);
    const roas = (v) => gauges[1] && gauge(gauges[1], v, 8, `${v.toFixed(1)}×`);
    bars?.classList.toggle('is-run', !!run);
    if (!run) return ctr(4.8), roas(6.2), () => {};
    const a = tween(0.9, 4.8, 1900, 300, ctr);
    const b = tween(1.4, 6.2, 2100, 450, roas);
    return () => (a(), b());
  },
  content(ui, run) {
    const type = $('.rwsv-type', ui);
    const caret = $('i', type);
    const title = type.dataset.title || (type.dataset.title = type.textContent);
    const prog = $('.rwsv-prog i', ui);
    const reads = $('.rwsv-reads', ui);
    const setType = (n) => {
      type.firstChild && type.firstChild.nodeType === 3 ? (type.firstChild.nodeValue = title.slice(0, n)) : type.insertBefore(document.createTextNode(title.slice(0, n)), caret);
      caret.className = n < title.length ? 'is-typing' : '';
    };
    const setReads = (v) => {
      if (prog) prog.style.transform = `scaleX(${(v / 2410).toFixed(3)})`;
      if (reads) reads.lastChild.nodeValue = `${Math.round(v).toLocaleString('en-US')} reads this week`;
    };
    if (reads && reads.lastChild?.nodeType !== 3) reads.appendChild(document.createTextNode(''));
    if (!run) return setType(title.length), setReads(2410), () => {};
    const a = counter(title.length, 40, 350, setType);
    const b = tween(0, 2410, 2600, 600, setReads);
    return () => (a(), b());
  },
};

const near = nearViewport(sec, '0px');
function play() {
  stopRun();
  stopRun = () => {};
  const kind = KINDS[active % KINDS.length];
  const ui = $('.rwsv-ui', panels[active]);
  const story = STORIES[kind];
  if (!ui || !story) return;
  const run = sec.classList.contains('is-on') && !RM;
  stopRun = story(ui, run) || (() => {});
}

/* initial: every non-active UI shows its end state; the active one plays once the section is on */
panels.forEach((p, i) => {
  const ui = $('.rwsv-ui', p);
  const s = STORIES[KINDS[i % KINDS.length]];
  if (ui && s) s(ui, false);
});
render();
sec.addEventListener('rw:on', play);
void near;
