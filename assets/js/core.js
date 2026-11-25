/**
 * AiWorx — shared runtime used by every section module.
 *
 *  - one requestAnimationFrame loop (pre → reads → writes) shared by all sections
 *  - breakpoint classes (.is-ph < 810px, .is-tab 810–1099px) on every `.rw` section
 *  - in-view reveals: a section gets `.is-on` (and so do its eyebrow + heading)
 *  - scroll progress custom properties (--sp / --pp) for parallax & pinned scenes
 *  - magnetic buttons, Lenis smooth scrolling and in-page anchor scrolling
 */

export const win = window;
export const doc = document;
export const root = doc.documentElement;

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const reducedMotion = () => win.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => win.matchMedia('(hover:hover) and (pointer:fine)').matches;
export const $ = (sel, el = doc) => el.querySelector(sel);
export const $$ = (sel, el = doc) => Array.from(el.querySelectorAll(sel));

/* ------------------------------------------------------------------ ticker */
const tick = { pre: new Set(), reads: new Set(), subs: new Set(), raf: 0 };
/* Reads (getBoundingClientRect & co.) force the browser to finish style + layout, so they only run when the
   page has scrolled or resized — or every 15th frame as a safety net for layout that moves on its own. */
/* (scroll and resize are tracked with passive listeners: reading window.scrollY inside the frame would itself
   force a layout every frame) */
let sinceRead = 0, dirty = true;
/** Force the next frame to re-measure (call after changing layout from code). */
export const invalidate = () => (dirty = true);
win.addEventListener('scroll', invalidate, { passive: true });
win.addEventListener('resize', invalidate, { passive: true });
function frame(t) {
  tick.pre.forEach((f) => f(t));
  if (dirty || ++sinceRead >= 15) {
    sinceRead = 0;
    dirty = false;
    tick.reads.forEach((f) => f(t));
  }
  tick.subs.forEach((f) => f(t));
  tick.raf = requestAnimationFrame(frame);
}
/** Subscribe to the shared rAF loop. `read` runs before every `write`. Returns an unsubscribe fn. */
export function onTick(write, read, pre) {
  if (!tick.raf) tick.raf = requestAnimationFrame(frame);
  tick.subs.add(write);
  read && tick.reads.add(read);
  pre && tick.pre.add(pre);
  return () => {
    tick.subs.delete(write);
    read && tick.reads.delete(read);
    pre && tick.pre.delete(pre);
  };
}

/* ------------------------------------------------------------- breakpoints */
export function viewport() {
  const w = win.innerWidth;
  return { w, h: win.innerHeight, ph: w < 810, tab: w >= 810 && w < 1100, cmp: w < 1100 };
}
const bpListeners = new Set();
/** Run `fn(viewport)` now and whenever the breakpoint bucket changes. */
export function onBreakpoint(fn) {
  bpListeners.add(fn);
  fn(viewport());
  return () => bpListeners.delete(fn);
}
let lastBucket = '';
function applyBreakpoint(force) {
  const v = viewport();
  const bucket = v.ph ? 'ph' : v.tab ? 'tab' : 'desk';
  if (!force && bucket === lastBucket) return;
  lastBucket = bucket;
  $$('.rw:not(.rwhd)').forEach((el) => {
    el.classList.toggle('is-ph', v.ph);
    el.classList.toggle('is-tab', v.tab);
  });
  bpListeners.forEach((fn) => fn(v));
}
applyBreakpoint(true);
win.addEventListener('resize', () => applyBreakpoint(false));

/* ------------------------------------------------------- idle sections */
/* Sections well outside the viewport get .is-idle, which pauses their looping CSS animations
   (pulses, blinks, marquees, mock-UI loops) so the browser stops repainting things nobody can see. */
{
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-idle', !e.isIntersecting)),
    { rootMargin: '20% 0px 20% 0px' },
  );
  $$('.rw:not(.rwhd)').forEach((el) => io.observe(el));
}

/* ----------------------------------------------------------------- reveals */
/**
 * Calls `cb` once, the first time `el` scrolls into view.
 * Mirrors the reference: threshold = min(t, max(.005, 80px / height)).
 */
/** Runs `cb` once the intro loader has released the page (html.rw-hold-* removed), or after 9s. */
export function whenReleased(cb) {
  const held = () => /(^|\s)rw-hold/.test(root.className);
  if (!held()) return cb();
  const mo = new MutationObserver(() => {
    if (held()) return;
    mo.disconnect();
    clearTimeout(to);
    cb();
  });
  mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  const to = setTimeout(() => {
    mo.disconnect();
    cb();
  }, 9000);
}

