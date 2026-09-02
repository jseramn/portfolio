export const GLOW =
  "transition-all duration-300 hover:drop-shadow-[0_0_14px_rgba(0,0,0,0.75)] hover:text-[var(--hero-ink-hover)]"
export const TAP_TARGET = "inline-flex min-h-11 min-w-11 items-center justify-center"
export const CHROME_FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--hero-ink)]"
export const MARQUEE_TYPE = "hero-on-video font-mono text-sm md:text-base whitespace-nowrap"
export const MARQUEE_TRACK = "w-full min-w-0 overflow-hidden marquee-edge-fade"
export const HOME_NAV = [
  { href: "/about", label: "about" },
  { href: "/contact", label: "contact" },
] as const
export const CHARS = "!@#$%^&*()_+-=[]{}|;:,./<>?`~abcdefghijklmnopqrstuvwxyz0123456789"
