import { expect, test } from "@playwright/test"

test("GET / with Accept: text/markdown returns markdown identity", async ({ request }) => {
  const res = await request.get("/", { headers: { Accept: "text/markdown" } })
  expect(res.status()).toBe(200)
  expect(res.headers()["content-type"] ?? "").toMatch(/^text\/markdown/)
  expect(res.headers().vary ?? "").toMatch(/Accept/)
  expect(res.headers().link ?? "").toContain('rel="describedby"')
  expect(await res.text()).toContain("# José Ramón García Del Risco")
})

test("GET / with Accept: image/png is 406", async ({ request }) => {
  const res = await request.get("/", { headers: { Accept: "image/png" } })
  expect(res.status()).toBe(406)
  expect(res.headers().link ?? "").not.toContain("describedby")
})

test("GET / default Accept returns HTML", async ({ request }) => {
  const res = await request.get("/")
  expect(res.ok()).toBe(true)
  expect(res.headers()["content-type"] ?? "").toMatch(/text\/html/)
  expect(res.headers().link ?? "").toContain('rel="describedby"')
  const html = await res.text()
  expect((html.match(/rel="describedby"/g) ?? []).length).toBe(1)
})

test("GET /does-not-exist with Accept: text/markdown is 404 markdown", async ({ request }) => {
  const res = await request.get("/does-not-exist", { headers: { Accept: "text/markdown" } })
  expect(res.status()).toBe(404)
  expect(res.headers()["content-type"] ?? "").toMatch(/^text\/markdown/)
})

const LEGAL_MARKDOWN = [
  { path: "/policy", heading: "# Privacy Policy", updated: "August 27, 2026" },
  { path: "/terms", heading: "# Terms of Service", updated: "August 9, 2026" },
  { path: "/data-deletion", heading: "# Data Deletion Instructions", updated: "August 27, 2026" },
] as const

test("GET /policy with Accept: text/markdown returns markdown", async ({ request }) => {
  const res = await request.get("/policy", { headers: { Accept: "text/markdown" } })
  expect(res.status()).toBe(200)
  expect(res.headers()["content-type"] ?? "").toMatch(/^text\/markdown; charset=utf-8/)
  expect(res.headers().vary ?? "").toBe("Accept, Accept-Encoding")
  const body = await res.text()
  expect(body).toContain("# Privacy Policy")
  expect(body).toContain("Last updated: August 27, 2026")
  expect(body).toContain("PostHog")
  expect(body).toContain("[jseramn.tech](https://jseramn.tech)")
})

test("GET legal routes negotiate markdown and keep HTML", async ({ request }) => {
  for (const page of LEGAL_MARKDOWN) {
    const md = await request.get(page.path, { headers: { Accept: "text/markdown" } })
    expect(md.status(), page.path).toBe(200)
    expect(md.headers()["content-type"] ?? "").toMatch(/^text\/markdown; charset=utf-8/)
    expect(md.headers().vary ?? "").toBe("Accept, Accept-Encoding")
    const text = await md.text()
    expect(text).toContain(page.heading)
    expect(text).toContain(`Last updated: ${page.updated}`)

    const html = await request.get(page.path, { headers: { Accept: "text/html" } })
    expect(html.status(), page.path).toBe(200)
    expect(html.headers()["content-type"] ?? "").toMatch(/text\/html/)
    expect(await html.text()).toContain("<!DOCTYPE html>")
  }
})
