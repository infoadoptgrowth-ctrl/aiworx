# AiWorx website: SEO audit and implementation report

Date: 26 November 2026 · Site: https://aiworxllc.com · Stack: static HTML/CSS/ES modules on Vercel
(no framework, no build step; one serverless function for forms). No framework migration was made.

Everything below was checked against the code and a local server that mirrors the Vercel config
(`npm run dev`). Items that depend on the live domain are listed separately. Nothing here
guarantees rankings, indexing speed or Core Web Vitals scores.

The reference site (joyful-studies-761814.framer.app) could not be opened from the build
environment (outbound network blocked), so the audit is of this codebase only.

## 1. Issues identified

| # | Area | Issue |
| --- | --- | --- |
| 1 | URLs / links | All 1,461 internal links pointed to `*.html`; Vercel (`cleanUrls`) answers each with a 308 redirect to the clean URL, so every click and crawl hop went through a redirect |
| 2 | Canonicals | Canonicals were relative (`about.html`, `./`), resolving to the redirecting `.html` URL instead of the served clean URL |
| 3 | Crawling | No `robots.txt`, no `sitemap.xml` |
| 4 | 404 | `404.html` was indexable, had a canonical, and used page-relative asset paths, so it rendered unstyled at nested URLs such as `/blog/old/post` |
| 5 | Titles | Service pages titled only "SEO — AiWorx LLC" etc.; no service keywords |
| 6 | Descriptions | 25 of 36 pages had descriptions of 38–90 characters; services/case studies used one templated sentence |
| 7 | Social | `og:image` relative and WebP (not shown by some apps); no `og:url`, `og:description` on several pages, no Twitter title/description/image |
| 8 | Structured data | No JSON-LD on any page |
| 9 | Robots meta | No explicit index/follow on indexable pages |
| 10 | Images | 314 of 476 `<img>` without width/height; 83 below-the-fold images not lazy; 6 above-the-fold images lazy-loaded; 2000–2400 px files served into 40–400 px slots (no `srcset`) |
| 11 | Images (JS) | Case-study slider and content feed built `<img>` tags from full-size files in JavaScript |
| 12 | Internal linking | Two blog posts were linked from only one page; every post's "Keep reading" showed the same articles |
| 13 | Accessibility | Footer outside any landmark (axe `region`, all 36 pages); animated numbers used `aria-label` on role-less `<span>` (axe `aria-prohibited-attr`); no skip-to-content link |
| 14 | Content | "seo" in lowercase on a team page; team pages share one templated paragraph (near-duplicate content) |
| 15 | Headers | No `X-Frame-Options`, `Permissions-Policy` or explicit HSTS; `/api/*` and config files indexable; CSS/JS cached 7 days unversioned (stale styles after deploys) |
| 16 | Mobile (earlier pass) | Hero chips over buttons, squeezed review cards, 13 px select (iOS zoom), 19 px footer tap targets |
| 17 | Forms (earlier pass) | Forms opened the visitor's mail app instead of sending; the audit form lost the email on submit |

Checked and found fine: one H1 per page and no heading-level jumps (all 36 pages); viewport meta
on every page; no broken internal links; no mixed content; fonts use `display=swap` with
preconnect; hero image preloaded with `fetchpriority="high"`; all content is in server-delivered
HTML (no client-side routing); text contrast passes WCAG AA in the final rendered state (earlier
flags were mid-animation); every `<img>` already had an `alt` attribute.

## 2. Issues fixed

- **Clean URLs everywhere:** internal links rewritten to root-relative clean URLs (`/about`,
  `/#pricing`); asset paths made root-relative (`/assets/...`); JS-built links updated
  (`cta.js`, `work.js`). Zero `.html` links remain. 404 page now renders styled at any depth.
- **Canonicals:** self-referencing, absolute, HTTPS, on `https://aiworxllc.com`, matching the
  sitemap one-to-one. Removed from the 404 page.
- **robots.txt + sitemap.xml:** 35 canonical URLs (404 excluded), HTTPS, valid XML, referenced
  from robots.txt; `/api/` disallowed.
