# CLOUD OVERRIDE (2026-09-02)
# PRs target **main**, not swarm/integration. Read ../../HANDOFF.md first.
# Worktrees: sibling ../portfolio-worktrees/swarm/<unit> on the cloud VM, never /tmp.

# Worker contract — jseramn.tech sanitation swarm

You are an implementation worker in a swarm of Cursor CLI agents. There is NO human in the loop: never ask questions, never wait for confirmation. Make the decision, document it in the PR body, and move on. If you are truly blocked, finish with a report that says exactly what blocked you.

## Where you are
- Your workspace is an isolated git worktree: `WORKTREE` (given in your unit brief), on branch `swarm/<unit>`, cut from **`origin/main`**. All commands run there.
- Do not edit other checkouts. On José’s machine `/home/jseramn/portfolio` is off limits; on the cloud VM stay inside your assigned worktree.
- Remote: `origin` = https://github.com/jseramn/portfolio.git. `gh` is authenticated. Vercel builds a preview deployment for every pushed branch (URL appears in the PR's Vercel bot comment or `vercel ls`; you may use it for verification, but never deploy to production).
- Serialize heavy commands with `flock /tmp/swarm/build.lock -c "<command>"` for `pnpm exec astro build`, `pnpm build`, Lighthouse, Playwright. Run at most one Chromium at a time. Kill any dev server you start before finishing.
- Node 24 / pnpm 11. `node_modules` is already installed in the worktree (`pnpm install --frozen-lockfile`); if your unit adds dependencies, use `pnpm add`/`pnpm add -D` and commit the lockfile change.

