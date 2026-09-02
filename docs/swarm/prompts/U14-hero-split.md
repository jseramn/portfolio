# Unit U14 (+U13) — Split `Hero.tsx` into focused components and extract the glass pump module (no visual change)

WORKTREE: `/home/jseramn/portfolio-worktrees/swarm/hero-split` — branch `swarm/hero-split` from **`origin/main` after U07 (#47) is squash-merged**. Last HERO-lane unit. Keep U24b nav, U26 `src/lib/music/state.ts`, U22 fallback/`glow-pulse`, U07 `heroMotionStatic` / `scheduleHeroMotionChrome`, Tinity CTA (`aria-label="Open Tinity"`, `href={site.tinity.path}`), Layout `tinity` prop (#46), U10 home-only inline CSS. PR **against `main`**. Do not start while #47 is open.
Cite `/tmp/swarm/reports/A-report.md` A-03, A-13; `design.md` §3/§6 region names.

On the U07 branch (`9dff534`) the map is:

| Region | `data-hud-region` | `GlassSurface` around |
|---|---|---|
| marquee | `marquee` | ~528 |
| music | `now-playing` | ~589 |
| socials + about/contact | `socials` | dock ~682 |
| roles + hire | `roles` | ~727 |
| Tinity | (inside roles cluster) | `preset="button"` ~763, `Open Tinity` |
| tagline | `tagline` | ~781 |

`Hero.tsx` **813** LOC (`useScramble` 42–99, `useGitHubStats` 100–120, `Hero` 121–813). `heroMotionStatic.tsx` 86. `GlassSurface.tsx` **497** with module pump `glassJobs`/`glassPump` ~155–264 and register ~424–439. `ContactModal.tsx` 467 — **out of scope** (justify in PR as pre-existing; do not split this unit).

Home glass count: **6 hero wraps + 1 modal** (Tinity is the extra hero wrap vs the old five). Keep all six `<GlassSurface` sites; the six-wrap test must count across the new files.

## Evidence
Marquee, YouTube/music, socials/nav, roles/hire + Tinity, tagline, scramble, GitHub stats, and a large pointer/`useEffect` still live in one island file. The glass rAF pump is still a module singleton inside `GlassSurface.tsx` (U12 added refcounted unbind; extract it).

Safety net: `heroLiquidGlass.test.ts`, `tinityPage.test.ts` (Hero pin), `viewportLock.test.ts`, Playwright (taps, no-clip, nav, music failure, marquee/roles/CLS from U07). Keep them green; do not weaken.

## Task
1. `refactor(glass): extract the pump into src/lib/glass/pump.ts` — jobs set, rAF loop, ASCII wait, resume binding, refcount cleanup. API `registerGlassJob(job): () => void` plus whatever `getPumpAscii` the surface still needs. Vitest with fake rAF/timers. `GlassSurface.tsx` keeps React surface + presets only (target ≤300 LOC).
2. `refactor(hero): split chrome` under `src/components/hero/`: `HeroMarquee.tsx`, `HeroMusic.tsx`, `HeroSocials.tsx` (dock + U24b links + **Tinity wrap**), `HeroHire.tsx` (roles + hire + lazy modal), `HeroTagline.tsx`, hooks `useScramble.ts`, `useGitHubStats.ts`, `useHeroPointer.ts`. Motion chrome stays behind `scheduleHeroMotionChrome` / `heroMotionStatic` — do not re-static-import `motion/react` into the shell. `Hero.tsx` = layout shell (regions + scrims + ASCII host) **≤ 150 LOC**. Identical className / DOM order / `data-*` / aria. `site.ts` untouched.
3. Prove no change: SSR markup of `/` before/after (normalise hashed ids) empty; shots 390 coarse, 844×390, 1920; `pnpm test:e2e` green.
4. PR `wc -l` for `src/components/**`. Product files in that tree ≤300 except `ContactModal.tsx` (pre-existing, listed).

## Acceptance
Zero visual/behaviour change; `Hero.tsx` ≤150; pump tested; six hero wraps + modal; Tinity CTA still present; critical island still without `motion`.
`pnpm exec tsc --noEmit`, `pnpm test`, `astro check`, flock build + e2e. Authored diff will exceed 400: label `size:exception` "file moves; SSR diff empty". Semantic edits must be zero.
PR title: `refactor(hero): split chrome components and extract the glass pump`.

## Out of scope
Behaviour, styling, ASCII runtime (U15), Three (U11), ContactModal split, `/tinity` markdown (separate unit).

