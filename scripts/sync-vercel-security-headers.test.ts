import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  ASTRO_ASSET_SOURCE,
  CDN_SWR_CACHE_CONTROL,
  GITHUB_STATS_API_SOURCE,
  IMMUTABLE_ASSET_CACHE_CONTROL,
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
  it("does not attach Vary: Accept to the global or hashed-asset rules", () => {
    const rules = buildVercelHeaderRules()
    const global = rules.find((rule) => rule.source === "/(.*)")
    const astro = rules.find((rule) => rule.source === ASTRO_ASSET_SOURCE)
    expect(global?.headers.some((header) => header.key === "Vary")).toBe(false)
    expect(astro?.headers).toEqual([{ key: "Cache-Control", value: IMMUTABLE_ASSET_CACHE_CONTROL }])
  })

  it("overrides /api catch-all no-store for public github-stats JSON", () => {
    const rules = buildVercelHeaderRules()
    const apiIdx = rules.findIndex((rule) => rule.source === "/api/(.*)")
    const statsIdx = rules.findIndex((rule) => rule.source === GITHUB_STATS_API_SOURCE)
    expect(apiIdx).toBeGreaterThanOrEqual(0)
    expect(statsIdx).toBeGreaterThan(apiIdx)
    expect(rules[apiIdx]?.headers).toEqual(
      expect.arrayContaining([{ key: "Cache-Control", value: "no-store" }]),
    )
    expect(rules[statsIdx]?.headers).toEqual(
      expect.arrayContaining([
        { key: "Cache-Control", value: CDN_SWR_CACHE_CONTROL },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ]),
    )
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

  it("allows PostHog on both CSPs and omits Vercel Analytics hosts", () => {
    const mainCsp = cspFor("/(.*)")
    const legalCsp = cspFor("/(policy|terms|data-deletion)")

    expect(mainCsp).toBe(buildContentSecurityPolicy(false))
    expect(legalCsp).toBe(buildLegalContentSecurityPolicy())

    expect(directive(mainCsp, "script-src")).toContain(POSTHOG_HOST)
    expect(directive(mainCsp, "connect-src")).toContain(POSTHOG_HOST)
    expect(directive(mainCsp, "frame-src")).toContain(POSTHOG_HOST)
    expect(directive(mainCsp, "worker-src")).toContain("blob:")
    expect(directive(legalCsp, "script-src")).toContain(POSTHOG_HOST)
    expect(directive(legalCsp, "connect-src")).toContain(POSTHOG_HOST)
    expect(directive(legalCsp, "frame-src")).toContain(POSTHOG_HOST)
    expect(directive(legalCsp, "worker-src")).toContain("blob:")

    expect(directive(mainCsp, "script-src")).not.toMatch(/va\.vercel/)
    expect(directive(mainCsp, "connect-src")).not.toMatch(/vitals\.vercel/)
    expect(directive(legalCsp, "script-src")).not.toMatch(/va\.vercel/)
    expect(directive(legalCsp, "connect-src")).not.toMatch(/vitals\.vercel/)

    expect(legalCsp).toContain("frame-ancestors *")
    expect(legalCsp).not.toContain("youtube")
  })

  it("applies the shared legal CSP from middleware and never imports posthog-node", () => {
    const middleware = readFileSync(join(here, "../src/middleware.ts"), "utf8")
    expect(middleware).toContain("buildLegalContentSecurityPolicy")
    expect(middleware).not.toMatch(/posthog-node/)
  })
})