export function whenInView(el, cb, t = 0.16) {
  if (reducedMotion()) {
    cb();
    return () => {};
  }
  let stop = () => {};
  whenReleased(() => (stop = observeOnce(el, cb, t)));
  return () => stop();
}
function observeOnce(el, cb, t) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) {
          io.disconnect();
          cb();
        }
    },
    { threshold: Math.min(t, Math.max(0.005, 80 / Math.max(1, el.offsetHeight))) },
  );
  io.observe(el);
  return () => io.disconnect();
}

/** Turns a section "on": the section, its eyebrow and its heading get `.is-on`. */
export function switchOn(section) {
  section.classList.add('is-on');
  $$('.rw-eb, .rw-hd', section).forEach((e) => {
    if (!e.closest('[data-own-on]') || e.closest('[data-own-on]') === section) e.classList.add('is-on');
  });
  section.dispatchEvent(new CustomEvent('rw:on'));
}

/** Standard section boot: drop SSR static flags, then reveal when in view. */
export function bootSection(section, { staticFlags = ['is-set', 'is-fin', 'is-still', 'is-park'], threshold } = {}) {
  if (!section) return;
  staticFlags.forEach((c) => section.classList.remove(c));
  eagerImagesNear(section);
  whenInView(section, () => switchOn(section), threshold);
}

/** Promote lazy images to eager a screen and a half before they are needed. */
export function eagerImagesNear(el) {
  const io = new IntersectionObserver(
    (e) => {
      if (!e[0].isIntersecting) return;
      io.disconnect();
      $$('img', el).forEach((img) => {
        img.loading = 'eager';
        img.decode?.().catch(() => {});
      });
    },
    { rootMargin: '150% 0px 150% 0px' },
  );
  io.observe(el);
}

/** Tracks whether an element is near the viewport (cheap gate for per-frame work). */
export function nearViewport(el, margin = '25% 0px 25% 0px') {
  const state = { on: true };
  const io = new IntersectionObserver((e) => (state.on = e[0].isIntersecting), { rootMargin: margin });
  io.observe(el);
  state.stop = () => io.disconnect();
  return state;
}

/**
 * Smoothed scroll progress for a section, reported to `cb(sp, pp)`:
 *   sp  0 → 1 while the section travels through the viewport
 *   pp  0 → 1 while a section taller than the viewport is "pinned"
 * `--sp` is written only onto `targets` — the few elements whose CSS reads it. Writing a custom
 * property on a whole section would force the browser to restyle every element inside it each frame.
 */
export function scrollProgress(el, cb, { targets = [], ease = 0.14 } = {}) {
  const near = nearViewport(el);
  let top = 0, height = 1, vh = 1, sp = -1, pp = -1, last = -9, settled = false, ready = false;
  const stop = onTick(
    () => {
      if (!ready) return;
      const tSp = clamp01((vh - top) / (vh + height));
      const tPp = height > vh * 1.05 ? clamp01(-top / (height - vh)) : tSp;
      if (sp < 0) {
        sp = tSp;
        pp = tPp;
      } else {
        sp += (tSp - sp) * ease;
        pp += (tPp - pp) * ease;
        if (Math.abs(tSp - sp) < 5e-4) sp = tSp;
        if (Math.abs(tPp - pp) < 5e-4) pp = tPp;
      }
      settled = sp === tSp && pp === tPp;
      if (Math.abs(sp + pp - last) < 3e-4) return;
      last = sp + pp;
      if (targets.length) {
        const v = sp.toFixed(4);
        for (const t of targets) t.style.setProperty('--sp', v);
      }
      cb && cb(sp, pp);
    },
    () => {
      if (!near.on && settled) {
        ready = false;
        return;
      }
      const r = el.getBoundingClientRect();
      top = r.top;
      height = r.height;
      vh = win.innerHeight || 1;
      ready = true;
    },
  );
  return () => {
    stop();
    near.stop();
  };
}

/* ---------------------------------------------------------------- magnetic */
/** Buttons marked [data-mag] drift up to 8px toward the cursor inside `scope`. */
export function magnetic(scope) {
  if (!finePointer()) return;
  const items = () => $$('[data-mag]', scope);
  scope.addEventListener('pointermove', (e) => {
    for (const b of items()) {
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      const f = d < 150 ? (1 - d / 150) * 8 : 0;
      b.style.setProperty('--mx', `${(dx / (d || 1)) * f}px`);
      b.style.setProperty('--my', `${(dy / (d || 1)) * f}px`);
    }
  });
  scope.addEventListener('pointerleave', () => {
    for (const b of items()) {
      b.style.setProperty('--mx', '0px');
      b.style.setProperty('--my', '0px');
    }
  });
}

