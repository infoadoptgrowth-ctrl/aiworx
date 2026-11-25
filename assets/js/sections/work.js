/* Case studies: before/after viewer. Scrolling wipes from "before" to "after" while the number counts up;
   drag (or arrow keys) to compare; tabs autoplay through the six clients. */
import { $, $$, win, onTick, bootSection, magnetic, clamp01, reducedMotion, finePointer } from '../core.js';

const CASES = [
  { slug: 'northside-dental', name: 'Northside Dental', title: 'From page 4 to the top 3 for “dentist near me”', kind: 'Dental clinic', services: 'SEO;Content', metric: 'Organic visits a month', from: '4,200', to: '38,900', unit: '', year: '2025', sum: 'A local SEO rebuild: 60 location pages, 180 reviews and a content plan for every treatment.', img: 'assets/img/iQ0lX69C3YgeRjqffxWadnnAmnc.webp' },
  { slug: 'kettlebrook-coffee', name: 'Kettlebrook Coffee', title: 'A coffee brand people film for us', kind: 'Food & drink', services: 'Social media;Content', metric: 'Instagram followers', from: '8,100', to: '96,400', unit: '', year: '2025', sum: 'Three reels a week shot in the roasteries turned a local brand into a national one.', img: 'assets/img/myjp4zr3op66cJhewFtasNpY5I.webp' },
  { slug: 'fitloop', name: 'Fitloop', title: 'Paid ads that pay for themselves in 11 days', kind: 'Fitness app', services: 'Paid ads', metric: 'Return on ad spend', from: '1.4', to: '6.2', unit: '×', year: '2025', sum: 'We rebuilt the Meta account around creative testing and cut the cost per trial by 58%.', img: 'assets/img/hd4rblq8DW7sPIt8FWcRq1HdmQ0.webp' },
  { slug: 'haven-realty', name: 'Haven Realty', title: 'A pipeline of sellers, not just clicks', kind: 'Real estate', services: 'Paid ads;Web design', metric: 'Seller leads a month', from: '14', to: '122', unit: '', year: '2024', sum: 'A new site with valuation landing pages and Google campaigns for every neighbourhood.', img: 'assets/img/zEqvjQAlVPs2PE6oz2TsexQ8TA.webp' },
  { slug: 'lumen-skin', name: 'Lumen Skin', title: 'A skincare launch that sold out twice', kind: 'Beauty', services: 'Social media;Branding', metric: 'Launch-week revenue', from: '$18k', to: '$142k', unit: '', year: '2024', sum: 'Brand, creators and a TikTok launch plan built in six weeks.', img: 'assets/img/QSuLrUGcfrrneXqjDG4ZKyC91Gk.webp' },
  { slug: 'orbit-legal', name: 'Orbit Legal', title: 'Thought leadership that books consultations', kind: 'Law firm', services: 'Content;SEO', metric: 'Consultations a month', from: '9', to: '57', unit: '', year: '2024', sum: 'Weekly LinkedIn posts and long-form guides that rank and get shared by clients.', img: 'assets/img/csWXqRpXZMLSqxx74oKZj5QkJw.webp' },
];
const START = 0.85; // divider resting position (mostly "before")
const HOLD = 0.15; // divider position once the story has played
const RM = reducedMotion();

const sec = $('.rwwk');
const main = $('.rwwk-main', sec);
const tabs = $$('.rwwk-tab', sec);
const view = $('.rwwk-view', sec);
const handle = $('.rwwk-handle', sec);
const cursor = $('.rwwk-cur', sec);
const topCl = $('.rwwk-cl', sec);
const topMl = $('.rwwk-ml', sec);
const info = $('.rwwk-info', sec);
const N = CASES.length;

/* the server-rendered progress bar is replaced by the one autoplay manages */
for (const p of $$('.rwwk-prog', sec)) p.parentNode.removeChild(p);
bootSection(sec);
magnetic(sec);

/* ------------------------------------------------------------ helpers */
const easeIO = (v) => {
  const t = clamp01(v);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};
