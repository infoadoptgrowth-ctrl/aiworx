/* Free audit CTA: radar rings centred on the launch button, live New York clock, audit request form. */
import { $, bootSection, magnetic, scrollProgress, viewport, clamp01, reducedMotion, clock, SITE } from '../core.js';

const sec = $('.rwct');
const launch = $('.rwct-launch', sec);
const form = $('.rwct-form', sec);
const clockEl = $('.rwct-clock b', sec);
const RM = reducedMotion();
const easeIO = (v) => {
  const t = clamp01(v);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

bootSection(sec, { staticFlags: RM ? [] : ['is-set'] });
magnetic(sec);

/* the rings radiate from the launch button */
const centre = () => {
  const s = sec.getBoundingClientRect(), b = launch.getBoundingClientRect();
  sec.style.setProperty('--bx', `${Math.round(b.left - s.left + b.width / 2)}px`);
  sec.style.setProperty('--by', `${Math.round(b.top - s.top + b.height / 2)}px`);
};
centre();
new ResizeObserver(centre).observe(sec);
setTimeout(centre, 700);
setTimeout(centre, 2200);

if (!RM) {
  /* only the radar rings read --f */
  const rings = $('.rwct-rings', sec);
  scrollProgress(sec, (sp) => rings.style.setProperty('--f', easeIO((sp - (viewport().ph ? 0.2 : 0.14)) / 0.44).toFixed(4)));
}

/* live clock */
const tick = () => (clockEl.textContent = clock(SITE.tz, true));
tick();
setInterval(tick, 1000);

/* audit request → contact page with email + budget filled in */
function submit(e) {
  e.preventDefault();
  const email = form.elements.email;
  if (email.value.trim() && !email.checkValidity()) {
    email.reportValidity();
    return;
  }
  /* hand the details to the contact page, which pre-fills them */
  const q = new URLSearchParams();
  if (email.value.trim()) q.set('email', email.value.trim());
  if (form.elements.budget.value) q.set('budget', form.elements.budget.value);
  window.location.href = `contact.html${q.toString() ? `?${q}` : ''}#start`;
}
form.addEventListener('submit', submit);
$('.rwct-go', sec).addEventListener('click', submit);
