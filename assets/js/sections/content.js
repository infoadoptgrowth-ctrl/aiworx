/* Content: a wall of client posts in columns that drift against each other with scroll and skew with scroll speed. */
import { $, win, onTick, onBreakpoint, bootSection, magnetic, scrollProgress, reducedMotion } from '../core.js';

const POSTS = `xbfdpTvZzzafiJOwtXCs0luyp2I|@kettlebrook.coffee|2418|post;1DPklcMWo4iq1F5uWVjcytvrsc|@lumenskin|8114|carousel|5;yOk3vEq9TQ9CWpwuFmZY86mAVY|@fitloop|3912|reel|48k;s0jwUqVTFxGplLAwU0WLa8rbdw|@parcel.co|5630|post;YpYjh1duUyRdFMaCaQZ6JVDbmko|@tallow.kitchen|1204|post;HeKFyo7MfYy7GEQSGOPGXvhVHvo|@brightline.run|9870|reel|112k;oSWgZWTjPoakKUa7CvtJ6TXueP0|@lumenskin|3307|carousel|3;3nqFQlS1bXsh1PS74cijri0AhSM|@verde.studio|1786|post;yg9StsTkn2mS5VxfA3YnyrJNM1Q|@haven.realty|2205|reel|21k;mnE5eA5CunHm89doTbOt2H7pHdE|@verde.studio|2874|carousel|4;uYN9bcKFZFsqzLzQWUSswf4QIs|@tallow.kitchen|2951|carousel|6;eMqxq3byjv5ceZYESvRLuMWVug|@parcel.co|3690|post;xbfdpTvZzzafiJOwtXCs0luyp2I|@kettlebrook.coffee|1932|post;yOk3vEq9TQ9CWpwuFmZY86mAVY|@fitloop|4480|reel|64k;1DPklcMWo4iq1F5uWVjcytvrsc|@lumenskin|2660|carousel|3;3nqFQlS1bXsh1PS74cijri0AhSM|@verde.studio|1417|post;HeKFyo7MfYy7GEQSGOPGXvhVHvo|@brightline.run|6042|reel|31k;oSWgZWTjPoakKUa7CvtJ6TXueP0|@lumenskin|1118|carousel|5;s0jwUqVTFxGplLAwU0WLa8rbdw|@parcel.co|2336|post;uYN9bcKFZFsqzLzQWUSswf4QIs|@tallow.kitchen|2074|carousel|4`
  .split(';')
  .map((row) => {
    const [img, handle, likes, kind, extra = ''] = row.split('|');
    return { src: `assets/img/${img}.webp`, handle, likes: Number(likes), kind, extra };
  });
/* avatar tints drawn from the AiWorx palette */
const AVATARS = ['#D4F905', '#7CB203', '#E3F79A', '#B6E35A', '#A6D96A', '#C6EB5C'];
const SPEEDS = [1, 0.72, 1.12, 0.84, 0.96];
const RM = reducedMotion();

const sec = $('.rwfd');
const wall = $('.rwfd-wall', sec);

bootSection(sec);
magnetic(sec);
if (RM) sec.classList.add('is-rm');

const avatar = (h) => {
  let t = 0;
  for (const c of h) t = (t * 31 + c.charCodeAt(0)) >>> 0;
  return AVATARS[t % AVATARS.length];
};
const n = (v) => v.toLocaleString('en-US');
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.4 4.5c2 0 3.6 1.1 4.6 2.7 1-1.6 2.6-2.7 4.6-2.7 3.5 0 5.8 3.3 4.6 6.7C19.5 15.9 12 20.5 12 20.5z"></path></svg>';

function card(p, col, row) {
  const ratio = p.kind === 'reel' ? '9/16' : p.kind === 'carousel' ? '4/5' : '1/1';
  let extra = '';
  if (p.kind === 'reel')
    extra = `<span class="rwfd-reel f-m"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"></path></svg>${p.extra || '10k'} views</span>`;
  if (p.kind === 'carousel') {
    const k = Math.max(2, parseInt(p.extra) || 3);
    extra = `<span class="rwfd-n f-m">1/${k}</span><span class="rwfd-dots" aria-hidden="true">${Array.from({ length: Math.min(6, k) }, (_, i) => `<i class="${i ? '' : 'is-a'}"></i>`).join('')}</span>`;
  }
  const letter = p.handle.replace(/^@/, '').charAt(0).toUpperCase();
  return `<article class="rwfd-card is-${p.kind}" style="transition-delay:${col * 70 + row * 40}ms">
  <div class="rwfd-media" style="aspect-ratio:${ratio}"><img src="${p.src}" alt="Post by ${p.handle}" loading="lazy" decoding="async" draggable="false">${extra}</div>
  <div class="rwfd-meta"><i class="rwfd-av f-d" aria-hidden="true" style="--av:${avatar(p.handle)}">${letter}</i><span class="rwfd-hd">${p.handle}</span>
  <span class="rwfd-like f-m"><span class="rwfd-heart">${HEART}<i class="rwfd-ring" aria-hidden="true"></i></span><span class="rwfd-roll" aria-label="${n(p.likes)} likes"><b aria-hidden="true">${n(p.likes)}</b><b aria-hidden="true">${n(p.likes + 1)}</b></span></span></div>
</article>`;
}

function render(v) {
  const cols = v.ph ? 2 : v.tab ? 3 : 5;
  const rows = Math.max(Math.ceil(POSTS.length / cols), v.ph ? 6 : 4);
  let html = '';
  for (let c = 0; c < cols; c++) {
    html += `<div class="rwfd-col" style="--dir:${c % 2 ? 1 : -1};--spd:${SPEEDS[c % SPEEDS.length]}">`;
    for (let r = 0; r < rows; r++) {
      const i = r * cols + c;
      html += card(POSTS[(i < POSTS.length ? i : i + 3) % POSTS.length], c, r);
    }
    html += '</div>';
  }
  wall.style.setProperty('--cols', cols);
  wall.innerHTML = html;
}
onBreakpoint(render);

if (!RM) {
  scrollProgress(sec);
  /* skew the wall with scroll velocity */
  const near = { on: true };
  new IntersectionObserver((e) => (near.on = e[0].isIntersecting), { rootMargin: '20% 0px 20% 0px' }).observe(wall);
  let y = 0, prev = -1, vel = 0, sk = 0, last = 0;
  onTick(
    () => {
      if (prev < 0) {
        prev = y;
        return;
      }
      const d = y - prev;
      prev = y;
      if (!near.on && Math.abs(sk) < 0.01) return;
      vel += (d - vel) * 0.25;
      const target = Math.max(-4, Math.min(4, vel * 0.16));
      sk += (target - sk) * 0.14;
      if (Math.abs(sk) < 0.01) sk = 0;
      if (Math.abs(sk - last) < 0.02) return;
      last = sk;
      wall.style.setProperty('--sk', `${sk.toFixed(2)}deg`);
    },
    () => (y = win.scrollY),
  );
}
