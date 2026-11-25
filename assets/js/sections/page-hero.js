/* Page hero (Services, Work): headline + a live object. Services shows a search that gets typed and won;
   Work shows a traffic chart that draws itself. The object tilts toward the cursor and the hero drifts away on scroll. */
import { $, $$, win, onTick, bootSection, magnetic, nearViewport, clamp01, reducedMotion, finePointer } from '../core.js';

const sec = $('.rwph');
const copy = $('.rwph-copy', sec);
const obj = $('.rwph-obj', sec);
const RM = reducedMotion();

bootSection(sec, { threshold: 0.05 });
magnetic(sec);

/* scroll exit + pointer tilt (written only onto the copy and the object) */
if (!RM && obj) {
  const near = nearViewport(sec, '20% 0px 20% 0px');
  let top = 0, h = 1, ex = -1, px = 0, py = 0, tx = 0, ty = 0, key = '';
  if (finePointer()) {
    sec.addEventListener('pointermove', (e) => {
      const r = obj.getBoundingClientRect();
      px = clamp01((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
      py = clamp01((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1;
    });
    sec.addEventListener('pointerleave', () => (px = py = 0));
  }
  onTick(
    () => {
      if (!near.on) return;
      const t = clamp01(-top / Math.max(1, h));
      ex = ex < 0 ? t : ex + (t - ex) * 0.2;
      tx += (px - tx) * 0.08;
      ty += (py - ty) * 0.08;
      const k = `${ex.toFixed(4)}|${tx.toFixed(3)}|${ty.toFixed(3)}`;
      if (k === key) return;
      key = k;
      copy.style.setProperty('--ex', ex.toFixed(4));
      obj.style.setProperty('--ex', ex.toFixed(4));
      obj.style.setProperty('--tx', tx.toFixed(3));
      obj.style.setProperty('--ty', ty.toFixed(3));
    },
    () => {
      if (!near.on) return;
      const r = sec.getBoundingClientRect();
      top = r.top;
      h = r.height;
    },
  );
}

/* ------------------------------------------------------------ chart (Work) */
const chart = $('.rwph-chart', sec);
if (chart) {
  const kpi = $('.rwph-kpi b', chart);
  // the server-rendered KPI is the animation's start frame ("+0%"); the figure it counts to lives here
  const final = /[1-9]/.test(kpi.textContent) ? kpi.textContent : kpi.dataset.value || '+212%';
  const svg = $('.rwph-svg', chart);
  const end = $('.rwph-end', chart);
  const pop = $('.rwph-pop', chart);
  const fmt = (k) => {
    const m = final.match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (!m) return final;
    const n = parseFloat(m[2].replace(/,/g, ''));
    const dec = (m[2].split('.')[1] || '').length;
    const v = n * k;
    return `${m[1]}${dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')}${m[3]}`;
  };
  if (RM) {
    svg.classList.add('is-on');
    end.classList.add('is-on');
    pop?.classList.add('is-up');
  } else {
    kpi.textContent = fmt(0);
    sec.addEventListener('rw:on', () => {
      svg.classList.add('is-on');
      end.classList.add('is-on');
      const t0 = performance.now();
      const step = (t) => {
        const k = clamp01((t - t0 - 500) / 1800);
        kpi.textContent = fmt(1 - (1 - k) ** 3);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      if (pop) {
        setTimeout(() => pop.classList.add('is-up'), 2300);
        setInterval(() => {
          pop.classList.remove('is-up');
          setTimeout(() => pop.classList.add('is-up'), 700);
        }, 5200);
      }
    });
  }
}

/* ------------------------------------------------------------ search (Services) */
const serp = $('.rwph-search', sec);
if (serp) {
  const qt = $('.rwph-qt', serp);
  const caret = $('.rwph-caret', qt);
  const query = qt.textContent.trim() || 'marketing agency near me';
  const count = $('.rwph-sc', serp);
  const list = $('.rwph-res', serp);
  const rows = $$('.rwph-r', serp);
  const rank = $('.rwph-rank', serp);
  const pop = $('.rwph-pop', serp);
  const text = document.createTextNode('');
  qt.replaceChildren(text, caret);
  const slot = (i, stage) => (i === 0 ? (stage >= 2 ? 0 : 2) : stage >= 2 ? i : i - 1 < 2 ? i - 1 : i);
  const set = (typed, stage) => {
    text.nodeValue = query.slice(0, typed);
    caret.classList.toggle('is-done', typed >= query.length);
    count.textContent = stage ? 'About 2,140,000 results' : ' ';
    list.classList.toggle('is-on', stage > 0);
    rows.forEach((r, i) => {
      r.style.setProperty('--s', slot(i, stage));
      if (i === 0) r.classList.toggle('is-top', stage >= 2);
    });
    if (rank) rank.textContent = `#${stage >= 2 ? 1 : 3}`;
    pop?.classList.toggle('is-up', stage >= 2);
  };
  if (RM) set(query.length, 2);
  else {
    set(0, 0);
    const loop = () => {
      set(0, 0);
      let i = 0;
      const type = () => {
        i++;
        set(i, 0);
        if (i < query.length) setTimeout(type, 55 + Math.random() * 60);
        else {
          setTimeout(() => set(i, 1), 380);
          setTimeout(() => set(i, 2), 1700);
          setTimeout(loop, 8200);
        }
      };
      setTimeout(type, 500);
    };
    sec.addEventListener('rw:on', loop, { once: true });
  }
}
void win;
