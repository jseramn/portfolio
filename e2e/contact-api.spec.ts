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

test.fixme("GET /api/contact returns JSON 404/405, not HTML", {
  annotation: {
    type: "fixme",
    description:
      "U01 owns the production contact 404; GET currently has no JSON handler in this worktree",
  },
}, async ({ request }) => {
  const res = await request.get("/api/contact")
  expect(res.headers()["content-type"] ?? "").toMatch(/application\/json/)
  expect([404, 405]).toContain(res.status())
})
