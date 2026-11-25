/* Intro loader (first visit per session): the AiWorx mark beats, the name resolves, three reach rings sweep a crowd
   of dots lime while the counter climbs — then a circular hole opens onto the page. Click / Esc skips. */
const doc = document;
const root = doc.documentElement;
const el = doc.querySelector('.rwld');
const DURATION = 2400;
const EXIT = 680;
const COUNT = 1284300;

const release = () => root.classList.remove('rw-hold-ld');
const done = () => {
  root.classList.remove('rwld-go', 'rw-hold-ld', 'rwld-rm');
  el.className = 'rwld is-gone';
  el.hidden = true;
};
const remember = () => {
  try {
    sessionStorage.setItem('rw-loaded', '1');
  } catch {}
};

function run() {
  window.__rwldLive = true;
  if (!el || !root.classList.contains('rwld-go')) return done();
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.99 || performance.now() > 3500) return done();
  el.style.animation = 'none';
  el.style.setProperty('--T', `${DURATION}ms`);
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const sk = el.querySelector('.rwld-sk');
    if (sk) sk.textContent = 'Tap to skip';
  }

  const sheet = el.querySelector('.rwld-sheet');
  const canvas = el.querySelector('.rwld-cv');
  const mark = el.querySelector('.rwld-mk');
  const num = el.querySelector('.rwld-cn b');
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const timers = [];
  let raf = 0, stopped = false, skip = () => {};
  const stop = () => {
    stopped = true;
    timers.forEach(clearTimeout);
    cancelAnimationFrame(raf);
    doc.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => e.key === 'Escape' && skip();
  doc.addEventListener('keydown', onKey);
  el.addEventListener('click', () => skip());

  if (root.classList.contains('rwld-rm')) {
    num.textContent = fmt(COUNT);
    el.className = 'rwld is-run';
    timers.push(setTimeout(() => (remember(), release(), (el.className = 'rwld is-exit')), 420));
    timers.push(setTimeout(() => (stop(), done()), 840));
    return;
  }

  const t0 = typeof window.__rwld0 === 'number' ? window.__rwld0 : performance.now();
  const ctx = canvas.getContext('2d');
  const rgb = (v, fb) => {
    const i = doc.createElement('i');
    i.style.color = `var(${v})`;
    el.appendChild(i);
    const m = getComputedStyle(i).color.match(/[\d.]+/g);
    i.remove();
    return m ? m.slice(0, 3).join(',') : fb;
  };
  const lime = rgb('--rw-brass', '212,249,5');
  const white = rgb('--rw-cloud', '255,255,255');
  const leaf = rgb('--rw-pop', '124,178,3');
  let W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1), cx = W / 2, cy = H * 0.42;
  const size = () => {
    W = innerWidth;
    H = innerHeight;
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const r = mark.getBoundingClientRect();
    if (r.width) {
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
    }
  };
  size();
  addEventListener('resize', size);

  const clamp = (v) => Math.min(1, Math.max(0, v));
  const easeIO = (v) => {
    const t = clamp(v);
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  };
  const easeOut3 = (v) => 1 - (1 - clamp(v)) ** 3;
  const easeOutCbrt = (v) => 1 - (1 - clamp(v)) ** (1 / 3);

  const far = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
  const k = DURATION / 2400;
  const RING_AT = [0.05, 0.2, 0.36].map((v) => v * DURATION);
  const RING_LEN = [0.32, 0.35, 0.38].map((v) => v * DURATION);
  const RING_R = [0.34, 0.68, 1.04].map((v) => v * far);
  const N = Math.round(Math.min(640, Math.max(150, (W * H) / 2200)));
  const xs = new Float32Array(N), ys = new Float32Array(N), born = new Float32Array(N), hit = new Float32Array(N);
  const keep = Array.from(el.querySelectorAll('[data-keep]')).map((n) => {
    const r = n.getBoundingClientRect();
    return [r.left - 14, r.top - 12, r.right + 14, r.bottom + 12];
  });
  const free = (x, y) => {
    if (Math.hypot(x - cx, y - cy) < 52) return false;
    for (const b of keep) if (x > b[0] && x < b[2] && y > b[1] && y < b[3]) return false;
    return x > 6 && x < W - 6 && y > 6 && y < H - 6;
  };
  const gauss = () => {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const clusters = Array.from({ length: 18 }, () => [Math.random() * W, Math.random() * H, 18 + Math.random() * 60]);
  let n = 0;
  for (let tries = 0; n < N && tries++ < N * 12; ) {
    let x, y;
    if (Math.random() < 0.6) {
      const c = clusters[(Math.random() * clusters.length) | 0];
      x = c[0] + gauss() * c[2];
      y = c[1] + gauss() * c[2] * 0.8;
    } else {
      x = Math.random() * W;
      y = Math.random() * H;
    }
    if (!free(x, y)) continue;
    const d = Math.hypot(x - cx, y - cy);
    let at = 1e9;
    for (let r = 0; r < 3; r++)
      if (d <= RING_R[r]) {
        at = Math.min(at, RING_AT[r] + RING_LEN[r] * easeOutCbrt(d / RING_R[r]));
        break;
      }
    xs[n] = x;
    ys[n] = y;
    hit[n] = at;
    born[n] = Math.max(0, Math.min(60 * k + Math.random() * 620 * k, at - 110));
    n++;
  }

  let exitAt = Math.max(DURATION - EXIT, performance.now() - t0 + 700);
  let exiting = false, shown = -1, smooth = 0;
  const exit = () => {
    if (exiting) return;
    exiting = true;
    remember();
    release();
    el.className = 'rwld is-exit';
  };
  skip = () => {
    if (exiting || stopped) return;
    const now = performance.now() - t0;
    for (let i = 0; i < n; i++) if (hit[i] > now) hit[i] = now - 1;
    exitAt = Math.min(exitAt, now + 140);
    el.classList.add('is-skip');
  };
  el.className = 'rwld is-run';

  const frame = () => {
    if (stopped) return;
    const t = performance.now() - t0;
    if (!exiting && t >= exitAt) exit();
    const ex = exiting ? easeIO((t - exitAt) / EXIT) : 0;
    const hole = ex * (far + 40);
    if (exiting) sheet.style.setProperty('--hole', `${hole.toFixed(1)}px`);
    let reached = 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (let r = 0; r < 3; r++) {
      const p = (t - RING_AT[r]) / RING_LEN[r];
      if (p < 0 || p > 1.3) continue;
      const rad = RING_R[r] * easeOut3(Math.min(1, p));
      const a = 1 - clamp(p / 1.25);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${lime},${(a * 0.1).toFixed(3)})`;
      ctx.lineWidth = 16;
      ctx.stroke();
      ctx.strokeStyle = `rgba(${lime},${(a * 0.85).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    const spread = 1 + 0.2 * ex, fade = 1 - ex * 0.85;
    for (let i = 0; i < n; i++) {
      const vis = clamp((t - born[i]) / 380);
      if (vis <= 0) continue;
      const x = cx + (xs[i] - cx) * spread, y = cy + (ys[i] - cy) * spread, age = t - hit[i];
      if (age < 0) {
        ctx.globalAlpha = vis * 0.34 * fade;
        ctx.fillStyle = `rgb(${white})`;
        ctx.fillRect(x - 1, y - 1, 2, 2);
        continue;
      }
      reached++;
      const pop = age < 360 ? Math.sin((Math.PI * age) / 360) : 0;
      ctx.globalAlpha = (0.55 + 0.45 * (1 - clamp((age - 300) / 900))) * fade;
      ctx.fillStyle = `rgb(${lime})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.3 + pop * 2.2, 0, Math.PI * 2);
      ctx.fill();
      if (i % 6 === 0 && age < 700) {
        const e = age / 700;
        ctx.globalAlpha = (1 - e) * 0.6 * fade;
        ctx.strokeStyle = `rgb(${lime})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 2 + e * 15, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (i % 23 === 0 && age > 120 && age < 1250) {
        const e = (age - 120) / 1130, a = e < 0.2 ? e / 0.2 : e > 0.8 ? (1 - e) / 0.2 : 1;
        ctx.globalAlpha = a * fade;
        ctx.fillStyle = `rgb(${leaf})`;
        ctx.beginPath();
        ctx.arc(x + 5, y - 5, 2.6 * (0.6 + 0.4 * a), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (exiting && hole > 0.5) {
      ctx.beginPath();
      ctx.arc(cx, cy, hole + 9, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${lime},.2)`;
      ctx.lineWidth = 18;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, hole + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgb(${lime})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    const target = exiting ? COUNT : COUNT * (n ? reached / n : 0);
    smooth += (target - smooth) * 0.18;
    if (Math.abs(target - smooth) < 1) smooth = target;
    const v = Math.round(smooth);
    if (v !== shown) num.textContent = fmt((shown = v));
    if (exiting && t >= exitAt + EXIT) {
      stop();
      removeEventListener('resize', size);
      done();
    } else raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
}

run();
