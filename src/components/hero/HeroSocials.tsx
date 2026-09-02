import { site } from "../../config/site"
import { onOutboundSocial } from "../../lib/analytics/productCapture"
import { SOCIAL_ICONS } from "../icons"
import { CHROME_FOCUS, GLOW, HOME_NAV, TAP_TARGET } from "./chrome"

export function HeroTinity() {
  return (
    <a
      href={site.tinity.path}
      className={`hero-on-video ${TAP_TARGET} self-start w-max max-w-full md:shrink-0 font-sans text-2xl md:text-3xl font-semibold tracking-tight text-left cursor-pointer ${GLOW} ${CHROME_FOCUS}`}
      aria-label="Open Tinity"
    >
      <span className="underline decoration-transparent underline-offset-4 transition-[text-decoration-color] hover:decoration-[var(--hero-ink)]/50">
        tinity
      </span>
    </a>
  )
}

export function HeroSocials() {
  return (
    <div
      data-hud-region="socials"
      className="flex justify-center z-10 hud:absolute hud:left-8 hud:top-24 hud:bottom-auto hud:right-auto hud:translate-x-0 hud:justify-start short:shrink-0"
    >
      <div className="flex flex-col items-center gap-1">
        <div className="flex flex-row items-center gap-4 md:gap-5 short:gap-2">
          {site.socials.map((social) => {
            const Icon = SOCIAL_ICONS[social.icon]
            if (!Icon) return null
            const external = social.href.startsWith("http")
            return (
              <a
                key={social.id}
                href={social.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className={`hero-ink drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] ${GLOW} ${TAP_TARGET} hover:scale-125`}
                aria-label={social.id}
                onClick={() => onOutboundSocial(social.id)}
              >
                <Icon size={24} />
              </a>
            )
          })}
        </div>
        <nav aria-label="Site" className="flex flex-row items-center gap-1">
          {HOME_NAV.map((item, index) => (
            <span key={item.href} className="flex items-center gap-1">
              {index > 0 ? (
                <span className="hero-ink-muted font-mono text-sm" aria-hidden>
                  ·
                </span>
              ) : null}
              <a
                href={item.href}
                className={`hero-on-video font-mono text-sm ${TAP_TARGET} ${GLOW} ${CHROME_FOCUS}`}
              >
                {item.label}
              </a>
            </span>
          ))}
        </nav>
      </div>
    </div>
  )
}
