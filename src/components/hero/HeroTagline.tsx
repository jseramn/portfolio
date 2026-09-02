import type { RefObject } from "react"
import { site } from "../../config/site"
import { GlassSurface } from "../GlassSurface"
import { GLOW } from "./chrome"
import { useScramble } from "./useScramble"

const DESC = site.tagline.en

export function HeroTagline({
  mouseContainer,
}: {
  mouseContainer: RefObject<HTMLDivElement | null>
}) {
  const desc = useScramble(DESC)

  return (
    <div data-hud-region="tagline" className="min-w-0 short:w-full">
      <GlassSurface
        preset="card"
        mouseContainer={mouseContainer}
        className="w-full md:w-auto short:min-w-0"
      >
        <p
          className={`hero-on-video font-sans text-base md:text-xl font-normal leading-relaxed hud:max-w-md text-left hud:text-right cursor-default ${GLOW} whitespace-pre-line short:whitespace-normal`}
          onMouseEnter={desc.start}
          onMouseLeave={desc.stop}
        >
          {desc.display}
        </p>
      </GlassSurface>
    </div>
  )
}
