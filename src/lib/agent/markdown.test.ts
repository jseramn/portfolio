import { describe, expect, it } from "vitest"
import { ACCEPT_VARY, negotiate } from "./accept"
import { agentCopy } from "./copy"
import { linkedHrefs } from "./linkify"
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

  it("about and contact markdown twins expose the same URLs as HTML linkification", () => {
    for (const page of ["about", "contact"] as const) {
      const md = toMarkdown(page)
      const hrefs = [
        ...new Set([...md.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1])),
      ].sort()
      expect(hrefs).toEqual([...linkedHrefs(agentCopy(page).body)].sort())
      expect(md).toContain("[contacto@jseramn.tech](mailto:contacto@jseramn.tech)")
    }
  })
})
