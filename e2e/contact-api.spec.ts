import { expect, test } from "@playwright/test"

test("POST /api/contact returns JSON, never an HTML 404", async ({ request }) => {
  const res = await request.post("/api/contact", {
    headers: {
      Origin: "http://127.0.0.1:4399",
      "Content-Type": "application/json",
    },
    data: {},
  })
  expect(res.headers()["content-type"] ?? "").toMatch(/application\/json/)
  expect([400, 503]).toContain(res.status())
  expect(res.headers()["content-type"] ?? "").not.toMatch(/text\/html/)
})

test("GET /api/contact returns JSON 405 with Allow: POST", async ({ request }) => {
  const res = await request.get("/api/contact")
  expect(res.headers()["content-type"] ?? "").toMatch(/application\/json/)
  expect(res.headers()["content-type"] ?? "").not.toMatch(/text\/html/)
  expect(res.status()).toBe(405)
  expect(res.headers().allow).toBe("POST")
  await expect(res.json()).resolves.toEqual({ error: "method_not_allowed" })
})
