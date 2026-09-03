# Proposal: tinity-spine-sync

## Intent

Keep `jseramn.tech/tinity` in lockstep with `jseramn/tinity` `landing/` after the agentic marketing spine. The portfolio owns the Astro page, twin endpoints, markdown negotiation, and a pull script. The landing tree under `src/tinity` is a vendored copy, except `TinityApp.tsx`.

## Proposal question round

Locked:

1. **One page** at `/tinity`. Hash sections. Windows `?w=`. Agent surface `?surface=agent`.
2. **Source of truth** is `jseramn/tinity` `landing/`. Production is this repo. Sync is `pnpm tinity:pull`.
3. **Do not lock scroll** on `/tinity`. The visible H1 lives in the React spine. Drop the sr-only duplicate.
4. **Twins** at `/tinity/index.md`, `/tinity/changelog.md`, `/tinity/design.md`, `/tinity/llms.txt`. `Accept: text/markdown` on `/tinity` reads the overview twin.

## Scope

### In Scope

- `scripts/tinity-pull.mjs` and `src/tinity/parity.test.ts`
- Astro page, Layout favicon/OG/JSON-LD, twin endpoints, middleware markdown
- `public/llms.txt` entries, skills + OpenSpec mirror

### Out of Scope

- Editing `src/tinity/components/canvasui/*`
- Changing the homepage Tinity HUD control
- Merging `jseramn/tinity` itself

## Capabilities

- `tinity-pull`: tarball or `TINITY_SRC` checkout → `src/tinity` + `src/tinity/twins` + `public/tinity`
- `tinity-twins`: prerendered dotted routes + negotiated markdown on `/tinity`
