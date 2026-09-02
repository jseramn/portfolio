import { describe, expect, it } from "vitest"
import { isPointerCoarse } from "./pointer"

describe("isPointerCoarse", () => {
  it("reads the coarse pointer media query and fails closed", () => {
    expect(isPointerCoarse((() => ({ matches: true })) as unknown as typeof matchMedia)).toBe(true)
    expect(isPointerCoarse((() => ({ matches: false })) as unknown as typeof matchMedia)).toBe(
      false,
    )
    expect(isPointerCoarse(undefined)).toBe(false)
    expect(
      isPointerCoarse((() => {
        throw new Error("matchMedia unavailable")
      }) as unknown as typeof matchMedia),
    ).toBe(false)
  })
})
