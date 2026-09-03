import { describe, expect, it } from "vitest"
import { shouldNegotiateAccept, skipNegotiate } from "./skip"

describe("skipNegotiate", () => {
  it("skips documentation-like and executable extensioned paths", () => {
    expect(skipNegotiate("/requirements.txt")).toBe(true)
    expect(skipNegotiate("/CMakeLists.txt")).toBe(true)
    expect(skipNegotiate("/README.sh")).toBe(true)
    expect(skipNegotiate("/docs/guide.md")).toBe(true)
    expect(skipNegotiate("/page.mdx")).toBe(true)
    expect(skipNegotiate("/foo.md")).toBe(true)
  })

  it("skips llms.txt and dotted well-known paths so static files are not rewritten", () => {
    expect(skipNegotiate("/llms.txt")).toBe(true)
    expect(skipNegotiate("/llms-full.txt")).toBe(true)
    expect(skipNegotiate("/design.md")).toBe(true)
    expect(skipNegotiate("/tinity/index.md")).toBe(true)
    expect(skipNegotiate("/tinity/llms.txt")).toBe(true)
    expect(skipNegotiate("/.well-known/security.txt")).toBe(true)
    expect(skipNegotiate("/security.txt")).toBe(true)
  })

  it("skips /api and /_astro", () => {
    expect(skipNegotiate("/api/contact")).toBe(true)
    expect(skipNegotiate("/_astro/client.js")).toBe(true)
  })

  it("does not skip HTML routes", () => {
    expect(skipNegotiate("/")).toBe(false)
    expect(skipNegotiate("/about")).toBe(false)
    expect(skipNegotiate("/contact")).toBe(false)
    expect(skipNegotiate("/policy")).toBe(false)
    expect(skipNegotiate("/terms")).toBe(false)
    expect(skipNegotiate("/data-deletion")).toBe(false)
    expect(skipNegotiate("/tinity")).toBe(false)
    expect(skipNegotiate("/tinity/")).toBe(false)
    expect(skipNegotiate("/some-path-that-does-not-exist")).toBe(false)
  })
})

describe("shouldNegotiateAccept", () => {
  it("does not read Accept on prerendered pages", () => {
    expect(shouldNegotiateAccept("/policy", true)).toBe(false)
    expect(shouldNegotiateAccept("/terms", true)).toBe(false)
    expect(shouldNegotiateAccept("/data-deletion", true)).toBe(false)
    expect(shouldNegotiateAccept("/", true)).toBe(false)
  })

  it("negotiates Accept on SSR HTML routes", () => {
    expect(shouldNegotiateAccept("/", false)).toBe(true)
    expect(shouldNegotiateAccept("/about", false)).toBe(true)
    expect(shouldNegotiateAccept("/tinity", false)).toBe(true)
    expect(shouldNegotiateAccept("/tinity/index.md", false)).toBe(false)
    expect(shouldNegotiateAccept("/policy", false)).toBe(true)
    expect(shouldNegotiateAccept("/terms", false)).toBe(true)
    expect(shouldNegotiateAccept("/data-deletion", false)).toBe(true)
  })

  it("still skips APIs and static files when SSR", () => {
    expect(shouldNegotiateAccept("/api/contact", false)).toBe(false)
    expect(shouldNegotiateAccept("/llms.txt", false)).toBe(false)
    expect(shouldNegotiateAccept("/llms-full.txt", false)).toBe(false)
    expect(shouldNegotiateAccept("/design.md", false)).toBe(false)
    expect(shouldNegotiateAccept("/.well-known/security.txt", false)).toBe(false)
  })
})
