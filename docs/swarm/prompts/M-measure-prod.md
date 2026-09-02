# Measurement overlay — production after #44/#43/#46

TARGET_URL: `https://www.jseramn.tech`
LABEL: `prod-r1`
Workspace: `/home/jseramn/portfolio-worktrees/swarm/integration-verify` (update to `origin/main` `824588c` if not already).

You are read-only. Do not edit product files, commit, or merge. Follow `/tmp/swarm/prompts/M-measure.md` against TARGET_URL.

Notes:
- Preview SSO blocks Vercel preview URLs; measure **production**.
- #46 restored HTML after `tinity` ReferenceError. Confirm `/` is a real HTML document (doctype, not 21-byte "Internal server error").
- Home still inlines CSS; `/about` should `<link>` `/_astro/globals.*.css`.
- `POST /api/contact` with `{}` + Origin must be JSON 4xx, never HTML 404.
- Hero Tinity CTA may be missing (`tinityPage.test.ts` href pin) — record as UNVERIFIED/FAIL, do not fix.
- U07 lazy-motion is NOT in this SHA; report JS/TBT vs budget honestly.

`--mode plan` is allowed. Write `/tmp/swarm/measure/prod-r1/report.md` and print it.
