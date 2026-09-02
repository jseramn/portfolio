import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { site } from "../../config/site"
import { MANIFESTO } from "../../tinity/experience/copy"
import { agentCopy, readableLength } from "./copy"
import { LEGAL_PAGE_IDS, legalDocument, legalVisibleText, normalizeLegalVisible } from "./legalCopy"
import { pageFromPath, toMarkdown } from "./markdown"

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..")
const dist = join(root, "dist/client")
const preview = process.env.AGENT_BASE_URL ?? "http://127.0.0.1:4321"

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

function readableText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

async function fetchIfUp(path: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(new URL(path, preview), { ...init, redirect: "manual" })
    return res
  } catch {
    return null
  }
}

function declaredHttpUrls(text: string): string[] {
  const urls = new Set<string>()
  for (const match of text.matchAll(/https?:\/\/[^\s)>\]]+/gi)) {
    urls.add(match[0].replace(/[.,;]+$/, ""))
  }
  for (const match of text.matchAll(/\((https?:\/\/[^)\s]+)\)/gi)) {
    urls.add(match[1])
  }
  return [...urls]
}

function firstPartyPathExists(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/"
  if (path === "/") return existsSync(join(root, "src/pages/index.astro"))
  if (path === "/llms.txt") return existsSync(join(root, "public/llms.txt"))
  if (path === "/sitemap-index.xml" || path === "/sitemap-0.xml") return true
  const asPublic = join(root, "public", path.slice(1))
  if (existsSync(asPublic)) return true
  const asPage = join(root, "src/pages", `${path.slice(1)}.astro`)
  const asTs = join(root, "src/pages", `${path.slice(1)}.ts`)
  const asIndex = join(root, "src/pages", path.slice(1), "index.astro")
  return existsSync(asPage) || existsSync(asTs) || existsSync(asIndex)
}

const LARGE_INLINE_CSS = 8_000

function stylesheetHrefs(html: string): string[] {
  return [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)].flatMap((tag) => {
    const href = tag[0].match(/\bhref=["']([^"']+)["']/i)
    return href?.[1] ? [href[1]] : []
  })
}

function inlineStyleChars(html: string): number {
  return [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].reduce(
    (total, block) => total + (block[1]?.length ?? 0),
    0,
  )
}

async function pageHtml(path: string): Promise<string | null> {
  const live = await fetchIfUp(path)
  if (live?.ok) return live.text()
  const rel = path === "/" ? "index.html" : `${path.slice(1)}/index.html`
  const file = join(dist, rel)
  return existsSync(file) ? readFileSync(file, "utf8") : null
}

