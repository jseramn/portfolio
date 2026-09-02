import { site } from "../../config/site"

export type LegalInline =
  | string
  | { href: string; text: string; rel?: "noopener noreferrer" }
  | { br: true }
  | { strong: string }

export type LegalListItem = readonly LegalInline[]

export type LegalBlock =
  | { type: "p"; children: readonly LegalInline[] }
  | { type: "h2"; text: string }
  | { type: "ul"; items: readonly LegalListItem[] }
  | { type: "ol"; items: readonly LegalListItem[] }

export type LegalPageId = "policy" | "terms" | "dataDeletion"

export type LegalDocumentCopy = {
  id: LegalPageId
  path: "/policy" | "/terms" | "/data-deletion"
  title: string
  description: string
  heading: string
  lastUpdated: string
  blocks: readonly LegalBlock[]
}

export const BR = { br: true } as const

export function link(href: string, text: string, rel?: "noopener noreferrer"): LegalInline {
  return rel ? { href, text, rel } : { href, text }
}

export function strong(text: string): LegalInline {
  return { strong: text }
}

export function isBreak(node: LegalInline): node is { br: true } {
  return typeof node === "object" && "br" in node
}

export function isStrong(node: LegalInline): node is { strong: string } {
  return typeof node === "object" && "strong" in node
}

export function isLegalLink(
  node: LegalInline,
): node is { href: string; text: string; rel?: "noopener noreferrer" } {
  return typeof node === "object" && "href" in node
}

export const siteLink = link(site.url, "jseramn.tech")
export const mailLink = link(`mailto:${site.email}`, site.email)
