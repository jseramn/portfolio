# Unit — Tinity markdown negotiation (CTA is in U07)

WORKTREE: `/home/jseramn/portfolio-worktrees/swarm/tinity-md` — branch `swarm/tinity-md` from **`origin/main` after U07 (#47) is squash-merged**. PR against `main`. Do not start while U07 is open.

Homepage Tinity CTA (`href={site.tinity.path}`, `aria-label="Open Tinity"`) is already in PR #47 commit `c684e2a`. **Do not edit `Hero.tsx`.**

## Evidence
Wave 3 prod-r1: `Accept: text/markdown` is 200 markdown on `/`, `/about`, `/contact`, `/policy`, `/terms`, `/data-deletion`, and 404, but **`/tinity` returns 200 `text/html`**. `src/lib/agent/markdown.ts` `pageFromPath` has no `tinity` arm; middleware then `next()`s HTML. DoD: markdown on every public HTML page. Cite `src/tinity/experience/copy.ts` `MANIFESTO` / `src/lib/agent/copy.ts` Tinity paragraph. `/tmp/swarm/measure/prod-r1/agentic-curls.md` check 4.

## Task
1. `feat(agent): negotiate markdown for /tinity` — map `/tinity` in `pageFromPath` + `toMarkdown` (short experiment page: title, manifesto, repo link, not the WebGL internals).
2. Tests: Vitest `pageFromPath("/tinity")`; html/markdown tests; do **not** add live-fetch against :4321.
3. Optional: `/llms.txt` already lists `/tinity` — only touch if the corpus heading is missing.

## Acceptance
- `curl -sSI -H 'Accept: text/markdown' https://www.jseramn.tech/tinity` on the preview is `content-type: text/markdown`. Authored diff ≤ 80 lines.
- PR title: `feat(agent): markdown for /tinity`.

## Out of scope
Hero CTA, Tinity WebGL, Layout, U14.