describe("built HTML overlay", () => {
  it("home copy is long enough to keep ≥5% on a ~25kB prerendered shell", () => {
    expect(readableLength(agentCopy("home")) / 25_000).toBeGreaterThanOrEqual(0.05)
  })

  it("homepage source wraps the hero in a main landmark", () => {
    const home = readFileSync(join(root, "src/pages/index.astro"), "utf8")
    expect(home).toMatch(/<main\b/)
    expect(home).toContain('id="main"')
    expect(home).not.toContain('class="contents"')
    expect(home.indexOf("<main")).toBeLessThan(home.indexOf("<h1>"))
    expect(home.indexOf("</main>")).toBeGreaterThan(home.indexOf("<Hero client:load"))
  })

  it("homepage has h1, ≥800 readable chars, ≥5% ratio, sr-only, canonical, hero, email-only JSON-LD", async () => {
    let html: string | null = null
    const live = await fetchIfUp("/")
    if (live?.ok) html = await live.text()
    else if (existsSync(join(dist, "index.html")))
      html = readFileSync(join(dist, "index.html"), "utf8")
    if (!html) return

    const text = readableText(html)
    expect(html).toMatch(/<h1[\s>]/)
    expect(html).toMatch(/<main[\s>]/)
    expect(html.match(/<h2[\s>]/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
    expect(text.length).toBeGreaterThanOrEqual(800)
    const isViteDev = html.includes("/@vite/")
    if (!isViteDev) {
      expect(text.length / html.length).toBeGreaterThanOrEqual(0.05)
    }
    expect(html).toMatch(/class="[^"]*sr-only/)
    expect(html).toContain('lang="en"')
    expect(html).toContain('property="og:image"')
    expect(html).toContain('property="og:image:alt"')
    expect(html).toContain('property="og:image:type"')
    expect(html).toContain('property="og:type"')
    expect(html).toContain('rel="canonical"')
    expect(html).toContain('rel="describedby"')
    expect(html).toContain('href="/llms.txt"')
    expect(html).toContain('type="text/markdown"')
    expect((html.match(/rel="describedby"/g) ?? []).length).toBe(1)
    expect(html).toContain('rel="apple-touch-icon"')
    expect(html).toContain('rel="manifest"')
    expect(html).toContain('name="theme-color"')
    expect(html).toContain('name="twitter:image:alt"')
    expect(html).toContain("https://jseramn.tech/thumbnail.png")
    expect(html).toContain("https://jseramn.tech/apple-touch-icon.png")
    expect(html).toMatch(/"image"\s*:\s*"https:\/\/jseramn\.tech\/thumbnail\.png"/)
    expect(html).toContain("https://jseramn.tech")
    expect(html).toMatch(/hero-ascii-display|component-url="[^"]*Hero/)
    expect(html).toContain("contacto@jseramn.tech")
    expect(html).toContain("contactPoint")
    expect(html).toContain("PostalAddress")
    expect(html).toContain("Medellín")
    expect(html.toLowerCase()).not.toMatch(/"telephone"/)
    expect(text.toLowerCase()).toMatch(/portfolio/)
    expect(text.toLowerCase()).toMatch(/contact/)
    expect(text.toLowerCase()).not.toMatch(/pricing table/)
  })

  it("about and contact are ≥500 readable characters", async () => {
    expect(readableLength(agentCopy("about"))).toBeGreaterThanOrEqual(500)
    expect(readableLength(agentCopy("contact"))).toBeGreaterThanOrEqual(500)
    for (const path of ["/about", "/contact"]) {
      const live = await fetchIfUp(path)
      let html: string | null = null
      if (live?.ok) html = await live.text()
      else {
        const rel = `${path.slice(1)}/index.html`
        if (existsSync(join(dist, rel))) html = readFileSync(join(dist, rel), "utf8")
      }
      if (!html) continue
      expect(readableText(html).length).toBeGreaterThanOrEqual(500)
    }
  })

  it("404 lists recovery links and dist has no markdown twins", async () => {
    const live = await fetchIfUp("/some-path-that-does-not-exist")
    let html: string | null = null
    if (live) {
      expect([404, 410]).toContain(live.status)
      html = await live.text()
    } else if (existsSync(join(dist, "404.html"))) {
      html = readFileSync(join(dist, "404.html"), "utf8")
    }
    if (html) {
      for (const href of [
        "/",
        "/llms.txt",
        "/sitemap-index.xml",
        "/about",
        "/contact",
        "/policy",
      ]) {
        expect(html).toContain(href)
      }
    }
    if (existsSync(dist)) {
      expect(walk(dist).filter((file) => file.endsWith(".md"))).toEqual([])
    }
  })

  it("Layout advertises llms.txt describedby and markdown alternate at the canonical URL", () => {
    const layout = readFileSync(join(root, "src/layouts/Layout.astro"), "utf8")
    expect(layout).toContain('rel="describedby"')
    expect(layout).toContain('href="/llms.txt"')
    expect(layout).toContain('type="text/markdown"')
    expect(layout).toContain("href={canonical}")
    expect((layout.match(/rel="describedby"/g) ?? []).length).toBe(1)
  })

  it("home HTML prefetches about and contact via speculation rules", async () => {
    const layout = readFileSync(join(root, "src/layouts/Layout.astro"), "utf8")
    expect(layout).toContain('type="speculationrules"')
    expect(layout).toMatch(/urls:\s*\["\/about",\s*"\/contact"\]/)
    expect(layout).toContain('pathname === "/"')
    expect(layout).not.toMatch(/"\/api\//)
    const home = await fetchIfUp("/")
    if (home?.ok) expect(await home.text()).toContain('type="speculationrules"')
    const about = await fetchIfUp("/about")
    if (about?.ok) expect(await about.text()).not.toContain('type="speculationrules"')
  })

  it("inlines critical CSS on home and links a stylesheet on secondary pages", async () => {
    const layout = readFileSync(join(root, "src/layouts/Layout.astro"), "utf8")
    const homeSrc = readFileSync(join(root, "src/pages/index.astro"), "utf8")
    const secondarySrc = readFileSync(join(root, "src/components/SecondaryPage.astro"), "utf8")
    expect(layout).toMatch(/inlineCss\s*=\s*false/)
    expect(layout).toContain("globals.css?inline")
    expect(layout).toContain("globals.css?url")
    expect(layout).toContain('rel="stylesheet"')
    expect(homeSrc).toMatch(/<Layout\b[^>]*\binlineCss\b/)
    expect(secondarySrc).not.toMatch(/\binlineCss\b/)

    const home = await pageHtml("/")
    const about = await pageHtml("/about")
    if (!home || !about || home.includes("/@vite/")) return

    expect(home).toMatch(/<style\b/i)
    expect(stylesheetHrefs(home).filter((href) => href.includes(".css"))).toEqual([])
    expect(inlineStyleChars(home)).toBeGreaterThan(LARGE_INLINE_CSS)
    expect(about).toMatch(/<link\b[^>]*rel=["']stylesheet["']/i)
    expect(stylesheetHrefs(about).some((href) => /\/_astro\/[^"']+\.css/.test(href))).toBe(true)
    expect(inlineStyleChars(about)).toBeLessThan(LARGE_INLINE_CSS)
  })

  it("llms.txt names jobs and how to call; privacy redirects to policy", () => {
    const llms = readFileSync(join(root, "public/llms.txt"), "utf8")
    expect(llms.toLowerCase()).toMatch(/tech lead/)
    expect(llms.toLowerCase()).toMatch(/cybersecurity/)
    expect(llms.toLowerCase()).toMatch(/web development/)
    expect(llms.toLowerCase()).toMatch(/founding|product/)
    expect(llms).toContain("/")
    expect(llms).toContain("/about")
    expect(llms).toContain("/contact")
    expect(llms).toContain("/tinity")
    expect(llms).toContain("mailto:contacto@jseramn.tech")
    expect(llms).not.toContain("presenciapyme.com")
    expect(llms).not.toContain("/api/contact")
    expect(llms).toContain("https://jseramn.tech/oembed.json")
    expect(llms).toMatch(/^## Pages$/m)
    expect(llms).toMatch(/^## Legal$/m)
    expect(llms).toMatch(/^## Optional$/m)
    expect(llms).toContain("Accept: text/markdown")
    expect(llms).toContain("Prefer email over any JSON API")
    expect(llms).toContain("/.well-known/security.txt")
    expect(llms).not.toMatch(/^- \*\*/m)
    const fileList = llms.match(/^- \[[^\]]+\]\([^)]+\)/gm) ?? []
    expect(fileList.length).toBeGreaterThanOrEqual(6)

    const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")) as {
      redirects: { source: string; destination: string; permanent: boolean }[]
    }
    expect(vercel.redirects).toContainEqual({
      source: "/privacy",
      destination: "/policy",
      permanent: true,
    })
  })

  it("every http(s) URL in llms.txt is first-party real content or an allowed external host", () => {
    const llms = readFileSync(join(root, "public/llms.txt"), "utf8")
    const urls = declaredHttpUrls(llms)
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) {
      const parsed = new URL(url)
      if (parsed.protocol === "mailto:") continue
      if (parsed.hostname === "jseramn.tech" || parsed.hostname === "www.jseramn.tech") {
        expect(firstPartyPathExists(parsed.pathname || "/"), url).toBe(true)
        continue
      }
      const allowedExternal = new Set([
        "github.com",
        "x.com",
        "instagram.com",
        "mallanet.org",
        "age-encryption.org",
        "linkedin.com",
      ])
      expect(allowedExternal.has(parsed.hostname), url).toBe(true)
    }
  })

  it("tinity HTML source and markdown share title, manifesto, and repo without live fetch", () => {
    const src = readFileSync(join(root, "src/pages/tinity/index.astro"), "utf8")
    expect(src).toContain("<h1>{site.tinity.name}</h1>")
    expect(src).toContain("{MANIFESTO}")
    expect(src).toContain("site.tinity.repo")
    expect(pageFromPath("/tinity")).toBe("tinity")
    const md = toMarkdown("tinity")
    expect(md).toContain(`# ${site.tinity.name}`)
    expect(md).toContain(MANIFESTO)
    expect(md).toContain(site.tinity.repo)
  })

  it("legal HTML readable text matches the shared legal copy", async () => {
    for (const id of LEGAL_PAGE_IDS) {
      const doc = legalDocument(id)
      const expected = legalVisibleText(doc)
      const live = await fetchIfUp(doc.path)
      let html: string | null = null
      if (live?.ok) html = await live.text()
      else {
        const rel = `${doc.path.slice(1)}/index.html`
        if (existsSync(join(dist, rel))) html = readFileSync(join(dist, rel), "utf8")
      }
      if (!html) {
        expect(expected.length).toBeGreaterThan(100)
        expect(expected).toContain("jseramn.tech")
        continue
      }
      const text = normalizeLegalVisible(readableText(html))
      expect(text).toContain(`Last updated: ${doc.lastUpdated}`)
      expect(text).toContain(doc.heading)
      expect(text).toContain(expected)
    }
  })
})
