import { expect, test } from "@playwright/test"

const PAGES = [
  { path: "/about", status: 200, current: "About" },
  { path: "/contact", status: 200, current: "Contact" },
  { path: "/policy", status: 200, current: "Policy" },
  { path: "/does-not-exist", status: 404, current: null },
] as const

const FOOTER = ["About", "Contact", "Policy", "Terms", "Data deletion"] as const

for (const pageCase of PAGES) {
  test(`secondary chrome ${pageCase.path}`, async ({ page }) => {
    for (const width of [360, 390] as const) {
      await page.setViewportSize({ width, height: 800 })
      const response = await page.goto(pageCase.path)
      expect(response?.status(), `${pageCase.path} @ ${width}`).toBe(pageCase.status)

      const back = page.getByRole("link", { name: /←\s*jseramn/i })
      await expect(back).toBeVisible()
      expect((await back.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)

      const nav = page.getByRole("navigation", { name: "Secondary pages" })
      for (const label of FOOTER) {
        if (pageCase.current === label) {
          await expect(nav.getByRole("link", { name: label, exact: true })).toHaveCount(0)
          await expect(nav.locator('[aria-current="page"]')).toHaveText(label)
          continue
        }
        const link = nav.getByRole("link", { name: label, exact: true })
        await expect(link).toBeVisible()
        expect((await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
      }

      if (pageCase.status === 404) {
        for (const loc of await page.locator("main article ul a").all()) {
          expect((await loc.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
        }
      }

      if (pageCase.path === "/about") {
        await expect(page.locator('a[href="https://github.com/jseramn"]')).toBeVisible()
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      )
      expect(overflow, `${pageCase.path} overflow @ ${width}`).toBe(false)
    }
  })
}

test("secondary pages ship a stylesheet and paint black at 390 without FOUC", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "one visual pass at 390")

  const home = await (await request.get("/")).text()
  const about = await (await request.get("/about")).text()
  const policy = await (await request.get("/policy")).text()

  expect(home).toMatch(/<style\b/i)
  expect(home).not.toMatch(/<link\b[^>]*rel=["']stylesheet["']/i)
  expect(about).toMatch(/<link\b[^>]*rel=["']stylesheet["']/i)
  expect(policy).toMatch(/<link\b[^>]*rel=["']stylesheet["']/i)

  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ["/about", "/policy"] as const) {
    await page.goto(path, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(1000)
    const bg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg, `${path} body`).toBe("rgb(0, 0, 0)")
    const color = await page.locator("body").evaluate((el) => getComputedStyle(el).color)
    expect(color, `${path} ink`).not.toBe("rgb(0, 0, 0)")
    await page.screenshot({ path: `/tmp/swarm/ui/U10-${path.slice(1)}-390.png` })
  }
})
