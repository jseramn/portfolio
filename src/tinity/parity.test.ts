import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  PRESERVE,
  SOURCE_MANIFEST,
  TWIN_NAMES,
  hashTinityTree,
} from "../../scripts/tinity-pull.mjs"
import { twins, type TwinName } from "../lib/tinityTwinContent"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")
const tinityDir = join(root, "src/tinity")
const twinsDir = join(tinityDir, "twins")

describe("tinity vendored copy parity", () => {
  it("matches the last pull manifest hashes", () => {
    expect(existsSync(SOURCE_MANIFEST)).toBe(true)
    const manifest = JSON.parse(readFileSync(SOURCE_MANIFEST, "utf8")) as {
      sha: string
      files: Record<string, string>
    }
    expect(manifest.sha).toMatch(/^[0-9a-f]{40}$/)
    expect(hashTinityTree()).toEqual(manifest.files)
    for (const rel of PRESERVE) {
      expect(manifest.files[rel]).toBeUndefined()
    }
  })

  it("keeps generated twin module identical to the raw files", () => {
    for (const name of TWIN_NAMES) {
      const raw = readFileSync(join(twinsDir, name), "utf8")
      expect(twins[name as TwinName]).toBe(raw)
    }
  })

  it("does not overwrite the portfolio TinityApp shell", () => {
    const app = readFileSync(join(tinityDir, "TinityApp.tsx"), "utf8")
    expect(app).toContain("./styles/marketing.css")
    expect(app).toContain("export default function TinityApp")
  })
})
