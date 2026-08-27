export function chromiumRuntimeHint(
  userAgent: string,
  chromeObject: boolean,
  brands: readonly string[] = [],
): boolean {
  if (/CriOS/.test(userAgent)) return false
  if (chromeObject) return true
  return brands.some((brand) => /Chromium|Google Chrome|Microsoft Edge|Opera/.test(brand))
}

export function shouldUseLiquidGlass(
  userAgent: string,
  reducedMotion: boolean,
  chromiumRuntime = false,
  pointerCoarse = false,
): boolean {
  if (!userAgent) return false
  if (reducedMotion) return false
  if (pointerCoarse) return false
  if (/Firefox|FxiOS/.test(userAgent)) return false
  if (/CriOS/.test(userAgent)) return false

  const isSafari = /Safari/.test(userAgent) && !/Chrome|Chromium|Edg|OPR/.test(userAgent)
  if (isSafari && !chromiumRuntime) return false

  return true
}