function parseNum(s) {
  const m = String(s || '').trim().match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/);
  if (!m) return null;
  return { pre: m[1], n: parseFloat(m[2].replace(/,/g, '')), dec: (m[2].split('.')[1] || '').length, grp: m[2].includes(','), suf: m[3] };
}
const fmt = (v, dec, grp) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: grp || Math.abs(v) >= 1e4 });
function hash(s) {
  let t = 7;
  for (let i = 0; i < s.length; i++) t = (t * 31 + s.charCodeAt(i)) >>> 0;
  return t;
}
function afterPath(slug) {
  const t = hash(slug), pts = [];
  for (let e = 0; e < 13; e++) {
    const r = e / 12, y = 276 - r ** 1.7 * 236, j = e === 0 || e === 12 ? 0 : (((t >> ((e % 10) * 3)) & 7) - 3.5) * 7;
    pts.push([r * 1e3, Math.max(22, Math.min(290, y + j))]);
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let e = 1; e < 13; e++) {
    const [x0, y0] = pts[e - 1], [x1, y1] = pts[e], m = (x0 + x1) / 2;
    d += ` C${m},${y0} ${m},${y1} ${x1},${y1}`;
  }
  return d;
}
function beforePath(slug) {
  const t = hash(slug + 'b');
  let d = 'M0,262';
  for (let e = 1; e <= 12; e++) d += ` L${(e / 12) * 1e3},${(262 + (((t >> ((e % 10) * 3)) & 7) - 3.5) * 2.2).toFixed(1)}`;
  return d;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function caseHTML(c, key, cls) {
  const a = afterPath(c.slug);
  return `<div class="rwwk-case ${cls}"${cls.includes('is-out') ? ' aria-hidden="true"' : ''}>
  <div class="rwwk-lay rwwk-after"><img src="${c.img}" alt="" loading="lazy" decoding="async" draggable="false"><i class="rwwk-scrim"></i>
    <svg class="rwwk-ch rwwk-ch-a" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="rwwk-g-${key}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--rw-brass)" stop-opacity=".42"/><stop offset="1" stop-color="var(--rw-brass)" stop-opacity="0"/></linearGradient></defs><path d="${a} L1000,300 L0,300 Z" fill="url(#rwwk-g-${key})"/><path d="${a}" class="rwwk-ln" vector-effect="non-scaling-stroke"/></svg>
    <div class="rwwk-num rwwk-num-a"><span class="rwwk-pill is-a f-m"><i></i>After</span><span class="rwwk-big f-d"><span data-big>${esc(c.to + c.unit)}</span></span></div></div>
  <div class="rwwk-lay rwwk-before"><img src="${c.img}" alt="" loading="lazy" decoding="async" draggable="false"><i class="rwwk-scrim"></i>
    <svg class="rwwk-ch rwwk-ch-b" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><path d="${beforePath(c.slug)}" class="rwwk-fl" vector-effect="non-scaling-stroke"/></svg>
    <div class="rwwk-num rwwk-num-b"><span class="rwwk-pill f-m">Before</span><span class="rwwk-ghost f-d">${esc(c.from + c.unit)}</span></div></div>
</div>`;
}
function infoHTML(c) {
  return `<div class="rwwk-info-in"><div class="rwwk-il"><p class="rwwk-meta f-m"><span>${esc(c.kind)}</span><span>${esc(c.year)}</span></p>
  <h3 class="rwwk-title f-d"><a href="work-${c.slug}.html">${esc(c.title)}</a></h3></div>
  <div class="rwwk-ir"><p class="rwwk-sum">${esc(c.sum)}</p><div class="rwwk-foot"><span class="rwwk-svs f-m">${c.services.split(';').map((s) => `<span>${esc(s)}</span>`).join('')}</span>
  <a class="rwwk-read f-m" href="work-${c.slug}.html">Read the case<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg></a></div></div></div>`;
}

/* ------------------------------------------------------------ state */
const st = { mode: 'scroll', dv: RM ? 0.5 : START, man: 0.5, r0: 0, sp: 0, inView: false };
let current = 0;
let bigEl = $('.rwwk-big span', view);
let lastText = '';
let paused = false;

function valueText(k) {
  const c = CASES[current];
  const to = parseNum(c.to), from = parseNum(c.from);
  if (!to) return `${c.to}${c.unit}`;
  const f = from ? from.n : 0;
  return `${to.pre}${fmt(f + (to.n - f) * k, to.dec, to.grp)}${to.suf}${c.unit}`;
}
function setDv(v) {
  view.style.setProperty('--dv', v.toFixed(4));
  const k = clamp01((START - v) / 0.7);
  view.style.setProperty('--dt', k.toFixed(4));
  const txt = valueText(k);
  if (txt !== lastText && bigEl) bigEl.textContent = lastText = txt;
  const pct = Math.round(v * 100);
  handle.setAttribute('aria-valuenow', String(pct));
  handle.setAttribute('aria-valuetext', `${100 - pct}% after`);
}

function select(i) {
  const n = ((i % N) + N) % N;
  if (n === current) return;
  const prevDv = st.dv;
  const prev = current;
  current = n;
  // outgoing layer fades on top of the incoming one
  $$('.rwwk-case', view).forEach((el) => el.remove());
  const out = document.createRange().createContextualFragment(caseHTML(CASES[prev], `o${prev}`, 'is-out')).firstElementChild;
  out.style.setProperty('--dv', prevDv.toFixed(3));
  out.style.setProperty('--dt', clamp01((START - prevDv) / 0.7).toFixed(3));
  const inc = document.createRange().createContextualFragment(caseHTML(CASES[n], `c${n}`, 'is-in')).firstElementChild;
  view.prepend(inc);
  view.prepend(out);
  setTimeout(() => out.remove(), 900);
  bigEl = $('[data-big]', inc);
  lastText = '';
  const c = CASES[n];
  topCl.innerHTML = `<i class="rw-port"></i>${esc(c.name)} · ${esc(c.year)}`;
  topMl.textContent = c.metric;
  info.innerHTML = infoHTML(c);
  info.setAttribute('aria-labelledby', `rwwk-t-${n}`);
  tabs.forEach((t, k) => {
    const sel = k === n;
    t.classList.toggle('is-sel', sel);
    t.setAttribute('aria-selected', String(sel));
    t.tabIndex = sel ? 0 : -1;
    $('.rwwk-prog', t)?.remove();
  });
  addProg();
  if (RM) setDv(0.5);
  else {
    st.mode = 'replay';
    st.r0 = performance.now();
    st.dv = START;
  }
}

/* autoplay progress bar on the selected tab (7s CSS animation → next case) */
let autoplay = false;
function addProg() {
  if (RM) return;
  const t = tabs[current];
  const p = document.createElement('i');
  p.className = 'rwwk-prog';
  p.setAttribute('aria-hidden', 'true');
  p.addEventListener('animationend', () => select(current + 1));
  t.appendChild(p);
  syncProg();
}
function syncProg() {
  const p = $('.rwwk-prog', tabs[current]);
  if (p) p.classList.toggle('is-run', autoplay && !paused);
}

tabs.forEach((t, i) => {
  t.id = `rwwk-t-${i}`;
  t.addEventListener('click', () => select(i));
  t.addEventListener('keydown', (e) => {
    const k = e.key;
    const n = k === 'ArrowRight' || k === 'ArrowDown' ? i + 1 : k === 'ArrowLeft' || k === 'ArrowUp' ? i - 1 : k === 'Home' ? 0 : k === 'End' ? N - 1 : null;
    if (n === null) return;
    e.preventDefault();
    select(n);
    tabs[((n % N) + N) % N].focus();
  });
});

/* pause autoplay while the pointer / focus is inside */
let hover = false, focus = false;
const updPause = () => {
  paused = hover || focus;
  syncProg();
};
main.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && ((hover = true), updPause()));
main.addEventListener('pointerleave', () => ((hover = false), updPause()));
main.addEventListener('focusin', () => ((focus = true), updPause()));
main.addEventListener('focusout', (e) => !main.contains(e.relatedTarget) && ((focus = false), updPause()));

