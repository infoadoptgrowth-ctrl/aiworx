/* Contact page: project form (validation, service chips, sends through /api/contact), success panel,
   live studio clock + opening hours, and a deck of contact cards that fans out as you scroll. */
import { $, $$, win, onTick, bootSection, magnetic, nearViewport, clamp01, reducedMotion, SITE } from '../core.js';

const sec = $('.rwco');
const box = $('.rwco-box', sec);
const form = $('.rwco-form', sec);
const col = $('.rwco-col', sec);
const cards = $$('.rwco-card', sec);
const RM = reducedMotion();
const easeIO = (v) => {
  const t = clamp01(v);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

bootSection(sec);
magnetic(sec);

/* ---------------------------------------------------------- form */
const ERR = {
  name: 'Please tell us your name.',
  email: 'Please enter a valid email, like name@company.com.',
  message: 'A line or two about your goals helps us prepare.',
};
const field = (n) => form.elements[n];
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const check = () => ({
  name: field('name').value.trim() ? '' : ERR.name,
  email: validEmail(field('email').value) ? '' : ERR.email,
  message: field('message').value.trim().length >= 3 ? '' : ERR.message,
});
const touched = new Set();
function showError(n, msg) {
  const input = field(n);
  const wrap = input.closest('.rwco-f');
  let p = $(`#rwco-e-${n}`, form);
  wrap.classList.toggle('is-bad', !!msg);
  if (msg) {
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', `rwco-e-${n}`);
    if (!p) {
      p = document.createElement('p');
      p.id = `rwco-e-${n}`;
      p.className = 'rwco-err f-m';
      wrap.appendChild(p);
    }
    p.innerHTML = `<i aria-hidden="true">!</i>${msg}`;
  } else {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    p?.remove();
  }
}
for (const n of ['name', 'email', 'message']) {
  field(n).addEventListener('blur', () => {
    touched.add(n);
    showError(n, check()[n]);
  });
  field(n).addEventListener('input', () => touched.has(n) && showError(n, check()[n]));
}

/* service chips */
$$('.rwco-chk', form).forEach((chip) => {
  const cb = $('input', chip);
  cb.addEventListener('change', () => chip.classList.toggle('is-on', cb.checked));
});

/* prefill from the home page audit form (?email=…&budget=…) */
try {
  const q = new URLSearchParams(location.search);
  if (q.get('email')) field('email').value = q.get('email').slice(0, 200);
  const b = q.get('budget');
  if (b) {
    const opt = Array.from(field('budget').options).find((o) => o.value.toLowerCase() === b.toLowerCase());
    if (opt) field('budget').value = opt.value;
  }
} catch {}

function success(name) {
  const first = name.trim().split(/\s+/)[0];
  box.classList.add('is-ok');
  form.hidden = true;
  form.insertAdjacentHTML('afterend', `<div class="rwco-ok" aria-live="polite"><span class="rwco-rings" aria-hidden="true"><i></i><i></i><i></i></span>
    <p class="rwco-chip f-m"><i class="rwco-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" fill="none" stroke="currentColor"/></svg></i><span><b>AiWorx</b> · now</span></p>
    <h2 class="f-d" tabindex="-1">Got it — we reply within 2 hours</h2>
    <p class="rwco-okt">Thanks${first ? `, ${first}` : ''} — your message is in our inbox. We'll reply from ${SITE.email}.</p>
    <p class="rwco-okm f-m"><a href="mailto:${SITE.email}">${SITE.email}</a></p>
    <button type="button" class="rwco-again f-m">Send another message</button></div>`);
  setTimeout(() => $('.rwco-ok h2', box)?.focus({ preventScroll: true }), 60);
  $('.rwco-again', box).addEventListener('click', reset);
}
function reset() {
  $('.rwco-ok', box)?.remove();
  box.classList.remove('is-ok');
  form.reset();
  touched.clear();
  ['name', 'email', 'message'].forEach((n) => showError(n, ''));
  $$('.rwco-chk', form).forEach((c) => c.classList.remove('is-on'));
  form.hidden = false;
  setTimeout(() => field('name').focus(), 60);
}

/* form-level message (send failures), shown above the submit button */
function formError(msg) {
  let p = $('#rwco-e-form', form);
  if (!msg) {
    if (p) p.hidden = true;
    return;
  }
  if (!p) {
    p = document.createElement('p');
    p.id = 'rwco-e-form';
    p.className = 'rwco-err f-m';
    p.setAttribute('role', 'alert');
    $('.rwco-sub', form).before(p);
  }
  p.hidden = false;
  p.innerHTML = `<i aria-hidden="true">!</i>${msg}`;
}

let sending = false;
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (sending) return;
  const errs = check();
  ['name', 'email', 'message'].forEach((n) => (touched.add(n), showError(n, errs[n])));
  const bad = ['name', 'email', 'message'].find((n) => errs[n]);
  if (bad) return field(bad).focus();
  if (form.elements.company_url?.value) return success(''); // honeypot: quietly accept
  const v = (n) => field(n)?.value.trim() || '';
  const data = {
    form: 'contact',
    name: v('name'),
    email: v('email'),
    company: v('company'),
    website: v('website'),
    budget: v('budget'),
    services: $$('input[name="services"]:checked', form).map((c) => c.value),
    message: v('message'),
    page: location.pathname,
  };

  const btn = $('.rwco-sub', form);
  const lbls = $$('.rw-l1, .rw-l2', btn);
  sending = true;
  formError('');
  btn.setAttribute('aria-busy', 'true');
  btn.disabled = true;
  lbls.forEach((l) => (l.textContent = 'Sending…'));
  try {
    const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const out = await r.json().catch(() => ({}));
    if (r.ok && out.ok) return success(data.name);
    if (['name', 'email', 'message'].includes(out.field)) {
      showError(out.field, out.error);
      return field(out.field).focus();
    }
    throw new Error(out.error || 'send failed');
  } catch {
    const subject = encodeURIComponent(`New enquiry — ${data.name}`);
    formError(`We couldn't send that just now. Please try again, or email us at <a href="mailto:${SITE.email}?subject=${subject}">${SITE.email}</a>.`);
  } finally {
    sending = false;
    btn.setAttribute('aria-busy', 'false');
    btn.disabled = false;
    lbls.forEach((l) => (l.textContent = 'Send message'));
  }
});

