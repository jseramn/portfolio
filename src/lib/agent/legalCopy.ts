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

const BR = { br: true } as const

function link(href: string, text: string, rel?: "noopener noreferrer"): LegalInline {
  return rel ? { href, text, rel } : { href, text }
}

function strong(text: string): LegalInline {
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

const siteLink = link(site.url, "jseramn.tech")
const mailLink = link(`mailto:${site.email}`, site.email)

const POLICY: LegalDocumentCopy = {
  id: "policy",
  path: "/policy",
  title: "Privacy Policy",
  description:
    "Privacy policy for jseramn.tech and related messaging services operated by José Ramón García Del Risco.",
  heading: "Privacy Policy",
  lastUpdated: "August 27, 2026",
  blocks: [
    {
      type: "p",
      children: [
        'This policy describes how José Ramón García Del Risco ("I", "me") collects and uses information when you visit ',
        siteLink,
        ", use the contact form, or message me through WhatsApp or other Meta messaging channels connected to my services (including the AUREUS assistant).",
      ],
    },
    { type: "h2", text: "Information I collect" },
    {
      type: "ul",
      items: [
        [
          strong("Website visitors:"),
          " pages viewed, clicks and other autocaptured interactions, approximate location derived from IP, browser and device type, referral source, and JavaScript exceptions. PostHog records these as cookieless, anonymous events. Session replay, surveys, console-log recording, and Core Web Vitals collection are disabled. I do not identify visitors, set analytics cookies, or send contact-form contents, names, emails, or decryption passphrases to PostHog. With surveys disabled in the client, survey scripts do not load even if a survey is launched in the PostHog project.",
        ],
        [
          strong("Contact form:"),
          " the message you submit is encrypted in your browser before transmission. I receive only ciphertext by email. Optional anti-abuse signals (for example Cloudflare Turnstile and rate-limit metadata) may be processed.",
        ],
        [
          strong("WhatsApp / Meta messaging:"),
          " your phone number, display name, message content, timestamps, and delivery status as provided by Meta's WhatsApp Business Platform when you contact me or use connected automations.",
        ],
        [
          strong("GitHub presence:"),
          " public profile and contribution statistics displayed on the site are fetched from GitHub's public API; I do not receive your GitHub credentials.",
        ],
      ],
    },
    { type: "h2", text: "How I use information" },
    {
      type: "p",
      children: [
        "I use this data to operate and secure the site, respond to inquiries, provide messaging services you request, prevent abuse, and improve reliability. I do not sell personal data.",
      ],
    },
    { type: "h2", text: "Third-party services" },
    {
      type: "ul",
      items: [
        [strong("Vercel"), " — hosting and CDN"],
        [
          strong("PostHog"),
          " — cookieless product analytics, autocapture, exception capture, and feature flags (Cloud US). Session replay, surveys, console recording, and web vitals are off.",
        ],
        [strong("Meta / WhatsApp"), " — messaging delivery and Business Platform APIs"],
        [strong("Resend"), " — encrypted contact email delivery"],
        [strong("Cloudflare"), " — Turnstile bot protection (when enabled)"],
        [strong("Upstash"), " — rate limiting for the contact API (when enabled)"],
        [strong("GitHub"), " — public stats shown on the portfolio"],
      ],
    },
    {
      type: "p",
      children: [
        "These providers process data under their own terms and privacy policies. Messaging through WhatsApp is also subject to ",
        link(
          "https://www.whatsapp.com/legal/privacy-policy",
          "WhatsApp's Privacy Policy",
          "noopener noreferrer",
        ),
        ".",
      ],
    },
    { type: "h2", text: "Retention" },
    {
      type: "p",
      children: [
        "Contact ciphertext and message logs are kept only as long as needed to respond, operate services, or meet legal obligations, then deleted or anonymized where practical. Server and analytics logs follow each provider's default retention periods.",
      ],
    },
    { type: "h2", text: "Your rights" },
    {
      type: "p",
      children: [
        "Depending on your location, you may request access, correction, deletion, or restriction of personal data I control. To exercise these rights, email ",
        mailLink,
        " or use the ",
        link("/data-deletion", "data deletion instructions"),
        ". I will verify requests before acting.",
      ],
    },
    { type: "h2", text: "Contact" },
    {
      type: "p",
      children: ["Operator: ", site.name, BR, "Email: ", mailLink, BR, "Website: ", siteLink],
    },
    {
      type: "p",
      children: [
        "See also: ",
        link("/terms", "Terms of Service"),
        " · ",
        link("/data-deletion", "Data Deletion"),
      ],
    },
  ],
}

const TERMS: LegalDocumentCopy = {
  id: "terms",
  path: "/terms",
  title: "Terms of Service",
  description: "Terms of service for jseramn.tech and related messaging services.",
  heading: "Terms of Service",
  lastUpdated: "August 9, 2026",
  blocks: [
    {
      type: "p",
      children: [
        "By using ",
        siteLink,
        " or messaging me through connected WhatsApp or Meta channels (including AUREUS), you agree to these terms. If you do not agree, do not use the services.",
      ],
    },
    { type: "h2", text: "Services" },
    {
      type: "p",
      children: [
        "This site is a personal portfolio and contact channel. Messaging features are provided for legitimate communication and assistance. I may modify, suspend, or discontinue any feature at any time.",
      ],
    },
    { type: "h2", text: "Acceptable use" },
    {
      type: "ul",
      items: [
        ["Do not send unlawful, harassing, fraudulent, or abusive content."],
        ["Do not attempt to disrupt, probe, or overload the site or APIs."],
        ["Do not use automated means to scrape or spam the contact form or messaging endpoints."],
      ],
    },
    { type: "h2", text: "No warranties" },
    {
      type: "p",
      children: [
        'The site and messaging services are provided "as is" without warranties of any kind. I do not guarantee uninterrupted availability, accuracy of automated responses, or fitness for a particular purpose.',
      ],
    },
    { type: "h2", text: "Limitation of liability" },
    {
      type: "p",
      children: [
        "To the fullest extent permitted by law, I am not liable for indirect, incidental, or consequential damages arising from your use of the site or messaging services.",
      ],
    },
    { type: "h2", text: "Third-party platforms" },
    {
      type: "p",
      children: [
        "WhatsApp and other Meta products are governed by their own terms. Your use of those platforms remains subject to Meta's policies in addition to these terms.",
      ],
    },
    { type: "h2", text: "Changes" },
    {
      type: "p",
      children: [
        "I may update these terms by posting a new version on this page. Continued use after changes constitutes acceptance of the updated terms.",
      ],
    },
    { type: "h2", text: "Contact" },
    {
      type: "p",
      children: ["Questions: ", mailLink],
    },
    {
      type: "p",
      children: [
        "See also: ",
        link("/policy", "Privacy Policy"),
        " · ",
        link("/data-deletion", "Data Deletion"),
      ],
    },
  ],
}

const DATA_DELETION: LegalDocumentCopy = {
  id: "dataDeletion",
  path: "/data-deletion",
  title: "Data Deletion",
  description:
    "How to request deletion of personal data held by jseramn.tech and related messaging services.",
  heading: "Data Deletion Instructions",
  lastUpdated: "August 27, 2026",
  blocks: [
    {
      type: "p",
      children: [
        "You can request deletion of personal data that José Ramón García Del Risco controls in connection with ",
        siteLink,
        " or WhatsApp / Meta messaging services (including AUREUS).",
      ],
    },
    { type: "h2", text: "How to request deletion" },
    {
      type: "ol",
      items: [
        [
          "Email ",
          mailLink,
          " from the address or phone number associated with your data, or message me on the same WhatsApp number you used previously.",
        ],
        [
          'Include "Data deletion request" in the subject or first line and specify what you want removed (for example: contact form submission, WhatsApp conversation history I store).',
        ],
        [
          "I will confirm your identity and respond within 30 days, or sooner where required by law.",
        ],
      ],
    },
    { type: "h2", text: "What can be deleted" },
    {
      type: "ul",
      items: [
        ["Encrypted contact form submissions and related email records I control"],
        ["Message logs and conversation data stored in my systems"],
        ["Any other personal data I hold that is not required for legal or security purposes"],
        [
          "PostHog person profiles if any were created in error; anonymous cookieless events have no email or name attached",
        ],
      ],
    },
    { type: "h2", text: "What I cannot delete" },
    {
      type: "p",
      children: [
        "Data held solely by Meta/WhatsApp, Vercel, PostHog, Resend, or other third-party providers must be requested through those services where applicable. Aggregated analytics without personal identifiers may be retained.",
      ],
    },
    { type: "h2", text: "Contact" },
    {
      type: "p",
      children: ["Operator: ", site.name, BR, "Email: ", mailLink],
    },
    {
      type: "p",
      children: [
        "See also: ",
        link("/policy", "Privacy Policy"),
        " · ",
        link("/terms", "Terms of Service"),
      ],
    },
  ],
}

const BY_ID: Record<LegalPageId, LegalDocumentCopy> = {
  policy: POLICY,
  terms: TERMS,
  dataDeletion: DATA_DELETION,
}

const BY_PATH: Record<LegalDocumentCopy["path"], LegalDocumentCopy> = {
  "/policy": POLICY,
  "/terms": TERMS,
  "/data-deletion": DATA_DELETION,
}

export const LEGAL_PAGE_IDS = ["policy", "terms", "dataDeletion"] as const

export function legalDocument(id: LegalPageId): LegalDocumentCopy {
  return BY_ID[id]
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
