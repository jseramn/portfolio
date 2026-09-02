import { site } from "../../config/site"
import { pageFromPath, toMarkdown } from "./markdown"

export const LLMS_FULL_PAGE_PATHS = ["/", "/about", "/contact"] as const

const LEGAL_PATHS = ["/policy", "/terms", "/data-deletion"] as const

export function llmsFullPaths(): string[] {
  return [...LLMS_FULL_PAGE_PATHS, ...LEGAL_PATHS.filter((path) => pageFromPath(path) !== null)]
}

export function buildLlmsFullTxt(): string {
  const sections = llmsFullPaths().map((path) => {
    const page = pageFromPath(path)
    if (!page) {
      throw new Error(`generate-llms-full: no markdown page for ${path}`)
    }
    return `## ${site.url}${path}\n\n${toMarkdown(page).trimEnd()}\n`
  })
  return `${sections.join("\n").trimEnd()}\n`
}
