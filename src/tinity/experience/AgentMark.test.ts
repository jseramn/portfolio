import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { AGENTS } from "./agents"

const dir = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(dir, "AgentMark.tsx"), "utf8")
const marksDir = join(dir, "marks")

describe("Tinity agent marks", () => {
  it("ships one raster file per catalog id", () => {
    const files = readdirSync(marksDir).filter((name) => name.endsWith(".png"))
    expect(files.sort()).toEqual(AGENTS.map((agent) => `${agent.id}.png`).sort())
    for (const agent of AGENTS) {
      expect(existsSync(join(marksDir, `${agent.id}.png`))).toBe(true)
    }
  })

  it("renders catalog marks as linked img rasters, not hand-drawn svg paths", () => {
    expect(source).toMatch(/<img/)
    expect(source).toMatch(/className="cube-mark"/)
    expect(source).not.toMatch(/const PI_MARK/)
    expect(source).not.toMatch(/GROK_BOT_HEAD/)
    expect(source).not.toMatch(/<svg/)
    expect(source).not.toMatch(/<path /)
    for (const agent of AGENTS) {
      expect(source).toContain(`./marks/${agent.id}.png`)
    }
  })
})
