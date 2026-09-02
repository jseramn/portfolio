import { DATA_DELETION } from "./legalCopy.dataDeletion"
import { POLICY } from "./legalCopy.policy"
import { TERMS } from "./legalCopy.terms"
import {
  isBreak,
  isLegalLink,
  isStrong,
  type LegalDocumentCopy,
  type LegalInline,
  type LegalPageId,
} from "./legalCopy.types"

export type {
  LegalBlock,
  LegalDocumentCopy,
  LegalInline,
  LegalListItem,
  LegalPageId,
} from "./legalCopy.types"
export { isBreak, isLegalLink, isStrong } from "./legalCopy.types"

export const LEGAL_DOCUMENTS = {
  policy: POLICY,
  terms: TERMS,
  dataDeletion: DATA_DELETION,
} as const satisfies Record<LegalPageId, LegalDocumentCopy>

const BY_PATH: Record<LegalDocumentCopy["path"], LegalDocumentCopy> = {
  "/policy": POLICY,
  "/terms": TERMS,
  "/data-deletion": DATA_DELETION,
}

export const LEGAL_PAGE_IDS = ["policy", "terms", "dataDeletion"] as const

export function legalDocument(id: LegalPageId): LegalDocumentCopy {
  return LEGAL_DOCUMENTS[id]
}

export function legalDocumentFromPath(pathname: string): LegalDocumentCopy | null {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/"
  if (path === "/policy" || path === "/terms" || path === "/data-deletion") {
    return BY_PATH[path]
  }
  return null
}

export function inlinesToText(nodes: readonly LegalInline[]): string {
  return nodes
    .map((node) => {
      if (typeof node === "string") return node
      if (isBreak(node)) return " "
      if (isStrong(node)) return node.strong
      return node.text
    })
    .join("")
}

export function normalizeLegalVisible(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/ ([.,;:])/g, "$1")
    .trim()
}

export function legalVisibleText(doc: LegalDocumentCopy): string {
  const chunks: string[] = []
  for (const block of doc.blocks) {
    if (block.type === "h2") {
      chunks.push(block.text)
      continue
    }
    if (block.type === "p") {
      chunks.push(inlinesToText(block.children))
      continue
    }
    for (const item of block.items) chunks.push(inlinesToText(item))
  }
  return normalizeLegalVisible(chunks.join(" "))
}

function inlinesToMarkdown(nodes: readonly LegalInline[]): string {
  return nodes
    .map((node) => {
      if (typeof node === "string") return node
      if (isBreak(node)) return "\n"
      if (isStrong(node)) return `**${node.strong}**`
      return `[${node.text}](${node.href})`
    })
    .join("")
}

export function legalToMarkdown(doc: LegalDocumentCopy): string {
  const parts: string[] = [`# ${doc.heading}`, "", `Last updated: ${doc.lastUpdated}`, ""]
  for (const block of doc.blocks) {
    if (block.type === "h2") {
      parts.push(`## ${block.text}`, "")
      continue
    }
    if (block.type === "p") {
      parts.push(inlinesToMarkdown(block.children), "")
      continue
    }
    if (block.type === "ul") {
      for (const item of block.items) parts.push(`- ${inlinesToMarkdown(item)}`)
      parts.push("")
      continue
    }
    for (const [index, item] of block.items.entries()) {
      parts.push(`${index + 1}. ${inlinesToMarkdown(item)}`)
    }
    parts.push("")
  }
  return `${parts.join("\n").trimEnd()}\n`
}

export function legalMarkdownHrefs(doc: LegalDocumentCopy): string[] {
  const hrefs: string[] = []
  const walk = (nodes: readonly LegalInline[]) => {
    for (const node of nodes) {
      if (isLegalLink(node)) hrefs.push(node.href)
    }
  }
  for (const block of doc.blocks) {
    if (block.type === "p") walk(block.children)
    if (block.type === "ul" || block.type === "ol") {
      for (const item of block.items) walk(item)
    }
  }
  return [...new Set(hrefs)]
}
