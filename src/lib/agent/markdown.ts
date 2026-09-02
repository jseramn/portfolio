import { agentCopy, type AgentPage } from "./copy"
import {
  legalDocument,
  legalDocumentFromPath,
  legalToMarkdown,
  type LegalPageId,
} from "./legalCopy"
import { linkifyMarkdown } from "./linkify"

export type MarkdownPage = AgentPage | LegalPageId

export const RECOVERY_PATHS = [
  "/",
  "/llms.txt",
  "/sitemap-index.xml",
  "/about",
  "/contact",
  "/policy",
] as const

export function pageFromPath(pathname: string): MarkdownPage | null {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/"
  if (path === "/") return "home"
  if (path === "/about") return "about"
  if (path === "/contact") return "contact"
  if (path === "/tinity") return "tinity"
  const legal = legalDocumentFromPath(path)
  return legal?.id ?? null
}

export function toMarkdown(page: MarkdownPage): string {
  if (page === "policy" || page === "terms" || page === "dataDeletion") {
    return legalToMarkdown(legalDocument(page))
  }
  const copy = agentCopy(page)
  if (copy.sections?.length) {
    const blocks = copy.sections.flatMap((section) => [`## ${section.h2}`, "", section.body, ""])
    return [`# ${copy.h1}`, "", ...blocks].join("\n")
  }
  return [`# ${copy.h1}`, "", linkifyMarkdown(copy.body), ""].join("\n")
}

export function notFoundMarkdown(): string {
  const { h1, body } = agentCopy("notFound")
  const links = RECOVERY_PATHS.map((href) => `- ${href}`).join("\n")
  return [`# ${h1}`, "", body, "", "## Where to look next", "", links, ""].join("\n")
}
