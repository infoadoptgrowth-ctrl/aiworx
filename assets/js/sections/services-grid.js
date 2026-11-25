/* Services page grid: each channel card "picks up a signal" as it scrolls into view, then plays its mock-UI story.
   Hovering a card replays the story at double speed. */
import { $, $$, win, onTick, bootSection, magnetic, nearViewport, reducedMotion } from '../core.js';
import { playStory } from '../stories.js';

const sec = $('.rwsg');
const grid = $('.rwsg-grid', sec);
const cards = $$('.rwsg-card', sec);
const RM = reducedMotion();

bootSection(sec);
magnetic(sec);

const hit = cards.map(() => RM);
const stops = cards.map(() => () => {});
const lastReplay = cards.map(() => 0);

function status(card, live) {
  const st = $('.rwsg-st', card);
  const label = Array.from(st.childNodes).find((n) => n.nodeType === 3);
  if (label) label.nodeValue = live ? 'Live' : 'Waiting for signal';
}
function play(i, mode, speed = 1) {
  stops[i]();
  stops[i] = playStory($('.rwsg-ui', cards[i]), mode, { speed });
}

cards.forEach((card, i) => {
  card.classList.toggle('is-hit', hit[i]);
  status(card, hit[i]);
  play(i, hit[i] ? 'end' : 'wait');
  card.addEventListener('pointerenter', () => {
    if (RM || !hit[i]) return;
    const now = performance.now();
    if (now - lastReplay[i] < 2600) return;
    lastReplay[i] = now;
    play(i, 'run', 2);
  });
});

if (!RM) {
  const near = nearViewport(grid, '30% 0px 30% 0px');
  let tops = [], vh = 1;
  onTick(
    () => {
      if (!near.on) return;
      tops.forEach((t, i) => {
        if (hit[i] || t >= vh * 0.7) return;
        hit[i] = true;
        cards[i].classList.add('is-hit');
        status(cards[i], true);
        play(i, 'run');
      });
    },
    () => {
      if (!near.on) return;
      vh = win.innerHeight || 1;
      tops = cards.map((c) => c.getBoundingClientRect().top);
    },
  );
}
