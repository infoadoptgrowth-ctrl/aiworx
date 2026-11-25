/* Header: entrance, glass bar on scroll, hide-on-scroll-down, light/dark ground probe, mobile drawer. */
import { $, $$, win, doc, onTick, onBreakpoint, magnetic, lockScroll, clock, SITE, whenReleased } from '../core.js';

const hd = $('.rwhd');
const top = $('.rwhd-top', hd);
const drawer = $('#rwhd-drawer');
const burger = $('.rwhd-bg', hd);
const burgerText = $('.rwhd-bg-t', hd);

/* entrance */
whenReleased(() =>
  requestAnimationFrame(() => {
    hd.classList.add('is-in');
    $$('.rv', hd).forEach((e) => e.classList.add('is-on'));
  }),
);

/* breakpoints: compact header < 1100, phone < 810, CTA hidden < 370 */
onBreakpoint((v) => {
  hd.classList.toggle('is-cmp', v.cmp);
  hd.classList.toggle('is-ph', v.ph);
  hd.classList.toggle('is-xs', v.w < 370);
  if (!v.cmp && hd.classList.contains('is-open')) setOpen(false);
});

magnetic(top);

/* luminance of a computed background colour (null when mostly transparent) */
function luminance(c) {
  const m = String(c || '').match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?/);
  if (!m) return null;
  let a = m[4] === undefined ? 1 : parseFloat(m[4]);
  if (m[4] && m[4].endsWith('%')) a /= 100;
  if (a < 0.5) return null;
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => {
    const t = parseFloat(v) / 255;
    return t <= 0.03928 ? t / 12.92 : ((t + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* is the ground under the bar light? */
function probeLight() {
  let lum = null;
  for (const x of [win.innerWidth * 0.5, win.innerWidth * 0.12]) {
    for (const el of doc.elementsFromPoint(x, 40)) {
      if (hd.contains(el)) continue;
      if (/^(IMG|CANVAS|VIDEO|PICTURE|IFRAME)$/.test(el.tagName)) {
        lum = 0.1;
        break;
      }
      const l = luminance(getComputedStyle(el).backgroundColor);
      if (l !== null) {
        lum = l;
        break;
      }
    }
    if (lum !== null) break;
  }
  if (lum === null) lum = luminance(getComputedStyle(doc.body).backgroundColor) ?? 1;
  return lum > 0.45;
}

const want = { glass: false, hid: false, lt: false };
const cur = { glass: false, hid: false, lt: false };
let lastY = win.scrollY, lastProbeT = -1e9, lastProbeY = -1e9;
let scrollY = win.scrollY; // cached from the scroll event; reading it in the frame would force a layout
win.addEventListener('scroll', () => (scrollY = win.scrollY), { passive: true });
onTick(
  () => {
    for (const k of ['glass', 'hid', 'lt']) {
      if (want[k] === cur[k]) continue;
      cur[k] = want[k];
      top.classList.toggle('is-' + k, cur[k]);
      if (k === 'lt') top.classList.toggle('rw-lt', cur[k]);
    }
  },
  (t) => {
    const y = scrollY;
    if (Math.abs(y - lastY) > 6) {
      if (y > lastY && y > 140) want.hid = true;
      else if (y < lastY) want.hid = false;
      lastY = y;
    }
    const open = hd.classList.contains('is-open');
    if (open || top.matches(':focus-within')) want.hid = false;
    want.glass = y > 40;
    if (t - lastProbeT > 400 || Math.abs(y - lastProbeY) > 160) {
      lastProbeT = t;
      lastProbeY = y;
      want.lt = !open && probeLight();
    }
  },
);

/* drawer */
function setOpen(open) {
  if (open) {
    const r = burger.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    drawer.style.setProperty('--bx', `${Math.round(x)}px`);
    drawer.style.setProperty('--by', `${Math.round(y)}px`);
    drawer.style.setProperty('--br', `${Math.ceil(Math.hypot(Math.max(x, win.innerWidth - x), Math.max(y, win.innerHeight - y))) + 20}px`);
  }
  hd.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  burgerText.textContent = open ? 'Close' : 'Menu';
  drawer.setAttribute('aria-hidden', String(!open));
  $$('a, button', drawer).forEach((a) => (a.tabIndex = open ? 0 : -1));
  lockScroll(open);
  if (open) setTimeout(() => $('.rwhd-dl a', drawer)?.focus({ preventScroll: true }), 60);
}
burger.addEventListener('click', () => setOpen(!hd.classList.contains('is-open')));
drawer.addEventListener('click', (e) => {
  if (e.target.closest('a')) setOpen(false);
});
$('.rwhd-logo', hd).addEventListener('click', () => setOpen(false));
doc.addEventListener('keydown', (e) => {
  if (!hd.classList.contains('is-open')) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    setOpen(false);
    burger.focus();
    return;
  }
  if (e.key !== 'Tab') return;
  const f = [burger, ...$$('a[href], button:not([disabled])', drawer)];
  const i = f.indexOf(doc.activeElement);
  if (e.shiftKey && i <= 0) {
    e.preventDefault();
    f[f.length - 1].focus();
  } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) {
    e.preventDefault();
    f[0].focus();
  }
});

/* drawer clock */
const clk = $('[data-clock]', drawer);
const tickClock = () => (clk.textContent = clock(SITE.tz));
tickClock();
setInterval(tickClock, 15000);
