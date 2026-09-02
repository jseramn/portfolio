export const HERO_ROOT_ATTR = "data-hero-root"
export const HERO_ROOT_SELECTOR = `[${HERO_ROOT_ATTR}]`
export const HERO_ASCII_DISPLAY_CLASS = "hero-ascii-display"
export const HERO_ASCII_CANVAS_SELECTOR = `${HERO_ROOT_SELECTOR} > .${HERO_ASCII_DISPLAY_CLASS}`
export const ASCII_PAINT_ATTR = "data-ascii-paint"
export const ASCII_PAINT_SELECTOR = `canvas.${HERO_ASCII_DISPLAY_CLASS}[${ASCII_PAINT_ATTR}]`
export const CONTACT_MODAL_OPEN_ATTR = "data-contact-modal-open"
export const CONTACT_MODAL_OPEN_SELECTOR = `[${CONTACT_MODAL_OPEN_ATTR}]`
export const ARIA_MODAL_ATTR = "aria-modal"
export const DIALOG_MODAL_SELECTOR = `[role="dialog"][${ARIA_MODAL_ATTR}="true"]`
export const BOOT_FALLBACK_ATTR = "data-hero-boot-fallback"
export const BOOT_FALLBACK_SELECTOR = `[${BOOT_FALLBACK_ATTR}]`

type QueryRoot = { querySelector: (selector: string) => unknown }

export function getHeroRoot(doc: QueryRoot): HTMLElement | null {
  return (doc.querySelector(HERO_ROOT_SELECTOR) as HTMLElement | null) ?? null
}

export function getAsciiCanvas(doc: QueryRoot): HTMLCanvasElement | null {
  return (doc.querySelector(HERO_ASCII_CANVAS_SELECTOR) as HTMLCanvasElement | null) ?? null
}

export function isUiBlockingOverlayOpen(doc: QueryRoot): boolean {
  return Boolean(
    doc.querySelector(CONTACT_MODAL_OPEN_SELECTOR) || doc.querySelector(DIALOG_MODAL_SELECTOR),
  )
}
