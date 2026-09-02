import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { pageFromPath, toMarkdown } from "./markdown"
import { buildLlmsFullTxt, LLMS_FULL_PAGE_PATHS } from "./llmsFull"

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..")

describe("llms-full.txt corpus", () => {
  it("concatenates negotiated markdown for home, about, and contact under origin headings", () => {
    const body = buildLlmsFullTxt()
    expect(LLMS_FULL_PAGE_PATHS).toEqual(["/", "/about", "/contact"])
    expect(body).toContain("## https://jseramn.tech/")
    expect(body).toContain("## https://jseramn.tech/about")
    expect(body).toContain("## https://jseramn.tech/contact")
    for (const path of LLMS_FULL_PAGE_PATHS) {
      const page = pageFromPath(path)
      expect(page).toBeTruthy()
      if (!page) continue
      expect(body).toContain(toMarkdown(page).trimEnd())
    }
    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(50_000)
    expect(body.endsWith("\n")).toBe(true)
    expect(buildLlmsFullTxt()).toBe(body)
  })

  it("omits legal pages until pageFromPath maps them", () => {
    expect(pageFromPath("/policy")).toBeNull()
    expect(pageFromPath("/terms")).toBeNull()
    expect(pageFromPath("/data-deletion")).toBeNull()
    const body = buildLlmsFullTxt()
    expect(body).not.toContain("## https://jseramn.tech/policy")
    expect(body).not.toContain("## https://jseramn.tech/terms")
    expect(body).not.toContain("## https://jseramn.tech/data-deletion")
  })

  it("keeps the committed public file identical to the generator", () => {
    const committed = readFileSync(join(root, "public/llms-full.txt"), "utf8")
    expect(committed).toBe(buildLlmsFullTxt())
  })

  it("runs from the build script before astro build", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      scripts: { build: string }
    }
    const { build } = pkg.scripts
    expect(build).toContain("scripts/generate-llms-full.mjs")
    expect(build.indexOf("generate-llms-full.mjs")).toBeLessThan(build.indexOf("astro build"))
    const script = readFileSync(join(root, "scripts/generate-llms-full.mjs"), "utf8")
    expect(script).toContain("buildLlmsFullTxt")
    expect(script).toContain("public/llms-full.txt")
  })
})
