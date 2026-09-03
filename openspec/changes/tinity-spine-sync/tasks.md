# Tasks: tinity-spine-sync

## Review Workload Forecast

Estimated changed lines: above the 400-line review budget (`size:exception`) because the first pull vendors the landing spine.

## Phase A: Pull and twins

- [x] A.1 `scripts/tinity-pull.mjs` + `tinity:pull` + parity test
- [x] A.2 First pull (`TINITY_SRC` until tinity `main` has the spine)
- [x] A.3 Drop `lockScroll` and the sr-only H1; import `marketing.css`
- [x] A.4 Twin endpoints + `toMarkdown("tinity")` reads `twins/index.md`
- [x] A.5 Layout favicon, OG, alternate markdown, SoftwareSourceCode, `tinity-state`
- [x] A.6 `public/llms.txt` lists `/tinity` twins
- [x] A.7 Skills + this OpenSpec change
