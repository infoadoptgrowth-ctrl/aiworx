# AiWorx LLC — website

The marketing site for AiWorx LLC, rebuilt from the reference design with its scroll-driven animations,
hover effects and intro loader, rebranded to the AiWorx logo palette.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home: hero, clients radar, services, case studies, process, numbers, content, team, reviews, pricing, FAQ, insights, free audit |
| `about.html` | About: story timeline, values, hiring, team, reviews |
| `services.html` | Services overview: all six channels, process, FAQ |
| `service-seo.html`, `service-social-media.html`, `service-paid-ads.html`, `service-content.html`, `service-web-design.html`, `service-branding.html` | One page per service |
| `work.html` | Portfolio grid with channel filter |
| `work-northside-dental.html`, `work-kettlebrook-coffee.html`, `work-fitloop.html`, `work-haven-realty.html`, `work-lumen-skin.html`, `work-orbit-legal.html` | One page per case study |
| `contact.html` | Contact form and contact cards |
| `pricing.html` | Retainers with monthly/quarterly toggle, side-by-side plan comparison, FAQ |
| `blog.html` | Articles with topic filter, newsletter sign-up |
| `blog-local-seo-2026.html`, `blog-reels-that-sell.html`, `blog-roas-is-not-profit.html`, `blog-content-calendar.html`, `blog-landing-pages.html`, `blog-agency-or-in-house.html` | One page per article (share links, reading-progress ring) |
| `careers.html` | Open roles, perks, hiring steps |
| `team-maya-chen.html`, `team-jordan-reyes.html`, `team-amara-okafor.html`, `team-liam-novak.html`, `team-sofia-marin.html`, `team-theo-park.html` | One page per team member |
| `privacy.html`, `terms.html`, `cookies.html` | Legal pages with a contents rail |
| `404.html` | "Signal lost" page (most static hosts serve `404.html` for unknown URLs automatically) |

Moving between pages plays the same transition as the reference: a lime-rimmed circle grows from the click
point and names the page being opened, and the next page opens by shrinking it back to that point
(`assets/js/sections/transition.js`, plus a short inline script in each page's `<head>` that covers the new page
before it paints). Links with `data-no-trans` skip it.

It is plain HTML, CSS and JavaScript modules. There is no build step and no framework; the only
third-party code is [Lenis](https://github.com/darkroomengineering/lenis) for smooth scrolling,
vendored in `assets/vendor/`.

## Run it locally

ES modules do not load from `file://`, so serve the folder over HTTP:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>. Any static host (Netlify, Vercel, GitHub Pages, S3, nginx) can serve
the folder as-is.

## Structure

```
*.html                     one file per page, one commented block per section
assets/
  css/base.css             brand tokens, fonts, shared primitives (buttons, eyebrows, headings, reveals)
  css/sections/*.css       one stylesheet per section
  css/brand.css            AiWorx logo lock-ups + small breakpoint rules
  js/core.js               shared runtime: rAF ticker, breakpoints, in-view reveals, scroll progress,
                           magnetic buttons, Lenis + anchor scrolling, clocks, rolling digits
  js/sections/*.js         one module per section (behaviour only; markup lives in the HTML)
  js/stories.js            the channel mock-UI animations shared by Services, the Services page and service pages
  vendor/lenis.*           smooth scrolling (MIT)
  img/                     photography, logo variants, favicons
```

Breakpoints match the reference: desktop ≥ 1100px, tablet 810–1099px (`.is-tab`) and phone < 810px
(`.is-ph`). `core.js` sets those classes on every section. Every animation is turned off when the
visitor has *prefers-reduced-motion* set.

## Brand

The colours come from the logo and are defined once in `assets/css/base.css`:

| Token          | Value     | Use                                   |
| -------------- | --------- | ------------------------------------- |
| `--rw-brass`   | `#d4f905` | logo lime: highlights, buttons, rings |
| `--rw-pop`     | `#7cb203` | logo leaf green: live dots, badges    |
| `--rw-forest`  | `#3e7600` | logo deep green                       |
| `--rw-ink`     | `#0d0e10` | logo black: text, dark panels         |
| `--rw-night`   | `#08090a` | dark sections                         |
| `--rw-bone`    | `#eeeee8` | paper background                      |

Logo files are in `assets/img/`: `aiworx-logo.png` (for light backgrounds), `aiworx-logo-light.png`
(white "worx" for dark backgrounds) and `aiworx-mark.png` (the "ai" symbol alone, also used for the favicons).

## Content to replace before launch

The copy, client names, team, reviews and figures are the reference template's sample content, with the
name changed to AiWorx. Replace these with real details:

- Contact details: `hello@aiworxllc.com`, `+1 (212) 555-0186` and "New York" (header menu, FAQ card, footer),
  plus `SITE` in `assets/js/core.js`.
- Social links in the footer and the mobile menu (they point to the network home pages).
- The free-audit form sends visitors to `contact.html` with their email and budget filled in. The contact form opens
  the visitor's email app with the message ready to send to `SITE.email`; connect it to a form backend or CRM
  (e.g. Formspree, HubSpot) if you want submissions delivered without the email app.
- Privacy / Terms / Cookies links currently point to the top of the page.
