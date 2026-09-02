import { describe, expect, it } from "vitest"
import { ACCEPT_VARY } from "./accept"
import {
  API_NO_STORE,
  CDN_SWR_CACHE,
  applyApiNoStoreHeaders,
  applyGitHubStatsCacheHeaders,
  applyNegotiatedResponseHeaders,
} from "./apiCacheHeaders"

function apiHeaders(pathname: string): Headers {
  const headers = new Headers()
  applyApiNoStoreHeaders(pathname, headers)
  return headers
}

describe("response cache headers", () => {
  it("no-stores private APIs and CDN-caches public github-stats 200s", () => {
    expect(apiHeaders("/api/contact").get("Cache-Control")).toBe(API_NO_STORE)
    expect(apiHeaders("/api/github-stats").get("Cache-Control")).toBeNull()
    const ok = new Headers()
    applyGitHubStatsCacheHeaders(ok, 200)
    expect(ok.get("Cache-Control")).toBe(CDN_SWR_CACHE)
    const fail = new Headers()
    applyGitHubStatsCacheHeaders(fail, 503)
    expect(fail.get("Cache-Control")).toBe(API_NO_STORE)
  })

  it("sets Vary on negotiated responses and does not CDN-cache documents", () => {
    const ok = new Headers()
    applyNegotiatedResponseHeaders(ok, true)
    expect(ok.get("Vary")).toBe(ACCEPT_VARY)
    expect(ok.get("Cache-Control")).toBeNull()
    const notAcceptable = new Headers({ "Cache-Control": "no-store" })
    applyNegotiatedResponseHeaders(notAcceptable, true)
    expect(notAcceptable.get("Vary")).toBe(ACCEPT_VARY)
    expect(notAcceptable.get("Cache-Control")).toBe("no-store")
    const skipped = new Headers()
    applyNegotiatedResponseHeaders(skipped, false)
    expect(skipped.get("Vary")).toBeNull()
  })
})
