/* Page transition between internal pages.
   Leaving: a lime wavefront grows from the click point with the night colour a beat behind it, then the name of the
   page you are opening wipes in. The click point and the name are kept in sessionStorage; the inline <head> script
   on the next page covers it before first paint (html.rwtr-arrive + rw-hold-pt), and this module then shrinks the
   circle back to that point and ends in a ping. Sections wait for rw-hold-pt to clear before they reveal. */
const KEY = 'rw-pt';
const HOME = 'Home';
const DURATION = 560; // ms, the leave wipe (--d)
const root = document.documentElement;
const el = document.querySelector('.rwtr');
const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (el) {
  const kicker = el.querySelector('.rwtr-k span');
  const name = el.querySelector('.rwtr-name span');
  const timers = [];
  let mode = 'boot', busy = false;

  const setMode = (m) => {
    mode = m;
    el.className = { leave: 'rwtr rwtr-on rwtr-leave', arrive: 'rwtr rwtr-on rwtr-enter', idle: 'rwtr rwtr-idle' }[m];
    el.style.pointerEvents = m === 'leave' ? 'auto' : 'none';
    if (m === 'arrive') void el.offsetWidth; // restart the enter animations
  };
  const release = () => root.classList.remove('rw-hold-pt', 'rwtr-arrive');
  const origin = (x, y) => {
    const W = innerWidth, H = innerHeight;
    root.style.setProperty('--rwtr-x', `${Math.round(x)}px`);
    root.style.setProperty('--rwtr-y', `${Math.round(y)}px`);
    root.style.setProperty('--rwtr-r', `${Math.ceil(Math.hypot(Math.max(x, W - x), Math.max(y, H - y))) + 24}px`);
  };
  const label = (p) => {
    const f = p.split('/').pop().replace(/\.html?$/, '');
    return !f || f === 'index' ? '/' : `/${f}`;
  };
  const arrive = () => {
    setMode('arrive');
    busy = false;
    timers.push(setTimeout(release, 330), setTimeout(() => mode === 'arrive' && setMode('idle'), 1300));
  };

  /* ---------------------------------------------------------- arriving */
  let f = null;
  try {
    f = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    sessionStorage.removeItem(KEY);
  } catch {}
  if (f && Date.now() - (Number(f.t) || 0) < 8000 && !rm && root.classList.contains('rwtr-arrive')) {
    origin((Number(f.x) || 0.5) * innerWidth, (Number(f.y) || 0.5) * innerHeight);
    name.textContent = String(f.n || HOME);
    kicker.textContent = String(f.p || '/');
    arrive();
  } else {
    release();
    setMode('idle');
  }

  /* ---------------------------------------------------------- leaving */
  const pageName = (url, a) => {
    const file = url.pathname.split('/').pop().replace(/\.html?$/, '');
    if (!file || file === 'index') return HOME;
    const own = String(a.getAttribute('aria-label') || String(a.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean)[0] || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (own && own.length <= 28 && !/^(read|learn more|open|more|view|see|→)/i.test(own) && !/\d{2}:\d{2}/.test(own)) return own;
    return decodeURIComponent(file)
      .replace(/^(service|work|blog|team)-/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  document.addEventListener(
    'click',
    (e) => {
      if (rm || busy || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download') || a.closest('[data-no-trans]')) return;
      const href = a.getAttribute('href') || '';
      if (!href || /^(mailto|tel|sms|javascript):/i.test(href) || href.startsWith('#')) return;
      let url;
      try {
        url = new URL(a.href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      e.preventDefault();
      e.stopPropagation();
      busy = true;
      let x = e.clientX, y = e.clientY;
      if (!e.detail || (x === 0 && y === 0)) {
        // keyboard activation: start from the middle of the link
        const r = a.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      origin(x, y);
      const n = pageName(url, a);
      name.textContent = n;
      kicker.textContent = label(url.pathname);
      setMode('leave');
      root.classList.add('rw-hold-pt');
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ n, p: label(url.pathname), x: x / innerWidth, y: y / innerHeight, t: Date.now() }));
      } catch {}
      timers.push(setTimeout(() => (location.href = url.href), DURATION + 200));
    },
    true,
  );

  /* back/forward from the page cache: the page comes back mid-leave, so clear it */
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    timers.forEach(clearTimeout);
    release();
    setMode('idle');
    busy = false;
  });
}
