/* Blog index: topic chips filter the articles (the first match becomes the featured card), cards unmask as they
   scroll in, a "your turn" card fills the last grid row, and the newsletter form validates and confirms. */
import { $, $$, win, onTick, onBreakpoint, bootSection, magnetic, nearViewport, clamp01, reducedMotion } from '../core.js';

const sec = $('.rwbl');
const chips = $$('.rwbl-chip', sec);
const list = $('.rwbl-list', sec);
const ask = $('.rwbl-ask', sec);
const RM = reducedMotion();
const easeIO = (v) => {
  const t = clamp01(v);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

bootSection(sec, { staticFlags: RM ? [] : ['is-set'] });
magnetic(sec);

/* ---------------------------------------------------------- articles (in server order) */
const cards = $$('.rwbl-card', list);
const flag = $('.rwbl-flag', cards[0])?.outerHTML || '';
cards.forEach((c) => $('.rwbl-flag', c)?.remove());
const topicOf = (c) => $('.rwbl-kick', c)?.textContent.trim() || '';

let topic = '';
let cols = 3;
let filteredAt = -1e9;
function render() {
  const shown = cards.filter((c) => !topic || topicOf(c) === topic);
  const [lead, ...rest] = shown;
  list.replaceChildren();
  if (!lead) {
    list.innerHTML = '<p class="rwbl-empty f-m">No articles in this topic yet.</p>';
    return;
  }
  lead.classList.add('is-feat');
  lead.dataset.col = '0';
  $('.rwbl-cov', lead).insertAdjacentHTML('beforeend', flag);
  $('img', lead).loading = 'eager';
  list.appendChild(lead);
  if (rest.length) {
    const grid = document.createElement('div');
    grid.className = 'rwbl-grid';
    rest.forEach((c, i) => {
      c.classList.remove('is-feat');
      $('.rwbl-flag', c)?.remove();
      c.dataset.col = String(i % cols);
      c.style.setProperty('--rvd', `${120 + (i % cols) * 90}ms`);
      grid.appendChild(c);
    });
    const fill = cols === 1 ? 0 : (cols - (rest.length % cols)) % cols;
    if (ask && fill > 0) {
      ask.style.gridColumn = `span ${fill}`;
      grid.appendChild(ask);
    }
    list.appendChild(grid);
  }
  chips.forEach((ch) => {
    const on = (ch.dataset.topic || '') === topic;
    ch.classList.toggle('is-act', on);
    ch.setAttribute('aria-pressed', String(on));
  });
}
chips.forEach((ch, i) => {
  // chip label is the text node after the dot; "All" means no filter
  ch.dataset.topic = i === 0 ? '' : Array.from(ch.childNodes).find((n) => n.nodeType === 3)?.nodeValue.trim() || '';
  ch.addEventListener('click', () => {
    if (ch.dataset.topic === topic) return;
    topic = ch.dataset.topic;
    filteredAt = performance.now() + 60;
    render();
  });
});
onBreakpoint((v) => {
  cols = v.ph ? 1 : v.tab ? 2 : 3;
  render();
});

/* ---------------------------------------------------------- cover unmask (--u) by scroll and by time since filtering */
if (RM) cards.forEach((c) => c.style.setProperty('--u', '1'));
else {
  const near = nearViewport(sec, '20% 0px 20% 0px');
  const last = new WeakMap();
  let items = [], vh = 1;
  onTick(
    (t) => {
      if (!near.on) return;
      items.forEach(([c, top], n) => {
        const col = Number(c.dataset.col || 0);
        const byScroll = clamp01((vh * 0.98 - top) / (vh * 0.52) - col * 0.16);
        const byTime = clamp01((t - filteredAt - n * 110) / 900);
        const u = easeIO(Math.min(byScroll, byTime));
        const prev = last.get(c);
        if (prev !== undefined && Math.abs(prev - u) < 0.002) return;
        last.set(c, u);
        c.style.setProperty('--u', u.toFixed(3));
      });
    },
    () => {
      if (!near.on) return;
      vh = win.innerHeight || 1;
      items = $$('.rwbl-card', list).map((c) => [c, c.getBoundingClientRect().top]);
    },
  );
}

/* ---------------------------------------------------------- newsletter */
const form = $('.rwbl-form', sec);
if (form) {
  const input = $('input', form);
  const note = $('#rwbl-note', form) || $('.rwbl-note', form);
  const noteText = note?.textContent || '';
  const valid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  input.addEventListener('input', () => {
    if (!form.classList.contains('is-err')) return;
    form.classList.remove('is-err');
    input.setAttribute('aria-invalid', 'false');
    if (note) (note.textContent = noteText), note.removeAttribute('role');
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!valid(input.value)) {
      form.classList.add('is-err');
      input.setAttribute('aria-invalid', 'true');
      if (note) (note.textContent = 'Enter a valid email address.'), note.setAttribute('role', 'alert');
      input.focus();
      return;
    }
    // no list provider is connected yet: confirm in place (wire a provider's endpoint here when ready)
    const ok = document.createElement('p');
    ok.className = 'rwbl-ok f-m';
    ok.setAttribute('role', 'status');
    ok.innerHTML = `<b class="f-d7">✓</b>You're in. The first email lands on Tuesday.<i aria-hidden="true"></i><em aria-hidden="true"></em>`;
    form.replaceWith(ok);
  });
}
