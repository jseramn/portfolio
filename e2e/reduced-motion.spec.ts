import { expect, test, type Page } from "@playwright/test"

async function openReducedHome(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" })
  expect((await page.goto("/"))?.ok()).toBe(true)
  const boot = page.locator("#boot-loader")
  await expect
    .poll(async () => {
      const hidden = await boot.getAttribute("hidden")
      return hidden !== null || (await boot.getAttribute("aria-hidden")) === "true"
    })
    .toBe(true)
}

test("reduced-motion shows a monochrome ASCII fallback and stops chrome motion", async ({
  page,
}, testInfo) => {
  expect(testInfo.project.name).toBe("reduced-motion")
  await openReducedHome(page)
  await expect(page.locator("[data-hero-root]")).toBeVisible()
  const fallback = page.locator("[data-hero-boot-fallback] img.hero-ascii-display")
  await expect(fallback).toBeVisible()
  await expect(fallback).toHaveAttribute("src", /ascii-fallback\.svg/)
  expect(await fallback.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)

  const body = await (await page.request.get("/ascii-fallback.svg")).text()
  expect(body).toContain("<tspan")
  expect(body).not.toMatch(/fill="#(?!000|fff)[0-9a-fA-F]{3,8}"/)

  await expect(page.locator("[data-hud-region=marquee] [data-marquee-static]")).toBeVisible()
  const motion = await page.locator("[data-hud-region=marquee]").evaluate((root) => {
    const styles = [...root.querySelectorAll<HTMLElement>("*")].map((el) => getComputedStyle(el))
    return {
      running: styles.filter(
        (s) => s.animationName !== "none" && s.animationPlayState === "running",
      ).length,
      transforms: styles.filter((s) => s.transform && s.transform !== "none").length,
    }
  })
  expect(motion).toEqual({ running: 0, transforms: 0 })

  for (const bar of await page.locator(".sound-bars span").evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el)
      return s.animationName === "none" || s.animationPlayState !== "running"
    }),
  )) {
    expect(bar).toBe(true)
  }
})