- **Robots meta:** `index, follow, max-image-preview:large` on all 35 indexable pages;
  `noindex, follow` on 404.
- **Titles and descriptions:** unique keyword-led titles (21–60 chars) and descriptions
  (137–163 chars) on every page, written from each page's own content; no duplicates.
- **Social:** `og:type/url/title/description/image(+width/height/alt)` and Twitter card tags on
  every page; new 1200×630 JPG share image `assets/img/og-cover.jpg`; blog posts use `og:type=article`.
- **Structured data (JSON-LD `@graph`):** Organization + WebSite (home); WebPage / AboutPage /
  ContactPage / CollectionPage (all indexable pages); BreadcrumbList (all inner pages); Service
  with the starting price shown on the page (6 service pages); BlogPosting with the visible
  publish date (6 posts); FAQPage from the visible FAQ (home, services, pricing). No reviews,
  ratings, address or Person data were added (see section 3).
- **Images:** width/height on all 476 images (verified: all 952 rendered image boxes identical
  before/after at 1280 px and 390 px); `loading="lazy"` + `decoding="async"` below the fold,
  eager above it; 83 smaller WebP copies (160/640/1024/1280 px) with `srcset`/`sizes` from
  measured render widths; hero gets `srcset` + matching preload `imagesrcset`; `srcsetFor()`
  helper used by the JS-built slider and feed. Measured image bytes for a full scroll of the
  home page: iPhone 13 2,201 KB → ~960–1,140 KB; desktop 1,789 KB → 800 KB.
- **Internal linking:** topical "Keep reading" links on each post; every article now has 2–3
  inbound links from other articles.
- **Accessibility:** footer is a `<footer>` landmark; animated numbers have `role="img"`;
  skip-to-content link on every page that moves focus into `<main>`. axe-core 4.14
  (WCAG 2 A/AA + best practice): 0 violations on all 36 pages.
- **Headers (`vercel.json`):** `X-Frame-Options`, `Permissions-Policy`, HSTS, `X-Robots-Tag:
  noindex` on `/api/*` and config files, CSS/JS revalidate on each visit, 1-hour cache on
  sitemap/robots.
- **Content:** "seo" → "SEO"; team pages get distinct titles and descriptions.
- **Earlier in this work:** mobile layout fixes; SMTP form backend (`api/contact.js`).

## 3. Remaining items (need your input, access or the live site)

- **Placeholder business details:** phone `+1 (212) 555-0186` (555 numbers are fictional),
  footer social links pointing to `instagram.com` / `tiktok.com` / `linkedin.com` / `x.com`
  home pages, and "New York" in copy and legal pages. Replace with real details or remove. Once
  real, add `telephone`, `address` and `sameAs` to the Organization schema.
- **Claims needing proof:** "126 client reviews", "Google 4.9 / Clutch 5.0 / G2 4.8",
  testimonials, case-study clients and numbers, team members and photos. If any are not real,
  remove them: they are misleading and against Google's guidelines. They were deliberately
  kept out of structured data. Person schema for team members can be added once the people
  and bios are confirmed real.
- **Thin/duplicate team pages:** six pages share one templated paragraph; real bios are needed.
- **Render-blocking CSS:** the home page loads 22 stylesheets and 19 module scripts (fine over
  HTTP/2, but bundling would help LCP). This needs a build step, which the project avoids by
  design.
- **Live-only checks:** HTTP→HTTPS and `www`→apex redirects (Vercel shows them configured),
  response headers, real-user Core Web Vitals (Search Console / PageSpeed Insights after deploy),
  Rich Results Test on the live URLs.
- **Deployment:** this work is on branch `claude/amazing-pascal-iloq0d`; production deploys from
  `claude/optimistic-archimedes-dk3r7i`. It needs merging to go live.
- **Email DNS:** if form mail is sent through cPanel SMTP, keep SPF (`ip4:135.181.161.16`) and
  DKIM; point MX/`mail` at the cPanel server if the mailbox should receive outside mail.

## 4. Files created or modified

