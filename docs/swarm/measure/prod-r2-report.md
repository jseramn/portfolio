# Wave 3 — production r2 (`7e1fb5e`, U07 + U14)

- **TARGET:** `https://www.jseramn.tech`
- **SHA served:** GitHub Production deployment `7e1fb5e` (`refactor(hero): split chrome components and extract the glass pump (#49)`), status **success** 2026-09-02 11:09:39Z. Live HTML matches U14 (`Hero.DMT7DWTQ.js` 156 B re-export of `Hero.JbxiLhNw.js`), not U07-only `Hero.DDqradxI.js`.
- **Checkout (repo checks):** `/home/jseramn/portfolio-worktrees/swarm/prod-r2` detached `origin/main` `7e1fb5e` (U07+U14). No `pnpm install`.
- **When:** 2026-09-02 06:11–06:20 America/Bogota (LH fetchTimes 11:17–11:18Z)
- **In this SHA / live:** U07 lazy Motion, U14 Hero split, homepage Tinity CTA (`aria-label="Open Tinity"`)
- **Not shipped:** `/tinity` markdown (`pageFromPath` has no tinity)
- **Compiler:** measurement agent, artifacts in `/tmp/swarm/measure/prod-r2/{lh,shots,taps,agentic,repo,html}`
- **Baseline (B-report, pre-swarm `8f9a743`):** mobile median P97, TBT 209 ms, FCP=LCP 0.93 s, SI 2.0 s, JS 258 KiB, total 506–624 KB
- **prod-r1 (`824588c`):** P90, TBT 390 ms, LCP 1.13 s, JS ~267 KB, total ~613 KB, no Tinity CTA, fat `Hero.BmOYRBcc.js` 57.7 KB

## Scores

Lighthouse 13.4.1, Chromium Playwright 1234, `flock /tmp/swarm/build.lock`. Mobile simulate.

| run | P | A | BP | SEO | FCP | LCP | TBT | CLS | SI | JS B | total B |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| home-mobile-1 | 94 | 100 | 100 | 100 | 1.18 s | 1.30 s | 293 ms | 0 | 2.2 s | 270 KB | 604 KB |
| home-mobile-2 | 99 | 100 | 100 | 100 | 0.97 s | 0.97 s | 125 ms | 0 | 1.9 s | 270 KB | 540 KB |
| home-mobile-3 | 98 | 100 | 100 | 100 | 1.04 s | 1.04 s | 155 ms | 0 | 1.9 s | 270 KB | 555 KB |
| **home mobile median** | **98** | **100** | **100** | **100** | **1.04 s** | **1.04 s** | **154.5 ms** | **0** | **1.9 s** | **270 KB** | **555 KB** |
| home-desktop-1 | 99 | 100 | 100 | 100 | 0.29 s | 0.29 s | 17 ms | 0.00013 | 1.2 s | 304 KB | 553 KB |
| home-desktop-2 | 100 | 100 | 100 | 100 | 0.31 s | 0.31 s | 17 ms | 0.00013 | 0.8 s | 304 KB | 610 KB |
| about-mobile-1 | 100 | 100 | 100 | 100 | 0.82 s | 0.95 s | 0 | 0 | 1.1 s | 0 | 59 KB |
| contact-mobile-1 | 100 | 100 | 100 | 100 | 0.80 s | 0.94 s | 0 | 0 | 1.1 s | 0 | 60 KB |
| policy-mobile-1 | 100 | 100 | 100 | 100 | 0.80 s | 0.93 s | 0 | 0 | 1.0 s | 0 | 61 KB |
| 404-mobile-1 | 100 | 100 | 96 | 92 | 0.80 s | 0.94 s | 0 | 0 | 1.0 s | 0 | 59 KB |

Pipeline median (`lh/extract.json`): P98 A100 BP100 SEO100 LCP 1039 ms TBT 154.5 ms CLS 0 JS 270052 B total 554754 B.

### Budget vs median (home mobile)

