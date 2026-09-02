import { site } from "../../config/site"
import { BR, link, mailLink, siteLink, strong, type LegalDocumentCopy } from "./legalCopy.types"

export const POLICY: LegalDocumentCopy = {
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
