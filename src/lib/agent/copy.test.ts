import { describe, expect, it } from "vitest"
import { agentCopy, readableLength } from "./copy"
import { LEGAL_PAGE_IDS, legalDocument } from "./legalCopy"
import { linkedHrefs } from "./linkify"
import { toMarkdown } from "./markdown"

describe("agentCopy", () => {
  it("home copy is ≥800 chars with four H2 sections, portfolio plus contact, no product pricing", () => {
    const copy = agentCopy("home")
    expect(readableLength(copy)).toBeGreaterThanOrEqual(800)
    expect(copy.sections).toHaveLength(4)
    const headings = copy.sections?.map((section) => section.h2) ?? []
    expect(headings).toEqual([
      "Who this is",
      "Who it is for",
      "How to get in touch",
      "What this site is not",
    ])
    const text = `${copy.h1} ${copy.body}`.toLowerCase()
    expect(text).toMatch(/portfolio/)
    expect(text).toMatch(/contact/)
    expect(text).toMatch(/\/projects/)
    expect(text).not.toMatch(/pricing table/)
    expect(text).not.toMatch(/telephone/)
    expect(text).not.toContain("presenciapyme.com")
  })

  it("about and contact copy are ≥500 chars, email only, no invented PII", () => {
    for (const page of ["about", "contact"] as const) {
      const copy = agentCopy(page)
      expect(readableLength(copy)).toBeGreaterThanOrEqual(500)
      expect(`${copy.h1} ${copy.body}`).toContain("contacto@jseramn.tech")
      expect(`${copy.h1} ${copy.body}`.toLowerCase()).not.toMatch(/telephone/)
      expect(`${copy.h1} ${copy.body}`.toLowerCase()).not.toMatch(/postal address/)
    }
  })

  it("about and contact HTML and markdown expose the same URLs", () => {
    for (const page of ["about", "contact"] as const) {
      const { body } = agentCopy(page)
      const htmlHrefs = [...linkedHrefs(body)].sort()
      const md = toMarkdown(page)
      const mdHrefs = [
        ...new Set([...md.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1])),
      ].sort()
      expect(htmlHrefs.length).toBeGreaterThan(0)
      expect(mdHrefs).toEqual(htmlHrefs)
      expect(htmlHrefs).toContain("mailto:contacto@jseramn.tech")
      expect(htmlHrefs.some((href) => href.startsWith("https://"))).toBe(true)
      expect(
        md
          .replace(/^# [^\n]+\n+/, "")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .trim(),
      ).toBe(body)
    }
  })

  it("legal pages expose headings, links, and lastUpdated in markdown", () => {
    for (const id of LEGAL_PAGE_IDS) {
      const doc = legalDocument(id)
      const md = toMarkdown(id)
      expect(md).toContain(`# ${doc.heading}`)
      expect(md).toContain(`Last updated: ${doc.lastUpdated}`)
      expect(md).toMatch(/^## /m)
      expect(md).toContain("[jseramn.tech](https://jseramn.tech)")
      expect(md).toContain("[contacto@jseramn.tech](mailto:contacto@jseramn.tech)")
    }
  })
})