| Gate | Budget | Median | Verdict |
|---|---|---|---|
| Performance | ≥99 (goal 100) | 98 | **FAIL** (prod-r1 90 — improved; one run hit 99) |
| A11y / BP / SEO | 100 | 100 / 100 / 100 | **PASS** |
| LCP | ≤1.5 s | 1.04 s | **PASS** (prod-r1 1.13 s) |
| TBT | ≤100 ms | 154.5 ms | **FAIL** (prod-r1 390 ms — improved, still over) |
| CLS | 0 | 0 | **PASS** |
| JS first load | ≤150 KB | ~270 KB | **FAIL** (prod-r1 ~267 KB — flat) |
| Transfer | ≤350 KB | ~555 KB | **FAIL** (prod-r1 ~613 KB — better; video Range still the swing) |

### Hero island vs unused JS / long tasks

Live first-load island is the **U07+U14 small split**, not the fat Hero:

- HTML module: `/_astro/Hero.DMT7DWTQ.js` **156 B** (re-export)
- Inner: `/_astro/Hero.JbxiLhNw.js` **35888 B** raw / **13366 B** br
- No `motion/react` / `popLayout` in the island. Dynamic `import()`: `TextLoop`, `InfiniteSlider`, `ContactModal`, `HeroAsciiBackground`, `index.esm.*.js`
- Checkout `src/components/Hero.tsx` **82 LOC**

Unused JS (all three mobile runs identical): `three.module.BZDFAEuz.js` 52.5 KB wasted of 133 KB (40%); `proxy.Bp6IqlKE.js` 23.3 KB wasted of 41.1 KB (57%). **Hero is not on the unused list** (prod-r1 had `Hero.BmOYRBcc.js` 28.6 / 57.7 KB).

Long tasks (home-mobile-1): unattributable 332 + 86 + 50 ms, document 55 ms. Bootup scripting: unattributable 465 ms, `proxy.*` 136 ms, `client.*` 239 ms, `mount.*` 113 ms, `Hero.JbxiLhNw.js` **33 ms** (was a 50 ms Hero task in r1). TBT metricSavings on long-tasks audit: 300 ms (run 1).

A11y audit `label-content-name-mismatch` still fires on hire (`aria-label="Hire / Contact"` vs visible `hire → cybersecurity` / role); category remains 100 (same as r1; experimental axe rule).

404 BP96 = `errors-in-console`; SEO92 = Lighthouse `http-status-code` on a real 404 (expected).

**U11:** mobile TBT median **154.5 ms > 100 ms** → recommend U11 (do not download `three` when the TBT budget is already blown). Gating condition met.

## UI matrix

Shots in `/tmp/swarm/measure/prod-r2/shots/`. Playwright: `domcontentloaded` + `#boot-loader` hidden; never `networkidle`. ASCII `data-ascii-paint="1"` on default/coarse home. Reduced-motion / no-WebGL: `[data-hero-boot-fallback]` + `img.hero-ascii-display[src=/ascii-fallback.svg]`.

| Shot | Verdict | Notes |
|---|---|---|
| home-360x800 | DEFECT | Marquee leading clip (`…Helping p`); glass HUD intact; ASCII on; **Tinity control present** |
| home-390x844 | OK-ish | Same marquee overflow (`Helping peop`); chrome + Tinity readable |
| home-430x932 | OK-ish | Same family as 390 |
| home-768x1024 | OK-ish | Portrait + HUD; marquee still slightly truncated (`technology whi`); Tinity beside hire |
| home-1024x768 | OK | |
| home-1366x768 | OK | |
| home-1920x1080 | OK | Wordmark + marquee + stats; socials top-left; music; hire + **tinity** + tagline; ASCII portrait |
| home-844x390 (landscape) | DEFECT risk | Short HUD (U20): marquee clips; hire + tinity + tagline + music + about/contact present; social icon dock not in the visible chrome |
| home-1280x600 | OK-ish | Short-ish desktop; Tinity present; social dock not obvious in frame |
| home-390x844-reduced-motion | PASS | Monochrome ASCII/static fallback (`/ascii-fallback.svg`); **not** a colour still. Hire + tinity + tagline readable |
| home-390x844-pointer-coarse | PASS | ASCII painted (`data-ascii-paint=1`); live glass off |
| home-390x844-no-webgl | PASS | Monochrome ASCII fallback still a glyph portrait, not `portrait.jpg` |
| about-* (7 vp) | OK | Secondary layout; globals CSS linked |
| contact-* (7 vp) | OK | |
| policy-* (7 vp) | OK | |
| 404-* (7 vp) | OK | Back + `jseramn`; recovery `/` `/llms.txt` `/sitemap-index.xml` `/about` `/contact` `/policy`; footer About/Contact/Policy/Terms/Data deletion |

