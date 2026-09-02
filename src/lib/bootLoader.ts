import {
  ASCII_PAINT_ATTR,
  ASCII_PAINT_SELECTOR,
  BOOT_FALLBACK_ATTR,
  BOOT_FALLBACK_SELECTOR,
} from "./domSignals"

export const BOOT_LOADER_ID = "boot-loader"
export const BOOT_READY_EVENT = "hero:boot-ready"
export const BOOT_TIMEOUT_MS = 8_000
export { ASCII_PAINT_SELECTOR, BOOT_FALLBACK_ATTR, BOOT_FALLBACK_SELECTOR }

export type BootDismissInput = {
  ready: boolean
  timedOut: boolean
  pageshowPersisted: boolean
}

export function isHeroBootReady(root: { querySelector: (selector: string) => unknown }): boolean {
  return Boolean(
    root.querySelector(ASCII_PAINT_SELECTOR) || root.querySelector(BOOT_FALLBACK_SELECTOR),
  )
}

export function shouldDismissBootLoader(input: BootDismissInput): boolean {
  return input.ready || input.timedOut || input.pageshowPersisted
}

export function wipeAnimationEnabled(reducedMotion: boolean): boolean {
  return !reducedMotion
}

export function applyBootLoaderHidden(
  overlay: { hidden: boolean; setAttribute: (name: string, value: string) => void },
  html: { removeAttribute: (name: string) => void },
): void {
  overlay.hidden = true
  overlay.setAttribute("aria-hidden", "true")
  html.removeAttribute("aria-busy")
  html.removeAttribute("data-boot-pending")
}

export function signalHeroBootReady(target?: EventTarget | null): void {
  const dest = target ?? (typeof window === "undefined" ? null : window)
  if (!dest) return
  dest.dispatchEvent(new Event(BOOT_READY_EVENT))
}

export function takeFirstAsciiPaint(dataset: { asciiPaint?: string }): boolean {
  if (dataset.asciiPaint === "1") return false
  dataset.asciiPaint = "1"
  return true
}

export const BOOT_MUTATION_OBSERVER_INIT: MutationObserverInit = {
  subtree: true,
  childList: false,
  attributes: true,
  attributeFilter: [ASCII_PAINT_ATTR, BOOT_FALLBACK_ATTR],
}

export function isBootReadyAttributeTarget(target: unknown): boolean {
  if (!target || typeof target !== "object") return false
  const el = target as {
    getAttribute?: (name: string) => string | null
    hasAttribute?: (name: string) => boolean
  }
  if (typeof el.getAttribute !== "function" || typeof el.hasAttribute !== "function") return false
  return el.getAttribute(ASCII_PAINT_ATTR) === "1" || el.hasAttribute(BOOT_FALLBACK_ATTR)
}

export function bootReadyFromMutations(
  records: ReadonlyArray<{ type: string; target: unknown }>,
): boolean {
  for (const rec of records) {
    if (rec.type === "attributes" && isBootReadyAttributeTarget(rec.target)) return true
  }
  return false
}

export function createBootLoaderSession(opts: { hide: () => void }): {
  dismiss: () => void
  onReady: () => void
  onPageshow: (persisted: boolean) => void
  onTimeout: () => void
} {
  let done = false
  const dismiss = () => {
    if (done) return
    done = true
    opts.hide()
  }
  return {
    dismiss,
    onReady: dismiss,
    onPageshow: (persisted) => {
      if (persisted) dismiss()
    },
    onTimeout: dismiss,
  }
}

export function installBootLoader(
  doc: Document = document,
  win: Window & typeof globalThis = window,
): () => void {
  const overlay = doc.getElementById(BOOT_LOADER_ID)
  if (!overlay) return () => {}

  const html = doc.documentElement
  const session = createBootLoaderSession({
    hide: () => applyBootLoaderHidden(overlay, html),
  })

  const check = () => {
    if (isHeroBootReady(doc)) session.onReady()
  }

  const onReadyEvent = () => session.onReady()
  const onPageshow = (event: Event) => {
    session.onPageshow("persisted" in event && Boolean((event as PageTransitionEvent).persisted))
  }

  const observer = new MutationObserver((records) => {
    if (bootReadyFromMutations(records)) session.onReady()
  })
  observer.observe(html, BOOT_MUTATION_OBSERVER_INIT)
  win.addEventListener(BOOT_READY_EVENT, onReadyEvent)
  win.addEventListener("pageshow", onPageshow)
  const timeoutId = win.setTimeout(() => session.onTimeout(), BOOT_TIMEOUT_MS)
  check()

  return () => {
    observer.disconnect()
    win.removeEventListener(BOOT_READY_EVENT, onReadyEvent)
    win.removeEventListener("pageshow", onPageshow)
    win.clearTimeout(timeoutId)
  }
}
