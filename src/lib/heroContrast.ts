export const HERO_INK_RGB = [232, 228, 217] as const
export const FALLBACK_FROST_BLACK_ALPHA = 0.72

export type Rgb = readonly [number, number, number]

function srgbChannelToLinear(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * srgbChannelToLinear(r) +
    0.7152 * srgbChannelToLinear(g) +
    0.0722 * srgbChannelToLinear(b)
  )
}

export function contrastRatio(fg: Rgb, bg: Rgb): number {
  const a = relativeLuminance(fg[0], fg[1], fg[2])
  const b = relativeLuminance(bg[0], bg[1], bg[2])
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

export function compositeSrcOver(src: Rgb, dst: Rgb, alpha: number): [number, number, number] {
  const t = 1 - alpha
  return [src[0] * alpha + dst[0] * t, src[1] * alpha + dst[1] * t, src[2] * alpha + dst[2] * t]
}
