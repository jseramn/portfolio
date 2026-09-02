type CssBox = { left: number; top: number; width: number; height: number }

/** Map a pane's on-screen box onto the ASCII bitmap that sits behind it. */
export function behindRect(
  asciiW: number,
  asciiH: number,
  asciiCss: CssBox,
  hostCss: CssBox,
  mag = 1,
  occupied?: CssBox,
) {
  const scaleX = asciiW / Math.max(asciiCss.width, 1)
  const scaleY = asciiH / Math.max(asciiCss.height, 1)
  let sw = Math.max(1, (hostCss.width * scaleX) / mag)
  let sh = Math.max(1, (hostCss.height * scaleY) / mag)
  if (sw > asciiW) {
    sh *= asciiW / sw
    sw = asciiW
  }
  if (sh > asciiH) {
    sw *= asciiH / sh
    sh = asciiH
  }
  const cx = (hostCss.left + hostCss.width / 2 - asciiCss.left) * scaleX
  const cy = (hostCss.top + hostCss.height / 2 - asciiCss.top) * scaleY
  let sx = Math.min(Math.max(0, cx - sw / 2), Math.max(0, asciiW - sw))
  let sy = Math.min(Math.max(0, cy - sh / 2), Math.max(0, asciiH - sh))
  if (occupied && occupied.width >= 2 && occupied.height >= 2) {
    const ox = occupied.left
    const oy = occupied.top
    const ow = occupied.width
    const oh = occupied.height
    if (sw > ow) {
      sh *= ow / sw
      sw = ow
    }
    if (sh > oh) {
      sw *= oh / sh
      sh = oh
    }
    const padX = Math.min(ow / 2, Math.max(sw / 2, ow * 0.22))
    const padY = Math.min(oh / 2, Math.max(sh / 2, oh * 0.22))
    const ncx = Math.min(Math.max(cx, ox + padX), ox + ow - padX)
    const ncy = Math.min(Math.max(cy, oy + padY), oy + oh - padY)
    sx = Math.min(Math.max(ox, ncx - sw / 2), Math.max(ox, ox + ow - sw))
    sy = Math.min(Math.max(oy, ncy - sh / 2), Math.max(oy, oy + oh - sh))
  }
  return { sx, sy, sw, sh }
}
