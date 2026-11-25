/* Insights: article images unmask (inset clip) one after another as the section scrolls in. */
import { $, bootSection, magnetic, scrollProgress, viewport, clamp01, reducedMotion } from '../core.js';

const sec = $('.rwjr');
const RM = reducedMotion();
const easeIO = (v) => {
  const t = clamp01(v);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

bootSection(sec, { staticFlags: RM ? [] : ['is-set'] });
magnetic(sec);

if (!RM)
  scrollProgress(sec, (sp) => {
    const ph = viewport().ph;
    for (let n = 0; n < 3; n++)
      sec.style.setProperty(`--u${n}`, easeIO((sp - (ph ? 0.04 : 0.14) - n * (ph ? 0.09 : 0.07)) / 0.34).toFixed(4));
  });
