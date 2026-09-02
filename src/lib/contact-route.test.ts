import { describe, expect, it } from "vitest"

async function loadContact() {
  return import("../pages/api/contact")
}

async function expectMethodNotAllowed(
  handler: (context: never) => Response | Promise<Response>,
  method: string,
) {
  const response = await handler({
    request: new Request("https://jseramn.tech/api/contact", { method }),
  } as never)
  expect(response.status).toBe(405)
  expect(response.headers.get("Allow")).toBe("POST")
  expect(response.headers.get("content-type") ?? "").toMatch(/application\/json/)
  await expect(response.json()).resolves.toEqual({ error: "method_not_allowed" })
}

describe("non-POST /api/contact", () => {
  it("answers GET with JSON 405 and Allow: POST", async () => {
    const { GET } = await loadContact()
    expect(GET).toEqual(expect.any(Function))
    await expectMethodNotAllowed(GET, "GET")
  })

  it("answers OPTIONS with JSON 405 and Allow: POST", async () => {
    const { OPTIONS } = await loadContact()
    expect(OPTIONS).toEqual(expect.any(Function))
    await expectMethodNotAllowed(OPTIONS, "OPTIONS")
  })
})
