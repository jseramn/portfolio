import { describe, expect, it } from "vitest"

describe("Vercel adapter options", () => {
  it("does not opt into the Edge middleware hop that drops POST", async () => {
    const config = (await import("../../astro.config.mjs")) as {
      vercelAdapterOptions?: { edgeMiddleware?: boolean }
    }
    expect(config.vercelAdapterOptions?.edgeMiddleware).toBe(false)
  })
})