/* ------------------------------------------------------------ scroll story */
if (RM) {
  setDv(0.5);
} else {
  setDv(START);
  addProg();
  const io = new IntersectionObserver(
    (e) => {
      visible = e[0].isIntersecting;
      st.inView = e[0].intersectionRatio > 0.35;
      if (!visible && st.mode !== 'scroll') st.mode = 'scroll';
    },
    { threshold: [0, 0.35, 0.6], rootMargin: '10% 0px 10% 0px' },
  );
  let visible = true, top = 0, h = 1, vh = 1, ok = false, last = -1;
  io.observe(view);
  onTick(
    (t) => {
      if (!ok) return;
      const span = Math.max(80, Math.min(vh * 0.76, vh * 0.88 - (vh * 0.7 - h)));
      st.sp = clamp01((vh * 0.88 - top) / span);
      let target;
      if (st.mode === 'manual') target = st.man;
      else if (st.mode === 'replay') {
        const k = clamp01((t - st.r0) / 1700);
        target = START - 0.7 * easeIO(k);
        if (k >= 1) st.mode = 'hold';
      } else target = st.mode === 'hold' ? HOLD : START - 0.7 * st.sp;
      st.dv = st.mode === 'manual' || st.mode === 'replay' || last < 0 ? target : st.dv + (target - st.dv) * 0.2;
      if (Math.abs(st.dv - target) < 6e-4) st.dv = target;
      if (Math.abs(st.dv - last) > 4e-4 || (st.dv === target && st.dv !== last)) {
        last = st.dv;
        setDv(st.dv);
      }
      const run = N > 1 && st.inView && (st.mode !== 'scroll' || st.sp > 0.94);
      if (run !== autoplay) {
        autoplay = run;
        syncProg();
      }
    },
    () => {
      if (!visible) {
        ok = false;
        return;
      }
      const r = view.getBoundingClientRect();
      top = r.top;
      h = r.height;
      vh = win.innerHeight || 1;
      ok = true;
    },
  );
}

