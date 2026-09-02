import { behindRect } from "./behindRect"
import { getPumpAscii, registerGlassJob } from "./pump"
import { isAsciiReadyForGlass, readGlassBox, readGlassGen } from "../domSignals"

export function attachGlassRefraction(
  host: HTMLElement,
  dest: HTMLCanvasElement,
  frostPx: number,
  useLiveGlass: boolean,
): () => void {
  if (!useLiveGlass) return () => {}

  let cancelled = false
  let boot = 0
  let tries = 0
  let lastGen = ""
  let lastPos = ""

  const bindFilter = () => {
    const filterEl = host.querySelector("filter")
    const rect = host.getBoundingClientRect()
    host.style.setProperty("--glass-frost", `${frostPx}px`)
    const svg = filterEl?.closest("svg")
    if (svg) {
      svg.style.overflow = "visible"
      svg.style.width = `${rect.width}px`
      svg.style.height = `${rect.height}px`
    }
    return Boolean(filterEl?.id)
  }

  const paint = () => {
    if (cancelled) return
    const { canvas: ascii, rect: ar } = getPumpAscii()
    const ready = Boolean(ascii && ar && isAsciiReadyForGlass(ascii))
    if (!ready) {
      return
    }
    if (!ascii || !ar) return
    const hr = host.getBoundingClientRect()
    const w = Math.max(1, Math.round(hr.width))
    const h = Math.max(1, Math.round(hr.height))
    if (w < 1 || h < 1) return
    const gen = readGlassGen(ascii)
    const pos = `${Math.round(hr.left)},${Math.round(hr.top)}`
    if (gen === lastGen && dest.width === w && dest.height === h && pos === lastPos) {
      return
    }
    lastGen = gen
    lastPos = pos
    if (dest.width !== w) dest.width = w
    if (dest.height !== h) dest.height = h
    const ctx = dest.getContext("2d")
    if (!ctx) return
    const boxRaw = readGlassBox(ascii)
    const boxParts = boxRaw.split(",").map(Number)
    const occupied =
      boxParts.length === 4 &&
      boxParts.every((n) => Number.isFinite(n) && n >= 0) &&
      boxParts[2] >= 2 &&
      boxParts[3] >= 2
        ? { left: boxParts[0], top: boxParts[1], width: boxParts[2], height: boxParts[3] }
        : undefined
    const lens = behindRect(ascii.width, ascii.height, ar, hr, 1.25, occupied)
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(ascii, lens.sx, lens.sy, lens.sw, lens.sh, 0, 0, w, h)
  }

  const waitForFilter = () => {
    if (cancelled) return
    if (bindFilter() || tries++ > 90) return
    boot = requestAnimationFrame(waitForFilter)
  }

  const unregister = registerGlassJob(paint)
  boot = requestAnimationFrame(waitForFilter)
  const ro = new ResizeObserver(() => {
    if (!cancelled) bindFilter()
  })
  ro.observe(host)
  return () => {
    cancelled = true
    cancelAnimationFrame(boot)
    unregister()
    ro.disconnect()
  }
}
