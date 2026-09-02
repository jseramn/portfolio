# Wave 3 — production r3 (`c295535` tree / GitHub Production `30d4040`, U11 WebGL2)

- **TARGET:** `https://www.jseramn.tech`
- **LABEL:** `prod-r3`
- **SHA served:** GitHub Production deployment **`30d4040`** (id `6222186245`), environment **Production**, status **success** 2026-09-02 **12:20:35Z**. Vercel Production `https://portfolio-bjwlp5qgo-jseramntech.vercel.app` aliased to `https://www.jseramn.tech`. Combined status for `30d4040`: **success** (`Vercel` / “Deployment has completed”).
- **Git tree:** `30d4040^{tree}` = `c295535^{tree}` = `db50d02d20988071a49d06769782dcdde420ce5a`. Squash-merge `c295535` itself never grew a Git webhook Production deploy; orchestrator promoted the Ready U11 preview (PR head `30d4040`) at ~12:20Z. Same bytes.
- **Checkout (repo checks):** `/home/jseramn/portfolio-worktrees/swarm/prod-r3` detached `c295535` (`perf(ascii): sample video with WebGL2 instead of Three (#51)`). No `pnpm install`. No CodeGraph.
- **When:** 2026-09-02 12:23–12:28Z (America/Bogota 07:23–07:28). LH fetchTimes 12:25:28Z–12:25:55Z mobile; pipeline `LH ALL DONE` 12:27:15Z.
- **Hard gate:** live HTML first-loads `/_astro/Hero.CNr93y_i.js` (**156 B** re-export of `Hero.DKyq6HrM.js`). **Not** `Hero.DMT7DWTQ.js`. Suite ran.
- **In this SHA / live:** U07 lazy Motion, U14 Hero split, U11 WebGL2 sampler (no `three`), homepage Tinity CTA, `/tinity` markdown (#50).
- **Compiler:** measurement agent, artifacts in `/tmp/swarm/measure/prod-r3/{lh,shots,taps,agentic,repo,html}`
- **Baseline (B-report, pre-swarm `8f9a743`):** mobile median P97, TBT 209 ms, FCP=LCP 0.93 s, SI 2.0 s, JS 258 KiB, total 506–624 KB
- **prod-r2 (`7e1fb5e`):** P98, TBT **154.5 ms**, LCP 1.04 s, JS **270052 B (~270 KB)**, `three.module.BZDFAEuz.js` **132798 B** transfer / unused 52.5 KB of 133 KB, `proxy.Bp6IqlKE.js` 41 KB unused 23 KB

## Scores

Lighthouse 13.4.1, Chromium Playwright 1234, `flock /tmp/swarm/build.lock`. Mobile simulate. Never treated `mount.*.js` in homepage HTML as a gate (dynamic import).

| run | P | A | BP | SEO | FCP | LCP | TBT | CLS | SI | JS B | total B |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| home-mobile-1 | 100 | 100 | 100 | 100 | 1.02 s | 1.02 s | 19 ms | 0 | 2.3 s | 137984 | 373396 |
| home-mobile-2 | 100 | 100 | 100 | 100 | 0.97 s | 0.97 s | 18.5 ms | 0 | 1.6 s | 137284 | 389874 |
| home-mobile-3 | 100 | 100 | 100 | 100 | 0.98 s | 0.98 s | 17.5 ms | 0 | 1.8 s | 137957 | 512816 |
| **home mobile median** | **100** | **100** | **100** | **100** | **0.98 s** | **0.98 s** | **18.5 ms** | **0** | **1.8 s** | **137957** | **389874** |
| home-desktop-1 | 100 | 100 | 100 | 100 | 0.28 s | 0.28 s | 0 | 0.00013 | 0.7 s | 171455 | 407755 |
| home-desktop-2 | 99 | 100 | 100 | 100 | 0.28 s | 0.28 s | 0 | 0.00040 | 1.3 s | 171528 | 341366 |
| about-mobile-1 | 100 | 100 | 100 | 100 | 0.79 s | 0.92 s | 0 | 0 | 1.0 s | 0 | 59497 |
| contact-mobile-1 | 100 | 100 | 100 | 100 | 0.80 s | 0.93 s | 0 | 0 | 1.0 s | 0 | 59516 |
| policy-mobile-1 | 100 | 100 | 100 | 100 | 0.79 s | 0.93 s | 0 | 0 | 0.9 s | 0 | 60860 |
| 404-mobile-1 | 100 | 100 | 96 | 92 | 0.79 s | 0.93 s | 0 | 0 | 0.9 s | 0 | 58703 |

Pipeline median (`lh/median.json`): P100 A100 BP100 SEO100 LCP 976.7 ms TBT 18.5 ms CLS 0 JS 137957 B total 389874 B. TTI mobile 1837 / 1706 / 1704 ms.

### Budget vs median (home mobile)

| Gate | Budget | Median | Verdict |
|---|---|---|---|
| Performance | ≥99 (goal 100) | 100 | **PASS** (prod-r2 98) |
| A11y / BP / SEO | 100 | 100 / 100 / 100 | **PASS** |
| LCP | ≤1.5 s | 0.98 s | **PASS** (prod-r2 1.04 s) |
| TBT | ≤100 ms | 18.5 ms | **PASS** (prod-r2 154.5 ms) |
| CLS | 0 | 0 | **PASS** |
| JS first load | ≤150 KB | 137957 B (~138 KB) | **PASS** (prod-r2 ~270 KB) |
| Transfer | ≤350 KB | ~390 KB | **FAIL** (prod-r2 ~555 KB — better; video Range still the swing: 171 / 188 / 311 KB `206` on `videobg-480.webm`) |

### U11 success

Success = TBT median ≤100 ms **or** JS drop from ~270 KB by ~133 KB. **Both hit.** Do not start another code unit from this label.

- TBT median **18.5 ms** (budget 100; was 154.5).
- JS **137957 B** vs prod-r2 **270052 B** → **−132095 B (−48.9%)**. prod-r2 `three.module.BZDFAEuz.js` transfer was **132798 B**; the drop is Three, not Motion.

### Hero island vs unused JS / long tasks / Three

Live first-load island is the **U11 small split**, not the fat Hero and not the r2 re-export:

- HTML module: `/_astro/Hero.CNr93y_i.js` **156 B** (re-export)
- Inner: `/_astro/Hero.DKyq6HrM.js` **35888 B** raw / **12751 B** gzip-9 locally; LH transfer ~13.5 KB
- Dynamic `import()` from island: `TextLoop`, `InfiniteSlider`, `ContactModal`, `HeroAsciiBackground.12CTQ4nP.js`, `index.esm.*`
- `HeroAsciiBackground.12CTQ4nP.js` dynamically imports `/_astro/mount.DiPKhRMh.js` (**16417 B** raw / **~6.7 KB** transfer). **`mount.*.js` is absent from homepage HTML** (expected).
- Checkout `src/components/Hero.tsx` **82 LOC**

Unused JS (all three mobile runs): **only** `proxy.Bp6IqlKE.js` ~41.1 KB, wasted 23.3–24.0 KB (57–59%). **`three.module` is absent from unused-javascript** (0 items) and from network-requests (0). GET `/_astro/three.module.BZDFAEuz.js` → **404** `text/html` (old 404 document).

Scripts in the LH window (home-mobile-2, 14 JS, no Three): `client.Dc9Vh3na.js` 60 KB, `proxy.Bp6IqlKE.js` 42 KB, `Hero.DKyq6HrM.js` 14 KB, `mount.DiPKhRMh.js` 6.7 KB, remainder islands.

Long tasks (home-mobile-1): unattributable **88 ms** only (r2 had 332+86+50). Bootup scripting still spends on `mount.*` (562 / 143 / 151 ms across runs) and `proxy.*` (224 / 110 / 114 ms) but those no longer produce a 100 ms+ TBT. `Hero.DKyq6HrM.js` scripting 34–64 ms.

A11y audit `label-content-name-mismatch` still fires on hire (`aria-label="Hire / Contact"` vs visible role text); category remains 100.

404 BP96 = `errors-in-console`; SEO92 = Lighthouse `http-status-code` on a real 404 (expected). Desktop-2 P99 = Speed Index, not TBT.

FCP=LCP on home (text/tagline, not canvas).

## UI matrix

Shots in `/tmp/swarm/measure/prod-r3/shots/` (40 PNG). Playwright: `domcontentloaded` + `#boot-loader` hidden; never `networkidle`. ASCII `data-ascii-paint="1"` on default/coarse/desktop home. Reduced-motion / no-WebGL: `[data-hero-boot-fallback]` + `img.hero-ascii-display[src=/ascii-fallback.svg]`. `colourStill` empty on every home probe.

| Shot | Verdict | Notes |
|---|---|---|
| home-360x800 | DEFECT | Marquee leading clip (`Helping` cut); glass HUD intact; ASCII on (`paint=1`); **Tinity control present** |
| home-390x844 | OK-ish | Marquee overflow (`Helping peo`); chrome + Tinity readable; glyph bust on |
| home-430x932 | OK-ish | Same family as 390; Tinity + hire |
| home-768x1024 | OK-ish | Portrait + HUD; marquee slightly truncated (`technology wh`); Tinity beside hire |
| home-1024x768 | OK | probe paint=1, Tinity, no colour still |
| home-1366x768 | OK | same |
| home-1920x1080 | OK | Wordmark + marquee + stats; socials top-left; music; hire + **tinity** + tagline; ASCII portrait |
| home-844x390 (landscape) | DEFECT risk | Short HUD (U20): hire + tinity + tagline + music + about/contact present; social icon dock not in the visible chrome |
| home-1280x600 | OK-ish | Short-ish desktop; Tinity present; socials collapsed to `about · contact` at bottom |
| home-390x844-reduced-motion | PASS | Monochrome SVG fallback (`/ascii-fallback.svg`); **not** a colour still. Hire + tinity + tagline readable |
| home-390x844-pointer-coarse | PASS | ASCII painted (`data-ascii-paint=1`); live glass off |
| home-390x844-no-webgl | PASS | Monochrome ASCII/SVG fallback still a glyph portrait, not `portrait.jpg` |
| about-* (7 vp) | OK | Secondary layout; cyan on black; globals CSS linked |
| contact-* (7 vp) | OK | |
| policy-* (7 vp) | OK | |
| 404-* (7 vp) | OK | Back + `jseramn`; recovery `/` `/llms.txt` `/sitemap-index.xml` `/about` `/contact` `/policy`; footer About/Contact/Policy/Terms/Data deletion |

No colourful stills. Loader only on home (`#boot-loader` in home HTML, absent on `/about`). Identity (white glyphs on black, glass HUD, frozen hire type) intact. Tinity CTA visible at every home viewport including 360 and landscape.

**Hollow bust / EXTRUDE:** checkout `src/lib/hero/ascii/scene.ts` has **no `EXTRUDE`**. Live desktop/landscape ASCII still reads as a recognizable monochrome glyph bust; density is outline/hollow rather than a filled extruded volume. prod-r2 1920 already looked hollow in the same way — not a new colour regression, not a missing portrait. Face/chest stay glyph-defined, not a photo.

## Targets and landmarks

`/tmp/swarm/measure/prod-r3/taps/summary.json`

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
| live glass hosts (`data-glass-host` / `data-glass-preset`) | 0 presets | 6 presets (bar, pill, dock, button, button, card) | **PASS** (coarse off; desktop on; +1 Tinity wrap vs design “5 hero”) |
| extra canvases (fallback refraction, not ASCII) | 6 | 6 | Tinity extra wrap; modal closed |
| ASCII paint | `"1"` | `"1"` | **PASS** |

## Agentic

`/tmp/swarm/measure/prod-r3/agentic/summary.json` — **39 PASS, 0 FAIL**.

| Check | Result | Verdict |
|---|---|---|
| POST `/api/contact` `{}` | 400 `application/json` `request_rejected` | **PASS** |
| GET `/api/contact` | 405 JSON `method_not_allowed` | **PASS** |
| Real contact send | not attempted | **UNVERIFIED** (user) |
| `/.well-known/security.txt` | 200; Contact/Expires/Canonical/Policy/Preferred-Languages; ACAO `*` | **PASS** |
| `/security.txt` | 308 → `/.well-known/security.txt` | **PASS** |
| Apex no-follow | 308 → `https://www.jseramn.tech/` | **PASS** |
| markdown `/` `/about` `/contact` `/policy` `/terms` `/data-deletion` | 200 `text/markdown; charset=utf-8` | **PASS** |
| markdown 404 | 404 `text/markdown` | **PASS** |
| markdown `/tinity` | 200 `text/markdown; charset=utf-8` (Tinity experiment copy) | **PASS** (prod-r2 FAIL HTML) |
| `Accept: image/png` `/` | 406 `text/plain` | **PASS** |
| `Accept: application/json` `/` | 406 `text/plain` | **PASS** |
| `Accept: application/ld+json` `/` | 200 graph Person, Organization, WebSite, ProfilePage | **PASS** |
| default HTML `/` | 200 `text/html` 56022 B doctype; Vary `Accept, Accept-Encoding`; `Hero.CNr93y_i.js`; `aria-label="Open Tinity"`; no `mount.*` in HTML; no `three.module` | **PASS** |
| GET old `three.module.BZDFAEuz.js` | 404 | **PASS** |
| HeroAsciiBackground → `mount.DiPKhRMh.js` | 200 JS; dynamic import present; no `three.module` in file | **PASS** |
| `/llms.txt` | 200; 13 `- [`; ACAO `*`; includes Tinity | **PASS** |
| `/llms-full.txt` | 200 11265 B | **PASS** |
| robots / sitemap | 200 | **PASS** |
| oEmbed | 200 `type=photo` | **PASS** |
| `/_astro` JS (`Hero.CNr93y_i.js`) | `max-age=31536000, immutable`; no Vary | **PASS** |
| hashed globals CSS | same immutable (`/about` → `globals.BAmHRMUt.css`) | **PASS** |
| `Link: </llms.txt>; rel="describedby"` | present (header + 1 html) | **PASS** |
| speculation rules | home only | **PASS** |
| home CSS | inline styles, no `/_astro/globals` link (U10) | **PASS** |
| about CSS | `/_astro/globals.BAmHRMUt.css` | **PASS** |
| home Tinity href / aria | true | **PASS** |
| videobg full-res in HEAD | only `videobg-480.{mp4,webm}` | **PASS** |
| lucide / react-use-measure / Vercel Analytics / Speed Insights / `three` | absent from `package.json` (no node_modules; skipped `pnpm ls`) | **PASS** |
| no `<link rel=preload as=video>` | true | **PASS** |
| PostHog `setTimeout(arm,6000)` | present in live HTML | **PASS** |
| `VIDEO_PRELOAD = "none"` | repo `heroAsciiBudget.ts` | **PASS** |

Is Agentic 100: **UNVERIFIED** (no live linter score this run). Discovery surfaces green including `/tinity` markdown.

## Repo

Checkout: `prod-r3` @ `c295535`. `pnpm ls` skipped (no `node_modules`). Evidence: `/tmp/swarm/measure/prod-r3/repo/repo.txt`.

| File | LOC | Note |
|---|---:|---|
| `src/tinity/components/canvasui/ForceField.tsx` | 1337 | Tinity experiment; out of home DoD |
| `DecryptReveal.tsx` | 1163 | same |
| `Glitch.tsx` / `Stage.tsx` | 541 / 511 | Tinity |
| **`src/components/ContactModal.tsx`** | **467** | **FAIL** >300 (pre-existing) |
| `src/lib/agent/legalCopy.ts` | 421 | **FAIL** >300 |
| `src/components/hero/HeroMusic.tsx` | 300 | at cap, PASS ≤300 |
| `src/components/GlassSurface.tsx` | 244 | **PASS** |
| `src/components/Hero.tsx` | 82 | **PASS**; split under `src/components/hero/` |
| `src/lib/glass/pump.ts` | 150 | `GLASS_MS = 1000 / ASCII_FPS` |
| `src/lib/hero/ascii/mount.ts` | 181 | U11 mount |
| `src/lib/hero/ascii/gl.ts` | 168 | WebGL2 sampler |
| `src/lib/hero/ascii/scene.ts` | 195 | **no `EXTRUDE`** |

- `git ls-files public | grep videobg` → only `videobg-480.{mp4,webm}` **PASS**
- `package.json`: no `lucide-react`, `react-use-measure`, `@vercel/analytics`, `@vercel/speed-insights`, **`three`**, **`@types/three`** **PASS**
- Product `src` has no `from "three"` / `import("three")` except negative assertions in `sitePerformance.test.ts` **PASS**
- `aria-modal`: `ContactModal.tsx` + `domSignals.ts` (`ARIA_MODAL_ATTR`). `1000 / ASCII_FPS` owners: `heroAsciiBudget.ts` `SAMPLE_MS`, `glass/pump.ts` `GLASS_MS`
- `prerender = false` on `/`, `/about`, `/contact`, `/404`, legal, `/tinity`, APIs
- `VIDEO_PRELOAD = "none"` in `heroAsciiBudget.ts`; PostHog `setTimeout(arm,6000)` in `src/components/posthog.astro`

## DoD verdict (goal §7 / design.md §10)

| Requirement | Verdict | Evidence |
|---|---|---|
| Production is U11 tree (`c295535` / `30d4040`) | **PASS** | GitHub Production `30d4040` Ready; live `Hero.CNr93y_i.js`; trees equal |
| Gates tsc/vitest/astro check/biome/build/e2e on **main** | **UNVERIFIED** this label | not re-run |
| POST `/api/contact` invalid → JSON 4xx | **PASS** | `agentic/contact-post.body` |
| Real email send | **UNVERIFIED** | needs user |
| `security.txt` 200 | **PASS** | `agentic/security-well-known.body` |
| `Accept: text/markdown` all pages incl. `/tinity` | **PASS** | `agentic/md-tinity.body` |
| Is Agentic 100 | **UNVERIFIED** | |
| Mobile P ≥99 | **PASS** | median 100 |
| A11y/BP/SEO 100 | **PASS** home; 404 BP96/SEO92 | |
| TBT ≤100 ms | **PASS** | 18.5 ms |
| LCP ≤1.5 s | **PASS** | 0.98 s |
| CLS 0 | **PASS** | 0 mobile; desktop 0.00013–0.00040 |
| JS ≤150 KB br | **PASS** | 137957 B |
| Transfer ≤350 KB | **FAIL** | 390 KB (video Range) |
| `three.module` gone from unused-JS + HTML + network | **PASS** | extract + 404 |
| ASCII paints (`data-ascii-paint`) | **PASS** | taps + shot probes |
| RM / no-WebGL monochrome SVG, never colour still | **PASS** | `home-390x844-reduced-motion.png`, `home-390x844-no-webgl.png` |
| Hollow bust vs r2 (EXTRUDE dropped) | **PASS / noted** | glyph bust intact; outline/hollow; same family as r2 1920 |
| No videobg full-res | **PASS** | `repo/repo.txt` |
| No dead lucide/analytics/three | **PASS** | `package.json` |
| Product files ≤300 LOC | **FAIL** | ContactModal 467, legalCopy 421; Hero/Glass under |
| Capacities centralized / no leaked singletons | **PASS** checkout | pump + SAMPLE_MS via `ASCII_FPS` |
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
| prerender=false home/about/contact/404 | **PASS** | repo `src/pages`; legal + tinity markdown live |
| video preload=none | **PASS** | no HTML preload link; `VIDEO_PRELOAD` in repo |
| PostHog setTimeout 6000 | **PASS** | live HTML `setTimeout(arm,6000)` |
| design.md exists + reviewer confirms | **PARTIAL** | file present |
| No filter-repo | **PASS** | not done |
| Tinity homepage CTA | **PASS** | aria-label + screenshots |
| `/tinity` markdown | **PASS** | was FAIL on prod-r2 |
| U07 Motion out of critical island | **PASS** | unused = `proxy.*` only, not Hero |
| U14 Hero split | **PASS** | Hero 82 LOC |
| U11 WebGL2 live | **PASS** | mount.DiPKhRMh.js in LH network; three 404 |

## Regressions vs baseline / vs prod-r2

vs B (`8f9a743`): P 97 → **100**; TBT 209 → **18.5 ms**; LCP 0.93 → 0.98 s (hold under 1.5); JS 258 → **138 KB**; transfer still video-dominated (~390 vs 506–624).

vs prod-r2 (`7e1fb5e` / `Hero.DMT7DWTQ.js`):

- Performance 98 → **100**
- TBT 154.5 → **18.5 ms**
- LCP 1.04 → **0.98 s**
- SI 1.9 → **1.8 s**
- JS 270052 → **137957 B** (−132 KB; matches `three.module` 132798 B transfer)
- Transfer 555 → **390 KB**
- unused-JS: Three **gone**; Motion `proxy.Bp6IqlKE.js` **unchanged** (~41 KB, ~57% unused)
- `/tinity` markdown **PASS** (was HTML FAIL)
- Tinity CTA still present
- Contact JSON 400 still good; HTML doctype still good
- Secondary pages still 100/100/100/100 ~59–61 KB
- Marquee 360 clip + landscape HUD compression **unchanged** (not a U11 regression)

No TBT regression. `proxy.*` remains in the LH window but TBT is already under budget.

## Recommendations

1. **Do not start another code unit.** U11 success is met on production (TBT 18.5 ms **and** JS −132 KB). Motion `proxy.Bp6IqlKE.js` is still ~41 KB unused ~23 KB; that is leftover, not a gate to open U12 from this measurement.
2. Transfer ≤350 KB still **FAIL** because of `videobg-480.webm` Range (171–311 KB). Owner decision remains video preload/range, not a new sampler unit.
3. **ContactModal.tsx 467** and **legalCopy.ts 421** still over 300 LOC (pre-existing).
4. Landscape 844×390 / 360 marquee clip: U20 still holds as a HUD defect; U11 did not make it worse.
5. Hire `label-content-name-mismatch` is the same experimental a11y ding; category 100. Optional copy/aria alignment, not a P-score lever.
6. Design invariant “5 hero + 1 modal” vs 6 desktop presets (Tinity extra wrap) is unchanged from r2.
