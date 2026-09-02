# Wave 3 — production r5 (`b9e209a` / #59 shrunk ASCII sampler)

- **TARGET:** `https://www.jseramn.tech`
- **LABEL:** `prod-r5`
- **Expected SHA:** `b9e209a00716c2548bedfa747bfd4c14c3adfcee` — `perf(hero): shrink ASCII sampler under the 350KB transfer budget (#59)`
- **SHA served:** GitHub Production **`b9e209a`** (id `6229777748`), environment **Production**, status **success** created 2026-09-02 **19:04:37Z**, status “Deployment has completed” **19:04:38Z**. Combined commit status **success** (`Vercel`). Preview origin `https://portfolio-e17f59xkt-jseramntech.vercel.app` (not LH’d; SSO 302). Live `videobg-480.webm` `Last-Modified: 2026-09-02 19:05:02 GMT`, `content-length: 131446`, `x-vercel-cache: HIT`.
- **Checkout (repo checks):** `/home/jseramn/portfolio-worktrees/swarm/prod-r5` **`b9e209a00716c2548bedfa747bfd4c14c3adfcee`**. No `pnpm install`. No product edits.
- **When:** 2026-09-02 deploy 19:04:37Z; gate 19:06:13Z; LH 19:09:40Z–19:11:31Z; shots+taps 19:11:46Z–19:13:02Z (America/Bogota 14:04–14:13).
- **Hard gate:** **PASS.** Live `curl -sSI` `videobg-480.webm` **content-length 131446** (NOT 1669565). `videobg-480.mp4` **137141**. GitHub Production **success** for `b9e209a` (id `6229777748` re-checked). Live first-load island still `Hero.BLeSawti.js` (expected: #59 video binaries only; ESM tree from #57). Suite ran. Did **not** measure the old 20s / 1.67MB sampler.
- **In this SHA / live:** #53 frost/boot, #54 loc-split, #55 biome tinity exclude, #56 marquee/HUD, #57 dotted `.ts` ESM loader, **#59 5s 426×240 12fps sampler ~131 KB webm**.
- **Compiler:** measurement agent, artifacts in `/tmp/swarm/measure/prod-r5/{lh,shots,taps,agentic,repo,html}`
- **Baseline (B-report, pre-swarm `8f9a743`):** mobile median P97, TBT 209 ms, FCP=LCP 0.93 s, SI 2.0 s, JS 258 KiB, total 506–624 KB
- **prod-r4b (`90f76f3` / #57):** P100, TBT **31 ms**, LCP 1.12 s, JS **137944 B**, transfer **517931 B FAIL** (videobg Range 158–319 KB of the 1.67MB file)

## Scores

Lighthouse 13.4.1, Chromium Playwright 1234, `flock /tmp/swarm/build.lock`. Mobile simulate. `AGENT_BASE_URL=http://127.0.0.1:1`. `env -u VERCEL_TOKEN`. Never treated `mount.*.js` in homepage HTML as a gate (dynamic import). Video `src` was **not** delayed: LH network shows `videobg-480.webm` status **206**, `resourceSize` **131446**, `transferSize` **~131.7 KB** on every home run.

| run | P | A | BP | SEO | FCP | LCP | TBT | CLS | SI | JS B | total B |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| home-mobile-1 | 100 | 100 | 100 | 100 | 1.05 s | 1.05 s | 18 ms | 0 | 1.8 s | 138022 | 333923 |
| home-mobile-2 | 100 | 100 | 100 | 100 | 1.06 s | 1.06 s | 24.5 ms | 0 | 1.8 s | 137889 | 333744 |
| home-mobile-3 | 100 | 100 | 100 | 100 | 1.02 s | 1.02 s | 18.5 ms | 0 | 1.7 s | 138089 | 333957 |
| **home mobile median** | **100** | **100** | **100** | **100** | **1.05 s** | **1.05 s** | **18.5 ms** | **0** | **1.8 s** | **138022** | **333923** |
| home-desktop-1 | 100 | 100 | 100 | 100 | 0.28 s | 0.28 s | 0 | 0.00013 | 0.7 s | 171567 | 367424 |
| home-desktop-2 | 100 | 100 | 100 | 100 | 0.27 s | 0.27 s | 0 | 0.00013 | 1.1 s | 171597 | 367488 |
| about-mobile-1 | 100 | 100 | 100 | 100 | 0.81 s | 0.93 s | 0 | 0 | 1.1 s | 0 | 59546 |
| contact-mobile-1 | 100 | 100 | 100 | 100 | 0.80 s | 0.93 s | 0 | 0 | 1.0 s | 0 | 59569 |
| policy-mobile-1 | 100 | 100 | 100 | 100 | 0.80 s | 0.93 s | 0 | 0 | 1.0 s | 0 | 60906 |
| 404-mobile-1 | 100 | 100 | 96 | 92 | 0.81 s | 1.09 s | 0 | 0 | 1.1 s | 0 | 58787 |

Pipeline median (`lh/median.json`): P100 A100 BP100 SEO100 LCP 1046.8 ms TBT 18.5 ms CLS 0 JS 138022 B total **333923 B** video **131731 B**. TTI mobile 1902 / 1896 / 1878 ms (median **1896**).

### Budget vs median (home mobile)

| Gate | Budget | Median | Verdict |
|---|---|---|---|
| Performance | ≥99 (goal 100) | 100 | **PASS** |
| A11y / BP / SEO | 100 | 100 / 100 / 100 | **PASS** |
| LCP | ≤1.5 s | 1.05 s | **PASS** (r4b 1.12 s) |
| TBT | ≤100 ms | 18.5 ms | **PASS** (r4b 31 ms) |
| CLS | 0 | 0 | **PASS** (desktop 0.00013, same family as r4b) |
| JS first load | ≤150 KB | 138022 B (~135 KB) | **PASS** (r4b 137944 B; flat) |
| Transfer | ≤350 KB | **333923 B (~326 KiB / 334 KB)** | **PASS** (r4b 517931 B FAIL; Δ −184008 B) |

**Transfer ≤350 KB: PASS.** All three mobile runs 333744–333957 B. Each includes a near-complete Range of the shrunk webm (206, resourceSize 131446, transfer 131716–131743). Page remainder ~202 KB. Do **not** start Three or Motion: TBT **18.5 ms** and JS **~138 KB**.

### Hero island vs unused JS / long tasks / Three

Live first-load island is still the **#57 split re-export** (video-only #59 did not retag JS):

- HTML module: `/_astro/Hero.BLeSawti.js` **156 B** (re-export `Hero.B6j7gg0v.js`)
- Inner: `/_astro/Hero.B6j7gg0v.js` **35877 B** raw; LH transfer ~13.5–14.0 KB
- Dynamic `import()` from inner island: `HeroAsciiBackground.Yhz_AvP1.js` → `mount.Bva2fqmr.js` (**16384 B** raw / **~6.6 KB** transfer). **`mount.*.js` is absent from homepage HTML** (expected).
- Checkout `src/components/Hero.tsx` **82 LOC**

Unused JS (all home runs): **only** `proxy.Bp6IqlKE.js` ~41.1 KB, wasted 23.3–24.0 KB (57–59%). **`three.module` is absent** from unused-javascript and from network-requests. GET `/_astro/three.module.BZDFAEuz.js` → **404**.

Scripts in the LH window (home-mobile-1): `client.Dc9Vh3na.js` 60 KB, `proxy.Bp6IqlKE.js`, `Hero.B6j7gg0v.js` 14 KB, `mount.Bva2fqmr.js` 6.7 KB, remainder islands.

Video (every home LH run): `https://www.jseramn.tech/videobg-480.webm` protocol h2, status **206**, mime `video/webm`, resourceType Media.

Long tasks (home-mobile-1): unattributable **86 ms** plus document **62 ms**. Bootup still spends on `proxy.*` and `mount.Bva2fqmr.js` but TBT stays ≤24.5 ms. FCP=LCP on home (text/tagline, not canvas).

A11y audit `label-content-name-mismatch` still fires on hire (`aria-label="Hire / Contact"` vs visible role text); category remains 100.

404 BP96 = `errors-in-console`; SEO92 = Lighthouse `http-status-code` on a real 404 (expected).

## UI matrix

Shots in `/tmp/swarm/measure/prod-r5/shots/` (40 PNG). Playwright: `domcontentloaded` + `#boot-loader` hidden; never `networkidle`. Unique debug port **4468**. ASCII `data-ascii-paint="1"` on default/coarse/desktop/landscape home. Reduced-motion / no-WebGL: `[data-hero-boot-fallback]` + `img.hero-ascii-display[src=/ascii-fallback.svg]`. `colourStill` empty on every home probe. 0 shot errors.

| Shot | Verdict | Notes |
|---|---|---|
| home-360x800 | **PASS** | Marquee `marquee-edge-fade` in HTML. Right-edge luminance on text row y=72: x288–296 **0.645** → x320–328 **0.357** → x328–336 **0.106** → x352–360 **0.019** (fade, not a hard mid-word chop). ASCII bust + Tinity |
| home-390x844 | **PASS** | Live ASCII visor bust recognizable (center mean lum 0.054, max 0.89, mean chroma 0.0007 — not black void / colour still). Chrome + Tinity + hire readable |
| home-430x932 | OK | Same family as 390; paint=1 |
| home-768x1024 | OK | Portrait HUD; ASCII on; Tinity |
| home-1024x768 | OK | paint=1, Tinity, no colour still |
| home-1366x768 | OK | same |
| home-1920x1080 | OK | Wordmark + marquee + stats; socials top-left; music; hire + **tinity** + tagline; ASCII portrait |
| home-844x390 (landscape) | **PASS** | Short HUD: **social icon dock visible** (GitHub/X/LinkedIn/Instagram/mail + `about · contact`) with music + hire + tinity + tagline. `crop-dock-844.png` |
| home-1280x600 | OK | Short-ish desktop; social dock in-flow; Tinity |
| home-390x844-reduced-motion | **PASS** | Monochrome SVG fallback (`/ascii-fallback.svg`); **not** a colour still. Glyph portrait still a bust (mean lum 0.119, chroma 0.0007). Hire + tinity + tagline readable |
| home-390x844-pointer-coarse | **PASS** | ASCII painted (`data-ascii-paint=1`); **0 live glass hosts**; frost fallback (2 card + 4 button) |
| home-390x844-no-webgl | **PASS** | Monochrome `/ascii-fallback.svg` glyph portrait, not `portrait.jpg` (mean lum 0.153, chroma 0.0007) |
| about-* (7 vp) | OK | Secondary layout; cyan on black; hashed globals CSS |
| contact-* (7 vp) | OK | |
| policy-* (7 vp) | OK | Last updated visible |
| 404-* (7 vp) | OK | Back + `jseramn`; recovery `/` `/llms.txt` `/sitemap-index.xml` `/about` `/contact` `/policy`; footer About/Contact/Policy/Terms/Data deletion |

No colourful stills. Loader only on home. Identity (white glyphs on black, glass/frost HUD, frozen hire type) intact. Tinity CTA visible at every home viewport including 360 and landscape. Shrunk 5s sampler still paints a **recognizable** bust at 390×844 after boot.

## Targets and landmarks

`/tmp/swarm/measure/prod-r5/taps/summary.json`

| Check | Coarse 390×844 | Desktop 1920 | Verdict |
|---|---|---|---|
| boxes < 44×44 | 0 | 0 | **PASS** |
| hire box | 258×44 | 306×44 | **PASS** |
| hire inner label scrollW vs clientW | 50=50 | 50=50 | **PASS** (no glass clip of hire) |
| Tinity box | 57×44 | 71×44 | **PASS** |
| chrome overlaps | none (5 `data-hud-region`) | none | **PASS** |
| `main` landmark | true | true | **PASS** |
| skip link + Tab | Skip to content `#main` | same | **PASS** |
| Tinity control | **true** | **true** | **PASS** |
| live glass hosts (`data-glass-preset`) | **0** presets; frostCard=2 frostButton=4 | 6 presets (bar, pill, dock, button, button, card) | **PASS** (coarse off + frost; desktop on; 6 hero + modal closed) |
| extra canvases (fallback refraction, not ASCII) | 0 | 6 | desktop live glass; modal closed |
| ASCII paint | `"1"` | `"1"` | **PASS** |

## Agentic

`/tmp/swarm/measure/prod-r5/agentic/summary.json` — script **46 PASS, 0 FAIL**. Hero re-export hop followed: `Hero.BLeSawti.js` → `Hero.B6j7gg0v.js` → `HeroAsciiBackground.Yhz_AvP1.js` → `mount.Bva2fqmr.js`, no `three.module`.

| Check | Result | Verdict |
|---|---|---|
| POST `/api/contact` `{}` | 400 `application/json` `request_rejected` | **PASS** |
| GET `/api/contact` | 405 JSON `method_not_allowed` | **PASS** |
| Real contact send | not attempted | **UNVERIFIED** (user-owned; JSON 400 is not a send) |
| `/.well-known/security.txt` | 200; Contact/Expires/Canonical/Policy/Preferred-Languages; ACAO `*` | **PASS** |
| `/security.txt` | 308 → `/.well-known/security.txt` | **PASS** |
| Apex no-follow | 308 → `https://www.jseramn.tech/` | **PASS** |
| markdown `/` `/about` `/contact` `/policy` `/terms` `/data-deletion` `/tinity` | 200 `text/markdown; charset=utf-8` | **PASS** |
| markdown 404 | 404 `text/markdown` | **PASS** |
| `Accept: image/png` `/` | 406 `text/plain` | **PASS** |
| `Accept: application/json` `/` | 406 `text/plain` | **PASS** |
| `Accept: application/ld+json` `/` | 200 graph Person, Organization, WebSite, ProfilePage | **PASS** |
| default HTML `/` | 200 `text/html` 55979 B doctype; Vary `Accept, Accept-Encoding`; `Hero.BLeSawti.js`; `aria-label="Open Tinity"`; `marquee-edge-fade`; no `mount.*` in HTML; no `three.module`; **left** `Hero.BTd8UTMb.js` | **PASS** |
| GET old `three.module.BZDFAEuz.js` | 404 | **PASS** |
| HeroAsciiBackground → `mount.Bva2fqmr.js` | 200 JS via inner Hero; dynamic import present; no `three.module` | **PASS** |
| `/llms.txt` | 200; 13 `- [`; ACAO `*` | **PASS** |
| `/llms-full.txt` | 200 11265 B | **PASS** |
| robots / sitemap | 200 | **PASS** |
| oEmbed | 200 `type=photo` | **PASS** |
| `/_astro` JS (`Hero.BLeSawti.js`) | `max-age=31536000, immutable`; no Vary | **PASS** |
| hashed globals CSS | same immutable (`/about` → `globals.j9XptzCu.css`) | **PASS** |
| `Link: </llms.txt>; rel="describedby"` | present (header + 1 html) | **PASS** |
| speculation rules | home only | **PASS** |
| home CSS | inline styles, no `/_astro/globals` link (U10) | **PASS** |
| about CSS | `/_astro/globals.j9XptzCu.css` | **PASS** |
| home Tinity href / aria | true | **PASS** |
| videobg HEAD | only `videobg-480.{mp4,webm}`; live 131446 / 137141 | **PASS** |
| no `<link rel=preload as=video>` | true | **PASS** |
| PostHog `setTimeout(arm,6000)` | present in live HTML | **PASS** |
| `VIDEO_PRELOAD = "none"` | repo `heroAsciiBudget.ts` | **PASS** |
| Is Agentic GET `https://is-agentic.com/api/v1/report?url=jseramn.tech` | **score 100**; essential 7/7 (80/80), recommended 9/9 (20/20), bonus 1.9, issues `[]`; `report_url` https://is-agentic.com/scan/jseramn.tech; **`scanned_at` 2026-09-02T00:00:44.247Z** (cached completed report; GET does not rescan) | **PASS** (cached) |

## Repo

Checkout: `prod-r5` @ `b9e209a`. Evidence: `/tmp/swarm/measure/prod-r5/repo/repo.txt`, `product-loc.txt`. `pnpm ls` skipped (no `node_modules`); forbidden deps checked via `package.json`.

Product files `src/**/*.{ts,tsx,astro}` excluding `src/tinity/**` and `*.test.ts`: **none >300 LOC**. Cap file: `HeroMusic.tsx` **300**. Product file count **93**.

| File | LOC | Note |
|---|---:|---|
| `src/tinity/components/canvasui/ForceField.tsx` | 1337 | Tinity experiment; out of home DoD |
| `DecryptReveal.tsx` / `Glitch.tsx` / `Stage.tsx` | 1163 / 541 / 511 | Tinity |
| `src/components/hero/HeroMusic.tsx` | **300** | at cap, **PASS** ≤300 |
| `src/components/ContactModal.tsx` | **260** | **PASS** |
| `src/components/GlassSurface.tsx` | 244 | **PASS** |
| `src/lib/heroAsciiBudget.ts` | 164 | `SAMPLE_MS = 1000 / ASCII_FPS` |
| `src/lib/glass/pump.ts` | 150 | `GLASS_MS = 1000 / ASCII_FPS` |
| `src/lib/agent/legalCopy.ts` | **131** | **PASS** |
| `src/components/Hero.tsx` | 82 | **PASS** |
| `src/lib/hero/ascii/scene.ts` | 195 | no `EXTRUDE` |

- `git ls-files public | grep videobg` → only `videobg-480.{mp4,webm}` **PASS**
- Local bytes match live: webm **131446**, mp4 **137141**
- `package.json`: no `lucide-react`, `react-use-measure`, `@vercel/analytics`, `@vercel/speed-insights`, `three`, `@types/three` **PASS**
- Product `src` has no `from "three"` / `import("three")` except negative assertions in `sitePerformance.test.ts` **PASS**
- `aria-modal`: `ContactModal.tsx` + `domSignals.ts` (`ARIA_MODAL_ATTR`). `1000 / ASCII_FPS` owners: `heroAsciiBudget.ts` `SAMPLE_MS`, `glass/pump.ts` `GLASS_MS`
- `prerender = false` on `/`, `/about`, `/contact`, `/404`, legal, `/tinity`, APIs
- `VIDEO_PRELOAD = "none"` in `heroAsciiBudget.ts`; PostHog `setTimeout(arm,6000)` in `src/components/posthog.astro`
- `biome.json` `files.includes` contains `"!**/src/tinity"` (#55)
- Tinity CTA: `aria-label="Open Tinity"` live HTML

## DoD verdict (goal §7 / design.md §10)

| Requirement | Verdict | Evidence |
|---|---|---|
| Production is `b9e209a` (#59 tree) | **PASS** | GH Production `6229777748` success; live webm 131446 / mp4 137141; last-modified 19:05:02Z |
| Gates tsc/vitest/astro check/biome/build/e2e on **main** | **UNVERIFIED** this label | not re-run; Vercel Production Ready implies `pnpm run build` passed on Node 24 |
| POST `/api/contact` invalid → JSON 4xx | **PASS** | `agentic/contact-post.body` `{"error":"request_rejected"}` |
| Real email send | **UNVERIFIED** | needs user |
| `security.txt` 200 | **PASS** | `agentic/security-well-known.body` |
| `Accept: text/markdown` all pages incl. `/tinity` | **PASS** | `agentic/md-*.body` |
| Is Agentic 100 | **PASS** (cached GET) | score **100**, `scanned_at` **2026-09-02T00:00:44.247Z**; GET does not rescan |
| Mobile P ≥99 | **PASS** | median 100 |
| A11y/BP/SEO 100 | **PASS** home; 404 BP96/SEO92 | |
| TBT ≤100 ms | **PASS** | 18.5 ms |
| LCP ≤1.5 s | **PASS** | 1.05 s |
| CLS 0 | **PASS** | 0 mobile; desktop 0.00013 |
| JS ≤150 KB br | **PASS** | 138022 B |
| Transfer ≤350 KB | **PASS** | **333923 B** (all 3 runs ≤333957) |
| `three.module` gone from unused-JS + HTML + network | **PASS** | extract + 404 |
| ASCII paints (`data-ascii-paint`) | **PASS** | taps + shot probes; 390 bust recognizable |
| RM / no-WebGL monochrome SVG, never colour still | **PASS** | `home-390x844-reduced-motion.png`, `home-390x844-no-webgl.png` |
| No videobg full-res | **PASS** | `repo/repo.txt`; live 131446 not 1669565 |
| No dead lucide/analytics/three | **PASS** | `package.json` |
| Product files ≤300 LOC (excl. tinity + tests) | **PASS** | none >300; HeroMusic 300; ContactModal 260; legalCopy 131 |
| Screenshot matrix: 360 fade, not mid-word hard chop | **PASS** | `home-360x800.png` + row-72 luminance fade + `marquee-edge-fade` in HTML |
| 844×390 social dock visible | **PASS** | `home-844x390.png` / `crop-dock-844.png` |
| Coarse 390: 0 live glass, frost, ASCII on | **PASS** | taps coarse: 0 presets, frost 2+4, asciiPaint=`1` |
| Tap ≥44 px | **PASS** | taps/summary.json |
| Modal focus trap | **UNVERIFIED** | not exercised |
| Reduced-motion fallback visible | **PASS** | `home-390x844-reduced-motion.png` |
| Nav to about/contact | **PASS** | shots + HTML |
| Contrast ≥4.5:1 | **PASS** (computed) legal last-updated **7.25:1** (`text-vesper-accent/70` = `rgba(0,240,255,0.7)` on `#000`). Hire/tagline bone vs `#000` **16.5:1**. Over raw white glyphs still ~1.27:1 without frost. Not a canvas pixel meter on the bust |
| Identity Vesper/ASCII/glass | **PASS** | shots |
| Six GlassSurface (6 hero + 1 modal) | **PASS** (modal closed) | 6 live presets desktop; modal not opened |
| Liquid glass Chromium desktop fine-pointer only | **PASS** | 0 `data-glass-preset` coarse; 6 desktop |
| ASCII on mobile | **PASS** | coarse asciiPaint=1; 390 bust |
| No colour stills | **PASS** | no-webgl + reduced-motion shots |
| Loader only home | **PASS** | secondary LH JS 0; no boot-loader in /about HTML |
| prerender=false home/about/contact/404 | **PASS** | repo `src/pages`; legal + tinity markdown live |
| video preload=none | **PASS** | no HTML preload link; `VIDEO_PRELOAD` in repo; LH still transferred the webm honestly |
| PostHog setTimeout 6000 | **PASS** | live HTML `setTimeout(arm,6000)` |
| design.md exists + reviewer confirms | **UNVERIFIED** (file present; no reviewer this label) | worktree root `design.md` |
| No filter-repo | **PASS** | not done |
| Tinity homepage CTA | **PASS** | aria-label + screenshots |
| `/tinity` markdown | **PASS** | |
| U07 Motion out of critical island | **PASS** | unused = `proxy.*` only, not Hero |
| U14 Hero split | **PASS** | Hero 82 LOC |
| U11 WebGL2 live | **PASS** | mount.Bva2fqmr.js in LH network; three 404 |
| #53 frost/boot live | **PASS** | coarse frost hosts; boot overlay home-only |
| #54 loc-split live | **PASS** | ContactModal 260 / legalCopy 131 on disk |
| #55 biome exclude | **PASS** checkout | `!**/src/tinity` |
| #56 marquee fade + short socials live | **PASS** | 360 + 844 shots |
| #57 ESM loader live | **PASS** | `Hero.BLeSawti.js` tree |
| #59 shrunk sampler live | **PASS** | webm 131446; transfer median 334 KB |

## Regressions vs baseline / vs prod-r4b

vs B (`8f9a743`): P 97 → **100**; TBT 209 → **18.5 ms**; LCP 0.93 → 1.05 s (hold under 1.5); JS 258 → **138 KB**; transfer 506–624 KB → **334 KB PASS**.

vs prod-r4b (`90f76f3` / `Hero.BLeSawti.js` same island, old 1.67MB sampler):

- Performance 100 → **100**
- TBT 31 → **18.5 ms** (still **PASS**; not a Three/Motion trigger)
- LCP 1.12 → **1.05 s** (still **PASS**)
- SI 1.7 → **1.8 s**
- JS 137944 → **138022 B** (flat)
- Transfer **517931 → 333923 B (−184 KB)** — **FAIL → PASS**. Swing was videobg: r4b Range 158–319 KB of 1.67MB file; r5 Range **~132 KB of 131446 B** file (206, full resourceSize)
- unused-JS: Motion `proxy.Bp6IqlKE.js` **unchanged**
- 360 marquee fade, 844 social dock, coarse frost, RM SVG: **hold PASS**
- Contact JSON 400, `/tinity` markdown, Is Agentic 100: **hold**
- ASCII bust still recognizable after the 5s/240p re-encode (not black void)

No TBT/JS budget regression. `proxy.*` remains in the LH window; TBT is already under budget.

## Recommendations

1. **Transfer DoD is closed.** Home mobile median **333923 B ≤ 350 KB**. Owner: do not start another sampler unit; do not hide video `src` from Lighthouse.
2. **Do not start a Three or Motion unit.** TBT median **18.5 ms** and JS **~138 KB**. Motion `proxy.Bp6IqlKE.js` is still ~41 KB unused ~23 KB; leftover, not a gate.
3. **HeroMusic.tsx 300** is at the product LOC cap. Next edit there needs a split or an exception.
4. Hire `label-content-name-mismatch` is the same experimental a11y ding; category 100.
5. Is Agentic **100** is a **cached** GET (`scanned_at` 2026-09-02T00:00:44.247Z, before #59). Score still 100; a forced rescan is owner-optional, not required to close this label.
6. Real contact send stays user-owned. Desktop transfer ~367 KB is above the **mobile** budget; budget line is home mobile only.
7. **Do not promote anything**; www already serves `b9e209a`.

Wait result: `/tmp/swarm/measure/prod-r5/wait-result.txt` = PASS. Worktree copy: `docs/swarm/measure/prod-r5-report.md` (uncommitted).
