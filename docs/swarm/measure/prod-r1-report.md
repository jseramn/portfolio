# Wave 3 — production r1 (`824588c`, post #44/#43/#46)

- **TARGET:** `https://www.jseramn.tech`
- **SHA:** `origin/main` `824588c` (`fix(layout): restore tinity prop dropped in the swarm/main merge (#46)`)
- **When:** 2026-09-02 01:53–01:58 America/Bogota (LH fetchTimes 06:53–06:56Z)
- **Not in this SHA:** U07 lazy Motion, U14 Hero split, homepage Tinity CTA
- **Compiler:** orchestrator, from `/tmp/swarm/measure/prod-r1/{lh,shots,taps,agentic,repo}` after chrome-pipeline finished. The M-prod-r1 xhigh agent collected this data but did not write `report.md` (stuck in MCP after taps).
- **Baseline (B-report, pre-swarm `8f9a743`):** mobile median P97, TBT 209 ms, FCP=LCP 0.93 s, SI 2.0 s, JS 258 KiB, total 506–624 KB

## Scores

Lighthouse 13.4.1, Chromium Playwright 1234, `flock /tmp/swarm/build.lock`.

| run | P | A | BP | SEO | FCP | LCP | TBT | CLS | SI | JS B | total B |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| home-mobile-1 | 88 | 100 | 100 | 100 | 1.13 s | 1.13 s | 463 ms | 0 | 2.2 s | 267 KB | 620 KB |
| home-mobile-2 | 90 | 100 | 100 | 100 | 1.3 s | 1.3 s | 390 ms | 0 | 2.4 s | 267 KB | 613 KB |
| home-mobile-3 | 91 | 100 | 100 | 100 | 1.02 s | 1.02 s | 377 ms | 0 | 2.4 s | 266 KB | 613 KB |
| **home mobile median** | **90** | **100** | **100** | **100** | **1.13 s** | **1.13 s** | **390 ms** | **0** | **2.4 s** | **267 KB** | **613 KB** |
| home-desktop-1 | 100 | 100 | 100 | 100 | 0.29 s | 0.29 s | 31 ms | 0.00013 | 1.0 s | 300 KB | 621 KB |
| home-desktop-2 | (see json) | 100 | 100 | 100 | | | | | | | |
| about-mobile-1 | 100 | 100 | 100 | 100 | 0.81 s | 1.08 s | 0 | 0 | 1.0 s | 0 | 63 KB |
| contact-mobile-1 | 100 | 100 | 100 | 100 | 0.85 s | 1.09 s | 3 ms | 0 | 1.2 s | 0 | 63 KB |
| policy-mobile-1 | 100 | 100 | 100 | 100 | 0.83 s | 0.95 s | 0 | 0 | 1.2 s | 0 | 64 KB |
| 404-mobile-1 | 100 | 100 | 96 | 92 | 0.81 s | 1.09 s | 0 | 0 | 1.1 s | 0 | 62 KB |

Pipeline-computed median (`lh/extract.json` → chrome-pipeline.log): P90 A100 BP100 SEO100 LCP 1134 ms TBT 389.5 ms CLS 0 JS 266632 B total 612916 B.

### Budget vs median (home mobile)

| Gate | Budget | Median | Verdict |
|---|---|---|---|
| Performance | ≥99 (goal 100) | 90 | **FAIL** (baseline was 97 — regression) |
| A11y / BP / SEO | 100 | 100 / 100 / 100 | **PASS** |
| LCP | ≤1.5 s | 1.13 s | **PASS** |
| TBT | ≤100 ms | 390 ms | **FAIL** (baseline 209 ms — worse) |
| CLS | 0 | 0 | **PASS** |
| JS first load | ≤150 KB | ~267 KB | **FAIL** |
| Transfer | ≤350 KB | ~613 KB | **FAIL** |

