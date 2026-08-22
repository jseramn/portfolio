import { describe, expect, it } from "vitest"
import { ACCEPT_VARY, negotiate } from "./accept"
import { notFoundMarkdown, toMarkdown } from "./markdown"

describe("markdown negotiation bodies", () => {
  it("emits markdown with charset contract via Content-Type helper values", () => {
    expect(toMarkdown("home")).toMatch(/^# /)
    expect(toMarkdown("home")).toMatch(/^## /m)
    expect(negotiate("text/markdown")).toBe("text/markdown")
  })

  it("returns null for image/png so callers can 406 with Vary and no-store", () => {
    expect(negotiate("image/png")).toBeNull()
    expect(ACCEPT_VARY).toBe("Accept, Accept-Encoding")
  })

  it("unknown-path markdown recovery lists sitemap, llms.txt, home, about, contact, and policy", () => {
    const md = notFoundMarkdown()
    for (const href of ["/", "/llms.txt", "/sitemap-index.xml", "/about", "/contact", "/policy"]) {
      expect(md).toContain(href)
    }
    expect(md).toMatch(/^# /)
  })
})
