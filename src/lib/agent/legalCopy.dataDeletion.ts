import { site } from "../../config/site"
import { BR, link, mailLink, siteLink, type LegalDocumentCopy } from "./legalCopy.types"

export const DATA_DELETION: LegalDocumentCopy = {
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
