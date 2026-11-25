/* Hero: WebGL crowd — grey photo, lime "reach" rings that colour the crowd and pop live result chips. */
import { $, $$, win, doc, onTick, onBreakpoint, magnetic, clamp01, reducedMotion, finePointer, whenReleased } from '../core.js';

const hero = $('.rwh');
const bg = $('.rwh-bg', hero);
const canvas = $('.rwh-cv', hero);
const chipsEl = $('.rwh-chips', hero);
const copy = $('.rwh-copy', hero);
const countEl = $('.rwh-count-n', hero);
const RM = reducedMotion();
const FINE = finePointer();

const CHIPS = [
  ['❤', '1.2k likes on one reel'], ['+', '86 new followers'], ['★', 'New 5-star review'],
  ['#1', '“dentist near me”'], ['●', '12 leads today'], ['↗', 'CTR up to 4.8%'],
  ['✓', 'Call booked · Tue 10:30'], ['◎', '+318 profile visits'], ['▶', '48k video views'], ['$', 'ROAS 6.2×'],
];
/* people in the photo (normalised image coords) where chips may pop */
const PEOPLE = [
  [0.31, 0.12], [0.275, 0.21], [0.41, 0.17], [0.47, 0.29], [0.54, 0.3], [0.62, 0.27], [0.75, 0.18], [0.905, 0.08],
  [0.935, 0.19], [0.295, 0.37], [0.255, 0.39], [0.465, 0.39], [0.625, 0.39], [0.72, 0.47], [0.805, 0.43], [0.93, 0.4],
  [0.07, 0.58], [0.235, 0.53], [0.56, 0.56], [0.95, 0.55], [0.315, 0.65], [0.535, 0.71], [0.61, 0.73], [0.705, 0.75],
  [0.89, 0.74], [0.185, 0.7], [0.35, 0.8], [0.455, 0.91], [0.635, 0.94], [0.095, 0.87], [0.94, 0.89], [0.4, 0.87],
];
const IMG_ASPECT = 2400 / 1340;
const FOCUS = [0, 0]; // focus 50%/50%

/* ---------------------------------------------------------------- layout */
let isPhone = false;
onBreakpoint((v) => {
  isPhone = v.ph;
  hero.style.setProperty('--hh', v.ph ? 'auto' : `${Math.round(Math.min(Math.max(v.h, 720), 1080))}px`);
  hero.classList.toggle('has-cur', FINE && !v.ph);
});
win.addEventListener('resize', () => {
  if (!isPhone) hero.style.setProperty('--hh', `${Math.round(Math.min(Math.max(win.innerHeight, 720), 1080))}px`);
});

/* ---------------------------------------------------------------- entrance */
const enter = () => {
  hero.classList.add('is-in', 'is-on');
};
whenReleased(() => setTimeout(enter, 80));
if (RM) hero.classList.add('is-rm');
magnetic(hero);

/* -------------------------------------------------------- rolling counter */
let count = 1284300;
let pending = 0;
let prevDigits = [];
function renderCount(n) {
  const text = n.toLocaleString('en-US');
  const chars = text.split('');
  const off = prevDigits.length - chars.length;
  const roll = doc.createElement('span');
  roll.className = 'rwh-roll';
  roll.setAttribute('aria-label', text);
  const existing = $$(':scope > span', $('.rwh-roll', countEl) || doc.createElement('span'));
  chars.forEach((c, i) => {
    if (!/\d/.test(c)) {
      const s = doc.createElement('span');
      s.setAttribute('aria-hidden', 'true');
      s.textContent = c;
      roll.appendChild(s);
      return;
    }
    const prev = prevDigits[i + off];
    const steps = Math.max(1, /\d/.test(prev || '') ? Math.abs(+c - prev) : 1);
    // reuse the existing reel at the same position from the right so the transition plays
    const reuse = existing[existing.length - (chars.length - i)];
    let rd = reuse && reuse.classList.contains('rwh-rd') ? reuse : null;
    if (!rd) {
      rd = doc.createElement('span');
      rd.className = 'rwh-rd';
      rd.setAttribute('aria-hidden', 'true');
      const reel = doc.createElement('span');
      reel.innerHTML = '0123456789'.split('').map((d) => `<i>${d}</i>`).join('');
      rd.appendChild(reel);
    }
    const reel = rd.firstElementChild;
    reel.style.transitionTimingFunction = `steps(${steps}, end)`;
    reel.style.transitionDuration = `${Math.min(0.6, 0.07 * steps + 0.08)}s`;
    reel.style.transform = `translateY(${-Number(c) * 10}%)`;
    roll.appendChild(rd);
  });
  countEl.replaceChildren(roll);
  prevDigits = chars;
}
renderCount(count);
setInterval(() => {
  if (pending > 0) {
    count += pending;
    pending = 0;
    renderCount(count);
  }
}, 1400);

