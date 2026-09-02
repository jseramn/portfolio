import { expect, test, type Page } from "@playwright/test"

async function openHome(page: Page) {
  expect((await page.goto("/"))?.ok()).toBe(true)
  const boot = page.locator("#boot-loader")
  await expect
    .poll(
      async () =>
        (await boot.getAttribute("hidden")) !== null ||
        (await boot.getAttribute("aria-hidden")) === "true",
      {
        timeout: 10_000,
      },
    )
    .toBe(true)
}

test("blocked YouTube shows audio unavailable without breaking the page", async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = []
  page.on("pageerror", (error) => pageErrors.push(error.message))
  await page.route(/youtube\.com|youtu\.be|googlevideo\.com/, (route) => route.abort())
  await openHome(page)
  await page.getByRole("button", { name: "Play music" }).click()
  const failed = page.getByText("audio unavailable")
  await expect(failed).toBeVisible({ timeout: 6_000 })
  await expect(page.getByRole("button", { name: "Previous track" })).toHaveAttribute(
    "aria-disabled",
    "true",
  )
  await page.getByRole("button", { name: "Hire / Contact" }).click()
  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible()
  await page.keyboard.press("Escape")
  expect(pageErrors, pageErrors.join("\n")).toEqual([])
  if (testInfo.project.name !== "chromium") return
  for (const [width, height, file] of [
    [390, 844, "U26-390.png"],
    [1920, 1080, "U26-1920.png"],
  ] as const) {
    await page.setViewportSize({ width, height })
    await expect(failed).toBeVisible()
    await page.screenshot({ path: `/tmp/swarm/ui/${file}` })
  }
})