No colourful stills. Loader only on home (`#boot-loader`, `aria-busy`, `data-boot-pending`). Identity (white glyphs on black, glass HUD, frozen hire type) intact. Tinity CTA visible at every home viewport including 360 and landscape.

## Targets and landmarks

`/tmp/swarm/measure/prod-r2/taps/summary.json`

| Check | Coarse 390×844 | Desktop 1920 | Verdict |
|---|---|---|---|
| boxes < 44×44 | 0 | 0 | **PASS** |
| hire box | 258×44 | 306×44 | **PASS** |
| hire inner label scrollW vs clientW | 50=50 (inner span; button itself 258/306, screenshots unclipped) | same | **PASS** (no glass clip of hire) |
| Tinity box | 57×44 | 71×44 | **PASS** |
| chrome overlaps | none (5 `data-hud-region`) | none | **PASS** |
| `main` landmark | true | true | **PASS** |
| skip link + Tab | Skip to content `#main` | same | **PASS** |
| Tinity control | **true** | **true** | **PASS** (prod-r1 false) |
| live glass hosts (`data-glass-host` / `data-glass-preset`) | 0 presets | 6 presets (bar, pill, dock, button, button, card) | **PASS** (coarse off; desktop on; +1 Tinity wrap vs design “5 hero”) |
| fallback refraction canvases | 6 | 6 | Tinity extra wrap; modal closed |
| ASCII paint | `"1"` | `"1"` | **PASS** |

## Agentic

`/tmp/swarm/measure/prod-r2/agentic/summary.json` — 33 PASS, 1 FAIL.

| Check | Result | Verdict |
|---|---|---|
| POST `/api/contact` `{}` | 400 `application/json` `request_rejected` | **PASS** |
| GET `/api/contact` | 405 JSON `method_not_allowed` | **PASS** |
| Real contact send | not attempted | **UNVERIFIED** (user) |
| `/.well-known/security.txt` | 200; Contact/Expires/Canonical/Policy/Preferred-Languages; Expires 2027-08-01; ACAO `*` | **PASS** |
| `/security.txt` | 308 → `/.well-known/security.txt` | **PASS** |
| Apex no-follow | 308 → `https://www.jseramn.tech/` | **PASS** |
| markdown `/` `/about` `/contact` `/policy` `/terms` `/data-deletion` | 200 `text/markdown; charset=utf-8` | **PASS** |
| markdown 404 | 404 `text/markdown` | **PASS** |
| markdown `/tinity` | 200 `text/html` (`pageFromPath` has no tinity) | **FAIL** |
| `Accept: image/png` `/` | 406 `text/plain` | **PASS** |
| `Accept: application/json` `/` | 406 `text/plain` | **PASS** |
| `Accept: application/ld+json` `/` | 200 graph Person, Organization, WebSite, ProfilePage; `ContactAction` nested under Person `potentialAction` mailto | **PASS** |
| default HTML `/` | 200 `text/html` 56022 B doctype; Vary `Accept, Accept-Encoding`; `aria-label="Open Tinity"` | **PASS** |
| `/llms.txt` | 200; 13 `- [`; ACAO `*`; includes Tinity | **PASS** |
| `/llms-full.txt` | 200 11265 B | **PASS** |
| robots / sitemap | 200 | **PASS** |
| oEmbed | 200 `type=photo` | **PASS** |
| `/_astro` JS | `max-age=31536000, immutable`; no Vary | **PASS** |
| hashed globals CSS | same immutable (`/about` → `globals.BAmHRMUt.css`) | **PASS** |
| `Link: </llms.txt>; rel="describedby"` | present (header + 1 html) | **PASS** |
| speculation rules | home only | **PASS** |
| home CSS | inline styles, no `/_astro/globals` link (U10) | **PASS** |
| about CSS | `/_astro/globals.BAmHRMUt.css` | **PASS** |
| home Tinity href / aria | true | **PASS** (prod-r1 FAIL) |
| videobg full-res in HEAD | only `videobg-480.{mp4,webm}` | **PASS** |
| lucide / react-use-measure / Vercel Analytics / Speed Insights | absent from `package.json` (no node_modules; skipped `pnpm ls`) | **PASS** |
| no `<link rel=preload as=video>` | true | **PASS** |
| PostHog `setTimeout(arm,6000)` | present in live HTML | **PASS** |
| `VIDEO_PRELOAD = "none"` | repo `heroAsciiBudget.ts` | **PASS** (element, not live-network proven beyond no preload link) |