Unused JS (home-mobile-1): `three.module.BZDFAEuz.js` 52.5 KB wasted of 133 KB (40%); `Hero.BmOYRBcc.js` 28.6 KB wasted of 57.7 KB (50%). Long tasks: unattributable 534 ms, `client.*.js` 60 ms, `Hero.*.js` 50 ms. A11y audit `label-content-name-mismatch` listed on run 2 but category still 100.

404 BP96 = `errors-in-console`; SEO92 = Lighthouse `http-status-code` on a real 404 (expected, not a missing meta description).

**U07 expected effect:** Hero island 162 → 33 kB raw in the PR branch (motion moved to lazy `proxy.*.js`). Does **not** remove `three`. **U11** stays gated on post-U07 TBT still >100 ms.

## UI matrix

Shots in `/tmp/swarm/measure/prod-r1/shots/`. Boot wait via chrome-pipeline; ASCII `data-ascii-paint` on coarse taps.

| Shot | Verdict | Notes |
|---|---|---|
| home-360x800 | DEFECT | Marquee leading clip (`…hile I build things`); glass HUD intact; ASCII on; no Tinity control |
| home-390x844 | OK-ish | Same marquee overflow; chrome readable |
| home-430x932 | OK-ish | Same family as 390 |
| home-768x1024 | OK | Portrait + HUD |
| home-1024x768 | OK | |
| home-1366x768 | OK | |
| home-1920x1080 | OK | Wordmark + marquee + stats; socials top-left; music top-right; hire + tagline bottom; ASCII portrait; **no Tinity control** |
| home-844x390 (landscape) | DEFECT risk | Short viewport: wordmark sits inside top marquee bar; social dock not in the visible chrome (U20 short-HUD). Hire + tagline + music present |
| home-1280x600 | OK-ish | Short-ish desktop |
| home-390x844-reduced-motion | PASS | Monochrome ASCII/static fallback visible; **not** a colour still. Roles/hire readable (`hire → tech lead`) |
| home-390x844-pointer-coarse | PASS | ASCII painted; live glass off |
| home-390x844-no-webgl | PASS | Monochrome ASCII fallback still a glyph portrait, not `portrait.jpg` |
| about-* (7 vp) | OK | Secondary layout; globals CSS linked |
| contact-* (7 vp) | OK | |
| policy-* (7 vp) | OK | |
| 404-* (7 vp) | OK | Back + `jseramn`; recovery paths `/` `/llms.txt` `/about` `/contact` `/policy`; footer About/Contact/Policy/Terms/Data deletion |

No colourful stills. Loader only implied on home (`aria-busy` / `data-boot-pending` in HTML). Identity (white glyphs on black, glass HUD, frozen hire type) intact.

## Targets and landmarks

`/tmp/swarm/measure/prod-r1/taps/summary.json` (rerun; desk `pointerCoarse: false`).