/* ------------------------------------------------------------------ chips */
let chipSeq = 0;
let chipKind = Math.floor(Math.random() * 10);
function popChip(x, y) {
  const [icon, text] = CHIPS[chipKind++ % CHIPS.length];
  const chip = doc.createElement('span');
  chip.className = 'rwh-chip';
  chip.style.left = `${Math.round(x)}px`;
  chip.style.top = `${Math.round(y)}px`;
  chip.innerHTML = `<i class="rwh-chip-p"></i><b class="rwh-chip-i f-d"></b><span class="f-m"></span>`;
  chip.children[1].textContent = icon;
  chip.children[2].textContent = text;
  const live = $$('.rwh-chip.is-up', chipsEl);
  if (live.length > 3) live.slice(0, live.length - 3).forEach((c) => c.remove());
  chipsEl.appendChild(chip);
  requestAnimationFrame(() => requestAnimationFrame(() => chip.classList.add('is-up')));
  chipSeq++;
  pending += 40 + Math.round(Math.random() * 260);
  setTimeout(() => chip.classList.remove('is-up'), 2600);
  setTimeout(() => chip.remove(), 3200);
}
function staticChips() {
  [[1, 0], [2, 2], [3, 3]].forEach(([s, k]) => {
    const chip = doc.createElement('span');
    chip.className = 'rwh-chip is-up';
    chip.dataset.s = String(s);
    chip.innerHTML = `<i class="rwh-chip-p"></i><b class="rwh-chip-i f-d">${CHIPS[k][0]}</b><span class="f-m">${CHIPS[k][1]}</span>`;
    chipsEl.appendChild(chip);
  });
}

/* ------------------------------------------------------------------ WebGL */
const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FRAG = `precision mediump float;
uniform sampler2D uTex;uniform vec2 uView;uniform float uImg;uniform float uZoom;uniform vec2 uFoc;uniform float uTime;uniform vec3 uLime;uniform vec4 uP[8];uniform vec3 uPtr;uniform float uDiag;uniform float uDim;
vec2 cover(vec2 s){float ra=uView.x/uView.y;vec2 uv=s;if(ra>uImg){uv.y=(s.y-.5)*uImg/ra+.5;}else{uv.x=(s.x-.5)*ra/uImg+.5;}return (uv-.5)/uZoom+.5+uFoc;}
void main(){vec2 fc=vec2(gl_FragCoord.x,uView.y-gl_FragCoord.y);vec2 s=fc/uView;vec3 col=texture2D(uTex,clamp(cover(s),.001,.999)).rgb;
float l=dot(col,vec3(.299,.587,.114));vec3 grey=mix(vec3(l)*vec3(.9,.94,1.),vec3(.03,.035,.045),uDim);
float reach=0.;float rim=0.;
for(int i=0;i<8;i++){vec4 P=uP[i];if(P.w<=0.)continue;float age=uTime-P.z;if(age<0.)continue;float R=age*uDiag*(.2+.07*P.w);float d=distance(fc,P.xy);float life=2.4+2.6*P.w;float fade=1.-smoothstep(life*.4,life,age);float band=uDiag*(.008+.006*P.w);
rim+=exp(-pow((d-R)/band,2.))*(1.-smoothstep(0.,life*.75,age));reach=max(reach,(1.-smoothstep(R-band*5.,R+band,d))*fade);}
float sp=(1.-smoothstep(uDiag*.035,uDiag*.12,distance(fc,uPtr.xy)))*uPtr.z;reach=max(reach,sp*.85);
vec3 c=mix(grey,col*mix(1.,.86,uDim),reach);c=mix(c,uLime,clamp(rim,0.,1.)*.62);
float vg=smoothstep(.45,1.,s.y)*.55+(1.-smoothstep(0.,.2,s.y))*.28;c*=1.-vg;
gl_FragColor=vec4(c,1.);}`;

