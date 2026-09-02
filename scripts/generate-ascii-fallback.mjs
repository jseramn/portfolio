import { spawnSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import { register } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
register(pathToFileURL(join(here, "resolve-ts-specifiers.mjs")), import.meta.url)

const { FALLBACK_COLS, FALLBACK_ROWS, firstNonBlackRgbFrame, rgb24ToRgba, svgFromRgbaFrame } =
  await import("../src/lib/heroAsciiFallback.ts")

const ff = spawnSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    join(here, "../public/videobg-480.mp4"),
    "-frames:v",
    "120",
    "-vf",
    `scale=${FALLBACK_COLS}:${FALLBACK_ROWS}:force_original_aspect_ratio=increase:flags=area,crop=${FALLBACK_COLS}:${FALLBACK_ROWS}`,
    "-pix_fmt",
    "rgb24",
    "-f",
    "rawvideo",
    "pipe:1",
  ],
  { encoding: "buffer", maxBuffer: 8_000_000 },
)
if (ff.status !== 0) throw new Error(String(ff.stderr || `ffmpeg ${ff.status}`))
const rgb = firstNonBlackRgbFrame(new Uint8Array(ff.stdout), FALLBACK_COLS, FALLBACK_ROWS)
writeFileSync(
  join(here, "../public/ascii-fallback.svg"),
  svgFromRgbaFrame(rgb24ToRgba(rgb), FALLBACK_COLS, FALLBACK_ROWS),
)
