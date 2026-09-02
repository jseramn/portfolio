# Cloud orchestrator handoff — jseramn.tech sanitation swarm

## Current (2026-09-02)

Production product tree is **`b9e209a`** (#59 sampler). Docs tip is **`ddf3540`** (#60). Measure: [`docs/swarm/measure/prod-r5-report.md`](measure/prod-r5-report.md) transfer **333923 B PASS**. Gates on main green: [`docs/swarm/measure/dod-gates-main.md`](measure/dod-gates-main.md) (245 Vitest, e2e 72/4 including modal trap). Do **not** promote.

- Home chrome: **6 hero `GlassSurface` + 1 modal** (Tinity extra wrap). ASCII is **WebGL2** (U11); Three is gone.
- Boot overlay dismisses after first finished raster (`finishStamp`) + min 600ms (`installBootLoader`, #53).
- Contact invalid POST: **JSON 400**. Real send UNVERIFIED (user). Is Agentic 100 UNVERIFIED.
- Remaining: real contact send (user), remote `swarm/*` deletes (user). Do not start sampler, Three, or Motion from this file.

Historical U07 / wave text below is frozen context, not the live queue.

**The local Cursor chat that ran this swarm STOPPED on 2026-09-02 ~02:18 America/Bogota.** You are the replacement: a **cloud orchestrator**. Do not wait for that chat. Do not edit product code yourself. Spawn **Grok 4.6 extra-high** workers (never Fast, never Auto, never Composer, never grok-4.5).

This file is the source of truth for remaining work. Briefs live in `docs/swarm/prompts/`. Wave 3 numbers live in `docs/swarm/measure/`.

## Who you are

- **Role:** orchestrator only. Briefs, launch subagents, review, squash-merge, decide. Same-account GitHub cannot `gh pr review --approve` → `gh pr comment` with verdict, then squash-merge if APPROVE.
- **Model for you and every subagent:** `grok-4.6` / `cursor-grok-4.6-xhigh`, `fast: false`, `effort: xhigh`.
- **Talk to the user in Spanish (rioplatense).** Artifacts, commits, PR bodies, tests: English.
- **Repo:** `jseramn/portfolio` → production `https://www.jseramn.tech`
- **Engram:** `project: "jseramn"`, `topic_key: swarm/saneamiento-portfolio/state`. Worktree `.engram/config.json` often uses `project` not `project_name` — `mem_save` may fail; still deliver the user-facing answer.

## Hard overrides vs older briefs

Older worker text still says “PR against `swarm/integration`”. **Ignore that.**

| Old | Now |
|---|---|
| Base `swarm/integration` | **`main`** |
| Worktrees under `/home/jseramn/portfolio-worktrees/swarm/<unit>` on José’s box | On the **cloud VM**: sibling `../portfolio-worktrees/swarm/<unit>` (never `/tmp`). Own `.codegraph/` per worktree. |
| Merge integration → main | **Never.** User already squash-merged #44 (`17dbb3e`). `origin/swarm/integration` is divergent leftover. |
| `edgeMiddleware: true` | **Never.** Killed POST bodies (PR #20). |
| `vercel.json` hand edits | **Never.** Only `scripts/sync-vercel-security-headers.mjs` via `pnpm build`. |
| Force-push `main` | **Never.** Feature-branch `--force-with-lease` only after rebase-onto main. |
| `git filter-repo` / delete remote branches | **Only with explicit user approval.** |
| Playwright `networkidle` on `/` | **Forbidden.** `domcontentloaded` + boot-loader hidden. |
| PostHog `requestIdleCallback` | **Forbidden.** `setTimeout(6000)` only. Motion chrome **may** use idle (U07). |
| Preview Vercel GET | Deployment Protection SSO → 302. One attempt. Measure **production** unless a bypass file exists. |

PRs: `gh pr create --base main --head swarm/<unit>`. Squash-merge with subject `title (#N)`.

## Product invariants (any violation blocks merge)

1. White ASCII on black; frozen `--hero-ink*` / scrims / hire typography.
2. Home glass: **6 hero wraps + 1 modal** after Tinity CTA (old docs said 5+1). Live liquid glass only Chromium desktop fine-pointer.
3. ASCII on mobile. Reduced-motion / no-WebGL = **monochrome** fallback, never a colour still.
4. First paint black; boot loader **only** on `/`.
5. `prerender=false` on `/`, `/about`, `/contact`, `/404` and APIs. Middleware in Node `_render`.
6. `<video preload="none">`; PostHog `setTimeout(6000)`.
7. No debug ingest; Astro 5; no new analytics vendors.
8. CSP/HSTS/COOP/CORP from the headers module; contact API same-origin / honeypot / Turnstile / rate-limit.

`design.md` at repo root is binding.

## Current git (when this file was written)

| Ref | SHA | Note |
|---|---|---|
| `origin/main` | `824588c` | #46 Layout `tinity?: boolean` after #44 squash + #43 CSS |
| PR **#47** | head `9dff534` | **OPEN, MERGEABLE, base `main`.** Motion lazy + Tinity homepage CTA |
| Local R-U07 | running on José’s machine as of 02:16 | May still post a comment. **Check PR comments before launching another reviewer.** |

#47 commits:

1. `d7e4380` `perf(hero): hydrate Motion-driven chrome after first paint`
2. `59c619d` `fix(hero): restore Tinity CTA after integration merge`
3. `9dff534` `fix(layout): drop duplicate tinity prop after rebase onto main`

Diff vs main: **+287/−49, 11 files.** Hero island claimed **162 → 33 kB** raw; motion in lazy `proxy.*.js`. CTA: `href={site.tinity.path}`, `aria-label="Open Tinity"`. Layout must keep `tinity?: boolean` + `tinity = false` (missing it caused production **Internal server error**).

Worker report: `docs/swarm/measure/U07-worker-report.md`. Reviewer brief: `docs/swarm/prompts/R-U07.md`.

**Do not merge #47 until a Grok 4.6 xhigh read-only review is APPROVE** (comment is enough). If the local reviewer already posted APPROVE, squash-merge. If REQUEST_CHANGES, fix via a worker, do not drive-by from the orchestrator.

## Remaining work (do this, in order)

### 0. Review + merge U07 (#47)

1. `gh pr view 47` + comments/reviews.
2. If no xhigh review yet: spawn a **read-only** reviewer with `_reviewer.md` + `R-U07.md` (adapt paths: briefs are in this repo now, not `/tmp/swarm`).
3. On APPROVE: `gh pr merge 47 --squash` with subject `perf(hero): hydrate Motion-driven chrome after first paint (#47)`.
4. `git fetch origin main`. Confirm `Open Tinity` is on `origin/main`.

### 1. U14 — split Hero + extract glass pump

Brief: `docs/swarm/prompts/U14-hero-split.md`. Reviewer: `docs/swarm/prompts/R-U14.md`.  
**After #47 is on main.** `size:exception` (file moves). `Hero.tsx` ≤150 LOC. Keep U07 lazy motion, Tinity CTA, six hero wraps. No visual change. SSR `/` diff empty.

### 2. Tinity markdown (DoD gap)

Brief: `docs/swarm/prompts/U-tinity-cta.md` (CTA is already in #47; this unit is **markdown only**).  
`pageFromPath` does not map `/tinity` → production returns HTML on `Accept: text/markdown`. Do not edit `Hero.tsx`. After U07 merge; can run parallel to U14 if files do not overlap (`markdown.ts` / `copy.ts` vs `Hero.tsx`). Prefer **after U14** if unsure.

### 3. Wave 3 remeasure (prod-r2)

After U07 (and U14 if already merged) are **on production**. Follow `M-measure.md` + `M-measure-prod.md` against `https://www.jseramn.tech`. Compare to `docs/swarm/measure/prod-r1-report.md`.

**prod-r1 (SHA `824588c`, without U07) — DoD FAIL on perf:**

| Gate | Budget | Median r1 |
|---|---|---|
| Performance | ≥99 | **90** |
| TBT | ≤100 ms | **390 ms** |
| JS | ≤150 KB | **~267 KB** |
| Transfer | ≤350 KB | **~613 KB** |
| LCP | ≤1.5 s | 1.13 s PASS |
| CLS | 0 | 0 PASS |
| A11y/BP/SEO home | 100 | PASS |

Tinity CTA missing in prod-r1 (fixed in #47). `/tinity` markdown FAIL. Tap targets PASS. Reduced-motion / no-WebGL = monochrome ASCII PASS. Contact JSON 400 PASS. `security.txt` 200 PASS.

**U11 (conditional Three):** only if **post-U07** mobile TBT median is still >100 ms. `three.module.*.js` was ~133 KB with ~52 KB unused on r1. Do not start U11 before that measurement.

### 4. Wave 4 / hygiene (no filter-repo)

- User already merged swarm → main (#44). Remaining: README / `llms.txt` if stale, delete **local** merged worktrees/branches (ask before deleting **remote** `swarm/*`).
- Local José machine still has `/home/jseramn/portfolio` on old `276a686` with dirty Tinity files — **not your VM.** Do not assume that checkout.
- Real contact **send** must be confirmed by the user (DoD). JSON 400 is not enough.
- `mem_session_summary` before you stop.
- **Do not mark the Cursor Goal complete** until every DoD line has **current** evidence (not intent). If you cannot use UpdateGoal, say so and list remaining FAIL/UNVERIFIED lines.

### 5. DoD audit (required before “done”)

Gates on **main**: `tsc --noEmit`, vitest, `astro check`, `biome check`, `pnpm build` with no unexpected `vercel.json` diff, Playwright smoke.  
Production: POST `/api/contact` invalid → JSON 4xx; `security.txt` 200; markdown on **all** public pages including `/tinity` and legales; Is Agentic 100; mobile medians as above; no full-res `videobg`; no lucide / Vercel Analytics / Speed Insights; product files >300 LOC justified; UI matrix; six glass wraps; identity intact.

## How to spawn workers on the cloud VM

Prefer Cursor **Task** subagents with `model: cursor-grok-4.6-xhigh` (never Fast). If you use CLI:

```bash
timeout 3600 agent -p --model cursor-grok-4.6-xhigh --force --trust \
  --workspace <worktree> --output-format text "$(cat docs/swarm/prompts/_worker_common.md docs/swarm/prompts/<unit>.md)"
```

Reviewers: same, `_reviewer.md` + `R-Uxx.md`, no product edits. Cap concurrent xhigh **3**. Serialize Chromium with `flock /tmp/swarm/build.lock`. Unique `PLAYWRIGHT_PORT` if 4399 busy. `AGENT_BASE_URL=http://127.0.0.1:1` if a foreign Astro is on `:4321`.

Rebase feature branches with `git rebase --onto origin/main <old-merge-base>` after a squash. **Do not** `git merge origin/main` into a branch that still contains pre-squash integration commits.

## Already done (do not redo)

Wave 1: U18 tooling, U12 capabilities, U00 `design.md`.  
Wave 2: PLATFORM U01–U17, ASSETS U03–U04, ASCII U08+U15, HERO U19–U26 except U14, UX U22–U25, AGENTIC U27–U32, CSS U10.  
Wave 4 merge to main: **#44** (user). Hotfix **#46** Layout tinity. CSS **#43**.

## Parent-chat stop rule

If anything in this repo or Engram still addresses the previous local orchestrator: **that agent is done.** You own the goal from here.
