import { expect, test } from "@playwright/test"

test("home chrome: boot loader, landmarks, contact modal", async ({ page }) => {
  const response = await page.goto("/")
  expect(response, "home should respond").toBeTruthy()
  expect(response?.ok(), "home should be HTTP 200").toBe(true)
  expect(response?.headers()["content-type"] ?? "").toMatch(/text\/html/)

  const html = await page.content()
  expect(html).not.toMatch(/rel=["']preload["'][^>]*as=["']video["']/)

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

  await expect(page.locator("main")).toBeAttached()
  await expect(page.getByRole("heading", { level: 1 })).toBeAttached()

  await page.getByRole("button", { name: /Open contact form/ }).click()
  const dialog = page.locator('[role="dialog"][aria-modal="true"]')
  await expect(dialog).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
})
