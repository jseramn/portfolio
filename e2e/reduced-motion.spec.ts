import { expect, test, type Page } from "@playwright/test"

async function openReducedHome(page: Page) {
  await page.addInitScript(() => {
    const state = window as typeof window & { __heroCls: number }
    state.__heroCls = 0
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
        if (!shift.hadRecentInput) state.__heroCls += shift.value ?? 0
      }
    })
    observer.observe({ type: "layout-shift", buffered: true })
  })
  await page.setViewportSize({ width: 390, height: 844 })
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

  const marquee = page.locator("[data-hud-region=marquee]")
  await expect(
    marquee.locator("[data-marquee-pending], [data-marquee-static]").first(),
  ).toBeVisible()
  const height = await marquee.evaluate((el) => el.getBoundingClientRect().height)
  await expect(marquee.locator("[data-marquee-static]")).toBeVisible()
  await expect(marquee.locator(".flex.w-max")).toBeVisible()
  await expect(marquee.locator(".flex-wrap")).toHaveCount(0)
  expect(await marquee.evaluate((el) => el.getBoundingClientRect().height)).toBe(height)
  const cls = await page.evaluate(() => (window as typeof window & { __heroCls: number }).__heroCls)
  expect(cls).toBeLessThan(0.01)
  const motion = await marquee.evaluate((root) => {
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
