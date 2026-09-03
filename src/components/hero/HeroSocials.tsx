import { site } from "../../config/site"
import { onOutboundSocial } from "../../lib/analytics/productCapture"
import { SOCIAL_ICONS } from "../icons"
import { CHROME_FOCUS, GLOW, TAP_TARGET } from "./chrome"

export function HeroTinity() {
  return (
    <div
      data-hud-region="tinity"
      className="relative z-10 flex flex-col items-start self-start short:shrink-0 hud:absolute hud:left-8 hud:top-52"
    >
      <p className="hero-ink-muted font-mono text-xs md:text-sm" aria-hidden="true">
        building@jseramn:~$
      </p>
      <a
        href={site.tinity.path}
        className={`hero-on-video font-mono text-sm md:text-base inline-flex min-h-11 min-w-11 items-center justify-start ${GLOW} ${CHROME_FOCUS}`}
        aria-label="Open Tinity"
      >
        <span aria-hidden="true">&gt;&nbsp;</span>
        tinity
      </a>
    </div>
  )
}

export function HeroSocials() {
  return (
    <div
      data-hud-region="socials"
      className="flex justify-center z-10 hud:absolute hud:left-8 hud:top-24 hud:bottom-auto hud:right-auto hud:translate-x-0 hud:justify-start short:shrink-0"
    >
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
    </div>
  )
}