function brassRGB() {
  const probe = doc.createElement('i');
  probe.style.color = 'var(--rw-brass)';
  hero.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g) || ['212', '249', '5'];
  probe.remove();
  return m.slice(0, 3).map((v) => Number(v) / 255);
}

function startGL() {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) return false;
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aP = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(aP);
  gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const u = { view: U('uView'), img: U('uImg'), zoom: U('uZoom'), foc: U('uFoc'), time: U('uTime'), lime: U('uLime'), p: U('uP'), ptr: U('uPtr'), diag: U('uDiag'), dim: U('uDim') };
  const lime = brassRGB();
  gl.uniform3f(u.lime, lime[0], lime[1], lime[2]);

  const tex = gl.createTexture();
  let aspect = IMG_ASPECT, ready = false;
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    try {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      aspect = img.naturalWidth / img.naturalHeight;
      ready = true;
      hero.classList.add('is-gl');
    } catch {}
  };
  img.src = $('.rwh-img', hero).currentSrc || $('.rwh-img', hero).src;

  let W = 1, H = 1, dpr = 1, diag = 1;
  const resize = () => {
    // the scene is a soft greyscale photo; 1.25× density looks identical and halves GPU fill on retina
    dpr = Math.min(win.devicePixelRatio || 1, FINE ? 1.25 : 1); // phones: 1x is plenty under the grey + blur look
    const r = hero.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    diag = Math.hypot(W, H);
  };
  resize();
  new ResizeObserver(resize).observe(hero);

  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;
  const pulses = [];
  const lastHit = PEOPLE.map(() => -99);
  let zoom = RM ? 1 : 1.12;
  const addPulse = (x, y, s) => {
    pulses.push([x, y, now(), s]);
    if (pulses.length > 8) pulses.shift();
    pending += Math.round(s * (120 + Math.random() * 380));
  };
  const toScreen = (nx, ny, fx, fy) => {
    const ra = W / H;
    let x = (nx - fx - 0.5) * zoom + 0.5;
    let y = (ny - fy - 0.5) * zoom + 0.5;
    if (ra > aspect) y = ((y - 0.5) * ra) / aspect + 0.5;
    else x = ((x - 0.5) * aspect) / ra + 0.5;
    return [x * W, y * H];
  };
  const checkChips = (t) => {
    const fx = FOCUS[0], fy = FOCUS[1];
    const cr = copy.getBoundingClientRect();
    const hr = hero.getBoundingClientRect();
    for (const p of pulses) {
      const age = t - p[2];
      if (age < 0) continue;
      const R = age * diag * (0.2 + 0.07 * p[3]);
      if (R > diag) continue;
      PEOPLE.forEach(([nx, ny], i) => {
        if (t - lastHit[i] < 7) return;
        const [x, y] = toScreen(nx, ny, fx, fy);
        if (x < 90 || x > W - 110 || y < 190 || y > H - 190) return;
        if (x + hr.left > cr.left - 40 && x + hr.left < cr.right + 40 && y + hr.top > cr.top - 30 && y + hr.top < cr.bottom + 20) return;
        if (Math.abs(Math.hypot(x - p[0], y - p[1]) - R) > 14) return;
        lastHit[i] = t;
        popChip(x, y);
      });
    }
  };

  /* pointer: hover follows the cursor on desktop, tap/click launches a campaign ring */
  let cx = W / 2, cy = H * 0.55, tx = cx, ty = cy, glow = 0, hover = 0, lastMove = -99, lastPulse = -99;
  if (FINE) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      hover = 1;
      lastMove = now();
    });
    hero.addEventListener('pointerleave', () => (hover = 0));
  }
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest?.('a,button,input,nav')) return;
    const r = hero.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (!FINE) {
      tx = cx = x;
      ty = cy = y;
      lastMove = now();
    }
    addPulse(x, y, 1.6);
    lastPulse = now();
  });

  let visible = true, raf = 0, scrollK = 0, lastSy = -1;
  const firstAt = RM ? 0 : 1.6;
  const P = new Float32Array(32);
  function frame() {
    raf = 0;
    if (!visible || doc.hidden) return;
    const t = now();
    const r = hero.getBoundingClientRect();
    scrollK = clamp01(-r.top / (r.height || 1));
    zoom = RM ? 1 + scrollK * 0.08 : 1 + 0.12 * (1 - clamp01(t / 2.2)) ** 3 + scrollK * 0.08;
    const auto = !FINE || t - lastMove > 2.6 || hover === 0;
    if (auto) {
      const k = t * 0.23;
      tx = W * (0.5 + 0.34 * Math.sin(k * 1.3));
      ty = H * (0.5 + 0.28 * Math.sin(k * 0.9 + 1.2));
    }
    cx += (tx - cx) * (auto ? 0.03 : 0.16);
    cy += (ty - cy) * (auto ? 0.03 : 0.16);
    glow += ((FINE && !auto ? 1 : 0) - glow) * 0.08;
    if (!RM && t > firstAt && t - lastPulse > (auto ? 1.9 : 1.35)) {
      addPulse(cx, cy, auto ? 0.7 : 0.9);
      lastPulse = t;
    }
    if (t > firstAt - 0.2 && pulses.length === 0 && !RM) {
      addPulse(W / 2, H * 0.55, 1.4);
      lastPulse = t;
    }
    for (let i = 0; i < 8; i++) {
      const p = pulses[i];
      P[i * 4] = p ? p[0] * dpr : 0;
      P[i * 4 + 1] = p ? p[1] * dpr : 0;
      P[i * 4 + 2] = p ? p[2] : 0;
      P[i * 4 + 3] = p ? p[3] : 0;
    }
    if (ready) {
      gl.uniform2f(u.view, canvas.width, canvas.height);
      gl.uniform1f(u.img, aspect);
      gl.uniform1f(u.zoom, zoom);
      gl.uniform2f(u.foc, FOCUS[0], FOCUS[1]);
      gl.uniform1f(u.time, t);
      gl.uniform4fv(u.p, P);
      gl.uniform3f(u.ptr, cx * dpr, cy * dpr, glow);
      gl.uniform1f(u.diag, diag * dpr);
      gl.uniform1f(u.dim, 0.42);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    checkChips(t);
    /* background parallax: written straight onto the background layer, and only when it moves */
    if (Math.abs(scrollK - lastSy) > 1e-4) {
      lastSy = scrollK;
      bg.style.translate = `0 ${(scrollK * 14).toFixed(3)}%`;
    }
    raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver((e) => {
    visible = e[0].isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }).observe(hero);
  doc.addEventListener('visibilitychange', () => {
    if (!doc.hidden && visible && !raf) raf = requestAnimationFrame(frame);
  });
  raf = requestAnimationFrame(frame);
  return true;
}

if (RM) {
  bg.insertBefore(Object.assign(doc.createElement('i'), { className: 'rwh-stillring' }), $('.rwh-shade', bg));
  staticChips();
}
if (!startGL() && !RM) {
  bg.insertBefore(Object.assign(doc.createElement('i'), { className: 'rwh-stillring' }), $('.rwh-shade', bg));
  staticChips();
}

/* ------------------------------------------------------------ custom cursor */
if (FINE) {
  const cur = doc.createElement('div');
  cur.className = 'rwh-cur';
  cur.dataset.m = 'out';
  cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = '<i class="rwh-cur-r"><b class="f-m">Reach</b></i><i class="rwh-cur-d"></i>';
  hero.appendChild(cur);
  let px = -99, py = -99, x = -99, y = -99, inside = false, mode = 'out';
  const setMode = (m) => {
    if (m !== mode) cur.dataset.m = mode = m;
  };
  hero.addEventListener('pointermove', (e) => {
    if (isPhone) return;
    px = e.clientX;
    py = e.clientY;
    inside = true;
    const t = e.target;
    setMode(t.closest?.('.rw-btn, nav a, .rwh-tags a') ? 'btn' : t.closest?.('.rwh-copy h1, .rwh-copy p') ? 'dot' : 'reach');
  });
  hero.addEventListener('pointerleave', () => {
    inside = false;
    setMode('out');
  });
  hero.addEventListener('pointerdown', () => {
    if (mode === 'btn') return;
    cur.classList.remove('is-ping');
    void cur.offsetWidth;
    cur.classList.add('is-ping');
  });
  onTick(() => {
    if (!inside && x < -50) return;
    x += (px - x) * 0.28;
    y += (py - y) * 0.28;
    cur.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
  });
}