Is Agentic 100: **UNVERIFIED** (no live linter score this run). Discovery surfaces green except `/tinity` markdown.

## Repo

Checkout: `prod-r2` @ `7e1fb5e`. `pnpm ls` skipped (no `node_modules`).

| File | LOC | Note |
|---|---:|---|
| `src/tinity/components/canvasui/ForceField.tsx` | 1337 | Tinity experiment; out of home DoD |
| `DecryptReveal.tsx` | 1163 | same |
| `Glitch.tsx` / `Stage.tsx` | 541 / 511 | Tinity |
| **`src/components/ContactModal.tsx`** | **467** | **FAIL** >300 (pre-existing; U14 out of scope) |
| `src/lib/agent/legalCopy.ts` | 421 | **FAIL** >300 |
| `src/components/hero/HeroMusic.tsx` | 300 | at cap, PASS ≤300 |
| `src/components/GlassSurface.tsx` | 244 | **PASS** (prod-r1 497) |
| `src/components/Hero.tsx` | 82 | **PASS** (prod-r1 794); split under `src/components/hero/` |
| `src/lib/glass/pump.ts` | 150 | `GLASS_MS = 1000 / ASCII_FPS` single owner |

`aria-modal`: `ContactModal.tsx` + `domSignals.ts` (`ARIA_MODAL_ATTR`). `Open Tinity` lives in `HeroHire` / `HeroSocials` composition, present in live HTML.

`prerender = false` on `/`, `/about`, `/contact`, `/404`, legal, `/tinity`, APIs.

## DoD verdict (goal §7 / design.md §10)