/* ------------------------------------------------------------ drag to compare */
const manual = (x) => {
  const r = view.getBoundingClientRect();
  st.mode = 'manual';
  st.man = Math.min(0.97, Math.max(0.03, (x - r.left) / r.width));
  if (RM) setDv(st.man);
};
let pid = -1, sx = 0, sy = 0, dragging = false, cx = 0, cy = 0, tx = 0, ty = 0, inside = false;
view.addEventListener('pointerdown', (e) => {
  if (e.target.closest?.('a')) return;
  pid = e.pointerId;
  sx = e.clientX;
  sy = e.clientY;
  dragging = e.pointerType === 'mouse' || e.target.closest?.('.rwwk-handle') !== null;
  if (dragging) {
    try {
      view.setPointerCapture(pid);
    } catch {}
    manual(e.clientX);
    view.classList.add('is-drag');
  }
});
view.addEventListener('pointermove', (e) => {
  const r = view.getBoundingClientRect();
  tx = e.clientX - r.left;
  ty = e.clientY - r.top;
  if (!inside) {
    cx = tx;
    cy = ty;
  }
  inside = true;
  if (e.pointerId !== pid) return;
  if (!dragging && Math.abs(e.clientX - sx) > 8 && Math.abs(e.clientX - sx) > Math.abs(e.clientY - sy)) {
    dragging = true;
    try {
      view.setPointerCapture(pid);
    } catch {}
    view.classList.add('is-drag');
  }
  if (dragging) manual(e.clientX);
});
const end = () => {
  pid = -1;
  dragging = false;
  view.classList.remove('is-drag');
};
view.addEventListener('pointerup', end);
view.addEventListener('pointercancel', end);
view.addEventListener('pointerleave', () => (inside = false));
if (finePointer() && cursor)
  onTick(() => {
    if (!inside) return;
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;
    cursor.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
  });

handle.addEventListener('keydown', (e) => {
  let v = st.mode === 'manual' ? st.man : st.dv;
  const k = e.key;
  if (k === 'ArrowLeft' || k === 'ArrowDown') v -= 0.05;
  else if (k === 'ArrowRight' || k === 'ArrowUp') v += 0.05;
  else if (k === 'Home') v = 0.03;
  else if (k === 'End') v = 0.97;
  else if (k === 'PageDown') v -= 0.2;
  else if (k === 'PageUp') v += 0.2;
  else return;
  e.preventDefault();
  st.mode = 'manual';
  st.man = Math.min(0.97, Math.max(0.03, v));
  if (RM) setDv(st.man);
});