Created: `robots.txt`, `sitemap.xml`, `assets/img/og-cover.jpg`, 83 image variants
`assets/img/*-{160,640,1024,1280}.webp`, `scripts/dev-server.js`, `SEO-REPORT.md`
(also from the earlier passes: `api/contact.js`, `package.json`, `package-lock.json`).
Modified: all 36 `*.html` pages, `vercel.json`, `.vercelignore`, `README.md`,
`assets/css/base.css`, `assets/js/core.js`, `assets/js/sections/{hero,cta,work,content}.js`.

## 5. Page-by-page metadata

Canonical = `https://aiworxllc.com` + URL. Every indexable page also has og/twitter tags with the
same title and description and the shared image `https://aiworxllc.com/assets/img/og-cover.jpg`.

| URL | Title (chars) | Description (chars) | Robots | Schema types |
| --- | --- | --- | --- | --- |
| `/` | AiWorx LLC \| Digital Marketing Agency for SEO, Social & Ads (59) | AiWorx is a digital marketing agency for SEO, social media marketing and paid ads. One team, one monthly retainer and plain-number reports. Book a free audit. (158) | index | Organization, WebSite, WebPage, FAQPage |
| `/services` | Digital Marketing Services: SEO, Social, Ads & More \| AiWorx (60) | SEO, social media marketing, paid ads, content, web design and branding from one team. Pick one channel or all six, planned together and reported in plain numbers. (163) | index | CollectionPage, BreadcrumbList, FAQPage |
| `/service-seo` | SEO Services That Rank for Searches That Buy \| AiWorx (53) | SEO services from AiWorx: technical audits, keyword mapping, content and link building that move you up for the searches your customers make. From $1,500/mo. (157) | index | WebPage, BreadcrumbList, Service |
| `/service-social-media` | Social Media Marketing Services \| AiWorx (40) | Social media marketing that people stop for: strategy, content, posting and community management for Instagram, TikTok and LinkedIn. From $1,800/mo. (148) | index | WebPage, BreadcrumbList, Service |
| `/service-paid-ads` | Paid Ads & PPC Management Services \| AiWorx (43) | Paid ads management for Google, Meta and TikTok with every dollar tracked to a sale: account setup, creative testing and weekly optimisation. From $1,200/mo. (157) | index | WebPage, BreadcrumbList, Service |
| `/service-content` | Content Marketing Services: Articles, Video & Email \| AiWorx (60) | Content marketing that sells: articles, short-form video and email newsletters planned around what your customers search for and share. From $1,400/mo. (151) | index | WebPage, BreadcrumbList, Service |
| `/service-web-design` | Web Design Services That Turn Visits Into Calls \| AiWorx (56) | Conversion-focused web design: fast websites and landing pages built to turn visitors into calls and leads, with wireframes, design and build. From $4,500. (155) | index | WebPage, BreadcrumbList, Service |
| `/service-branding` | Branding Agency Services: Logo & Brand Identity \| AiWorx (56) | Branding services for a brand people remember: brand workshop, logo, visual identity and brand guidelines that keep your ads and posts consistent. From $3,800. (159) | index | WebPage, BreadcrumbList, Service |
| `/pricing` | Marketing Agency Pricing: Monthly Retainers \| AiWorx (52) | Clear digital marketing pricing: Starter, Growth and Scale retainers for SEO, social media and paid ads. Month to month, 30 days notice, ad spend paid directly. (160) | index | WebPage, BreadcrumbList, FAQPage |
| `/work` | Marketing Case Studies & Client Results \| AiWorx (48) | Digital marketing case studies with real numbers: SEO, social media, paid ads and content results for dental, legal, real estate, beauty, fitness and food brands. (162) | index | CollectionPage, BreadcrumbList |
| `/work-northside-dental` | Dental SEO Case Study: Page 4 to Top 3 \| AiWorx (47) | How local SEO and content took Northside Dental from page 4 to the top 3 for “dentist near me”, and grew organic visits from 4,200 to 38,900 a month. (149) | index | WebPage, BreadcrumbList |
| `/work-kettlebrook-coffee` | Coffee Brand Social Media Case Study \| AiWorx (45) | How social media and content grew Kettlebrook Coffee’s Instagram from 8,100 to over 92,000 followers with a brand people film and share for us. (143) | index | WebPage, BreadcrumbList |
| `/work-fitloop` | Fitness App Paid Ads Case Study \| AiWorx (40) | How paid ads for the Fitloop fitness app paid for themselves in 11 days: the challenge, the campaigns we ran and the return on ad spend we delivered. (149) | index | WebPage, BreadcrumbList |
| `/work-haven-realty` | Real Estate Marketing Case Study \| AiWorx (41) | How paid ads and a new website gave Haven Realty a steady pipeline of seller leads instead of empty clicks, and cut their reliance on paid lead portals. (152) | index | WebPage, BreadcrumbList |
| `/work-lumen-skin` | Skincare Brand Launch Case Study \| AiWorx (41) | How social media and branding made the Lumen Skin launch sell out twice, from the brand identity to the launch-week content plan and creator posts. (147) | index | WebPage, BreadcrumbList |
| `/work-orbit-legal` | Law Firm Content & SEO Case Study \| AiWorx (42) | How thought-leadership content and SEO turned Orbit Legal’s LinkedIn posts and articles into a steady flow of booked consultations every month. (143) | index | WebPage, BreadcrumbList |
| `/about` | About AiWorx \| A Results-First Digital Marketing Agency (55) | Meet AiWorx, the digital marketing agency behind 140+ growing brands. Our story, the rules we work by, our team and what our clients say about working with us. (159) | index | AboutPage, BreadcrumbList |
| `/team-maya-chen` | Maya Chen, Founder & Strategy Lead \| AiWorx (43) | Meet Maya Chen, founder and strategy lead at AiWorx. She runs strategy on every account from the first audit to the weekly report, with no hand-offs to juniors. (160) | index | WebPage, BreadcrumbList |
| `/team-jordan-reyes` | Jordan Reyes, Head of SEO \| AiWorx (34) | Meet Jordan Reyes, Head of SEO at AiWorx. Jordan leads the SEO work on every account, from the first technical audit to the weekly ranking report. (146) | index | WebPage, BreadcrumbList |
| `/team-amara-okafor` | Amara Okafor, Social Media Director \| AiWorx (44) | Meet Amara Okafor, social media director at AiWorx. Amara runs social strategy and content on every account, from the first audit to the weekly report. (151) | index | WebPage, BreadcrumbList |
| `/team-liam-novak` | Liam Novak, Paid Ads Lead \| AiWorx (34) | Meet Liam Novak, paid ads lead at AiWorx. Liam runs Google, Meta and TikTok campaigns on every account, from the first audit to the weekly report. (146) | index | WebPage, BreadcrumbList |
| `/team-sofia-marin` | Sofia Marín, Content Lead \| AiWorx (34) | Meet Sofia Marín, content lead at AiWorx. Sofia plans and produces articles, video and email on every account, from the first audit to the weekly report. (153) | index | WebPage, BreadcrumbList |
| `/team-theo-park` | Theo Park, Design Lead \| AiWorx (31) | Meet Theo Park, design lead at AiWorx. Theo leads web design and branding work on every account, from the first audit to the finished site. (139) | index | WebPage, BreadcrumbList |
| `/careers` | Marketing Jobs at AiWorx \| SEO, Social & Paid Ads Roles (55) | Join AiWorx, a remote-first digital marketing agency. Open roles for SEO, social media and paid ads specialists, with 4-day summer weeks and profit share. (154) | index | WebPage, BreadcrumbList |
| `/blog` | Digital Marketing Blog: SEO, Social & Paid Ads Tips \| AiWorx (60) | Practical digital marketing guides from the AiWorx team: local SEO, short-form video that sells, paid ads reporting, content calendars and landing page fixes. (158) | index | CollectionPage, BreadcrumbList |
| `/blog-local-seo-2026` | Local SEO in 2026: what still moves the map pack \| AiWorx (57) | Local SEO in 2026 comes down to reviews, location pages and local links. What still moves the Google map pack, and the tactics we use for every local client. (157) | index | WebPage, BreadcrumbList, BlogPosting |
| `/blog-reels-that-sell` | Reels That Sell: The 3-Second Hook Rule \| AiWorx (48) | Why the first three seconds decide whether anyone watches the rest of your reel, and the simple hook rule we use to make short-form video that sells. (149) | index | WebPage, BreadcrumbList, BlogPosting |
| `/blog-roas-is-not-profit` | ROAS is not profit: how we report paid ads \| AiWorx (51) | A 6x return on ad spend can still lose money. Why ROAS alone misleads, and the profit number we report on every paid ads account instead. (137) | index | WebPage, BreadcrumbList, BlogPosting |
| `/blog-content-calendar` | The one-page content calendar we give every client \| AiWorx (59) | The one-page content calendar we give every client: how to plan a month of posts, reels and articles around what your customers actually search for. (148) | index | WebPage, BreadcrumbList, BlogPosting |
| `/blog-landing-pages` | Five landing page fixes that doubled conversions \| AiWorx (57) | Five landing page fixes that doubled conversions for our clients: headlines, proof, forms, speed and one clear call to action. Simple changes, big gains. (153) | index | WebPage, BreadcrumbList, BlogPosting |
| `/blog-agency-or-in-house` | Agency or in-house? An honest comparison \| AiWorx (49) | Should you hire a marketing agency or build an in-house team? An honest comparison of cost, speed, skills and control to help you choose what fits. (147) | index | WebPage, BreadcrumbList, BlogPosting |
| `/contact` | Contact AiWorx \| Book a Free Digital Marketing Audit (52) | Tell us where your marketing is and where you want it to be. A senior strategist reads every message and replies within two hours on work days. (143) | index | ContactPage, BreadcrumbList |
| `/privacy` | Privacy Policy \| AiWorx (23) | How AiWorx collects, uses and protects personal information on this website, why we collect it, how long we keep it and the choices you have about your data. (157) | index | WebPage, BreadcrumbList |
| `/terms` | Terms of Use \| AiWorx (21) | The terms that apply when you use the AiWorx website, including how prices and packages shown on the site work and how client engagements are agreed. (149) | index | WebPage, BreadcrumbList |
| `/cookies` | Cookie Policy \| AiWorx (22) | Which cookies the AiWorx website uses, grouped into essential, analytics and marketing, and how to change your cookie choices at any time. (138) | index | WebPage, BreadcrumbList |
| `(any unknown URL)` | Page not found \| AiWorx (23) | This page moved or never existed. (33) | noindex | — |

