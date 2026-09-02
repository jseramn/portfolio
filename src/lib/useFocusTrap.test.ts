import { describe, expect, it } from "vitest"
import { isTabbable, orderTabbable, wrapFocusIndex } from "./useFocusTrap"

describe("useFocusTrap helpers", () => {
  it("orders tabbables and wraps Tab around the list", () => {
    expect(
      orderTabbable([
        { id: "age", tabIndex: 0 },
        { id: "honeypot", tabIndex: -1 },
        { id: "name", tabIndex: 0 },
        { id: "email", tabIndex: 0, disabled: true },
        { id: "submit", tabIndex: 0 },
        { id: "turnstile", tabIndex: 0 },
        { id: "ghost", tabIndex: 0, hidden: true },
        { id: "close", tabIndex: 0 },
      ]).map((el) => el.id),
    ).toEqual(["age", "name", "submit", "turnstile", "close"])
    expect(wrapFocusIndex(4, false, 5)).toBe(0)
    expect(wrapFocusIndex(0, true, 5)).toBe(4)
    expect(wrapFocusIndex(2, false, 5)).toBe(3)
    expect(wrapFocusIndex(-1, false, 5)).toBe(0)
    expect(wrapFocusIndex(-1, true, 5)).toBe(4)
    expect(wrapFocusIndex(0, false, 0)).toBe(0)
    expect(isTabbable({ tabIndex: 0 })).toBe(true)
    expect(isTabbable({ tabIndex: -1 })).toBe(false)
    expect(isTabbable({ tabIndex: 0, disabled: true })).toBe(false)
  })
})
