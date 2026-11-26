/* Free audit CTA: radar rings centred on the launch button, live New York clock, audit request form (emails via /api/contact). */
import { $, $$, bootSection, magnetic, scrollProgress, viewport, clamp01, reducedMotion, clock, SITE } from '../core.js';

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

/* audit request → emailed through /api/contact; if sending fails, hand the details to the contact page instead */
const priv = $('.rwct-priv', sec);
const goLbls = $$('.rwct-go .rw-l1, .rwct-go .rw-l2', sec);
const setLabel = (t) => goLbls.forEach((l) => (l.textContent = t));
if (priv) priv.setAttribute('aria-live', 'polite');
/* the button is a link to contact.html (no-JS fallback); keep the page transition from following it */
$('.rwct-go', sec).setAttribute('data-no-trans', '');
let state = 'idle'; // idle | sending | sent
function toContact(email, budget) {
  const q = new URLSearchParams();
  if (email) q.set('email', email);
  if (budget) q.set('budget', budget);
  window.location.href = `contact.html${q.toString() ? `?${q}` : ''}#start`;
}
async function submit(e) {
  e.preventDefault();
  if (state !== 'idle') return;
  const email = form.elements.email;
  const value = email.value.trim();
  const budget = form.elements.budget.value;
  email.required = true;
  if (!value || !email.checkValidity()) {
    email.reportValidity();
    email.focus();
    return;
  }
  state = 'sending';
  setLabel('Sending…');
  try {
    const r = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form: 'audit', email: value, budget, page: location.pathname }),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out.ok) throw new Error(out.error || 'send failed');
    state = 'sent';
    setLabel('Request sent ✓');
    email.disabled = true;
    form.elements.budget.disabled = true;
    if (priv) priv.textContent = "Thanks — we'll email you within 2 hours to book your audit.";
  } catch {
    state = 'idle';
    setLabel('Get my free audit');
    toContact(value, budget);
  }
}
form.addEventListener('submit', submit);
$('.rwct-go', sec).addEventListener('click', submit);