/* ---------------------------------------------------------- studio clock + opening hours (Mon–Fri 09:00–18:00) */
const clockEl = $('.rwco-clock b', sec);
const studio = cards[2];
let openEl = $('.rwco-open', studio);
if (!openEl && studio) {
  openEl = document.createElement('p');
  openEl.className = 'rwco-open f-m';
  $('.rwco-clock', studio).after(openEl);
}
const studioEm = studio && $('.rwco-app em', studio);
function tick() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: SITE.tz, weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = (t) => (parts.find((p) => p.type === t) || { value: '' }).value;
  if (clockEl) clockEl.textContent = `${get('hour')}:${get('minute')}:${get('second')}`;
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday')) + 1;
  const mins = (Number(get('hour')) % 24) * 60 + Number(get('minute'));
  const open = day >= 1 && day <= 5 && mins >= 540 && mins < 1080;
  if (openEl) {
    openEl.classList.toggle('is-open', open);
    openEl.innerHTML = `<i aria-hidden="true"></i>${open ? 'Open · till 18:00' : 'Closed · opens 09:00'}`;
  }
  if (studioEm) studioEm.textContent = open ? 'open' : 'closed';
}
tick();
setInterval(tick, 1000);

/* ---------------------------------------------------------- card deck */
const stack = () => {
  if (!cards.length) return;
  const top0 = cards[0].offsetTop;
  cards.forEach((c, i) => c.style.setProperty('--dy', `${c.offsetTop - top0 - i * 14}px`));
};
stack();
new ResizeObserver(stack).observe(col);
if (RM) cards.forEach((c) => c.style.setProperty('--f', '1'));
else {
  cards.forEach((c) => c.style.setProperty('--f', '0'));
  const near = nearViewport(col, '30% 0px 30% 0px');
  let top = 0, h = 1, vh = 1, s = 0, on = false;
  const last = cards.map(() => -1);
  sec.addEventListener('rw:on', () => (on = true));
  onTick(
    () => {
      if (!near.on || !on) return;
      const target = clamp01((vh * 0.92 - top) / Math.max(200, Math.min(h, vh) * 0.55));
      s += (target - s) * 0.07;
      if (Math.abs(target - s) < 0.001) s = target;
      cards.forEach((c, i) => {
        const f = easeIO(s * 1.35 - i * 0.11);
        if (Math.abs(f - last[i]) > 0.0015) {
          last[i] = f;
          c.style.setProperty('--f', f.toFixed(4));
        }
      });
    },
    () => {
      if (!near.on) return;
      const r = col.getBoundingClientRect();
      top = r.top;
      h = r.height || 1;
      vh = win.innerHeight || 1;
    },
  );
}
