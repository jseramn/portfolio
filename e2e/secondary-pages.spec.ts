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
