#!/usr/bin/env bash
# Generate OG/favicon/PWA preview assets from a full-page site snapshot.
# Does NOT run during `pnpm build`.
#
# Usage:
#   scripts/generate-preview-assets.sh path/to/hero-1920x1080.png
#   NODE_PATH=/path/to/node_modules CAPTURE=1 scripts/generate-preview-assets.sh

set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
public="$root/public"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

source_png="${1:-}"
chrome_path="${CHROME_PATH:-$HOME/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome}"
capture_url="${CAPTURE_URL:-https://jseramn.tech/}"

wait_and_capture() {
  local out="$1"
  node --input-type=module - "$chrome_path" "$capture_url" "$out" <<'NODE'
import puppeteer from "puppeteer-core"

const [chromePath, url, out] = process.argv.slice(2)

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--window-size=1920,1080",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--hide-scrollbars",
  ],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
})

try {
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 })
  await page.waitForFunction(
    () => {
      const el = document.querySelector(".hero-ascii-display")
      if (!(el instanceof HTMLCanvasElement) || !el.width || !el.height) return false
      const boot = document.getElementById("boot-loader")
      if (boot && !boot.hidden) return false
      const ctx = el.getContext("2d")
      if (!ctx) return false
      const { width: w, height: h } = el
      const sampleW = Math.min(w, 160)
      const sampleH = Math.min(h, 160)
      const sx = Math.floor((w - sampleW) / 2)
      const sy = Math.floor((h - sampleH) / 2)
      const data = ctx.getImageData(sx, sy, sampleW, sampleH).data
      let lit = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] + data[i + 1] + data[i + 2] > 12) lit++
      }
      return lit / (sampleW * sampleH) > 0.02
    },
    { timeout: 20_000 },
  )
  await new Promise((resolve) => setTimeout(resolve, 400))
  await page.screenshot({ path: out, type: "png", captureBeyondViewport: false })
} finally {
  await browser.close()
}
NODE
}

if [[ "${CAPTURE:-}" == "1" || -z "$source_png" ]]; then
  if [[ -n "$source_png" && "${CAPTURE:-}" != "1" ]]; then
    :
  elif [[ ! -x "$chrome_path" ]]; then
    echo "error: Chrome not found at $chrome_path" >&2
    echo "pass a source PNG: $0 path/to/snapshot.png" >&2
    exit 1
  else
    source_png="$tmp/hero-1920x1080.png"
    wait_and_capture "$source_png"
  fi
fi

if [[ ! -f "$source_png" ]]; then
  echo "error: source PNG not found: $source_png" >&2
  exit 1
fi

identify -format "source %wx%h %b\n" "$source_png"

# Open Graph / Twitter: 1.91:1 → 1200x630
magick "$source_png" -gravity center -crop 1920x1005+0+0 +repage \
  -resize 1200x630! -strip PNG32:"$tmp/thumbnail.png"
if command -v pngquant >/dev/null 2>&1; then
  pngquant --force --quality=70-95 --output "$public/thumbnail.png" "$tmp/thumbnail.png"
else
  magick "$tmp/thumbnail.png" -define png:compression-level=9 PNG32:"$public/thumbnail.png"
fi

# ASCII portrait square (below top chrome, center-right of a 1920x1080 frame)
magick "$source_png" -crop 800x800+560+140 +repage PNG32:"$tmp/portrait-sq.png"

magick "$tmp/portrait-sq.png" -resize 180x180! -strip PNG32:"$public/apple-touch-icon.png"
magick "$tmp/portrait-sq.png" -resize 192x192! -strip PNG32:"$public/android-chrome-192x192.png"
magick "$tmp/portrait-sq.png" -resize 512x512! -strip PNG32:"$public/android-chrome-512x512.png"
magick "$tmp/portrait-sq.png" -resize 32x32! -sigmoidal-contrast 3x50% -strip PNG32:"$public/favicon.png"

magick "$tmp/portrait-sq.png" \
  \( -clone 0 -resize 16x16 -sigmoidal-contrast 3x50% \) \
  \( -clone 0 -resize 32x32 -sigmoidal-contrast 3x50% \) \
  \( -clone 0 -resize 48x48 -sigmoidal-contrast 3x50% \) \
  -delete 0 -strip "$public/favicon.ico"

cat > "$public/site.webmanifest" <<'EOF'
{
  "name": "José Ramón García Del Risco",
  "short_name": "jseramn",
  "description": "Helping people with technology while I build things",
  "lang": "en",
  "id": "/",
  "scope": "/",
  "start_url": "/",
  "display": "browser",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
EOF

echo "generated:"
identify "$public/thumbnail.png" "$public/favicon.png" "$public/apple-touch-icon.png" \
  "$public/android-chrome-192x192.png" "$public/android-chrome-512x512.png" \
  "$public/favicon.ico"
ls -l "$public/thumbnail.png" "$public/favicon.svg" "$public/site.webmanifest"
