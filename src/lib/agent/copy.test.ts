import { describe, expect, it } from "vitest"
import { agentCopy, readableLength } from "./copy"

describe("agentCopy", () => {
  it("home copy is ≥800 chars and states portfolio plus contact with no product or pricing", () => {
    const copy = agentCopy("home")
    expect(readableLength(copy)).toBeGreaterThanOrEqual(800)
    const text = `${copy.h1} ${copy.body}`.toLowerCase()
    expect(text).toMatch(/portfolio/)
    expect(text).toMatch(/contact/)
    expect(text).not.toMatch(/pricing table/)
    expect(text).not.toMatch(/telephone/)
    expect(text).not.toMatch(/postal/)
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
