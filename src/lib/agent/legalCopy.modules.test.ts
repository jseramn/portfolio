import { describe, expect, it } from "vitest"
import { DATA_DELETION } from "./legalCopy.dataDeletion"
import { POLICY } from "./legalCopy.policy"
import { TERMS } from "./legalCopy.terms"
import {
  LEGAL_DOCUMENTS,
  LEGAL_PAGE_IDS,
  legalDocument,
  legalDocumentFromPath,
  legalVisibleText,
} from "./legalCopy"

describe("legal copy sibling modules", () => {
  it("exports LEGAL_DOCUMENTS as the same objects as page lookup", () => {
    expect(LEGAL_PAGE_IDS).toEqual(["policy", "terms", "dataDeletion"])
    expect(LEGAL_DOCUMENTS).toEqual({
      policy: POLICY,
      terms: TERMS,
      dataDeletion: DATA_DELETION,
    })
    expect(legalDocument("policy")).toBe(POLICY)
    expect(legalDocument("terms")).toBe(TERMS)
    expect(legalDocument("dataDeletion")).toBe(DATA_DELETION)
    expect(legalDocumentFromPath("/policy")).toBe(POLICY)
    expect(legalDocumentFromPath("/terms/?x=1")).toBe(TERMS)
    expect(legalDocumentFromPath("/data-deletion")).toBe(DATA_DELETION)
    expect(legalDocumentFromPath("/about")).toBeNull()
  })

  it("keeps policy, terms, and data-deletion visible text on the sibling literals", () => {
    expect(legalVisibleText(POLICY)).toMatch(/cookieless/)
    expect(legalVisibleText(POLICY)).toMatch(/PostHog/)
    expect(legalVisibleText(TERMS)).toMatch(/Terms of Service|agree to these terms/)
    expect(legalVisibleText(DATA_DELETION)).toMatch(/Data deletion request/)
    expect(POLICY.lastUpdated).toBe("August 27, 2026")
    expect(TERMS.lastUpdated).toBe("August 9, 2026")
    expect(DATA_DELETION.lastUpdated).toBe("August 27, 2026")
  })
})
