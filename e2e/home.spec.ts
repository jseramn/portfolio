import { expect, test, type Page } from "@playwright/test"

async function openHome(page: Page) {
  const response = await page.goto("/")
  expect(response, "home should respond").toBeTruthy()
  expect(response?.ok(), "home should be HTTP 200").toBe(true)
  expect(response?.headers()["content-type"] ?? "").toMatch(/text\/html/)

  const html = await page.content()
  expect(html).not.toMatch(/rel=["']preload["'][^>]*as=["']video["']/)
  expect(html).not.toContain("/videobg.webm")
  expect(html).not.toContain("/videobg.mp4")

  const boot = page.locator("#boot-loader")
  await expect(boot).toBeAttached()
  await expect
    .poll(
      async () => {
        const hidden = await boot.getAttribute("hidden")
        const ariaHidden = await boot.getAttribute("aria-hidden")
        return hidden !== null || ariaHidden === "true"
      },
      { timeout: 10_000 },
    )
    .toBe(true)

  await page.evaluate(() => document.fonts.ready)
}

test("home chrome: boot loader, landmarks, contact modal", async ({ page }) => {
  await openHome(page)

  await expect(page.locator("main")).toBeAttached()
  await expect(page.getByRole("heading", { level: 1 })).toBeAttached()

  await page.getByRole("button", { name: /Open contact form/ }).click()
  const dialog = page.locator('[role="dialog"][aria-modal="true"]')
  await expect(dialog).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
})

test("home chrome: 44px tap targets and unclipped hire CTA", async ({ page }, testInfo) => {
  await openHome(page)

  if (testInfo.project.name === "chromium") {
    await expect(
      page.locator('[data-hero-root] [data-glass-host][data-glass-preset="button"]'),
    ).toHaveCount(1, { timeout: 8_000 })
  }

  const hire = page.getByRole("button", { name: /Open contact form/ })
  await expect
    .poll(async () => hire.evaluate((el) => el.clientWidth), { timeout: 8_000 })
    .toBeGreaterThan(80)

  const report = await page.locator("[data-hero-root]").evaluate((root) => {
    const hireEl = root.querySelector<HTMLElement>('[aria-label^="Open contact form"]')
    const label = hireEl?.querySelector<HTMLElement>('[aria-hidden="true"]') ?? hireEl
    const smallTargets = [
      ...root.querySelectorAll<HTMLElement>("a, button, [role=button]"),
    ].flatMap((el) => {
      const box = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      if (
        box.width <= 0 ||
        box.height <= 0 ||
        style.visibility === "hidden" ||
        style.display === "none"
      ) {
        return []
      }
      if (box.width + 0.5 < 44 || box.height + 0.5 < 44) {
        return [
          {
            name:
              el.getAttribute("aria-label") ||
              el.getAttribute("href") ||
              (el.textContent ?? "").trim().slice(0, 80),
            w: Math.round(box.width * 10) / 10,
            h: Math.round(box.height * 10) / 10,
          },
        ]
      }
      return []
    })
    return {
      clipOk: Boolean(label && label.scrollWidth <= label.clientWidth + 1),
      scrollWidth: label?.scrollWidth ?? 0,
      clientWidth: label?.clientWidth ?? 0,
      hireText: (hireEl?.innerText ?? "").replace(/\s+/g, " ").trim(),
      smallTargets,
    }
  })

  expect(report.clipOk, JSON.stringify(report)).toBe(true)
  expect(report.smallTargets, JSON.stringify(report.smallTargets)).toEqual([])
})
