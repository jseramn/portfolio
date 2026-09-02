import { expect, test, type Page } from "@playwright/test"

async function open(page: Page, path: string) {
  const response = await page.goto(path)
  expect(response, `${path} should respond`).toBeTruthy()
  expect(response?.ok(), `${path} should be HTTP 200`).toBe(true)
  if (path !== "/") return
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
}

async function assertSkipAndMain(page: Page) {
  const skip = page.getByRole("link", { name: "Skip to content" })
  await expect(skip).toHaveCount(1)
  await expect(skip).not.toBeInViewport()

  await page.keyboard.press("Tab")
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  expect((await skip.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)

  await skip.press("Enter")
  const main = page.getByRole("main")
  await expect(main).toHaveCount(1)
  await expect(main).toBeFocused()
  const box = await main.boundingBox()
  expect(box?.width ?? 0).toBeGreaterThan(0)
  expect(box?.height ?? 0).toBeGreaterThan(0)
  expect(await main.evaluate((el) => getComputedStyle(el).display)).not.toBe("contents")
}

test("skip link and main landmark on /", async ({ page }) => {
  await open(page, "/")
  await assertSkipAndMain(page)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
  )
  expect(overflow).toBe(false)
})

test("skip link and main landmark on /about", async ({ page }) => {
  await open(page, "/about")
  await assertSkipAndMain(page)
})

test("focused skip link screenshots", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop screenshot matrix")
  await open(page, "/")
  const skip = page.getByRole("link", { name: "Skip to content" })
  for (const width of [390, 1366] as const) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 })
    await skip.focus()
    await expect(skip).toBeFocused()
    await expect(skip).toBeInViewport()
    await page.screenshot({ path: `/tmp/swarm/ui/U25-skip-${width}.png` })
  }
})
