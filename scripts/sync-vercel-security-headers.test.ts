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
})
