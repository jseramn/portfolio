import { lazy, Suspense } from "react"
import { site } from "../../config/site"
import { onHireCtaClicked } from "../../lib/analytics/productCapture"
import { HeroMotionRoles } from "../heroMotionStatic"
import { CHROME_FOCUS, GLOW } from "./chrome"
import { HeroTinity } from "./HeroSocials"

const ContactModal = lazy(() =>
  import("../ContactModal").then((mod) => ({ default: mod.ContactModal })),
)

const PROFESSIONS = site.roles

export function HeroContactLayer({
  open,
  onClose,
  contextRole,
}: {
  open: boolean
  onClose: () => void
  contextRole: string
}) {
  if (!open) return null
  return (
    <Suspense fallback={null}>
      <ContactModal open={open} onClose={onClose} contextRole={contextRole} />
    </Suspense>
  )
}

export function HeroHire({
  motionChrome,
  contactOpen,
  onOpenContact,
  onRoleIndexChange,
}: {
  motionChrome: boolean
  contactOpen: boolean
  onOpenContact: () => void
  onRoleIndexChange: (index: number) => void
}) {
  return (
    <div data-hud-region="roles">
      <div className="flex flex-col gap-3 self-start hud:flex-row hud:items-end hud:gap-4">
        <button
          type="button"
          onClick={() => {
            onHireCtaClicked()
            onOpenContact()
          }}
          className={`hero-on-video group inline-flex min-h-11 min-w-[18ch] w-max max-w-full md:shrink-0 items-center gap-3 whitespace-nowrap text-left cursor-pointer short:flex-col short:items-start short:gap-0 ${GLOW} ${CHROME_FOCUS}`}
          aria-label="Hire / Contact"
        >
          <span className="font-mono text-sm font-normal tracking-normal">hire →</span>
          <span
            aria-hidden="true"
            className="font-sans text-2xl md:text-3xl font-semibold tracking-tight"
          >
            <HeroMotionRoles
              ready={motionChrome}
              onIndexChange={onRoleIndexChange}
              paused={contactOpen}
            >
              {PROFESSIONS.map((p) => (
                <span
                  key={p}
                  className="underline decoration-transparent underline-offset-4 transition-[text-decoration-color] group-hover:decoration-[var(--hero-ink)]/50"
                >
                  {p}
                </span>
              ))}
            </HeroMotionRoles>
          </span>
        </button>
        <HeroTinity />
      </div>
    </div>
  )
}
