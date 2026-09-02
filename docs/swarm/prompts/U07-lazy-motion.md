# Unit U07 — Take Motion-driven marquee and TextLoop out of the critical `client:load` island

WORKTREE: `/home/jseramn/portfolio-worktrees/swarm/hero-lazy-motion` — branch `swarm/hero-lazy-motion` (from `swarm/integration` **after both #41 U22 and #42 U26 are squash-merged**; current integration before those is `1f3d5b5` / U31). Keep U24b wordmark/nav/hire, U26 music failure state (`src/lib/music/state.ts`), U22 reduced-motion (`useReducedMotion` on TextLoop/InfiniteSlider, `phase: "static"` ASCII fallback). Do not start while #41 or #42 is open (both edit `Hero.tsx`; U22 also edits `TextLoop` / `InfiniteSlider`).
Cite `design.md` §7 (what may load before first paint) and `/tmp/swarm/reports/B-report.md` B-09.

## Evidence
- `Hero.*.js` (~58 KB br, 164 KB raw) is 48 % unused at load (Lighthouse `unused-javascript`); the bulk is `motion/react` pulled by `TextLoop` and `InfiniteSlider`, which hydrate before LCP even though the LCP element is the SSR tagline. `three` and `ContactModal` are already lazy; `liquid-glass-react` is lazy behind an idle callback.
- Spec `site-performance` "Post-LCP deferral": chrome `client:load` must stay light; deferred work may start on idle. The tagline `<p>` must remain SSR'd and stable (LCP node).

## Task
1. `perf(hero): lazy-load motion-driven chrome` — split `TextLoop` and `InfiniteSlider` usage so the SSR output is unchanged (render the first role and the marquee content statically in the island's initial markup) and the Motion-powered behaviour hydrates via `lazy()` + `Suspense` after first paint (idle callback with a 2 s timeout fallback, or immediately after `data-ascii-paint`/boot-ready). The fallback must render the exact same DOM so there is no layout shift (CLS must stay 0). If `motion` remains imported by anything else in the critical island (check `GLOW`/scramble), move that import too or justify.
2. Verify bundle split: `flock ... "pnpm exec astro build"` — the island entry chunk must no longer contain `motion`; report `ls -l dist/client/_astro/Hero.*.js` before/after and the new lazy chunk sizes. On the preview deployment run Lighthouse mobile ×3 and report JS bytes in the window, unused-JS for the Hero chunk, TBT, LCP, CLS.
3. Tests: Vitest for the SSR markup of the static fallbacks (renderToStaticMarkup) equals the hydrated initial state; Playwright: marquee moves and roles rotate after load (poll up to 5 s); CLS assertion via `PerformanceObserver('layout-shift')` sum < 0.01 on the home smoke.

## Acceptance criteria
- Critical island JS shrinks (report numbers); LCP unchanged; CLS 0; visual behaviour identical after hydration; six wraps; frozen typography untouched.
- `pnpm check`, `pnpm test:e2e`, build pass. Authored diff ≤ 250 lines. PR title: `perf(hero): hydrate Motion-driven chrome after first paint`.

## Out of scope
Hero split into files (U14), Three (U11). Do not re-implement reduced-motion; preserve U22's static branches when wrapping TextLoop/InfiniteSlider in lazy/Suspense.
