import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { stampSliceEnd } from "../../heroAsciiBudget"

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..")
const asciiDir = join(root, "src/lib/hero/ascii")
const heroDir = join(root, "src/lib/hero")

function lineCount(file: string): number {
  const text = readFileSync(file, "utf8")
  if (text.length === 0) return 0
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0)
}

function walkTs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walkTs(path)
    if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) return [path]
    return []
  })
}

describe("hero ASCII module split", () => {
  it("keeps every ascii module ≤200 LOC and the hero tree ≤300", () => {
    const asciiFiles = walkTs(asciiDir)
    expect(asciiFiles.length).toBeGreaterThan(5)
    for (const file of asciiFiles) {
      expect(lineCount(file), file).toBeLessThanOrEqual(200)
    }
    for (const file of walkTs(heroDir)) {
      expect(lineCount(file), file).toBeLessThanOrEqual(300)
    }
  })

  it("does not revive the dead poster blit path", () => {
    const src = walkTs(asciiDir)
      .map((file) => readFileSync(file, "utf8"))
      .join("\n")
    expect(src).not.toContain("blitHeroPoster")
    expect(src).not.toContain("coverDestRect")
    expect(src).not.toMatch(/\bposter\b/)
    expect(src).not.toContain("ascii-poster")
  })

  it("schedules stamp slices from the shared budget owner", () => {
    expect(stampSliceEnd(0, 40, 0, 1)).toBe(40)
    expect(stampSliceEnd(4, 40, 0, 20)).toBe(5)
  })
})
