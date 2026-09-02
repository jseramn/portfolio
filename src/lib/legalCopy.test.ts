import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const here = dirname(fileURLToPath(import.meta.url))
const policy = readFileSync(join(here, "../pages/policy.astro"), "utf8")
const deletion = readFileSync(join(here, "../pages/data-deletion.astro"), "utf8")
const terms = readFileSync(join(here, "../pages/terms.astro"), "utf8")
const home = readFileSync(join(here, "../pages/index.astro"), "utf8")
const about = readFileSync(join(here, "../pages/about.astro"), "utf8")
const contact = readFileSync(join(here, "../pages/contact.astro"), "utf8")
const notFound = readFileSync(join(here, "../pages/404.astro"), "utf8")

describe("legal copy names PostHog", () => {
  it("discloses cookieless PostHog on the privacy policy", () => {
    expect(policy).toMatch(/PostHog/)
    expect(policy).toMatch(/cookieless/)
    expect(policy).toMatch(/session replay/i)
    expect(policy).toMatch(/disabled/)
    expect(policy).toMatch(/August 27, 2026/)
    expect(policy).not.toMatch(/Vercel Analytics/)
    expect(policy).not.toMatch(/Speed Insights/)
  })

  it("names PostHog on the data-deletion page", () => {
    expect(deletion).toMatch(/PostHog/)
    expect(deletion).toMatch(/August 27, 2026/)
  })
})

describe("SSR routes stay dynamic", () => {
  it("keeps prerender false on home, about, contact, and 404", () => {
    for (const source of [home, about, contact, notFound]) {
      expect(source).toMatch(/export const prerender = false/)
    }
  })

  it("keeps legal pages prerendered", () => {
    for (const source of [policy, deletion, terms]) {
      expect(source).not.toMatch(/export const prerender = false/)
    }
  })
})