## Stack facts
Astro 5 (`output: "static"`, `@astrojs/vercel` 8 with `edgeMiddleware: false` since PR #20; `/`, `/about`, `/contact`, `/404` and the API routes use `prerender = false`), React 19 islands (`Hero.tsx` is the only `client:load` island on `/`), Tailwind 3.4 ("vesper" theme), Motion 12, Three 0.185 (ASCII portrait from a 480p video sampler via WebGL), `liquid-glass-react` (Chromium desktop fine-pointer only), PostHog (cookieless, `setTimeout(6000)`), Resend + `age-encryption` contact, Vitest (144 tests, `pnpm test`), TypeScript strict via `astro/tsconfigs/strict` with `verbatimModuleSyntax`. `pnpm build` runs `scripts/sync-vercel-security-headers.mjs`, which REGENERATES `vercel.json` from `src/lib/security/siteSecurityHeaders.mjs` — never edit `vercel.json` by hand; change the source module and run `pnpm build`. Local `astro preview` does not work with the Vercel adapter; use `pnpm dev` for local runtime checks and the Vercel preview URL for adapter/edge behaviour.

Code style: 2-space indent, double quotes, no semicolons, trailing commas, ~100 columns. English for code, comments, tests, docs, commit messages and PR text. Comments only for non-obvious intent — never narrate what the code does.

## Product invariants (violating one fails review)
1. Visual identity stays: full-viewport white ASCII portrait on black (Vesper terminal aesthetic), glass chrome, Geist/Geist Mono. Layout, responsive behaviour, stacking and interaction details may change; Hero typography, scrim colours and `--hero-ink*` colours may NOT.
2. Home chrome: **6 hero `GlassSurface` wraps + 1 modal** after the Tinity CTA (older text said 5+1). Live `liquid-glass-react` only on Chromium desktop with a fine pointer; CSS fallback everywhere else (Safari/WebKit/CriOS/Firefox/coarse pointers/reduced motion).
3. ASCII runs on mobile too. Reduced-motion or no-WebGL users get a static monochrome fallback — never a colourful still (no portrait.jpg / ascii-poster).
4. First paint is black until glyphs paint; the boot loader overlay exists only on `/`.
5. `prerender = false` stays on `/`, `/about`, `/contact`, `/404` and the API routes. Since PR #20 the adapter uses `edgeMiddleware: false`: `src/middleware.ts` runs inside the Node `_render` function (the Edge hop dropped POST bodies/methods) — never turn `edgeMiddleware` back on. `Accept: text/markdown` negotiation, 406 for unacceptable types, and `Vary: Accept, Accept-Encoding` on negotiated responses must keep working (tests in `src/lib/agent/*.test.ts`).
6. `<video preload="none">` on the ASCII sampler element; PostHog init stays `setTimeout(6000)` (never `requestIdleCallback`).
7. No debug ingest (`dbg()` / localhost collectors). Astro stays on major 5. No new analytics vendors.
8. Security posture stays: CSP/HSTS/COOP/CORP headers come from `siteSecurityHeaders.mjs`; contact API keeps same-origin check, honeypot, Turnstile-when-configured, rate limit, generic errors.

## How you work (each unit)
1. Investigate: read the brief, `design.md` if it exists, and every file you will touch. Reproduce the problem (command output, test, screenshot) before changing code.
2. Test first: write or adjust the failing test (Vitest for logic/contracts, Playwright for UI/API smoke when the harness exists). Replace substring "contract" tests that pin dead code with behaviour tests; do not add new substring tests.
3. Analyse: identify root cause and alternatives; the PR body must state both.
4. Implement within scope. No drive-by refactors, no reformatting of files you did not need to touch (formatting is a dedicated unit), no new dependencies unless the brief allows it.
5. Gates (all must pass before you open the PR; paste the summarised output in the PR body):
   - `pnpm exec tsc --noEmit`
   - `pnpm test`
   - `pnpm exec astro check` and `pnpm exec biome check .` when those tools exist in the branch
   - `flock /tmp/swarm/build.lock -c "pnpm exec astro build"` (use `pnpm build` instead when your unit touches security headers, then confirm the `vercel.json` diff is exactly what you intended)
   - Playwright smoke (`pnpm test:e2e`) when it exists
6. Self-review against the invariants list and the unit's acceptance criteria. Count changed lines (`git diff --stat origin/main...HEAD`, excluding `pnpm-lock.yaml`).

## Git and PR rules
- Conventional Commits with scope: `fix(api): …`, `perf(hero): …`, `refactor(glass): …`, `feat(a11y): …`, `docs(design): …`, `chore(tooling): …`, `style: …`, `test: …`. One logical change per commit; tests and docs travel with the code they cover. Imperative subject ≤ 72 chars, body explains why.
- Commit as the configured git identity (do not change git config). The Cursor CLI appends a `Co-authored-by: Cursor` trailer automatically; that is accepted — do not add other trailers.
- `git push -u origin swarm/<unit>`; then `gh pr create --base main --head swarm/<unit> --title "<type(scope): summary>" --body-file /tmp/swarm/pr/<unit>.md` (create the directory if needed). PR body sections: `## Summary`, `## Root cause and alternatives`, `## Changes`, `## Verification` (exact commands + key output, Lighthouse numbers, screenshot paths or preview URL), `## Invariants checklist` (1–8 with ✅/n.a.), `## Risks and follow-ups`. Never open PRs against `swarm/integration`.
- Authored diff ≤ 400 lines (additions + deletions, excluding lockfile and pure-formatting commits). If you must exceed it, add the label `size:exception` (`gh label create size:exception --color 8b5cf6 --description "Reviewed oversize PR" 2>/dev/null || true`) and justify in the body.
- Never: force-push `main`, rebase or commit on `main`, delete remote branches, rewrite history, commit secrets (`.env*`), touch `vercel.json` by hand. Do not merge `swarm/integration` into main again.
- If `main` moved while you worked, `git fetch origin && git rebase origin/main` on YOUR branch only (or `rebase --onto origin/main <old-base>` after a squash). Re-run gates, then push. If the branch was already pushed, `git push --force-with-lease origin swarm/<unit>` — this is the only permitted force.

## Finding your Vercel preview deployment (adapter/Edge behaviour can only be verified there)
The Vercel CLI is not linked in worktrees; use the GitHub Deployments API instead. After `git push`, wait for the build (poll every 30 s, up to 6 min):
```
SHA=$(git rev-parse HEAD)
DEP=$(gh api "repos/jseramn/portfolio/deployments?sha=$SHA&per_page=1" --jq '.[0].id')
gh api "repos/jseramn/portfolio/deployments/$DEP/statuses" --jq '.[0] | {state, environment_url, target_url}'
```
`state` must be `success` and `environment_url` is the preview origin (e.g. `https://portfolio-<hash>-jseramntech.vercel.app`).
KNOWN BLOCKER: this project has Vercel Deployment Protection (SSO) on previews — GET returns 302 to `vercel.com/sso-api`, POST 401. If the file `/tmp/swarm/vercel-bypass.txt` exists, send its content as header `x-vercel-protection-bypass: <secret>` (plus `x-vercel-set-bypass-cookie: true` for browser/Lighthouse runs via `--extra-headers`) on every preview request. If the file does not exist, do NOT spend more than one attempt on the preview: state "preview verification blocked by Deployment Protection" in the PR body, verify everything you can locally (`pnpm dev`, the built `.vercel/output/` config and function bundles, unit/e2e tests), and list the exact curl commands the release verification must run against production. Never `vercel link`, never touch protection settings, never deploy manually.

## Skills to load before work (read these files first)
- /home/jseramn/.claude/skills/work-unit-commits/SKILL.md
- /home/jseramn/.claude/skills/chained-pr/SKILL.md (only the sizing and split guidance; do not open chained PRs unless your brief says so)
- /home/jseramn/.claude/skills/comment-writer/SKILL.md (tone for PR text)

## Final report (mandatory)
Before you finish, write a Markdown report to `/tmp/swarm/reports/<unit>.md` with a shell heredoc AND print the same text as your final message: `Branch`, `PR URL`, `Commits` (sha + subject), `Gates` (each command → pass/fail + key numbers), `Changed lines`, `Deviations from brief`, `Follow-ups`, `Blocked` (if any). Keep it factual; no filler.
