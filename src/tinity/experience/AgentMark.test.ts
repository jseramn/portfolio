import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "AgentMark.tsx"),
  "utf8",
)

const PI_PIXEL_MARK = "M3 3H21V9H9V21H3Z M15 15H21V21H15Z"

describe("Tinity agent marks", () => {
  it("locks the official 3x3 Pi pixel geometry as an SVG path", () => {
    expect(source).toContain(`const PI_MARK = "${PI_PIXEL_MARK}"`)
    expect(source).toContain("M3 3H21V9H9V21H3Z")
    expect(source).toContain("M15 15H21V21H15Z")
    expect(source).not.toContain("M12 2.15A9.85")
    expect(source).not.toMatch(/<img[\s>]/)
    expect(source).not.toMatch(/pi-coding-agent.*\.(webp|png)/)
  })

  it("locks OpenHands as stroked line-art hands with sparkle ticks", () => {
    expect(source).toContain("M3.85 20.55")
    expect(source).toContain("M20.15 20.55")
    expect(source).toContain("M12 2.45V4.55")
    expect(source).not.toContain("M2 19Q2.3")
    expect(source).toContain('stroke="currentColor"')
  })

  it("locks Crush as a kawaii rounded star with face, trails, and sparkles", () => {
    expect(source).toContain("M12.04 6.99Q13.38 5.37")
    expect(source).toContain("M4.94 10.16L2.34 12.96")
    expect(source).toContain("M19.55 5.00")
    expect(source).not.toContain("M22.87 7.13")
    expect(source).not.toMatch(/Gemini_Generated_Image/)
  })

  it("locks Hermes as a stacked HERMES AGENT wordmark", () => {
    expect(source).toContain("M2.20 7.05H3.40V11.15H2.20Z")
    expect(source).toContain("M3.10 12.80L4.85 16.95")
    expect(source).not.toContain("M11.15 5.1h1.7v15.1")
  })

  it("locks dcode as the four-part LangChain geometric mark", () => {
    expect(source).toContain("M10.85 11.15C8.20 7.40")
    expect(source).toContain("M12.75 11.15L12.75 4.35")
    expect(source).not.toContain("M13.796 0")
  })

  it("locks aider as a dashed currentColor wordmark", () => {
    expect(source).toContain("M4.80 9.15H6.53")
    expect(source).toContain("M8.42 7.15H8.85")
    expect(source).not.toContain("M11.8 5.4A6.6")
  })

  it("locks grok-build as the xAI symbol, not the grok-bot head", () => {
    expect(source).toContain("M2.35 7.55L5.05 7.55")
    expect(source).not.toContain("M557.09 211.99")
    expect(source).toContain("M228.541 114.228")
  })

  it("locks OpenClaw as a round mascot with evenodd eye cutouts", () => {
    expect(source).toContain("M12 5.15A6.45 6.45")
    expect(source).toContain("M8.55 9.55A0.36")
    expect(source).toContain("M2.15 12.85A2.05")
    expect(source).not.toContain("M60 10 C30 10")
  })
})
