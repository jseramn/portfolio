import { describe, expect, it } from "vitest"
import { ACCEPT_VARY } from "../src/lib/agent/accept"
import { buildVercelHeaderRules } from "./sync-vercel-security-headers.mjs"

describe("sync-vercel-security-headers", () => {
  it("emits Vary after security headers on /(.*)", () => {
    const rules = buildVercelHeaderRules()
    const global = rules.find((rule) => rule.source === "/(.*)")
    expect(global).toBeDefined()
    const keys = global?.headers.map((h) => h.key) ?? []
    expect(keys.at(-1)).toBe("Vary")
    expect(global?.headers.at(-1)?.value).toBe(ACCEPT_VARY)
  })

  it("overrides CORP for social preview assets after the global rule", () => {
    const rules = buildVercelHeaderRules()
    const preview = rules.find((rule) => rule.source.includes("thumbnail.png"))
    expect(preview).toBeDefined()
    expect(rules.findIndex((rule) => rule.source === "/(.*)")).toBeLessThan(
      rules.findIndex((rule) => rule.source.includes("thumbnail.png")),
    )
    expect(preview?.headers).toEqual(
      expect.arrayContaining([
        { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        { key: "Access-Control-Allow-Origin", value: "*" },
      ]),
    )
  })
})
