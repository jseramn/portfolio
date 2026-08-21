import { describe, expect, it } from "vitest"
import { ACCEPT_VARY, negotiate } from "./accept"

/** Typical Chrome desktop Accept — contains xml subtypes, not markdown. */
const CHROME_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"

describe("negotiate", () => {
  it("selects HTML for a Chrome Accept header (not substring markdown)", () => {
    expect(negotiate(CHROME_ACCEPT)).toBe("text/html")
  })

  it("selects HTML when html q is higher than markdown", () => {
    expect(negotiate("text/html;q=0.9, text/markdown;q=0.1")).toBe("text/html")
  })

  it("selects markdown when markdown q is higher than html (q-values select markdown)", () => {
    expect(negotiate("text/html;q=0.8, text/markdown;q=1")).toBe("text/markdown")
  })

  it("selects HTML not 406 when markdown is q=0 and */* is acceptable", () => {
    expect(negotiate("text/markdown;q=0, */*;q=1")).toBe("text/html")
  })

  it("returns null for image/png and still exposes Vary: Accept, Accept-Encoding", () => {
    expect(negotiate("image/png")).toBeNull()
    expect(ACCEPT_VARY).toBe("Accept, Accept-Encoding")
  })

  it("selects HTML for Accept: text/html (HTML Accept)", () => {
    expect(negotiate("text/html")).toBe("text/html")
  })

  it("selects markdown for Accept: text/markdown (Markdown Accept)", () => {
    expect(negotiate("text/markdown")).toBe("text/markdown")
  })
})
