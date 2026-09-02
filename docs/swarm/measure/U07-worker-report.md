# U07 report — hero-lazy-motion

**Branch:** `swarm/hero-lazy-motion`
**PR URL:** https://github.com/jseramn/portfolio/pull/47
**Commits:**
- `5ca5c70` `perf(hero): hydrate Motion-driven chrome after first paint`
- `c684e2a` `fix(hero): restore Tinity CTA after integration merge`

**Gates:**
- `pnpm exec tsc --noEmit` → pass
- `pnpm test` → pass (44 files, 209 tests)
- `pnpm exec astro check` → pass (0 errors, 4 pre-existing hints)
- `pnpm exec biome check` on unit files → pass except pre-existing Hero `useScramble` exhaustive-deps warnings
- `pnpm lint` / `pnpm check` → fail on pre-existing integration/Tinity lint (src/tinity/*, GlassSurface, TurnstileField, unused `tinity` in legalCopy.test.ts). Not introduced by this unit.
- `flock /tmp/swarm/build.lock -c "pnpm exec astro build"` → pass
- `flock /tmp/swarm/build.lock -c "CI=1 pnpm test:e2e"` → pass (65 passed, 2 skipped)

**Bundle (after):** `Hero.DDqradxI.js` 33.53 kB / 11.95 kB gzip, no `popLayout`. Before (same worktree with Motion in the island): 162.19 kB / 54.83 kB gzip. Lazy: `TextLoop` 1.21 kB, `InfiniteSlider` 8.16 kB, `proxy` (motion) 118.10 kB / 38.84 kB gzip.

**Changed lines:** 338 vs `origin/swarm/integration` (289 insertions, 49 deletions; 12 files). Over the 250-line unit target because of Tinity merge recovery; under 400. No `size:exception`.

**Deviations from brief:**
- Authored diff 338 > 250. Extra lines restore the Tinity homepage wrap, `Layout` `tinity` prop, `llms.txt` `/tinity`, and `llms-full.txt` after `main` merged into `swarm/integration` without those Hero hunks.
- Home glass count is 6 hero + 1 modal (Tinity's second `preset="button"`). Hire typography/ink unchanged (U24b).
- `pnpm check` does not pass repo-wide because `pnpm lint` is already red on integration/Tinity files.
- Preview Lighthouse mobile x3 not run (Deployment Protection).
- Engram `mem_save` failed: worktree `.engram/config.json` missing `project_name`.

**Follow-ups:**
- Lighthouse mobile x3 on a bypass-enabled preview or production: JS bytes, unused-JS for Hero.*, TBT, LCP, CLS.
- Formatting unit for `src/tinity/*` biome errors so `pnpm check` is green on integration.

**Blocked:** Preview verification blocked by Deployment Protection. `https://portfolio-f6dwpa21q-jseramntech.vercel.app/` GET → 302 `vercel.com/sso-api`. `/tmp/swarm/vercel-bypass.txt` absent. One attempt only.El preview de Vercel para `c684e2a` ya está listo: https://portfolio-f6dwpa21q-jseramntech.vercel.app

El GET a `/` responde **302** hacia `vercel.com/sso-api` (Deployment Protection). Sin el bypass, Lighthouse en ese URL no se puede correr; el PR #47 ya lo deja anotado.
