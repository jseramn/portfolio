import { site } from "../../config/site"
import { GLOW } from "./chrome"
import { useScramble } from "./useScramble"

const DESC = site.tagline.en

export function HeroTagline() {
  const desc = useScramble(DESC)

  return (
    <div data-hud-region="tagline" className="min-w-0 short:w-full">
      <p
        className={`hero-on-video font-sans text-base md:text-xl font-normal leading-relaxed hud:max-w-md text-left hud:text-right cursor-default ${GLOW} whitespace-pre-line short:whitespace-normal`}
        onMouseEnter={desc.start}
        onMouseLeave={desc.stop}
      >
        {desc.display}
      </p>
    </div>
  )
}
