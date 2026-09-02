import { expect, test, type Page, type TestInfo } from "@playwright/test"

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

type HireChromeReport = {
  clipOk: boolean
  scrollWidth: number
  hostWidth: number
  hireWidth: number
  hostKind: "live-button" | "fallback-overflow" | "missing"
  hireText: string
  smallTargets: { name: string; w: number; h: number }[]
}

function measureHireChrome(page: Page) {
  return page.locator("[data-hero-root]").evaluate((root): HireChromeReport => {
    const hireEl = root.querySelector<HTMLElement>('[aria-label^="Open contact form"]')
    const label = hireEl?.querySelector<HTMLElement>('[aria-hidden="true"]') ?? hireEl
    const liveHost = root.querySelector<HTMLElement>(
      '[data-glass-host][data-glass-preset="button"]',
    )

    let fallbackHost: HTMLElement | null = null
    if (!liveHost && hireEl) {
      let node: HTMLElement | null = hireEl.parentElement
      while (node && node !== root) {
        const overflow = getComputedStyle(node).overflow
        if (overflow === "hidden" || overflow === "clip") {
          fallbackHost = node
          break
        }
        node = node.parentElement
      }
    }

    const host = liveHost ?? fallbackHost
    const hostWidth = host?.getBoundingClientRect().width ?? 0
    const scrollWidth = label?.scrollWidth ?? 0
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
      clipOk: Boolean(host && label && scrollWidth <= hostWidth + 1),
      scrollWidth,
      hostWidth: Math.round(hostWidth * 10) / 10,
      hireWidth: Math.round((hireEl?.getBoundingClientRect().width ?? 0) * 10) / 10,
      hostKind: liveHost ? "live-button" : fallbackHost ? "fallback-overflow" : "missing",
      hireText: (hireEl?.innerText ?? "").replace(/\s+/g, " ").trim(),
      smallTargets,
    }
  })
}

async function assertHireChrome(page: Page, testInfo: TestInfo) {
  if (testInfo.project.name === "chromium") {
    await expect(
      page.locator('[data-hero-root] [data-glass-host][data-glass-preset="button"]'),
    ).toHaveCount(1, { timeout: 8_000 })
  }

  const hire = page.getByRole("button", { name: /Open contact form/ })
  await expect
    .poll(async () => hire.evaluate((el) => el.clientWidth), { timeout: 8_000 })
    .toBeGreaterThan(80)

  await expect
    .poll(async () => (await measureHireChrome(page)).clipOk, { timeout: 8_000 })
    .toBe(true)

  const report = await measureHireChrome(page)
  expect(report.clipOk, JSON.stringify(report)).toBe(true)
  expect(report.smallTargets, JSON.stringify(report.smallTargets)).toEqual([])
}

type HudBox = { name: string; x: number; y: number; w: number; h: number }

type HudOverlapReport = {
  names: string[]
  overlaps: string[]
  overflowX: boolean
  scrollWidth: number
  clientWidth: number
  boxes: HudBox[]
}

function measureHudOverlap(page: Page) {
  return page.locator("[data-hero-root]").evaluate((root): HudOverlapReport => {
    const boxes = [...root.querySelectorAll<HTMLElement>("[data-hud-region]")].flatMap((el) => {
      const r = el.getBoundingClientRect()
      if (r.width <= 1 || r.height <= 1) return []
      return [
        {
          name: el.dataset.hudRegion ?? "unknown",
          x: r.x,
          y: r.y,
          w: r.width,
          h: r.height,
        },
      ]
    })
    const slack = 2
    const overlaps: string[] = []
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        const hit =
          a.x + slack < b.x + b.w &&
          a.x + a.w > b.x + slack &&
          a.y + slack < b.y + b.h &&
          a.y + a.h > b.y + slack
        if (hit) overlaps.push(`${a.name}∩${b.name}`)
      }
    }
    return {
      names: boxes.map((b) => b.name).sort(),
      overlaps,
      overflowX: root.scrollWidth > root.clientWidth + 1,
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      boxes,
    }
  })
}

async function assertHudRegions(page: Page) {
  await expect
    .poll(async () => (await measureHudOverlap(page)).names.length, { timeout: 8_000 })
    .toBeGreaterThanOrEqual(5)

  const report = await measureHudOverlap(page)
  expect(report.names, JSON.stringify(report)).toEqual([
    "marquee",
    "now-playing",
    "roles",
    "socials",
    "tagline",
  ])
  expect(report.overlaps, JSON.stringify(report)).toEqual([])
  expect(report.overflowX, JSON.stringify(report)).toBe(false)
}

const SHORT_VIEWPORTS = [
  { width: 844, height: 390 },
  { width: 1024, height: 480 },
  { width: 1280, height: 480 },
] as const

test("home chrome: boot loader, landmarks, contact modal", async ({ page }) => {
  await openHome(page)

  await expect(page.locator("main")).toBeAttached()
  await expect(page.getByRole("heading", { level: 1 })).toBeAttached()

  const hire = page.getByRole("button", { name: /Open contact form/ })
  await hire.click()
  const dialog = page.locator('[role="dialog"][aria-modal="true"]')
  await expect(dialog).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  for (let i = 0; i < 80; i++) {
    if (await hire.evaluate((el) => el === document.activeElement)) break
    await page.keyboard.press("Tab")
  }
  await expect(hire).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText("Encrypted in your browser")
  await expect(dialog.locator('input[name="name"]')).toBeFocused({ timeout: 3_000 })
  const closeBox = await dialog.getByRole("button", { name: "Close" }).boundingBox()
  expect(closeBox?.width ?? 0).toBeGreaterThanOrEqual(44)
  expect(closeBox?.height ?? 0).toBeGreaterThanOrEqual(44)
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab")
    expect(
      await page.evaluate(() =>
        Boolean(document.querySelector('[role="dialog"]')?.contains(document.activeElement)),
      ),
    ).toBe(true)
  }
  await page.keyboard.press("Escape")
  await expect(hire).toBeFocused()
})

test("home chrome: 44px tap targets and unclipped hire CTA", async ({ page }, testInfo) => {
  await openHome(page)
  await assertHireChrome(page, testInfo)

  await page.setViewportSize({ width: 768, height: 1024 })
  await page.evaluate(() => document.fonts.ready)
  await assertHireChrome(page, testInfo)
})

test("home chrome: hud regions do not overlap or overflow", async ({ page }, testInfo) => {
  await openHome(page)
  await assertHudRegions(page)

  if (testInfo.project.name !== "chromium") return

  for (const viewport of SHORT_VIEWPORTS) {
    await page.setViewportSize(viewport)
    await page.evaluate(() => document.fonts.ready)
    await assertHudRegions(page)
  }

  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.evaluate(() => document.fonts.ready)
  await assertHudRegions(page)
})
