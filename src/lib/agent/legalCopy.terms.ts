import { link, mailLink, siteLink, type LegalDocumentCopy } from "./legalCopy.types"

export const TERMS: LegalDocumentCopy = {
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
