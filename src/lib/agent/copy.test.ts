import { describe, expect, it } from "vitest"
import { agentCopy, readableLength } from "./copy"

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
})