## 6. Sitemap and robots

- https://aiworxllc.com/sitemap.xml (35 URLs)
- https://aiworxllc.com/robots.txt

## 7. Google Search Console setup

1. Open https://search.google.com/search-console and add a **Domain** property for `aiworxllc.com`.
2. Verify it with the TXT record Google shows, added in cPanel → Zone Editor (the live DNS).
   Verification can take a few minutes to a few hours.
3. Sitemaps → submit `https://aiworxllc.com/sitemap.xml`.
4. URL Inspection → test `https://aiworxllc.com/` and a few key pages
   (`/services`, `/service-seo`, `/pricing`) → **Request indexing**.
5. After a few days check Pages (indexing), Enhancements (Breadcrumbs, FAQ) and Core Web Vitals
   (needs real-user traffic before data appears).
6. Optional: add the site to Bing Webmaster Tools (it can import from Search Console).

## 8. Build status

There is no build step (`vercel.json`: `buildCommand: ""`, output directory `.`); Vercel installs
`nodemailer` for `api/contact.js` and serves the files as they are. In place of a build, these
checks passed locally on the final code:

- Static validation of all 36 pages: unique titles/descriptions, canonicals = sitemap,
  robots meta, og/twitter tags, one H1, viewport, alt + width on every image, no `.html`
  or relative links, no missing assets or srcset files, all JSON-LD parses: **0 problems**.
- HTTP: 35/35 sitemap URLs return 200; `.html`, `/index` and trailing-slash URLs 308 to the
  clean URL; unknown URLs return 404 with the styled 404 page.
- Browser (Chromium; 1440 px desktop and iPhone 13): all routes load with no console errors,
  no failed requests and no horizontal overflow.
- axe-core accessibility: 0 violations on all 36 pages.
- Form API responds and validates; earlier end-to-end SMTP test delivered both form types.
