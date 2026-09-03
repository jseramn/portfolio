import { site } from "../../config/site"
import { onOutboundOrg } from "../../lib/analytics/productCapture"
import { HeroMotionSlider } from "../heroMotionStatic"
import { GLOW, MARQUEE_TRACK, MARQUEE_TYPE } from "./chrome"
import { useGitHubStats } from "./useGitHubStats"

export function HeroMarquee({ motionChrome }: { motionChrome: boolean }) {
  const ghStats = useGitHubStats()

  return (
    <div
      data-hud-region="marquee"
      className="relative z-10 flex flex-row items-center px-4 pt-[max(1.25rem,env(safe-area-inset-top))] hud:absolute hud:inset-x-0 hud:top-0 hud:px-8 hud:pt-8"
    >
      <div className={MARQUEE_TRACK} data-marquee-fade="">
        <HeroMotionSlider ready={motionChrome}>
          <span className={MARQUEE_TYPE}>
            Hi, I am {site.name} — {site.locationLine}
          </span>
          <span className="hero-ink-muted font-mono inline-flex items-center">·</span>
          {site.marqueeOrgs.flatMap((org) => [
            "href" in org && org.href ? (
              <a
                key={org.label}
                href={org.href}
                target={org.href.startsWith("http") ? "_blank" : undefined}
                rel={org.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`${MARQUEE_TYPE} min-h-11 ${GLOW}`}
                onClick={() => onOutboundOrg(org.label)}
              >
                {org.label}
              </a>
            ) : (
              <span key={org.label} className={`${MARQUEE_TYPE} min-h-11`}>
                {org.label}
              </span>
            ),
            <span
              key={`${org.label}-sep`}
              className="hero-ink-muted font-mono inline-flex items-center"
            >
              ·
            </span>,
          ])}
          {ghStats && (
            <span className={MARQUEE_TYPE}>
              {ghStats.today} contributions today · {ghStats.month} this month · {ghStats.year}{" "}
              this year · {ghStats.total} all-time
            </span>
          )}
          {ghStats && <span className="hero-ink-muted font-mono inline-flex items-center">·</span>}
          {ghStats?.lastCommit && (
            <a
              href={ghStats.lastCommit.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${MARQUEE_TYPE} min-h-11 ${GLOW}`}
            >
              last commit: {ghStats.lastCommit.message} ({ghStats.lastCommit.repo})
            </a>
          )}
          {ghStats?.lastCommit && (
            <span className="hero-ink-muted font-mono inline-flex items-center">·</span>
          )}
        </HeroMotionSlider>
      </div>
    </div>
  )
}
