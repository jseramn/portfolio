# Design: tinity-spine-sync

Astro 5 mounts `TinityApp` at `/tinity`. The React tree is the vendored `jseramn/tinity` `landing/src` copy. Portfolio-owned files: `TinityApp.tsx` (CSS imports), `parity.test.ts`, `.tinity-source.json`, `experience/AgentMark.test.ts`.

## Technical Approach

1. `pnpm tinity:pull` fetches `https://codeload.github.com/jseramn/tinity/tar.gz/<ref>` (default `main`) or copies `TINITY_SRC`.
2. Replace `src/tinity/**` except preserve list. Skip landing tests, `main.tsx`, and `vite-env.d.ts`.
3. Copy `landing/public/{llms.txt,index.md,changelog.md,design.md}` to `src/tinity/twins/` and emit `twins/content.ts` so middleware can import strings (no runtime `readFileSync` of `src/` on Vercel).
4. Copy favicon/mark/OG to `public/tinity/`. Generate `tinity-og.png` (1200×630) when the tarball has none.
5. Write `.tinity-source.json` (commit SHA + sha256 per file). `parity.test.ts` fails on local drift.
6. `/tinity` stays `prerender = false` so Accept markdown negotiation stays honest. Dotted twins are `prerender = true`.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| Sync | submodule / npm pack / tarball | Submodule friction; pack needs a publish | **GitHub tarball + TINITY_SRC** |
| Twins | only negotiation / only files / both | Agents fetch both the URL and `.md` | **Both** |
| Viewport | keep lockScroll / unlock | Spine is a scrolling marketing page | **Unlock** |
| H1 | sr-only + React / React only | Duplicate H1 is a lie once the caption is visible | **React only** |

## Risks

`TinityApp.tsx` is the only CSS import seam. A pull that forgets `marketing.css` will ship a lattice without the spine styles. The page test asserts the import. Parity does not hash that file, by design.
