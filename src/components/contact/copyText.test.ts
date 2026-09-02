import { afterEach, describe, expect, it, vi } from "vitest"
import { copyText } from "./copyText"

describe("copyText", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("writes the value to the clipboard and returns true", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", { clipboard: { writeText } })

    await expect(copyText("env-1")).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith("env-1")
  })

  it("returns false when clipboard write fails", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    })

    await expect(copyText("secret")).resolves.toBe(false)
  })
})
