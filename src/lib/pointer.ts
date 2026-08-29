export function isPointerCoarse(
  matchMedia: typeof globalThis.matchMedia | undefined = globalThis.matchMedia,
): boolean {
  if (typeof matchMedia !== "function") return false
  try {
    return Boolean(matchMedia.call(globalThis, "(pointer: coarse)").matches)
  } catch {
    return false
  }
}
