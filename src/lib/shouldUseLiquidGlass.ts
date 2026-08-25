export function shouldUseLiquidGlass(userAgent: string, reducedMotion: boolean): boolean {
  if (!userAgent) return false
  if (reducedMotion) return false

  const isSafari = /Safari/.test(userAgent) && !/Chrome|Chromium|Edg|OPR/.test(userAgent)
  if (isSafari) return false

  if (/Firefox|FxiOS/.test(userAgent)) return false

  return true
}
