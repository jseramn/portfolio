# Wave 3 — production r4b (`90f76f3` / #57 Node ESM)

- **TARGET:** `https://www.jseramn.tech`
- **LABEL:** `prod-r4b`
- **Expected SHA:** `90f76f3e01e827b486b8fdfdb8670edda1eeee06` — `fix(build): resolve dotted TypeScript specifiers for Node ESM (#57)` (contains #53 frost/boot, #54 loc-split, #55 biome exclude, #56 marquee/HUD, plus the Node ESM loader fix)
- **SHA served:** GitHub Production **`90f76f3`** (id `6228987469`), environment **Production**, status **success** 2026-09-02 **18:20:19Z**. Vercel Production Ready `dpl_2AE8bjoUiCDAxryvMRiADnjRZKgE` (`https://portfolio-4sdxrgx9b-jseramntech.vercel.app`) aliased to `https://www.jseramn.tech` / apex / `portfolio-jseramntech.vercel.app` / `portfolio-git-main-jseramntech.vercel.app`. Combined commit status **success** (`Vercel` / “Deployment has completed”).
- **Checkout (repo checks):** `/home/jseramn/portfolio-worktrees/swarm/prod-r4b` **`90f76f3e01e827b486b8fdfdb8670edda1eeee06`**. No `pnpm install`. No CodeGraph. No product edits.
- **When:** 2026-09-02 18:20:19Z deploy; measure 18:23:14Z–18:26:27Z (America/Bogota 13:20–13:26). LH fetchTimes 18:23:17Z–18:24:57Z; `LH ALL DONE` 18:25:06Z; shots+taps 18:26:27Z.
- **Hard gate:** **PASS.** Live first-load `/_astro/Hero.BLeSawti.js` (156 B re-export of `Hero.B6j7gg0v.js`). **Left** `Hero.BTd8UTMb.js` (#53). Local tree hash `Hero.d3ydGfVR.js` differs (expected on Vercel Node). GitHub Production **success** for `90f76f3`. Suite ran. Did **not** measure `495fbe2`.
- **In this SHA / live:** #53 frost/boot, #54 loc-split, #55 biome tinity exclude, #56 marquee edge-fade + short HUD socials, #57 dotted `.ts` ESM loader.
- **Compiler:** measurement agent, artifacts in `/tmp/swarm/measure/prod-r4b/{lh,shots,taps,agentic,repo,html}`
- **Baseline (B-report, pre-swarm `8f9a743`):** mobile median P97, TBT 209 ms, FCP=LCP 0.93 s, SI 2.0 s, JS 258 KiB, total 506–624 KB
- **prod-r3 (`c295535` tree / Production `30d4040`):** P100, TBT **18.5 ms**, LCP 0.98 s, JS **137957 B**, transfer **~390 KB FAIL**, unused JS `proxy.Bp6IqlKE.js` only
- **prod-r4 (expected `90d306b`):** **BLOCKED** — Production Error (`legalCopy.dataDeletion` ESM miss); live stayed `495fbe2` / `Hero.BTd8UTMb.js`; no LH

## Scores

Lighthouse 13.4.1, Chromium Playwright 1234, `flock /tmp/swarm/build.lock`. Mobile simulate. `AGENT_BASE_URL=http://127.0.0.1:1`. Never treated `mount.*.js` in homepage HTML as a gate (dynamic import).

| run | P | A | BP | SEO | FCP | LCP | TBT | CLS | SI | JS B | total B |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| home-mobile-1 | 100 | 100 | 100 | 100 | 1.12 s | 1.12 s | 60 ms | 0 | 2.4 s | 138014 | 517931 |
| home-mobile-2 | 100 | 100 | 100 | 100 | 1.12 s | 1.24 s | 31 ms | 0 | 1.7 s | 137390 | 360449 |
| home-mobile-3 | 100 | 100 | 100 | 100 | 0.98 s | 0.98 s | 25 ms | 0 | 1.7 s | 137944 | 521115 |
| **home mobile median** | **100** | **100** | **100** | **100** | **1.12 s** | **1.12 s** | **31 ms** | **0** | **1.7 s** | **137944** | **517931** |
| home-desktop-1 | 100 | 100 | 100 | 100 | 0.29 s | 0.29 s | 3.5 ms | 0.00013 | 0.7 s | 171572 | 341521 |
| home-desktop-2 | 100 | 100 | 100 | 100 | 0.29 s | 0.29 s | 0 | 0.00013 | 0.7 s | 171548 | 343100 |
| about-mobile-1 | 100 | 100 | 100 | 100 | 0.81 s | 1.09 s | 0 | 0 | 1.1 s | 0 | 59557 |
| contact-mobile-1 | 100 | 100 | 100 | 100 | 0.82 s | 0.94 s | 0 | 0 | 1.0 s | 0 | 59593 |
| policy-mobile-1 | 100 | 100 | 100 | 100 | 0.78 s | 0.90 s | 0 | 0 | 1.0 s | 0 | 60904 |
| 404-mobile-1 | 100 | 100 | 96 | 92 | 0.80 s | 1.08 s | 2 ms | 0 | 1.1 s | 0 | 58782 |

Pipeline median (`lh/median.json`): P100 A100 BP100 SEO100 LCP 1118.4 ms TBT 31 ms CLS 0 JS 137944 B total 517931 B. TTI mobile 2073 / 1887 / 1735 ms (median 1887).

### Budget vs median (home mobile)

| Gate | Budget | Median | Verdict |
|---|---|---|---|
| Performance | ≥99 (goal 100) | 100 | **PASS** |
| A11y / BP / SEO | 100 | 100 / 100 / 100 | **PASS** |
| LCP | ≤1.5 s | 1.12 s | **PASS** (prod-r3 0.98 s; hold) |
| TBT | ≤100 ms | 31 ms | **PASS** (prod-r3 18.5 ms; still under budget) |
| CLS | 0 | 0 | **PASS** (desktop 0.00013, same family as r3) |
| JS first load | ≤150 KB | 137944 B (~138 KB) | **PASS** (prod-r3 137957 B) |
| Transfer | ≤350 KB | ~518 KB | **FAIL** (prod-r3 ~390 KB; video Range swing: 316 / 158 / 319 KB `206` on `videobg-480.webm`) |

Do **not** start Three or Motion from this label: TBT **31 ms** (budget 100) and JS **~138 KB** (budget 150). Transfer FAIL is videobg-480 Range, not a sampler rewrite trigger.

### Hero island vs unused JS / long tasks / Three

Live first-load island is a **small split re-export**, not `#53` `Hero.BTd8UTMb.js`:

- HTML module: `/_astro/Hero.BLeSawti.js` **156 B** (re-export `Hero.B6j7gg0v.js`)
- Inner: `/_astro/Hero.B6j7gg0v.js` **35824 B** raw; LH transfer ~13.5–14.3 KB
- Dynamic `import()` from inner island: `TextLoop`, `InfiniteSlider`, `ContactModal`, `HeroAsciiBackground.Yhz_AvP1.js`, `index.esm.QlPf90vG.js`
- `HeroAsciiBackground.Yhz_AvP1.js` dynamically imports `/_astro/mount.Bva2fqmr.js` (**16384 B** raw / **~6.6 KB** transfer). **`mount.*.js` is absent from homepage HTML** (expected).
- Checkout `src/components/Hero.tsx` **82 LOC**

Unused JS (all three mobile runs): **only** `proxy.Bp6IqlKE.js` ~41.1 KB, wasted 23.3–24.0 KB (57–59%). **`three.module` is absent** from unused-javascript and from network-requests. GET `/_astro/three.module.BZDFAEuz.js` → **404**.

Scripts in the LH window (home-mobile-2): `client.Dc9Vh3na.js` 60 KB, `proxy.Bp6IqlKE.js` 41 KB, `Hero.B6j7gg0v.js` 14 KB, `mount.Bva2fqmr.js` 6.7 KB, remainder islands.

Long tasks (home-mobile-1): unattributable **132 / 57 / 56 ms** plus document **58 ms**. Bootup still spends on `mount.Bva2fqmr.js` (470 / 189 / 188 ms scripting) and `proxy.*` (259 / 198 / 173 ms) but TBT stays ≤60 ms. FCP=LCP on home (text/tagline, not canvas).

A11y audit `label-content-name-mismatch` still fires on hire (`aria-label="Hire / Contact"` vs visible role text); category remains 100.

404 BP96 = `errors-in-console`; SEO92 = Lighthouse `http-status-code` on a real 404 (expected).

## UI matrix

Shots in `/tmp/swarm/measure/prod-r4b/shots/` (40 PNG). Playwright: `domcontentloaded` + `#boot-loader` hidden; never `networkidle`. ASCII `data-ascii-paint="1"` on default/coarse/desktop/landscape home. Reduced-motion / no-WebGL: `[data-hero-boot-fallback]` + `img.hero-ascii-display[src=/ascii-fallback.svg]`. `colourStill` empty on every home probe. 0 shot errors.

| Shot | Verdict | Notes |
|---|---|---|
| home-360x800 | **PASS** | #56 live: top bar `marquee-edge-fade`; right-edge luminance 24–32px 0.086 → outer 8px 0.029 (fade, not a hard mid-word chop). HTML contains `marquee-edge-fade`. Frost HUD + ASCII `paint=1` + Tinity |
| home-390x844 | OK | Same fade family (`Helping pe` visible through mask). Chrome + Tinity + hire readable; glyph bust on |
| home-430x932 | OK | Same family as 390 |
| home-768x1024 | OK | Portrait HUD; ASCII on; Tinity |
| home-1024x768 | OK | probe paint=1, Tinity, no colour still |
| home-1366x768 | OK | same |
| home-1920x1080 | OK | Wordmark + marquee + stats; socials top-left; music; hire + **tinity** + tagline; ASCII portrait |
| home-844x390 (landscape) | **PASS** | Short HUD: **social icon dock visible** (GitHub/X/LinkedIn/Instagram/mail + `about · contact`) with music + hire + tinity + tagline. prod-r3 DEFECT closed |
| home-1280x600 | OK | Short-ish desktop; social dock in-flow; Tinity |
| home-390x844-reduced-motion | PASS | Monochrome SVG fallback (`/ascii-fallback.svg`); **not** a colour still. Hire + tinity + tagline readable |
| home-390x844-pointer-coarse | **PASS** | ASCII painted (`data-ascii-paint=1`); **0 live glass hosts**; frost fallback (2 card + 4 button) |
| home-390x844-no-webgl | PASS | Monochrome ASCII/SVG fallback still a glyph portrait, not `portrait.jpg` |
| about-* (7 vp) | OK | Secondary layout; cyan on black; hashed globals CSS |
| contact-* (7 vp) | OK | |
| policy-* (7 vp) | OK | Last updated visible |
| 404-* (7 vp) | OK | Back + `jseramn`; recovery `/` `/llms.txt` `/sitemap-index.xml` `/about` `/contact` `/policy`; footer About/Contact/Policy/Terms/Data deletion |

No colourful stills. Loader only on home. Identity (white glyphs on black, glass/frost HUD, frozen hire type) intact. Tinity CTA visible at every home viewport including 360 and landscape.

## Targets and landmarks

`/tmp/swarm/measure/prod-r4b/taps/summary.json`

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
| live glass hosts (`data-glass-preset`) | **0** presets; frostCard=2 frostButton=4 | 6 presets (bar, pill, dock, button, button, card) | **PASS** (coarse off + frost; desktop on; +1 Tinity wrap vs design “5 hero”) |
| extra canvases (fallback refraction, not ASCII) | 0 | 6 | desktop live glass; modal closed |
| ASCII paint | `"1"` | `"1"` | **PASS** |

## Agentic

`/tmp/swarm/measure/prod-r4b/agentic/summary.json` — script **39 PASS, 1 FAIL**; FAIL was a re-export hop (`Hero.BLeSawti.js` does not name `HeroAsciiBackground`). Follow-up: inner `Hero.B6j7gg0v.js` → `HeroAsciiBackground.Yhz_AvP1.js` → `mount.Bva2fqmr.js`, no `three.module`. **40/40 after follow-up.**

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
| default HTML `/` | 200 `text/html` 55907 B doctype; Vary `Accept, Accept-Encoding`; `Hero.BLeSawti.js`; `aria-label="Open Tinity"`; `marquee-edge-fade`; no `mount.*` in HTML; no `three.module`; **left** `Hero.BTd8UTMb.js` | **PASS** |
| GET old `three.module.BZDFAEuz.js` | 404 | **PASS** |
| HeroAsciiBackground → `mount.Bva2fqmr.js` | 200 JS via inner Hero; dynamic import present; no `three.module` | **PASS** (follow-up) |
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
| videobg full-res in HEAD | only `videobg-480.{mp4,webm}` | **PASS** |
| lucide / react-use-measure / Vercel Analytics / Speed Insights / `three` | absent from `package.json` (`pnpm ls` skipped; no node_modules) | **PASS** |
| no `<link rel=preload as=video>` | true | **PASS** |
| PostHog `setTimeout(arm,6000)` | present in live HTML | **PASS** |
| `VIDEO_PRELOAD = "none"` | repo `heroAsciiBudget.ts` | **PASS** |

Is Agentic 100: **UNVERIFIED** (no live linter / public checker found in repo or `llms.txt` this run; not invented).

## Repo

Checkout: `prod-r4b` @ `90f76f3`. Evidence: `/tmp/swarm/measure/prod-r4b/repo/repo.txt`, `product-loc.txt`. `pnpm ls` skipped (no `node_modules`).

Product files `src/**/*.{ts,tsx,astro}` excluding `src/tinity/**` and `*.test.ts`: **none >300 LOC**. Cap file: `HeroMusic.tsx` **300**.

| File | LOC | Note |
|---|---:|---|
| `src/tinity/components/canvasui/ForceField.tsx` | 1337 | Tinity experiment; out of home DoD |
| `DecryptReveal.tsx` / `Glitch.tsx` / `Stage.tsx` | 1163 / 541 / 511 | Tinity |
| `src/components/hero/HeroMusic.tsx` | **300** | at cap, **PASS** ≤300 |
| `src/components/ContactModal.tsx` | **260** | **PASS** (#54; was 467 on prod-r3) |
| `src/components/GlassSurface.tsx` | 244 | **PASS** |
| `src/lib/heroAsciiBudget.ts` | 164 | `SAMPLE_MS = 1000 / ASCII_FPS` |
| `src/lib/glass/pump.ts` | 150 | `GLASS_MS = 1000 / ASCII_FPS` |
| `src/lib/agent/legalCopy.ts` | **131** | **PASS** (#54; was 421). Dotted siblings now resolve via #57 loader |
| `src/components/Hero.tsx` | 82 | **PASS** |
| `src/lib/hero/ascii/scene.ts` | 195 | no `EXTRUDE` |

- `git ls-files public | grep videobg` → only `videobg-480.{mp4,webm}` **PASS**
- `package.json`: no `lucide-react`, `react-use-measure`, `@vercel/analytics`, `@vercel/speed-insights`, `three`, `@types/three` **PASS**
- Product `src` has no `from "three"` / `import("three")` except negative assertions in `sitePerformance.test.ts` **PASS**
- `aria-modal`: `ContactModal.tsx` + `domSignals.ts` (`ARIA_MODAL_ATTR`). `1000 / ASCII_FPS` owners: `heroAsciiBudget.ts` `SAMPLE_MS`, `glass/pump.ts` `GLASS_MS`
- `prerender = false` on `/`, `/about`, `/contact`, `/404`, legal, `/tinity`, APIs
- `VIDEO_PRELOAD = "none"` in `heroAsciiBudget.ts`; PostHog `setTimeout(arm,6000)` in `src/components/posthog.astro`
- `biome.json` `files.includes` contains `"!**/src/tinity"` (#55)
- Tinity CTA: `aria-label="Open Tinity"` live HTML
- `#57` `scripts/resolve-ts-specifiers.mjs` appends `.ts` unless the specifier already ends in a real module extension (so `./legalCopy.dataDeletion` maps to `.ts`)

## DoD verdict (goal §7 / design.md §10)

| Requirement | Verdict | Evidence |
|---|---|---|
| Production is `90f76f3` (#57 tree, includes #53–#56) | **PASS** | GH Production `6228987469` success; Vercel `4sdxrgx9b` Ready aliased to www; live `Hero.BLeSawti.js` not `Hero.BTd8UTMb.js` |
| Gates tsc/vitest/astro check/biome/build/e2e on **main** | **UNVERIFIED** this label | not re-run; Vercel Production Ready implies `pnpm run build` passed on Node 24 |
| POST `/api/contact` invalid → JSON 4xx | **PASS** | `agentic/contact-post.body` |
| Real email send | **UNVERIFIED** | needs user |
| `security.txt` 200 | **PASS** | `agentic/security-well-known.body` |
| `Accept: text/markdown` all pages incl. `/tinity` | **PASS** | `agentic/md-*.body` |
| Is Agentic 100 | **UNVERIFIED** | no public checker executed |
| Mobile P ≥99 | **PASS** | median 100 |
| A11y/BP/SEO 100 | **PASS** home; 404 BP96/SEO92 | |
| TBT ≤100 ms | **PASS** | 31 ms |
| LCP ≤1.5 s | **PASS** | 1.12 s |
| CLS 0 | **PASS** | 0 mobile; desktop 0.00013 |
| JS ≤150 KB br | **PASS** | 137944 B |
| Transfer ≤350 KB | **FAIL** | 518 KB (video Range) |
| `three.module` gone from unused-JS + HTML + network | **PASS** | extract + 404 |
| ASCII paints (`data-ascii-paint`) | **PASS** | taps + shot probes |
| RM / no-WebGL monochrome SVG, never colour still | **PASS** | `home-390x844-reduced-motion.png`, `home-390x844-no-webgl.png` |
| No videobg full-res | **PASS** | `repo/repo.txt` |
| No dead lucide/analytics/three | **PASS** | `package.json` |
| Product files ≤300 LOC (excl. tinity + tests) | **PASS** | none >300; HeroMusic 300; ContactModal 260; legalCopy 131 |
| Screenshot matrix: 360 fade, not mid-word hard chop | **PASS** | `home-360x800.png` + marquee crop + `marquee-edge-fade` in HTML |
| 844×390 social dock visible | **PASS** | `home-844x390.png` / `crop-dock-844.png` |
| Coarse 390: 0 live glass, frost, ASCII on | **PASS** | taps coarse: 0 presets, frost 2+4, asciiPaint=`1` |
| Tap ≥44 px | **PASS** | taps/summary.json |
| Modal focus trap | **UNVERIFIED** | not exercised |
| Reduced-motion fallback visible | **PASS** | `home-390x844-reduced-motion.png` |
| Nav to about/contact | **PASS** | shots + HTML |
| Contrast ≥4.5:1 | **PASS** legal last-updated **7.25:1** (composited `rgba(0,240,255,0.7)` on `#000`; was 3.99:1 at `/50`). Hire/tagline bone vs `#000` **16.5:1**. Over raw white glyphs still ~1.27:1 without frost; frost veil model ~7.27:1. Not a canvas pixel meter on the bust |
| Identity Vesper/ASCII/glass | **PASS** | shots |
| Six GlassSurface (5 hero + 1 modal) | **PARTIAL** | 6 live presets desktop (5 HUD + Tinity); modal closed. Design invariant still says 5+1 |
| Liquid glass Chromium desktop fine-pointer only | **PASS** | 0 `data-glass-preset` coarse; 6 desktop |
| ASCII on mobile | **PASS** | coarse asciiPaint=1 |
| No colour stills | **PASS** | no-webgl + reduced-motion shots |
| Loader only home | **PASS** | secondary LH JS 0; no boot-loader in /about HTML |
| prerender=false home/about/contact/404 | **PASS** | repo `src/pages`; legal + tinity markdown live |
| video preload=none | **PASS** | no HTML preload link; `VIDEO_PRELOAD` in repo |
| PostHog setTimeout 6000 | **PASS** | live HTML `setTimeout(arm,6000)` |
| design.md exists + reviewer confirms | **PARTIAL** | file present at worktree root |
| No filter-repo | **PASS** | not done |
| Tinity homepage CTA | **PASS** | aria-label + screenshots |
| `/tinity` markdown | **PASS** | |
| U07 Motion out of critical island | **PASS** | unused = `proxy.*` only, not Hero |
| U14 Hero split | **PASS** | Hero 82 LOC |
| U11 WebGL2 live | **PASS** | mount.Bva2fqmr.js in LH network; three 404 |
| #53 frost/boot live | **PASS** | coarse frost hosts; boot overlay home-only |
| #54 loc-split live | **PASS** | ContactModal 260 / legalCopy 131 on disk; Production built |
| #55 biome exclude | **PASS** checkout | `!**/src/tinity` |
| #56 marquee fade + short socials live | **PASS** | 360 + 844 shots |
| #57 ESM loader live | **PASS** | Production Ready after #54–#56 Error chain |

## Regressions vs baseline / vs prod-r3 / vs blocked prod-r4

vs B (`8f9a743`): P 97 → **100**; TBT 209 → **31 ms**; LCP 0.93 → 1.12 s (hold under 1.5); JS 258 → **138 KB**; transfer still video-dominated (~518 vs 506–624).

vs prod-r3 (`c295535` / `Hero.CNr93y_i.js`):

- Performance 100 → **100**
- TBT 18.5 → **31 ms** (still **PASS**; not a Three/Motion trigger)
- LCP 0.98 → **1.12 s** (still **PASS**)
- SI 1.8 → **1.7 s**
- JS 137957 → **137944 B** (flat)
- Transfer 390 → **518 KB** (worse Range draw on 2/3 runs: ~316–319 KB vs r3 mix 171/188/311). Still the videobg-480 FAIL, not JS
- unused-JS: Motion `proxy.Bp6IqlKE.js` **unchanged**
- **360 marquee hard clip → fade PASS** (#56)
- **844×390 missing social dock → visible PASS** (#56)
- ContactModal 467→260, legalCopy 421→131 **PASS and now live** (#54; unshipped on blocked r4)
- Contact JSON 400 still good; `/tinity` markdown still good

vs blocked prod-r4 (`90d306b` never Ready; live `#53`):

- Production **Error → success** on successor `90f76f3` (#57)
- Live **left** `Hero.BTd8UTMb.js`
- Full M-measure suite **ran** (r4 did not)

No TBT/JS budget regression that opens a sampler unit. `proxy.*` remains in the LH window; TBT is already under budget.

## Recommendations

1. **Do not start a Three or Motion unit.** TBT median **31 ms** and JS **~138 KB**. Motion `proxy.Bp6IqlKE.js` is still ~41 KB unused ~23 KB; leftover, not a gate.
2. Transfer ≤350 KB still **FAIL** because of `videobg-480.webm` Range (158–319 KB this run). Owner decision remains video preload/range, not a new sampler.
3. **HeroMusic.tsx 300** is at the product LOC cap. Next edit there needs a split or an exception.
4. Design invariant “5 hero + 1 modal” vs 6 desktop presets (Tinity extra wrap) is unchanged from r3.
5. Hire `label-content-name-mismatch` is the same experimental a11y ding; category 100.
6. prod-r4 BLOCKED is closed: **do not promote anything**; www already serves `90f76f3`. Real contact send stays user-owned.

Wait result: `/tmp/swarm/measure/prod-r4b/wait-result.txt` = PASS. Worktree copy: `docs/swarm/measure/prod-r4b-report.md` (uncommitted).
