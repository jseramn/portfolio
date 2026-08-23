import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { ACCEPT_VARY } from "../src/lib/agent/accept"
import {
  buildContentSecurityPolicy,
  buildLegalContentSecurityPolicy,
} from "../src/lib/security/siteSecurityHeaders.mjs"
import { buildVercelHeaderRules } from "./sync-vercel-security-headers.mjs"

const POSTHOG_HOST = "https://*.posthog.com"
const here = dirname(fileURLToPath(import.meta.url))

function cspFor(source: string): string {
  const rule = buildVercelHeaderRules().find((entry) => entry.source === source)
  const header = rule?.headers.find((h) => h.key === "Content-Security-Policy")
  expect(header?.value).toEqual(expect.any(String))
  return header?.value ?? ""
}

function directive(csp: string, name: string): string {
  const value = csp.split("; ").find((part) => part.startsWith(`${name} `)) ?? ""
  expect(value).not.toBe("")
  return value
}

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

  it("allows PostHog on both the main and legal CSPs without Vercel Analytics hosts", () => {
    const mainCsp = cspFor("/(.*)")
    const legalCsp = cspFor("/(policy|terms|data-deletion)")

    expect(mainCsp).toBe(buildContentSecurityPolicy(false))
    expect(legalCsp).toBe(buildLegalContentSecurityPolicy())

    expect(directive(mainCsp, "script-src")).toContain(POSTHOG_HOST)
    expect(directive(mainCsp, "connect-src")).toContain(POSTHOG_HOST)
    expect(directive(legalCsp, "script-src")).toContain(POSTHOG_HOST)
    expect(directive(legalCsp, "connect-src")).toContain(POSTHOG_HOST)

    expect(directive(mainCsp, "script-src")).not.toContain("https://va.vercel-scripts.com")
    expect(directive(mainCsp, "connect-src")).not.toContain("https://vitals.vercel-insights.com")
    expect(directive(legalCsp, "script-src")).not.toContain("https://va.vercel-scripts.com")
    expect(directive(legalCsp, "connect-src")).not.toContain("https://vitals.vercel-insights.com")

    expect(legalCsp).toContain("frame-ancestors *")
    expect(legalCsp).not.toContain("youtube")
  })

  it("applies the shared legal CSP from middleware and never imports posthog-node", () => {
    const middleware = readFileSync(join(here, "../src/middleware.ts"), "utf8")
    expect(middleware).toContain("buildLegalContentSecurityPolicy")
    expect(middleware).not.toMatch(/posthog-node/)
  })
})
