import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { TINIT_AGENT_FILES_SOURCE } from "../src/lib/security/siteSecurityHeaders.mjs"
import { DEFAULT_REF, PRESERVE, TARBALL_HOST, TWIN_NAMES } from "./tinity-pull.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")

describe("tinity:pull", () => {
  it("is wired as a package script and fetches the GitHub tarball of main", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      scripts: Record<string, string>
    }
    expect(pkg.scripts["tinity:pull"]).toBe("node scripts/tinity-pull.mjs")
    const source = readFileSync(join(here, "tinity-pull.mjs"), "utf8")
    expect(source).toContain(TARBALL_HOST)
    expect(source).toContain("/tar.gz/")
    expect(source).toContain("DEFAULT_REPO")
    expect(DEFAULT_REF).toBe("main")
    expect(source).toContain("TINITY_SRC")
    expect(source).toContain("TINITY_REF")
    for (const name of PRESERVE) {
      expect(source).toContain(name)
    }
    for (const name of TWIN_NAMES) {
      expect(source).toContain(name)
    }
  })

  it("lists tinity twins in the agent CORS header source", () => {
    expect(TINIT_AGENT_FILES_SOURCE).toContain("/tinity/")
    expect(TINIT_AGENT_FILES_SOURCE).toContain("index.md")
    expect(TINIT_AGENT_FILES_SOURCE).toContain("llms.txt")
  })
})
