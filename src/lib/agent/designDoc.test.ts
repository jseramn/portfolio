import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { GET } from "../../pages/design.md"
import { AGENT_FILES_SOURCE } from "../security/siteSecurityHeaders.mjs"
import { skipNegotiate } from "./skip"
import {
  DESIGN_DOC_PATH,
  DESIGN_MARKDOWN_TYPE,
  designMarkdown,
  designMarkdownResponse,
} from "./designDoc"

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..")

describe("designMarkdown", () => {
  it("returns the repo-root design.md bytes as markdown", async () => {
    const expected = readFileSync(join(root, "design.md"), "utf8")
    expect(expected.startsWith("# jseramn.tech design system")).toBe(true)
    expect(designMarkdown()).toBe(expected)

    const response = designMarkdownResponse()
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe(DESIGN_MARKDOWN_TYPE)
    expect(await response.text()).toBe(expected)
  })

  it("is skipped by Accept negotiation and listed in agent CORS sources", () => {
    expect(DESIGN_DOC_PATH).toBe("/design.md")
    expect(skipNegotiate(DESIGN_DOC_PATH)).toBe(true)
    expect(AGENT_FILES_SOURCE).toMatch(/design\.md/)
  })

  it("GET /design.md is prerendered and returns the same body", async () => {
    const source = readFileSync(join(root, "src/pages/design.md.ts"), "utf8")
    expect(source).toMatch(/export const prerender = true/)
    const response = await GET({} as Parameters<typeof GET>[0])
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe(DESIGN_MARKDOWN_TYPE)
    expect(await response.text()).toBe(designMarkdown())
  })
})
