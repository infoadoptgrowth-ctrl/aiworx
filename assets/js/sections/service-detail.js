/* Service page: the "what's included" steps tick off as you read down, the live preview replays for each step
   and a toast confirms it; the proof band counts up the results. */
import { $, $$, win, onTick, onBreakpoint, bootSection, magnetic, whenInView, nearViewport, clamp01, reducedMotion, numberText } from '../core.js';
import { playStory } from '../stories.js';

const sec = $('.rwsd');
const copy = $('.rwsd-copy', sec);
const side = $('.rwsd-side', sec);
const obj = $('.rwsd-obj', sec);
const btns = $('.rwsd-btns', sec);
const list = $('.rwsd-steps', sec);
const steps = $$('.rwsd-step', sec);
const band = $('.rwsd-band', sec);
const toast = $('.rwsd-ptoast', sec);
const toastText = toast && $('span', toast);
const capNum = $('.rwsd-pcap span', sec);
const segs = $$('.rwsd-seg i', sec);
const RM = reducedMotion();
const N = steps.length;
const names = steps.map((s) => $('.rwsd-st', s)?.textContent.trim() || '');

bootSection(sec);
magnetic(sec);

/* desktop keeps the live preview in a sticky side column; tablet/phone show it under the buttons */
let desktop = true;
onBreakpoint((v) => {
  desktop = !v.ph && !v.tab;
  if (desktop && side && obj.parentNode !== side) side.appendChild(obj);
  if (!desktop && obj.parentNode !== copy) btns.after(obj);
  if (side) side.hidden = !desktop;
});

/* ------------------------------------------------------------ steps */
let done = RM ? N : -1;
let stopStory = () => {};
const ui = () => $('.rwsd-ui', obj);
function setDone(n) {
  if (n === done) return;
  done = n;
  steps.forEach((s, i) => s.classList.toggle('is-on', i < n));
  segs.forEach((s, i) => (s.className = i < n ? 'is-on' : ''));
  if (capNum) capNum.textContent = `Step ${String(Math.max(1, n)).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
  if (toast) {
    toast.classList.toggle('is-on', n > 0);
    if (n > 0 && toastText) toastText.textContent = `${names[n - 1]} · done`;
    // restart the toast's entrance
    if (n > 0) toast.style.animation = 'none', void toast.offsetWidth, (toast.style.animation = '');
  }
  if (!RM && sec.classList.contains('is-on') && (desktop || n === 0)) {
    stopStory();
    stopStory = playStory(ui(), 'run', { speed: n > 0 ? 1.4 : 1 });
  }
}

if (RM) {
  playStory(ui(), 'end');
  setDone(N);
} else {
  setDone(0);
  stopStory = playStory(ui(), 'wait');
  sec.addEventListener('rw:on', () => {
    stopStory();
    stopStory = playStory(ui(), 'run');
  });
  const near = nearViewport(list, '40% 0px 40% 0px');
  let top = 0, h = 1, vh = 1, tops = [], lp = -1;
  onTick(
    () => {
      if (!near.on) return;
      const line = vh * 0.62;
      const p = clamp01((line - top) / h);
      if (Math.abs(p - lp) > 0.001) {
        lp = p;
        list.style.setProperty('--lp', p.toFixed(4));
      }
      setDone(tops.filter((t) => t < line).length);
    },
    () => {
      if (!near.on) return;
      const r = list.getBoundingClientRect();
      top = r.top;
      h = r.height || 1;
      vh = win.innerHeight || 1;
      tops = steps.map((s) => s.getBoundingClientRect().top + 30);
    },
  );
}

/* ------------------------------------------------------------ proof band */
if (band) {
  const nums = $$('.rwsd-ba strong', band).map((el) => numberText(el));
  const proof = $('.rwsd-proof', band);
  if (!RM) nums.forEach((n) => n.reset());
  whenInView(
    band,
    () => {
      band.classList.add('is-on');
      $$('.rw-eb, .rw-hd', band).forEach((e) => e.classList.add('is-on'));
      proof?.classList.add('is-on');
      nums.forEach((n) => n.run());
    },
    0.12,
  );
}
