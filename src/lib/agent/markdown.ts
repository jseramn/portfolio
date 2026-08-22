import { agentCopy, type AgentPage } from "./copy"

export const RECOVERY_PATHS = [
  "/",
  "/llms.txt",
  "/sitemap-index.xml",
  "/about",
  "/contact",
  "/policy",
] as const

export function pageFromPath(pathname: string): AgentPage | null {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/"
  if (path === "/") return "home"
  if (path === "/about") return "about"
  if (path === "/contact") return "contact"
  return null
}

export function toMarkdown(page: AgentPage): string {
  const { h1, body } = agentCopy(page)
  return [`# ${h1}`, "", body, ""].join("\n")
}

export function notFoundMarkdown(): string {
  const { h1, body } = agentCopy("notFound")
  const links = RECOVERY_PATHS.map((href) => `- ${href}`).join("\n")
  return [`# ${h1}`, "", body, "", "## Where to look next", "", links, ""].join("\n")
}
