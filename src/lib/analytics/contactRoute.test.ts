import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const {
  captureNode,
  isAllowedContactOrigin,
  enforceContactRateLimit,
  turnstileRequired,
  verifyTurnstileToken,
  send,
} = vi.hoisted(() => ({
  captureNode: vi.fn().mockResolvedValue(undefined),
  isAllowedContactOrigin: vi.fn().mockReturnValue(true),
  enforceContactRateLimit: vi.fn().mockResolvedValue(null),
  turnstileRequired: vi.fn().mockReturnValue(false),
  verifyTurnstileToken: vi.fn().mockResolvedValue(true),
  send: vi.fn(),
}))

vi.mock("./captureNode", () => ({
  captureNode,
}))

vi.mock("../security/contactApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../security/contactApi")>()
  return {
    ...actual,
    isAllowedContactOrigin,
    enforceContactRateLimit,
    turnstileRequired,
    verifyTurnstileToken,
  }
})

vi.mock("resend", () => ({
  Resend: class {
    emails = { send }
  },
}))

const VALID_BODY = {
  envelopeId: "env-deadbeef",
  armored: "-----BEGIN AGE ENCRYPTED FILE-----\nxyz\n-----END AGE ENCRYPTED FILE-----",
  visitorEmail: "ada@example.com",
  subjectLine: "Hello",
}

async function loadPOST() {
  const { POST } = await import("../../pages/api/contact")
  return POST
}

function postRequest(body: unknown, init?: RequestInit) {
  return new Request("https://jseramn.tech/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...init?.headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
    ...init,
  })
}

describe("POST /api/contact analytics wiring", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    captureNode.mockReset().mockResolvedValue(undefined)
    isAllowedContactOrigin.mockReset().mockReturnValue(true)
    enforceContactRateLimit.mockReset().mockResolvedValue(null)
    turnstileRequired.mockReset().mockReturnValue(false)
    verifyTurnstileToken.mockReset().mockResolvedValue(true)
    send.mockReset().mockResolvedValue({ error: null })
    vi.stubEnv("RESEND_API_KEY", "re_test")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("captures sent without changing the HTTP success contract", async () => {
    const POST = await loadPOST()
    const response = await POST({ request: postRequest(VALID_BODY) } as never)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(captureNode).toHaveBeenCalledWith("sent")
  })

  it("captures honeypot as a non-success outcome and still returns ok", async () => {
    const POST = await loadPOST()
    const response = await POST({
      request: postRequest({ ...VALID_BODY, company: "bot" }),
    } as never)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(captureNode).toHaveBeenCalledWith("honeypot")
    expect(JSON.stringify(captureNode.mock.calls)).not.toMatch(/ada@example.com|Hello|xyz/)
  })

  it("captures rejected without changing the 400 body", async () => {
    isAllowedContactOrigin.mockReturnValue(false)
    const POST = await loadPOST()
    const response = await POST({ request: postRequest(VALID_BODY) } as never)
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "request_rejected" })
    expect(captureNode).toHaveBeenCalledWith("rejected")
  })

  it("captures rate_limited and preserves rate-limit headers", async () => {
    enforceContactRateLimit.mockResolvedValue(
      Response.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: {
            "Retry-After": "12",
            "X-RateLimit-Limit": "8",
            "X-RateLimit-Remaining": "0",
          },
        },
      ),
    )
    const POST = await loadPOST()
    const response = await POST({ request: postRequest(VALID_BODY) } as never)
    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBe("12")
    expect(response.headers.get("X-RateLimit-Limit")).toBe("8")
    await expect(response.json()).resolves.toEqual({ error: "rate_limited" })
    expect(captureNode).toHaveBeenCalledWith("rate_limited")
  })

  it("captures send_failed without changing the 502 body", async () => {
    send.mockResolvedValue({ error: { message: "down" } })
    const POST = await loadPOST()
    const response = await POST({ request: postRequest(VALID_BODY) } as never)
    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ error: "send_failed" })
    expect(captureNode).toHaveBeenCalledWith("send_failed")
  })

  it("captures not_configured without changing the 503 body", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    const POST = await loadPOST()
    const response = await POST({ request: postRequest(VALID_BODY) } as never)
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: "server_not_configured" })
    expect(captureNode).toHaveBeenCalledWith("not_configured")
  })

  it("does not fail the request when captureNode throws", async () => {
    captureNode.mockRejectedValue(new Error("ingest down"))
    const POST = await loadPOST()
    const response = await POST({ request: postRequest(VALID_BODY) } as never)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it("does not capture method_not_allowed", async () => {
    const POST = await loadPOST()
    const request = new Request("https://jseramn.tech/api/contact", { method: "GET" })
    const response = await POST({ request } as never)
    expect(response.status).toBe(405)
    await expect(response.json()).resolves.toEqual({ error: "method_not_allowed" })
    expect(captureNode).not.toHaveBeenCalled()
  })
})

describe("product capture source wiring", () => {
  it("mounts cookieless PostHog plus Vercel Analytics and wires Hero, modal, and contact API", async () => {
    const { readFileSync } = await import("node:fs")
    const { dirname, join } = await import("node:path")
    const { fileURLToPath } = await import("node:url")
    const here = dirname(fileURLToPath(import.meta.url))
    const layout = readFileSync(join(here, "../../layouts/Layout.astro"), "utf8")
    const vercelAnalytics = readFileSync(
      join(here, "../../components/VercelAnalytics.astro"),
      "utf8",
    )
    const hero = readFileSync(join(here, "../../components/Hero.tsx"), "utf8")
    const modal = readFileSync(join(here, "../../components/ContactModal.tsx"), "utf8")
    const contact = readFileSync(join(here, "../../pages/api/contact.ts"), "utf8")
    const middleware = readFileSync(join(here, "../../middleware.ts"), "utf8")
    const captureClient = readFileSync(join(here, "captureClient.ts"), "utf8")
    const productCapture = readFileSync(join(here, "productCapture.ts"), "utf8")

    expect(layout).toMatch(/posthog\.astro/)
    expect(layout).toMatch(/VercelAnalytics\.astro/)
    expect(vercelAnalytics).toContain("<Analytics />")
    expect(vercelAnalytics).toMatch(/@vercel\/analytics\/astro/)
    expect(captureClient).not.toMatch(/@vercel\/analytics/)
    expect(productCapture).not.toMatch(/@vercel\/analytics/)
    expect(hero).toContain("onHireCtaClicked")
    expect(hero).toContain("onOutboundSocial")
    expect(hero).toContain("onOutboundOrg")
    expect(hero).toContain(
      "className={`hero-on-video group font-sans text-2xl md:text-3xl font-semibold tracking-tight text-left cursor-pointer md:w-[30%] ${GLOW} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--hero-ink)]`}",
    )
    expect(modal).toContain("onContactOpened")
    expect(modal).toContain("onContactDismissed")
    expect(modal).toContain("onContactSubmittedClient")
    expect(modal).toContain("onContactFailed")
    expect(contact).toContain("captureNode")
    expect(contact).not.toMatch(/from ["'].*middleware/)
    expect(middleware).not.toMatch(/posthog-node|captureNode|lib\/analytics/)
    expect(JSON.stringify({ layout, hero, modal, contact })).not.toMatch(
      /identify\(|alias\(|group\(/,
    )
  })
})
