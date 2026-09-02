import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  LEGAL_PAGE_IDS,
  legalDocument,
  legalMarkdownHrefs,
  legalVisibleText,
} from "./agent/legalCopy"

const here = dirname(fileURLToPath(import.meta.url))
const policyPage = readFileSync(join(here, "../pages/policy.astro"), "utf8")
const deletionPage = readFileSync(join(here, "../pages/data-deletion.astro"), "utf8")
const termsPage = readFileSync(join(here, "../pages/terms.astro"), "utf8")
const home = readFileSync(join(here, "../pages/index.astro"), "utf8")
const about = readFileSync(join(here, "../pages/about.astro"), "utf8")
const contact = readFileSync(join(here, "../pages/contact.astro"), "utf8")
const notFound = readFileSync(join(here, "../pages/404.astro"), "utf8")

const POLICY_VISIBLE =
  "This policy describes how José Ramón García Del Risco (\"I\", \"me\") collects and uses information when you visit jseramn.tech, use the contact form, or message me through WhatsApp or other Meta messaging channels connected to my services (including the AUREUS assistant). Information I collect Website visitors: pages viewed, clicks and other autocaptured interactions, approximate location derived from IP, browser and device type, referral source, and JavaScript exceptions. PostHog records these as cookieless, anonymous events. Session replay, surveys, console-log recording, and Core Web Vitals collection are disabled. I do not identify visitors, set analytics cookies, or send contact-form contents, names, emails, or decryption passphrases to PostHog. With surveys disabled in the client, survey scripts do not load even if a survey is launched in the PostHog project. Contact form: the message you submit is encrypted in your browser before transmission. I receive only ciphertext by email. Optional anti-abuse signals (for example Cloudflare Turnstile and rate-limit metadata) may be processed. WhatsApp / Meta messaging: your phone number, display name, message content, timestamps, and delivery status as provided by Meta's WhatsApp Business Platform when you contact me or use connected automations. GitHub presence: public profile and contribution statistics displayed on the site are fetched from GitHub's public API; I do not receive your GitHub credentials. How I use information I use this data to operate and secure the site, respond to inquiries, provide messaging services you request, prevent abuse, and improve reliability. I do not sell personal data. Third-party services Vercel — hosting and CDN PostHog — cookieless product analytics, autocapture, exception capture, and feature flags (Cloud US). Session replay, surveys, console recording, and web vitals are off. Meta / WhatsApp — messaging delivery and Business Platform APIs Resend — encrypted contact email delivery Cloudflare — Turnstile bot protection (when enabled) Upstash — rate limiting for the contact API (when enabled) GitHub — public stats shown on the portfolio These providers process data under their own terms and privacy policies. Messaging through WhatsApp is also subject to WhatsApp's Privacy Policy. Retention Contact ciphertext and message logs are kept only as long as needed to respond, operate services, or meet legal obligations, then deleted or anonymized where practical. Server and analytics logs follow each provider's default retention periods. Your rights Depending on your location, you may request access, correction, deletion, or restriction of personal data I control. To exercise these rights, email contacto@jseramn.tech or use the data deletion instructions. I will verify requests before acting. Contact Operator: José Ramón García Del Risco Email: contacto@jseramn.tech Website: jseramn.tech See also: Terms of Service · Data Deletion"

const TERMS_VISIBLE =
  'By using jseramn.tech or messaging me through connected WhatsApp or Meta channels (including AUREUS), you agree to these terms. If you do not agree, do not use the services. Services This site is a personal portfolio and contact channel. Messaging features are provided for legitimate communication and assistance. I may modify, suspend, or discontinue any feature at any time. Acceptable use Do not send unlawful, harassing, fraudulent, or abusive content. Do not attempt to disrupt, probe, or overload the site or APIs. Do not use automated means to scrape or spam the contact form or messaging endpoints. No warranties The site and messaging services are provided "as is" without warranties of any kind. I do not guarantee uninterrupted availability, accuracy of automated responses, or fitness for a particular purpose. Limitation of liability To the fullest extent permitted by law, I am not liable for indirect, incidental, or consequential damages arising from your use of the site or messaging services. Third-party platforms WhatsApp and other Meta products are governed by their own terms. Your use of those platforms remains subject to Meta\'s policies in addition to these terms. Changes I may update these terms by posting a new version on this page. Continued use after changes constitutes acceptance of the updated terms. Contact Questions: contacto@jseramn.tech See also: Privacy Policy · Data Deletion'

