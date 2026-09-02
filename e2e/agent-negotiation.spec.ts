import { expect, test } from "@playwright/test"

test("GET / with Accept: text/markdown returns markdown identity", async ({ request }) => {
  const res = await request.get("/", { headers: { Accept: "text/markdown" } })
  expect(res.status()).toBe(200)
  expect(res.headers()["content-type"] ?? "").toMatch(/^text\/markdown/)
  expect(res.headers().vary ?? "").toMatch(/Accept/)
  expect(await res.text()).toContain("# José Ramón García Del Risco")
})

test("GET / with Accept: image/png is 406", async ({ request }) => {
  const res = await request.get("/", { headers: { Accept: "image/png" } })
  expect(res.status()).toBe(406)
})

test("GET / default Accept returns HTML", async ({ request }) => {
  const res = await request.get("/")
  expect(res.ok()).toBe(true)
  expect(res.headers()["content-type"] ?? "").toMatch(/text\/html/)
})

test("GET /does-not-exist with Accept: text/markdown is 404 markdown", async ({ request }) => {
  const res = await request.get("/does-not-exist", { headers: { Accept: "text/markdown" } })
  expect(res.status()).toBe(404)
  expect(res.headers()["content-type"] ?? "").toMatch(/^text\/markdown/)
})
