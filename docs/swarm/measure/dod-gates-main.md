# DoD gates on current main — ddf3540

Worktree: `/home/jseramn/portfolio-worktrees/swarm/dod-gates-main`
Branch: `swarm/dod-gates-main` tracking `origin/main`
Label purpose: prove DoD gates on current main, not to change code.
No product edits, commits, pushes, merges, PRs, Lighthouse www, or Three/Motion startup.
`AGENT_BASE_URL=http://127.0.0.1:1`. Playwright `PLAYWRIGHT_PORT=4470` (webServer exited; no leftover listener on 4470).

## SHA

- `git rev-parse HEAD` → `ddf35409cc0ea8cfd4beddc0953efcdb4b35d97f`
- `git log -1 --oneline` → `ddf3540 docs(swarm): record prod-r5 and match live transfer PASS (#60)`

## PR URL

n.a. (read-only verification; no PR opened)

## Commits

None authored. HEAD is origin/main as given.

## Gates

| Command | Result | Key numbers |
|---|---|---|
| `pnpm install --frozen-lockfile` | PASS | exit 0; 611 packages added (reused store); pnpm 11.24.0; 2.3s |
| `pnpm exec tsc --noEmit` | PASS | exit 0 |
| `pnpm test` | PASS | exit 0; Vitest 4.1.11; **53 files, 245 tests** passed; 3.62s |
| `pnpm exec astro check` | PASS | exit 0; **0 errors, 0 warnings, 10 hints**; 187 files |
| `pnpm exec biome check .` | PASS | exit 0; **0 errors, 41 warnings**; 156 files; 445ms. Warnings OK per brief. |
| `flock /tmp/swarm/build.lock -c "pnpm build"` | PASS | exit 0; full script (`sync-vercel-security-headers` + `generate-llms-full` + `astro build`); server built 6.15s; local Node 24 / Vercel functions Node 22 warning (not a fail) |
| `git diff -- vercel.json` | PASS | empty (sync rewrote file to identical bytes) |
| `flock /tmp/swarm/build.lock -c "pnpm test:e2e"` (`PLAYWRIGHT_PORT=4470`, `AGENT_BASE_URL=http://127.0.0.1:1`) | PASS | exit 0; **72 passed, 4 skipped** (1.6m); 76 tests / 1 worker |

`pnpm check` (`lint && typecheck && test`) was not run as one script; `lint` would still PASS here because biome is 0 errors.

## vercel.json dirty?

No. `git diff -- vercel.json` empty after full `pnpm build`. Working tree clean vs `origin/main`.

## e2e passed / skipped (including modal trap)

**72 passed, 4 skipped.** Skips are chromium-only screenshot/FOUC tests on non-chromium projects:

- `[mobile]` focused skip link screenshots
- `[mobile]` secondary pages ship a stylesheet and paint black at 390 without FOUC
- `[landscape-phone]` focused skip link screenshots
- `[landscape-phone]` secondary pages ship a stylesheet and paint black at 390 without FOUC

**Home modal test present and passing on all three UI projects:**

- `[chromium] › e2e/home.spec.ts:296:5 › home chrome: boot loader, landmarks, contact modal`
- `[mobile] › e2e/home.spec.ts:296:5 › home chrome: boot loader, landmarks, contact modal`
- `[landscape-phone] › e2e/home.spec.ts:296:5 › home chrome: boot loader, landmarks, contact modal`

That test covers: dialog `role=dialog` `aria-modal=true`; Escape hides; Tab stays inside dialog (focus trap, 12 Tab presses); Escape restores focus to Hire / Contact.

## Changed lines

0 (read-only; no product edits)

## Deviations from brief

None. All seven required commands ran. Did not Lighthouse www. Did not start Three/Motion. Did not commit/push/merge/PR/promote.

## Follow-ups

None required for this label. Main at `ddf3540` is DoD-gate green.

## Blocked

None.
