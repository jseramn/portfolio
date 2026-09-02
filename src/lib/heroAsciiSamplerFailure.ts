import { BOOT_FALLBACK_ATTR } from "./domSignals"

export function applyHeroSamplerFailure(
  host: { setAttribute: (name: string, value: string) => void },
  stopLoop: () => void,
): void {
  stopLoop()
  host.setAttribute(BOOT_FALLBACK_ATTR, "")
}