/* ------------------------------------------------------------ count-ups */
export const fmtInt = (n) => Math.round(n).toLocaleString('en-US');
/** Animate a number from `from` to `to` over `ms`, calling `set(value)` each frame. */
export function countUp(from, to, ms, set, easing = (t) => 1 - Math.pow(1 - t, 3)) {
  if (reducedMotion()) {
    set(to);
    return () => {};
  }
  const t0 = performance.now();
  let raf = 0;
  const step = (t) => {
    const k = clamp01((t - t0) / ms);
    set(from + (to - from) * easing(k));
    if (k < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/* ------------------------------------------------------- smooth scrolling */
let lenis = null;
export const getLenis = () => lenis;
const ANCHOR_OFFSET = 72;

export function scrollToTarget(target) {
  if (!target) return;
  if (lenis) lenis.scrollTo(target, { offset: -ANCHOR_OFFSET });
  else target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
}

doc.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const target = id ? doc.getElementById(id) : null;
  if (!target) return;
  e.preventDefault();
  scrollToTarget(target);
  try {
    history.pushState(null, '', '#' + id);
  } catch {}
});

if (!reducedMotion() && finePointer()) {
  import('../vendor/lenis.mjs')
    .then((m) => {
      const Lenis = m.default || m.Lenis;
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
      win.__aiLenis = lenis;
      onTick(() => {}, undefined, (t) => lenis.raf(t));
      root.classList.add('lenis');
    })
    .catch(() => {});
}

/** Pause / resume page scrolling (used by the mobile menu). */
export function lockScroll(lock) {
  root.style.overflow = lock ? 'hidden' : '';
  if (lenis) lock ? lenis.stop() : lenis.start();
}

/* ------------------------------------------------------------------ misc */
/** Live clock text for a time zone, e.g. "14:07" (or with seconds). */
export function clock(tz = 'America/New_York', seconds = false) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      ...(seconds ? { second: '2-digit' } : {}),
      hour12: false,
    }).format(new Date());
  } catch {
    return '--:--';
  }
}

export const SITE = {
  name: 'AiWorx',
  email: 'hello@aiworxllc.com',
  tz: 'America/New_York',
};

/**
 * Rolling-digit number: each digit is a vertical reel (0–9) that steps to its new value.
 * `el` is the wrapper span (e.g. .rwpr-roll); `prefix` is the class stem ("rwpr" → .rwpr-rd).
 */
export function rollTo(el, text, prefix) {
  const prev = el._digits || (el.getAttribute('aria-label') || '').split('');
  const chars = String(text).split('');
  const off = prev.length - chars.length;
  const old = Array.from(el.children);
  const frag = document.createDocumentFragment();
  chars.forEach((c, i) => {
    if (!/\d/.test(c)) {
      const s = document.createElement('span');
      s.setAttribute('aria-hidden', 'true');
      s.textContent = c;
      frag.appendChild(s);
      return;
    }
    const was = prev[i + off];
    const steps = Math.max(1, /\d/.test(was || '') ? Math.abs(+c - was) : 1);
    let rd = old[old.length - (chars.length - i)];
    if (!rd || !rd.classList.contains(`${prefix}-rd`)) {
      rd = document.createElement('span');
      rd.className = `${prefix}-rd`;
      rd.setAttribute('aria-hidden', 'true');
      rd.innerHTML = `<span>${'0123456789'.split('').map((d) => `<i>${d}</i>`).join('')}</span>`;
    }
    const reel = rd.firstElementChild;
    reel.style.transitionTimingFunction = `steps(${steps}, end)`;
    reel.style.transitionDuration = `${Math.min(0.6, 0.07 * steps + 0.08)}s`;
    reel.style.transform = `translateY(${-Number(c) * 10}%)`;
    frag.appendChild(rd);
  });
  el.replaceChildren(frag);
  el.setAttribute('aria-label', text);
  el._digits = chars;
}

/**
 * Counts the number inside a text like "$142k", "38,900" or "6.2×" up from 0 when `run()` is called.
 * Returns { run, end } — `end()` shows the final text immediately.
 */
export function numberText(el, ms = 1600, delay = 200) {
  const final = el.textContent;
  const m = final.match(/^([^\d]*)([\d,]*\.?\d+)(.*)$/);
  if (!m) return { run() {}, end() {} };
  const n = parseFloat(m[2].replace(/,/g, ''));
  const dec = m[2].includes('.') ? m[2].split('.')[1].length : 0;
  const grp = m[2].includes(',');
  const fmt = (v) => `${m[1]}${grp ? v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : v.toFixed(dec)}${m[3]}`;
  el.setAttribute('aria-label', final);
  return {
    run() {
      if (reducedMotion()) return (el.textContent = final);
      const t0 = performance.now() + delay;
      el.textContent = fmt(0);
      const step = (t) => {
        const k = clamp01((t - t0) / ms);
        el.textContent = fmt(n * (1 - (1 - k) ** 3));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    reset() {
      el.textContent = fmt(0);
    },
    end() {
      el.textContent = final;
    },
  };
}