const DELETION_VISIBLE =
  'You can request deletion of personal data that José Ramón García Del Risco controls in connection with jseramn.tech or WhatsApp / Meta messaging services (including AUREUS). How to request deletion Email contacto@jseramn.tech from the address or phone number associated with your data, or message me on the same WhatsApp number you used previously. Include "Data deletion request" in the subject or first line and specify what you want removed (for example: contact form submission, WhatsApp conversation history I store). I will confirm your identity and respond within 30 days, or sooner where required by law. What can be deleted Encrypted contact form submissions and related email records I control Message logs and conversation data stored in my systems Any other personal data I hold that is not required for legal or security purposes PostHog person profiles if any were created in error; anonymous cookieless events have no email or name attached What I cannot delete Data held solely by Meta/WhatsApp, Vercel, PostHog, Resend, or other third-party providers must be requested through those services where applicable. Aggregated analytics without personal identifiers may be retained. Contact Operator: José Ramón García Del Risco Email: contacto@jseramn.tech See also: Privacy Policy · Terms of Service'

describe("legal copy names PostHog", () => {
  it("discloses cookieless PostHog on the privacy policy", () => {
    const text = legalVisibleText(legalDocument("policy"))
    expect(text).toMatch(/PostHog/)
    expect(text).toMatch(/cookieless/)
    expect(text).toMatch(/session replay/i)
    expect(text).toMatch(/disabled/)
    expect(legalDocument("policy").lastUpdated).toBe("August 27, 2026")
    expect(text).not.toMatch(/Vercel Analytics/)
    expect(text).not.toMatch(/Speed Insights/)
  })

  it("names PostHog on the data-deletion page", () => {
    const text = legalVisibleText(legalDocument("dataDeletion"))
    expect(text).toMatch(/PostHog/)
    expect(legalDocument("dataDeletion").lastUpdated).toBe("August 27, 2026")
  })
})

describe("legal copy is a single source", () => {
  it("keeps visible policy, terms, and data-deletion text identical after the move", () => {
    expect(legalVisibleText(legalDocument("policy"))).toBe(POLICY_VISIBLE)
    expect(legalVisibleText(legalDocument("terms"))).toBe(TERMS_VISIBLE)
    expect(legalVisibleText(legalDocument("dataDeletion"))).toBe(DELETION_VISIBLE)
  })

  it("exposes lastUpdated and in-page links for every legal document", () => {
    expect(LEGAL_PAGE_IDS).toEqual(["policy", "terms", "dataDeletion"])
    const policy = legalDocument("policy")
    expect(policy.lastUpdated).toBe("August 27, 2026")
    expect(legalMarkdownHrefs(policy)).toEqual(
      expect.arrayContaining([
        "https://jseramn.tech",
        "mailto:contacto@jseramn.tech",
        "/data-deletion",
        "/terms",
        "https://www.whatsapp.com/legal/privacy-policy",
      ]),
    )
    expect(legalMarkdownHrefs(legalDocument("terms"))).toEqual(
      expect.arrayContaining([
        "https://jseramn.tech",
        "mailto:contacto@jseramn.tech",
        "/policy",
        "/data-deletion",
      ]),
    )
    expect(legalMarkdownHrefs(legalDocument("dataDeletion"))).toEqual(
      expect.arrayContaining([
        "https://jseramn.tech",
        "mailto:contacto@jseramn.tech",
        "/policy",
        "/terms",
      ]),
    )
  })
})

describe("SSR routes stay dynamic", () => {
  it("keeps prerender false on home, about, contact, 404, and legal pages", () => {
    for (const source of [home, about, contact, notFound, policyPage, deletionPage, termsPage]) {
      expect(source).toMatch(/export const prerender = false/)
    }
  })

  it("keeps SecondaryPage legal json-ld and shared copy on legal routes", () => {
    for (const source of [policyPage, deletionPage, termsPage]) {
      expect(source).toContain('jsonLdPage="legal"')
      expect(source).toContain("LegalDocument")
      expect(source).toContain("legalDocument(")
    }
  })
})
