import { site } from "../../config/site"
import { onOutboundOrg } from "../../lib/analytics/productCapture"
import { HeroMotionSlider } from "../heroMotionStatic"
import { CHROME_FOCUS, GLOW, MARQUEE_TRACK, MARQUEE_TYPE, TAP_TARGET } from "./chrome"
import { useGitHubStats } from "./useGitHubStats"

export function HeroMarquee({ motionChrome }: { motionChrome: boolean }) {
  const ghStats = useGitHubStats()

  return (
    <div
      data-hud-region="marquee"
      className="relative z-10 flex flex-col gap-2 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] hud:absolute hud:inset-x-0 hud:top-0 hud:flex-row hud:items-center hud:gap-4 hud:px-8 hud:pt-8 short:flex-row short:items-center short:gap-3"
    >
      <a
        href="/"
        aria-current="page"
        className={`hero-on-video font-mono text-sm ${TAP_TARGET} ${GLOW} ${CHROME_FOCUS} shrink-0 self-start hud:self-center`}
      >
        {site.brand}
      </a>
      <div className={`hud:flex-1 short:flex-1 ${MARQUEE_TRACK}`} data-marquee-fade="">
        <HeroMotionSlider ready={motionChrome}>
          <span className={MARQUEE_TYPE}>
            Hi, I am {site.name} — {site.locationLine}
          </span>
          <span className="hero-ink-muted font-mono">·</span>
          {site.marqueeOrgs.flatMap((org) => [
            "href" in org && org.href ? (
              <a
                key={org.label}
                href={org.href}
                target={org.href.startsWith("http") ? "_blank" : undefined}
                rel={org.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`${MARQUEE_TYPE} inline-flex min-h-11 items-center ${GLOW}`}
                onClick={() => onOutboundOrg(org.label)}
              >
                {org.label}
              </a>
            ) : (
              <span key={org.label} className={`${MARQUEE_TYPE} inline-flex min-h-11 items-center`}>
                {org.label}
              </span>
            ),
            <span key={`${org.label}-sep`} className="hero-ink-muted font-mono">
              ·
            </span>,
          ])}
          {ghStats && (
            <span className={MARQUEE_TYPE}>
              {ghStats.today} contributions today · {ghStats.month} this month · {ghStats.year}{" "}
              this year · {ghStats.total} all-time
            </span>
          )}
          {ghStats && <span className="hero-ink-muted font-mono">·</span>}
          {ghStats?.lastCommit && (
            <a
              href={ghStats.lastCommit.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${MARQUEE_TYPE} inline-flex min-h-11 items-center ${GLOW}`}
            >
              last commit: {ghStats.lastCommit.message} ({ghStats.lastCommit.repo})
            </a>
          )}
          {ghStats?.lastCommit && <span className="hero-ink-muted font-mono">·</span>}
        </HeroMotionSlider>
      </div>
    </div>
  )
}