| Check | Coarse 390×844 | Desktop 1920 | Verdict |
|---|---|---|---|
| boxes < 44×44 | 0 | 0 | **PASS** |
| hire scrollW ≤ clientW | 195=195 | 244=244 | **PASS** |
| hire box | 258×44 | 307×44 | **PASS** |
| chrome overlaps | none | none | **PASS** |
| `main` landmark | true | true | **PASS** |
| skip link + Tab | Skip to content `#main` | same | **PASS** |
| Tinity control | **false** | **false** | **FAIL** (dropped in #44 squash; U07 commit `c684e2a` restores it, not in prod) |
| live glass | 0 | 5 | **PASS** (coarse off; desktop on) |
| fallback glass hosts | 5 | 0 | **PASS** vs design.md “5 fallback hosts” (modal closed) |
| ASCII paint | `"1"` | n/a | **PASS** |

## Agentic

Primary table: `/tmp/swarm/measure/prod-r1/agentic/rows.json` plus orchestrator curls `/tmp/swarm/measure/prod-r1/agentic-curls.md`.

| Check | Result | Verdict |
|---|---|---|
| POST `/api/contact` `{}` | 400 `application/json` `request_rejected` | **PASS** |
| GET `/api/contact` | 405 JSON `method_not_allowed` | **PASS** |
| Real contact send | not attempted | **UNVERIFIED** (user) |
| `/.well-known/security.txt` | 200; Contact/Expires/Canonical/Policy/Preferred-Languages; Expires 2027-08-01 | **PASS** |
| `/security.txt` | 308 → `/.well-known/security.txt` | **PASS** |
| Apex no-follow | 308 → `https://www.jseramn.tech/` | **PASS** |
| markdown `/` `/about` `/contact` `/policy` `/terms` `/data-deletion` | 200 `text/markdown` | **PASS** |
| markdown 404 | 404 `text/markdown` | **PASS** |
| markdown `/tinity` | 200 `text/html` (`pageFromPath` has no tinity) | **FAIL** |
| `Accept: image/png` `/` | 406 | **PASS** |
| `Accept: application/json` `/` | 406 | **PASS** |
| `Accept: application/ld+json` `/` | 200 graph Person, Organization, ContactAction, WebSite, ProfilePage | **PASS** |
| default HTML `/` | 200 `text/html` 55161 B doctype; Vary `Accept, Accept-Encoding`; not ISE | **PASS** (rows.json `html-default` FAIL is a probe bug: `/vary/i.test(rec.vary)` matches the header *value*) |
| `/llms.txt` | 200; 12 ` - [`; ACAO `*` | **PASS** |
| `/llms-full.txt` | 200 11265 B | **PASS** |
| robots / sitemap | 200 | **PASS** |
| oEmbed | 200 `type=photo` | **PASS** |
| `/_astro` JS | `max-age=31536000, immutable` | **PASS** |
| hashed globals CSS | same immutable (from `/about`) | **PASS** |
| `Link: </llms.txt>; rel="describedby"` | present | **PASS** |
| speculation rules | home only | **PASS** |
| home CSS | inline styles, no `/_astro/globals` link (U10) | **PASS** |
| about CSS | `/_astro/globals.BAmHRMUt.css` + some scoped inline | **PASS** |
| home Tinity href | false | **FAIL** |
| videobg full-res in HEAD | only `videobg-480.{mp4,webm}` | **PASS** |
| lucide / Vercel Analytics / Speed Insights | absent from `pnpm ls --depth 0` | **PASS** |

Is Agentic 100: **UNVERIFIED** (no live linter score captured this run). Discovery surfaces otherwise green except `/tinity` markdown.

## Repo

Checkout: `integration-verify` @ `824588c`.

| File | LOC | Note |
|---|---:|---|
| `src/tinity/components/canvasui/ForceField.tsx` | 1337 | Tinity experiment; out of home DoD unless U14-adjacent |
| `DecryptReveal.tsx` | 1163 | same |
| **`src/components/Hero.tsx`** | **794** | **FAIL** >300 without this-SHA justification; U07 adds files, U14 must split |
| `Glitch.tsx` / `Stage.tsx` | 541 / 511 | Tinity |
| `GlassSurface.tsx` | 497 | **FAIL** >300 |
| `ContactModal.tsx` | 467 | **FAIL** >300 |
| `legalCopy.ts` | 421 | **FAIL** >300 |

`Hero.tsx` still lacks `href={site.tinity.path}` / `Open Tinity`.

## DoD verdict (goal §7 / design.md §10)

| Requirement | Verdict | Evidence |
|---|---|---|
| Gates tsc/vitest/astro check/biome/build/e2e on **main** | **UNVERIFIED** this label (not re-run on prod SHA here; U07 worker claimed pass on old integration base) | n/a |
| POST `/api/contact` invalid → JSON 4xx | **PASS** | `agentic/contact-post.body` |
| Real email send | **UNVERIFIED** | needs user |
| `security.txt` 200 | **PASS** | `agentic/security-well-known.*` |
| `Accept: text/markdown` all pages incl. legal | **FAIL** | `/tinity` HTML; others PASS |
| Is Agentic 100 | **UNVERIFIED** | |
| Mobile P ≥99 | **FAIL** | 90 |
| A11y/BP/SEO 100 | **PASS** home; 404 BP96/SEO92 | |
| TBT ≤100 ms | **FAIL** | 390 ms |
| LCP ≤1.5 s | **PASS** | 1.13 s |
| CLS 0 | **PASS** | 0 |
| JS ≤150 KB br | **FAIL** | 267 KB |
| Transfer ≤350 KB | **FAIL** | 613 KB |
| No videobg full-res | **PASS** | `repo/videobg.txt` |
| No dead lucide/analytics | **PASS** | `repo/pnpm-ls.txt` |
| Product files ≤300 LOC | **FAIL** | Hero 794, GlassSurface 497, ContactModal 467 |
| Capacities centralized / no leaked singletons | **UNVERIFIED** this run | U12 landed earlier |
| No substring tests on dead code | **UNVERIFIED** | |
| Screenshot matrix no clips | **FAIL** | 360 marquee clip; landscape HUD compression |
| Tap ≥44 px | **PASS** | taps/summary.json |
| Modal focus trap | **UNVERIFIED** | not exercised in this pipeline |
| Reduced-motion fallback visible | **PASS** | `home-390x844-reduced-motion.png` |
| Nav to about/contact | **PASS** | shots + HTML |
| Contrast ≥4.5:1 over glyphs | **UNVERIFIED** (no contrast meter this run) | |
| Identity Vesper/ASCII/glass | **PASS** | shots; 5 live glass desktop, 0 coarse |
| Six GlassSurface (5 hero + 1 modal) | **PASS** with modal closed (5 hosts); Tinity extra wrap not in prod | |
| Liquid glass Chromium desktop fine-pointer only | **PASS** | taps |
| ASCII on mobile | **PASS** | coarse asciiPaint=1 |
| No colour stills | **PASS** | no-webgl + reduced-motion shots |
| Loader only home | **PASS** | secondary LH JS 0; no boot-loader on /tinity test in repo |
| prerender=false home/about/contact/404 | **UNVERIFIED** this run (repo tests exist) | |
| video preload=none | **UNVERIFIED** this run | |
| PostHog setTimeout 6000 | **UNVERIFIED** this run | |
| design.md exists + reviewer confirms | **PARTIAL** | file present; no U07 review yet |
| No filter-repo | **PASS** | not done |
| Tinity homepage CTA | **FAIL** in prod; restored on PR #47 branch | |
| U07 Motion out of critical island | **FAIL** in prod (Hero still 57.7 KB with motion) | |
| U14 Hero split | **FAIL** not started | |

## Regressions vs baseline

- Performance 97 → **90**
- TBT 209 → **390 ms** (ASCII/Three + Hero/motion still on first load; swarm did not ship U07 yet)
- LCP 0.93 → 1.13 s (still under 1.5 s)
- JS 258 → 267 KB (flat / slightly worse)
- Contact 404 HTML → **fixed** (JSON 400)
- ISE after #44 → **fixed** (#46)
- Secondary pages now 100/100/100/100 and ~63 KB

## Recommendations

1. **Merge U07 to main** after rebase-onto `824588c` (PR #47). Expected: Hero critical JS 57 KB → ~12 KB gz; TBT/P may move but `three` (~133 KB) remains.
2. **U11** if post-U07 mobile TBT median still >100 ms: do not download Three when the budget is already blown (conditional sampler).
3. **U14** split `Hero.tsx` (794 LOC) after U07; keep visual lock.
4. **Tinity markdown** (`pageFromPath("/tinity")`) — DoD “all pages”; CTA restore is already in U07 `c684e2a`.
5. Landscape 844×390 HUD: verify U20 still holds after Motion lazy-hydrate.
6. Do not merge `swarm/integration` again. Do not treat rows.json `html-default` FAIL as a product bug.
7. Re-run this exact pipeline as **prod-r2** after U07 (+U14) is on production.
