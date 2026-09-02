import { lazy, Suspense, type RefObject } from "react"
import { site } from "../../config/site"
import { onHireCtaClicked } from "../../lib/analytics/productCapture"
import { GlassSurface } from "../GlassSurface"
import { HeroMotionRoles } from "../heroMotionStatic"
import { GLOW } from "./chrome"
import { HeroTinity } from "./HeroSocials"

const ContactModal = lazy(() =>
  import("../ContactModal").then((mod) => ({ default: mod.ContactModal })),
)

const PROFESSIONS = site.roles

export function HeroContactLayer({
  open,
  onClose,
  contextRole,
  mouseContainer,
}: {
  open: boolean
  onClose: () => void
  contextRole: string
  mouseContainer: RefObject<HTMLDivElement | null>
}) {
  if (!open) return null
  return (
    <Suspense fallback={null}>
      <ContactModal
        open={open}
        onClose={onClose}
        contextRole={contextRole}
        mouseContainer={mouseContainer}
      />
    </Suspense>
  )
}

export function HeroHire({
  mouseContainer,
  motionChrome,
  contactOpen,
  onOpenContact,
  onRoleIndexChange,
}: {
  mouseContainer: RefObject<HTMLDivElement | null>
  motionChrome: boolean
  contactOpen: boolean
  onOpenContact: () => void
  onRoleIndexChange: (index: number) => void
}) {
  return (
    <div data-hud-region="roles">
      <div className="flex flex-col gap-3 self-start hud:flex-row hud:items-end hud:gap-4">
        <GlassSurface
          preset="button"
          mouseContainer={mouseContainer}
          className="self-start w-max max-w-full md:shrink-0"
        >
          <button
            type="button"
            onClick={() => {
              onHireCtaClicked()
              onOpenContact()
            }}
            className={`hero-on-video group inline-flex min-h-11 items-center gap-3 whitespace-nowrap text-left cursor-pointer short:flex-col short:items-start short:gap-0 ${GLOW}`}
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
        </GlassSurface>
        <HeroTinity mouseContainer={mouseContainer} />
      </div>
    </div>
  )
}
