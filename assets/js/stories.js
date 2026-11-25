/* The little "story" each channel mock-UI plays (SERP climb, likes, ad gauges, article typing).
   Shared by the home Services accordion (rwsv), the Services grid (rwsg) and the service pages (rwsd).

   playStory(ui, mode, { speed })
     ui     the `.{prefix}-ui` element; its second class (`{prefix}-seo|soc|ads|cnt|web|brd`) picks the story
     mode   'run'  — play from the start
            'wait' — sit at the starting frame (before the card has scrolled in)
            'end'  — show the finished frame
     speed  1 = normal, 2 = replay twice as fast
   Returns a function that cancels the running story. */

const clamp01 = (v) => Math.min(1, Math.max(0, v));
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
const noop = () => {};

const STORIES = {
  seo(ui, p, mode, sp) {
    const rows = Array.from(ui.querySelectorAll(`.${p}-r`));
    const rank = ui.querySelector(`.${p}-rank`);
    const toast = ui.querySelector(`.${p}-toast`);
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
    if (mode === 'wait') return set(0), noop;
    if (mode === 'end') return set(4), noop;
    return counter(4, 640 / sp, 420, set);
  },
  soc(ui, p, mode, sp) {
    const likes = ui.querySelector(`.${p}-likes`);
    const on = (v) => {
      ui.querySelector(`.${p}-float`)?.classList.toggle('is-on', v);
      ui.querySelector(`.${p}-toast-s`)?.classList.toggle('is-on', v);
      ui.querySelector(`.${p}-hrt`)?.classList.toggle('is-pop', v);
    };
    const setLikes = (v) => likes && (likes.textContent = `${Math.round(v).toLocaleString('en-US')} likes`);
    if (mode === 'wait') return setLikes(1184), on(false), noop;
    if (mode === 'end') return setLikes(1312), on(true), noop;
    const a = tween(1184, 1312, 2200 / sp, 500, setLikes);
    const b = counter(1, 400 / sp, 700, (n) => on(n >= 1));
    return () => (a(), b());
  },
  ads(ui, p, mode, sp) {
    const gauges = Array.from(ui.querySelectorAll(`.${p}-g`));
    const bars = ui.querySelector(`.${p}-bars`);
    const gauge = (g, v, max, txt) => {
      const arc = g.querySelector(`.${p}-g1`);
      if (arc) arc.style.strokeDashoffset = String(1 - clamp01(v / max));
      const b = g.querySelector('b');
      if (b) b.textContent = txt;
    };
    const ctr = (v) => gauges[0] && gauge(gauges[0], v, 6, `${v.toFixed(1)}%`);
    const roas = (v) => gauges[1] && gauge(gauges[1], v, 8, `${v.toFixed(1)}×`);
    if (bars) {
      bars.classList.remove('is-run');
      if (mode === 'run') void bars.offsetWidth, bars.classList.add('is-run');
    }
    if (mode === 'wait') return ctr(0.9), roas(1.4), noop;
    if (mode === 'end') return ctr(4.8), roas(6.2), noop;
    const a = tween(0.9, 4.8, 1900 / sp, 300, ctr);
    const b = tween(1.4, 6.2, 2100 / sp, 450, roas);
    return () => (a(), b());
  },
  cnt(ui, p, mode, sp) {
    const type = ui.querySelector(`.${p}-type`);
    const caret = type.querySelector('i');
    const title = type.dataset.title || (type.dataset.title = type.textContent);
    const prog = ui.querySelector(`.${p}-prog i`);
    const reads = ui.querySelector(`.${p}-reads`);
    if (reads && reads.lastChild?.nodeType !== 3) reads.appendChild(document.createTextNode(''));
    const setType = (n) => {
      if (type.firstChild && type.firstChild.nodeType === 3) type.firstChild.nodeValue = title.slice(0, n);
      else type.insertBefore(document.createTextNode(title.slice(0, n)), caret);
      caret.className = n < title.length ? 'is-typing' : '';
    };
    const setReads = (v) => {
      if (prog) prog.style.transform = `scaleX(${(v / 2410).toFixed(3)})`;
      if (reads) reads.lastChild.nodeValue = `${Math.round(v).toLocaleString('en-US')} reads this week`;
    };
    if (mode === 'wait') return setType(0), setReads(0), noop;
    if (mode === 'end') return setType(title.length), setReads(2410), noop;
    const a = counter(title.length, 40 / sp, 350, setType);
    const b = tween(0, 2410, 2600 / sp, 600, setReads);
    return () => (a(), b());
  },
  /* web + brand are pure CSS loops */
  web: () => noop,
  brd: () => noop,
};

export function playStory(ui, mode = 'run', { speed = 1 } = {}) {
  if (!ui) return noop;
  const cls = Array.from(ui.classList).find((c) => /-(seo|soc|ads|cnt|web|brd)$/.test(c));
  if (!cls) return noop;
  const [prefix, kind] = [cls.slice(0, cls.lastIndexOf('-')), cls.slice(cls.lastIndexOf('-') + 1)];
  return STORIES[kind](ui, prefix, mode, speed) || noop;
}