| Requirement | Verdict | Evidence |
|---|---|---|
| Gates tsc/vitest/astro check/biome/build/e2e on **main** | **UNVERIFIED** this label (not re-run here; U14 worker claimed pass on `7e1fb5e`) | n/a |
| POST `/api/contact` invalid → JSON 4xx | **PASS** | `agentic/contact-post.body` |
| Real email send | **UNVERIFIED** | needs user |
| `security.txt` 200 | **PASS** | `agentic/security-well-known.body` |
| `Accept: text/markdown` all pages incl. legal | **FAIL** | `/tinity` HTML; others PASS |
| Is Agentic 100 | **UNVERIFIED** | |
| Mobile P ≥99 | **FAIL** | median 98 (run 2 = 99) |
| A11y/BP/SEO 100 | **PASS** home; 404 BP96/SEO92 | |
| TBT ≤100 ms | **FAIL** | 154.5 ms |
| LCP ≤1.5 s | **PASS** | 1.04 s |
| CLS 0 | **PASS** | 0 mobile; desktop 0.00013 |
| JS ≤150 KB br | **FAIL** | 270 KB |
| Transfer ≤350 KB | **FAIL** | 555 KB |
| No videobg full-res | **PASS** | `repo/repo.txt` |
| No dead lucide/analytics | **PASS** | `package.json` |
| Product files ≤300 LOC | **FAIL** | ContactModal 467, legalCopy 421; Hero/Glass now under |
| Capacities centralized / no leaked singletons | **UNVERIFIED** this run | pump extracted in U14 |
| No substring tests on dead code | **UNVERIFIED** | |
| Screenshot matrix no clips | **FAIL** | 360 marquee clip; landscape HUD compression |
| Tap ≥44 px | **PASS** | taps/summary.json; Tinity ≥44 |
| Modal focus trap | **UNVERIFIED** | not exercised |
| Reduced-motion fallback visible | **PASS** | `home-390x844-reduced-motion.png` |
| Nav to about/contact | **PASS** | shots + HTML |
| Contrast ≥4.5:1 over glyphs | **UNVERIFIED** (no contrast meter) | |
| Identity Vesper/ASCII/glass | **PASS** | shots |
| Six GlassSurface (5 hero + 1 modal) | **PARTIAL** | 6 live presets desktop (5 HUD + Tinity); modal closed. Design invariant still says 5+1 |
| Liquid glass Chromium desktop fine-pointer only | **PASS** | 0 `data-glass-preset` coarse; 6 desktop |
| ASCII on mobile | **PASS** | coarse asciiPaint=1 |
| No colour stills | **PASS** | no-webgl + reduced-motion shots |
| Loader only home | **PASS** | secondary LH JS 0; no boot-loader in /about HTML |
| prerender=false home/about/contact/404 | **PASS** | repo `src/pages`; legal markdown live |
| video preload=none | **PASS** | no HTML preload link; `VIDEO_PRELOAD` in repo |
| PostHog setTimeout 6000 | **PASS** | live HTML `setTimeout(arm,6000)` |
| design.md exists + reviewer confirms | **PARTIAL** | file present |
| No filter-repo | **PASS** | not done |
| Tinity homepage CTA | **PASS** | aria-label + screenshots |
| U07 Motion out of critical island | **PASS** | Hero 36 kB / 13 kB br; unused = three + proxy, not Hero |
| U14 Hero split | **PASS** live + checkout | Hero 82 LOC, Glass 244, pump extracted |

## Regressions vs baseline / vs prod-r1

vs B (`8f9a743`): P 97 → **98** (near-hold); TBT 209 → **155 ms** (better, still over 100); LCP 0.93 → 1.04 s (under 1.5); JS 258 → 270 KB; transfer still video-dominated.

vs prod-r1 (`824588c`):

- Performance 90 → **98**
- TBT 390 → **154.5 ms**
- LCP 1.13 → **1.04 s**
- SI 2.4 → **1.9 s**
- JS 267 → **270 KB** (U07 did not shrink the LH script window: `proxy` 41 KB still downloads; `three` 133 KB remains)
- Transfer 613 → **555 KB**
- Tinity CTA **restored**
- Hero unused-JS **gone**; Motion sits in lazy `proxy.Bp6IqlKE.js`
- `/tinity` markdown still HTML (unchanged FAIL)
- Contact JSON 400 still good; HTML doctype still good
- Secondary pages still 100/100/100/100 ~59–61 KB

## Recommendations

1. **U11 (now ungated):** mobile TBT median still **154.5 ms > 100 ms**. Longest remaining waste is `three.module` (52.5 KB unused of 133 KB) plus unattributable 200–300 ms tasks around ASCII mount. Conditional sampler / do not download Three when the TBT budget is already blown. Do not start that work from this measurement agent.
2. **Tinity markdown:** map `pageFromPath("/tinity")` so `Accept: text/markdown` is honest. CTA restore is done.
3. **`proxy.Bp6IqlKE.js`:** lazy Motion still enters the LH window (41 KB, 57% unused). After U11, decide whether first-load should skip hydrating Motion until hover/idle beyond LH. Not a new unit until TBT is Three-bound.
4. **ContactModal.tsx 467** and **legalCopy.ts 421** still over 300 LOC.
5. Landscape 844×390 / 360 marquee clip: U20 still holds as a HUD defect; Tinity CTA did not make it worse.
6. Hire `label-content-name-mismatch` is the same experimental a11y ding as r1; category 100. Optional copy/aria alignment, not a P-score lever.
7. Do not merge `swarm/integration` again. Re-measure as **prod-r3** after U11 (or tinity-md) lands on production.
