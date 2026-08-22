import { describe, expect, it } from "vitest"
import { API_NO_STORE, applyApiNoStoreHeaders } from "./apiCacheHeaders"

function headersFor(pathname: string): Headers {
  const headers = new Headers()
  applyApiNoStoreHeaders(pathname, headers)
  return headers
}

describe("applyApiNoStoreHeaders", () => {
  it("sets both no-store headers on /api paths", () => {
    for (const pathname of ["/api", "/api/github-stats", "/api/", "/api/github-stats?x=1"]) {
      const headers = headersFor(pathname)
      expect(headers.get("Cache-Control")).toBe(API_NO_STORE)
      expect(headers.get("Vercel-CDN-Cache-Control")).toBe(API_NO_STORE)
    }
  })

  it("is a no-op for HTML routes and /api-foo", () => {
    for (const pathname of ["/", "/about", "/contact", "/api-foo"]) {
      const headers = headersFor(pathname)
      expect(headers.get("Cache-Control")).toBeNull()
      expect(headers.get("Vercel-CDN-Cache-Control")).toBeNull()
    }
  })
})
