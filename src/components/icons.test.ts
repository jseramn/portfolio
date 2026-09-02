import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import {
  Check,
  Copy,
  ExternalLink,
  Github,
  Instagram,
  Linkedin,
  Mail,
  Shuffle,
  SkipBack,
  SkipForward,
  SOCIAL_ICONS,
  Twitter,
  Volume2,
  VolumeX,
  X,
  type IconComponent,
} from "./icons"

const fixture = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "icons.fixture.json"), "utf8"),
) as Record<string, string>

const ICONS: Record<string, IconComponent> = {
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Shuffle,
  X,
  Copy,
  Check,
  ExternalLink,
}

const CHILD_RE = /<(path|rect|circle|line|polygon)\b/g

function childCount(html: string): number {
  return html.match(CHILD_RE)?.length ?? 0
}

function svgClass(html: string): string {
  return html.match(/class="([^"]*)"/)?.[1] ?? ""
}

describe("local lucide SVG icons", () => {
  it("renders each icon with the lucide v0.454.0 SSR markup", () => {
    for (const [name, expected] of Object.entries(fixture)) {
      const html = renderToStaticMarkup(createElement(ICONS[name]))
      expect(html, name).toBe(expected)
      expect(childCount(html), `${name} child count`).toBe(childCount(expected))
      expect(svgClass(html), `${name} class`).toBe(svgClass(expected))
    }
  })

  it("forwards size, className, and aria-hidden used at call sites", () => {
    expect(
      renderToStaticMarkup(createElement(SkipBack, { size: 16, className: "md:w-5 md:h-5" })),
    ).toContain('width="16"')
    expect(
      renderToStaticMarkup(
        createElement(VolumeX, { size: 18, className: "md:w-[22px] md:h-[22px]" }),
      ),
    ).toBe(
      fixture.VolumeX.replace('width="24" height="24"', 'width="18" height="18"').replace(
        'class="lucide lucide-volume-x"',
        'class="lucide lucide-volume-x md:w-[22px] md:h-[22px]"',
      ),
    )
    expect(renderToStaticMarkup(createElement(X, { size: 20 }))).toContain('width="20"')
    expect(renderToStaticMarkup(createElement(Copy, { size: 16 }))).toContain('height="16"')
    expect(
      renderToStaticMarkup(createElement(ExternalLink, { size: 10, "aria-hidden": true })),
    ).toContain('aria-hidden="true"')
    expect(
      renderToStaticMarkup(
        createElement(Github, { size: 24, className: "md:w-[26px] md:h-[26px]" }),
      ),
    ).toContain("lucide lucide-github md:w-[26px] md:h-[26px]")
  })

  it("keeps SOCIAL_ICONS keys used by site.socials", () => {
    expect(Object.keys(SOCIAL_ICONS)).toEqual([
      "Github",
      "Twitter",
      "Linkedin",
      "Instagram",
      "Mail",
    ])
    for (const Icon of Object.values(SOCIAL_ICONS)) {
      expect(renderToStaticMarkup(createElement(Icon))).toMatch(/^<svg /)
    }
  })
})
