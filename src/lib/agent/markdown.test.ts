import { describe, expect, it } from "vitest"
import { site } from "../../config/site"
import { MANIFESTO } from "../../tinity/experience/copy"
import { ACCEPT_VARY, negotiate } from "./accept"
import { agentCopy } from "./copy"
import { LEGAL_PAGE_IDS, legalDocument, legalMarkdownHrefs } from "./legalCopy"
import { linkedHrefs } from "./linkify"
import { notFoundMarkdown, pageFromPath, toMarkdown } from "./markdown"

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

  it("maps /tinity and renders title, manifesto, experiment framing, and repo link", () => {
    expect(pageFromPath("/tinity")).toBe("tinity")
    expect(pageFromPath("/tinity/")).toBe("tinity")
    expect(pageFromPath("/tinity?ref=home")).toBe("tinity")
    const md = toMarkdown("tinity")
    expect(md).toMatch(/^# Tinity\n/)
    expect(md).toContain(
      "Tinity is a single public experiment at [/tinity](/tinity), not a product catalog.",
    )
    expect(md).toContain(MANIFESTO)
    expect(md).toContain(`[${site.tinity.repo}](${site.tinity.repo})`)
    expect(md).not.toMatch(/WebGL|ForceField/i)
  })

  it("maps legal routes and renders headings, links, and lastUpdated", () => {
    expect(pageFromPath("/policy")).toBe("policy")
    expect(pageFromPath("/terms/")).toBe("terms")
    expect(pageFromPath("/data-deletion")).toBe("dataDeletion")
    expect(pageFromPath("/privacy")).toBeNull()
    for (const id of LEGAL_PAGE_IDS) {
      const doc = legalDocument(id)
      const md = toMarkdown(id)
      expect(md).toContain(`# ${doc.heading}`)
      expect(md).toContain(`Last updated: ${doc.lastUpdated}`)
      expect(md).toMatch(/^## /m)
      const hrefs = [
        ...new Set([...md.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1])),
      ].sort()
      expect(hrefs).toEqual([...legalMarkdownHrefs(doc)].sort())
      expect(md).toContain("[jseramn.tech](https://jseramn.tech)")
      expect(md).toContain("[contacto@jseramn.tech](mailto:contacto@jseramn.tech)")
    }
  })
})
