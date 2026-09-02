import { afterEach, describe, expect, it, vi } from "vitest"
import { sendEncryptedEmail } from "./sendEncryptedEmail"

const payload = {
  envelopeId: "env-abcd",
  armored: "-----BEGIN AGE ENCRYPTED FILE-----\nxyz\n-----END AGE ENCRYPTED FILE-----",
  visitorEmail: "hire@example.com",
  subjectLine: "[Security Engineer] Inquiry — Security Engineer",
  company: "",
  turnstileToken: "tok-1",
}

describe("sendEncryptedEmail", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("POSTs the envelope JSON to /api/contact and resolves when the response is ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchMock)

    await expect(sendEncryptedEmail(payload)).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  })

  it("throws the server error code when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "rate_limited" }),
      }),
    )

    await expect(sendEncryptedEmail({ ...payload, company: "bot" })).rejects.toThrow("rate_limited")
  })

  it("throws send_failed when the error body cannot be read", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("no json")
        },
      }),
    )

    await expect(sendEncryptedEmail(payload)).rejects.toThrow("send_failed")
  })
})
