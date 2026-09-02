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
    const hireEl = root.querySelector<HTMLElement>('[aria-label="Hire / Contact"]')
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
    ).toHaveCount(2, { timeout: 8_000 })
  }

  const hire = page.getByRole("button", { name: "Hire / Contact" })
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

  const hire = page.getByRole("button", { name: "Hire / Contact" })
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

test("home chrome: zone scrims sit above the glyph canvas", async ({ page }) => {
  await openHome(page)

  async function measureStacking() {
    return page.locator("[data-hero-root]").evaluate((root) => {
      const usedZ = (el: Element) => {
        let node: Element | null = el
        while (node && node !== root.parentElement) {
          const n = Number.parseFloat(getComputedStyle(node).zIndex)
          if (Number.isFinite(n)) return n
          node = node.parentElement
        }
        return Number.NaN
      }
      const canvas = root.querySelector("canvas.hero-ascii-display")
      const canvasZ = canvas ? usedZ(canvas) : Number.NaN
      const scrims = [
        ...root.querySelectorAll(".hero-scrim-top, .hero-scrim-bottom, .hero-scrim-social"),
      ].map((el) => ({
        z: usedZ(el),
        pointerEvents: getComputedStyle(el).pointerEvents,
        canvasZ,
      }))
      const hud = [...root.querySelectorAll("[data-hud-region]")].map((el) => ({
        z: usedZ(el),
      }))
      return { scrims, hud }
    })
  }

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1920, height: 1080 },
  ] as const) {
    await page.setViewportSize(viewport)
    await page.evaluate(() => document.fonts.ready)
    const stacking = await measureStacking()
    expect(stacking.scrims).toHaveLength(3)
    for (const row of stacking.scrims) {
      expect(row.z).toBeGreaterThan(row.canvasZ)
      expect(row.pointerEvents).toBe("none")
    }
    const scrimZ = stacking.scrims[0]?.z ?? Number.NaN
    for (const row of stacking.hud) expect(row.z).toBeGreaterThan(scrimZ)
  }
})

test("home chrome: hud regions do not overlap or overflow", async ({ page }, testInfo) => {
  await openHome(page)
  await assertHudRegions(page)

  if (testInfo.project.name !== "chromium") return

  for (const viewport of [
    ...SHORT_VIEWPORTS,
    { width: 768, height: 1024 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport)
    await page.evaluate(() => document.fonts.ready)
    await assertHudRegions(page)
  }
})

async function assertHomeIdentity(page: Page) {
  const root = page.locator("[data-hero-root]")
  const wordmark = root.getByRole("link", { name: "jseramn", exact: true })
  const about = root.getByRole("link", { name: "about", exact: true })
  const contact = root.getByRole("link", { name: "contact", exact: true })
  const hire = page.getByRole("button", { name: "Hire / Contact" })

  for (const loc of [wordmark, about, contact]) {
    await expect(loc).toBeVisible()
    const box = await loc.boundingBox()
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  }

  await expect(hire).toBeVisible()
  await expect(hire).toContainText(/hire/i)
  await expect(hire).not.toHaveAttribute("aria-live")
}

test("home chrome: marquee moves, roles rotate, and CLS stays near zero", async ({ page }) => {
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
  await openHome(page)
  const marqueeRegion = page.locator("[data-hud-region=marquee]")
  const marquee = marqueeRegion.locator(".flex.w-max").first()
  const firstHeight = await marqueeRegion.evaluate((el) => el.getBoundingClientRect().height)
  const firstTransform = await marquee.evaluate((el) => getComputedStyle(el).transform)
  await expect
    .poll(async () => marquee.evaluate((el) => getComputedStyle(el).transform), { timeout: 5_000 })
    .not.toBe(firstTransform)

  const visibleRole = page.locator(
    "[data-hud-region=roles] [data-text-loop] > div:not([aria-hidden])",
  )
  const firstRole = ((await visibleRole.innerText()) ?? "").replace(/\s+/g, " ").trim()
  await expect
    .poll(async () => ((await visibleRole.innerText()) ?? "").replace(/\s+/g, " ").trim(), {
      timeout: 5_000,
    })
    .not.toBe(firstRole)

  const cls = await page.evaluate(() => (window as typeof window & { __heroCls: number }).__heroCls)
  expect(cls).toBeLessThan(0.01)
  expect(await marqueeRegion.evaluate((el) => el.getBoundingClientRect().height)).toBe(firstHeight)
})

test("home chrome: wordmark, about/contact nav, and hire label", async ({ page }, testInfo) => {
  await openHome(page)
  await assertHomeIdentity(page)

  const forceClick = testInfo.project.name === "landscape-phone"
  const about = page.locator("[data-hero-root]").getByRole("link", { name: "about", exact: true })
  const aboutDoc = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/about" &&
      response.request().resourceType() === "document",
  )
  await about.click({ force: forceClick })
  expect((await aboutDoc).status()).toBe(200)
  await expect(page).toHaveURL(/\/about\/?$/)

  await openHome(page)
  await assertHomeIdentity(page)

  const contact = page
    .locator("[data-hero-root]")
    .getByRole("link", { name: "contact", exact: true })
  const contactDoc = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/contact" &&
      response.request().resourceType() === "document",
  )
  await contact.click({ force: forceClick })
  expect((await contactDoc).status()).toBe(200)
  await expect(page).toHaveURL(/\/contact\/?$/)
})
