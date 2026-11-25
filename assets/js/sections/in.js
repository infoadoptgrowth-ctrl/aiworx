/* "Everyone is a crowd": a canvas crowd that sorts itself into three buyer clusters as you scroll. */
import { $, $$, win, onTick, onBreakpoint, bootSection, magnetic, clamp01, reducedMotion, finePointer, fmtInt } from '../core.js';

const sec = $('.rwin');
const panel = $('.rwin-panel', sec);
const canvas = $('.rwin-cv', sec);
const ratioV = $('.rwin-ratio-v', sec);
const crowdK = $('.rwin-ratio-k', sec);
const labs = $$('.rwin-lab', sec);
const nums = $$('.rwin-num', sec);

const CLUSTERS = [312, 1204, 88];
const SHARE = 12;
const RM = reducedMotion();

bootSection(sec);
magnetic(sec);

/* seeded PRNG (mulberry-style) so the crowd is identical on every visit */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 1831565813) >>> 0;
    let e = s;
    e = Math.imul(e ^ (e >>> 15), e | 1);
    e ^= e + Math.imul(e ^ (e >>> 7), e | 61);
    return ((e ^ (e >>> 14)) >>> 0) / 4294967296;
  };
}
function cssRGB(varName, fallback) {
  const i = document.createElement('i');
  i.style.color = `var(${varName})`;
  panel.appendChild(i);
  const m = getComputedStyle(i).color.match(/[\d.]+/g);
  i.remove();
  return m ? m.slice(0, 3).join(',') : fallback;
}
const easeIO = (v) => {
  const t = clamp01(v);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

let stop = () => {};
onBreakpoint((v) => {
  stop();
  stop = build(v);
});

function build(v) {
  const phone = v.ph, tab = v.tab;
  const N = phone ? 600 : tab ? 900 : 1200;
  const POS = phone ? [[0.22, 0.2], [0.22, 0.5], [0.22, 0.8]] : tab ? [[0.36, 0.52], [0.6, 0.4], [0.84, 0.56]] : [[0.42, 0.52], [0.63, 0.38], [0.84, 0.58]];
  labs.forEach((l, i) => {
    l.style.left = `${POS[i][0] * 100}%`;
    l.style.top = `${POS[i][1] * 100}%`;
  });
  crowdK.lastChild.textContent = `${fmtInt(N)} people in the crowd`;
  canvas.setAttribute('aria-label', `A crowd of ${N} people sorts itself: 1 in ${SHARE} are your buyers, gathered into Search, Feeds, Audiences`);

  const ctx = canvas.getContext('2d');
  const white = cssRGB('--rw-cloud', '255,255,255');
  const lime = cssRGB('--rw-brass', '212,249,5');
  const r = rng(1207 + N);
  const x0 = new Float32Array(N), y0 = new Float32Array(N), rad = new Float32Array(N), ph = new Float32Array(N);
  const grp = new Int8Array(N).fill(-1), delay = new Float32Array(N), idx = new Float32Array(N), curve = new Float32Array(N);
  const ox = new Float32Array(N), oy = new Float32Array(N), glow = new Float32Array(N);
  for (let k = 0; k < N; ) {
    const cx = r(), cy = r(), n = r() < 0.3 ? 2 + Math.floor(r() * 3) : 1;
    for (let j = 0; j < n && k < N; j++, k++) {
      x0[k] = Math.min(0.99, Math.max(0.01, cx + (r() - 0.5) * 0.018 * !!j));
      y0[k] = Math.min(0.98, Math.max(0.02, cy + (r() - 0.5) * 0.03 * !!j));
      rad[k] = 1.25 + r() * 0.6;
      ph[k] = r() * 6.283;
    }
  }
  const mix = [0.34, 0.4, 0.26];
  const groups = [[], [], []];
  for (let k = 0; k < N; k++)
    if (r() < 1 / SHARE) {
      const t = r();
      const g = t < mix[0] ? 0 : t < mix[0] + mix[1] ? 1 : 2;
      grp[k] = g;
      groups[g].push(k);
      delay[k] = r() * 0.42;
      curve[k] = (r() - 0.5) * 0.5;
    }
  groups.forEach((g) => g.forEach((k, i) => (idx[k] = i)));

  let W = 1, H = 1, dpr = 1, dirty = true;
  const resize = () => {
    dpr = Math.min(2, win.devicePixelRatio || 1);
    const b = canvas.getBoundingClientRect();
    W = Math.max(1, b.width);
    H = Math.max(1, b.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    dirty = true;
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let px = -9999, py = -9999, hover = 0;
  const move = (e) => {
    const b = canvas.getBoundingClientRect();
    px = e.clientX - b.left;
    py = e.clientY - b.top;
    hover = 1;
  };
  const leave = () => {
    hover = 0;
    px = py = -9999;
  };
  if (finePointer() && !RM) {
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);
  }

  let visible = false;
  const io = new IntersectionObserver((e) => {
    visible = e[0].isIntersecting;
    dirty = true;
  }, { rootMargin: '10% 0px 10% 0px' });
  io.observe(canvas);

  let P = RM ? 1 : 0, target = P, top = 0, h = 1, vh = 1, measured = false;
  let lastRatio = '', lastNums = ['', '', ''];

  const draw = (ms) => {
    const t = ms / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const dot = Math.min(W, H) * (phone ? 0.021 : 0.019) + 2.2;
    const cx = POS.map((p) => p[0] * W), cy = POS.map((p) => p[1] * H);
    const live = RM ? 0 : 1;
    const baseA = 0.62 - 0.4 * easeIO(P);
    ctx.fillStyle = `rgba(${white},${baseA.toFixed(3)})`;
    ctx.beginPath();
    const glowing = [];
    for (let k = 0; k < N; k++) {
      if (grp[k] >= 0) continue;
      let x = x0[k] * W + Math.sin(t * 0.6 + ph[k]) * 1.4 * live;
      let y = y0[k] * H + Math.cos(t * 0.5 + ph[k] * 1.3) * 1.2 * live;
      let near = 0, best = 1e9;
      for (let g = 0; g < 3; g++) {
        const d = (x - cx[g]) ** 2 + (y - cy[g]) ** 2;
        if (d < best) {
          best = d;
          near = g;
        }
      }
      const d = Math.sqrt(best) || 1;
      const push = easeIO(P) * Math.max(0, 1 - d / (Math.min(W, H) * 0.55)) * Math.min(W, H) * 0.12;
      x += ((x - cx[near]) / d) * push + ox[k];
      y += ((y - cy[near]) / d) * push + oy[k];
      if (glow[k] > 0.05) glowing.push(k, x, y);
      else {
        ctx.moveTo(x + rad[k], y);
        ctx.arc(x, y, rad[k], 0, 6.2832);
      }
    }
    ctx.fill();
    for (let i = 0; i < glowing.length; i += 3) {
      const k = glowing[i];
      ctx.fillStyle = `rgba(${white},${Math.min(1, baseA + glow[k] * 0.7).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(glowing[i + 1], glowing[i + 2], rad[k] * (1 + glow[k] * 0.6), 0, 6.2832);
      ctx.fill();
    }
    for (let g = 0; g < 3; g++) {
      if (!groups[g].length) continue;
      const k = easeIO((P - 0.55) / 0.45);
      if (k <= 0) continue;
      const rr = dot * Math.sqrt(groups[g].length) * 0.5 + 14;
      ctx.strokeStyle = `rgba(${lime},${(0.55 * k).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx[g], cy[g], rr + (1 - k) * 30, 0, 6.2832);
      ctx.stroke();
      ctx.fillStyle = `rgba(${lime},${(0.06 * k).toFixed(3)})`;
      ctx.fill();
    }
    for (let k = 0; k < N; k++) {
      const g = grp[k];
      if (g < 0) continue;
      const e = easeIO((P - delay[k]) / 0.58);
      const sx = x0[k] * W + Math.sin(t * 0.6 + ph[k]) * 1.4 * live * (1 - e);
      const sy = y0[k] * H + Math.cos(t * 0.5 + ph[k] * 1.3) * 1.2 * live * (1 - e);
      const a = idx[k] * 2.39996, d = dot * 0.5 * Math.sqrt(idx[k] + 0.5);
      const tx = cx[g] + Math.cos(a) * d + Math.sin(t * 1.3 + ph[k]) * 0.6 * live;
      const ty = cy[g] + Math.sin(a) * d + Math.cos(t * 1.1 + ph[k]) * 0.6 * live;
      const dx = tx - sx, dy = ty - sy, bend = Math.sin(e * Math.PI) * curve[k];
      const x = sx + dx * e - dy * bend + ox[k], y = sy + dy * e + dx * bend + oy[k];
      const rr = rad[k] * (1 + 0.6 * e) * (1 + glow[k] * 0.5);
      if (e < 0.999) {
        ctx.fillStyle = `rgba(${white},${(0.62 * (1 - e)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, 6.2832);
        ctx.fill();
      }
      if (e > 0.001) {
        if (glow[k] > 0.05 || (e > 0.05 && e < 0.95)) {
          ctx.fillStyle = `rgba(${lime},${(0.18 * e).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, rr * 2.6, 0, 6.2832);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${lime},${e.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, 6.2832);
        ctx.fill();
      }
    }
  };
  const text = () => {
    const ratio = fmtInt(N - (N - SHARE) * easeIO(P) ** 0.6);
    if (ratio !== lastRatio) ratioV.textContent = lastRatio = ratio;
    CLUSTERS.forEach((n, i) => {
      const s = fmtInt(n * easeIO((P - 0.35) / 0.65));
      if (s !== lastNums[i] && nums[i]) nums[i].textContent = lastNums[i] = s;
    });
    panel.style.setProperty('--p', P.toFixed(3));
  };

  if (RM) {
    const still = () => {
      resize();
      draw(0);
      text();
    };
    still();
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }

  const off = onTick(
    (ms) => {
      if (!visible) return;
      if (measured) target = clamp01(((vh - top) / (vh + h) - 0.27) / 0.4);
      const prev = P;
      P += (target - P) * 0.12;
      if (Math.abs(target - P) < 5e-4) P = target;
      for (let k = 0; k < N; k++) {
        let tx = 0, ty = 0, tg = 0;
        if (hover && !(grp[k] >= 0 && P > 0.5)) {
          const dx = x0[k] * W - px, dy = y0[k] * H - py, d2 = dx * dx + dy * dy;
          if (d2 < 4900) {
            const d = Math.sqrt(d2) || 1, f = 1 - d / 70;
            tx = (dx / d) * f * 16;
            ty = (dy / d) * f * 16;
            tg = f;
          }
        }
        if (Math.abs(tx - ox[k]) + Math.abs(ty - oy[k]) + Math.abs(tg - glow[k]) > 0.01) {
          ox[k] += (tx - ox[k]) * 0.14;
          oy[k] += (ty - oy[k]) * 0.14;
          glow[k] += (tg - glow[k]) * (tg > glow[k] ? 0.3 : 0.05);
        }
      }
      draw(ms);
      if (prev !== P || dirty) {
        text();
        dirty = false;
      }
    },
    () => {
      if (!visible) {
        measured = false;
        return;
      }
      const b = canvas.getBoundingClientRect();
      top = b.top;
      h = b.height;
      vh = win.innerHeight || 1;
      measured = true;
    },
  );
  return () => {
    off();
    ro.disconnect();
    io.disconnect();
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerleave', leave);
  };
}
