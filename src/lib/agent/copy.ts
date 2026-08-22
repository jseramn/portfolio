import { site } from "../../config/site"

export type AgentPage = "home" | "about" | "contact" | "notFound"

export type AgentCopy = {
  h1: string
  body: string
}

const ORGS = site.marqueeOrgs.map((org) => `${org.label} (${org.href})`).join("; ")

const HOME_H1 = `${site.name} (${site.brand})`

const HOME_BODY = [
  `${site.name}, known as ${site.brand}, runs this site as a personal portfolio and contact surface.`,
  `It is for people and teams who want to reach him about ${site.roles.join(", ")} work.`,
  `jseramn.tech is not a product, SaaS, or billed service. It does not publish pricing, plans, packages, or a commercial catalog.`,
  `Tagline: ${site.tagline.en} / ${site.tagline.es}.`,
  `Affiliations shown on the site: ${ORGS}.`,
  `How to get in touch: email ${site.email}, open /contact, or use the on-site encrypted contact form.`,
  `The form encrypts messages in the browser with age before delivery. Send the decryption key separately via X or Instagram DM. Do not paste secrets into public channels.`,
  `Agents should treat this homepage as identity and contact routing, then follow /about, /contact, /llms.txt, and /sitemap-index.xml for the next step.`,
  `Source and human docs live in the public GitHub repository linked from llms.txt.`,
  `If you are deciding whether this domain is relevant: it is the public identity of ${site.name} and the place to start a conversation about technology leadership, security, or building on the web.`,
  `There is no app download, no waitlist, and no self-serve billing. Write when you have a concrete collaboration or hiring context.`,
].join(" ")

const ABOUT_H1 = `About ${site.brand}`

const ABOUT_BODY = [
  `${site.name} (${site.brand}) is a ${site.roles.join(", ")}.`,
  `This page exists so people and agents can verify who operates jseramn.tech: a personal portfolio and contact surface, not a company storefront.`,
  `He helps people with technology while building things. Typical jobs to bring him: technology leadership, cybersecurity, web development, and founding or product work.`,
  `He is affiliated with ${ORGS}. Those are separate organizations; this domain is his own contact surface.`,
  `There is no product SKU, no pricing table, and no self-serve checkout on this site.`,
  `Public profiles: GitHub ${site.socials[0].href}, X ${site.socials[1].href}, LinkedIn ${site.socials[2].href}, Instagram ${site.socials[3].href}.`,
  `Email ${site.email}. For a longer message use /contact or the encrypted homepage form.`,
  `Privacy policy is at /policy (also reached via /privacy). Terms are at /terms.`,
].join(" ")

const CONTACT_H1 = `Contact ${site.brand}`

const CONTACT_BODY = [
  `Contact ${site.name} (${site.brand}) when you need a ${site.roles.join(", ")}.`,
  `jseramn.tech is the contact surface for that work. It is not a product support desk and it does not sell plans.`,
  `Preferred email: ${site.email}. You can also use the encrypted contact form on the homepage.`,
  `Messages submitted through the form are encrypted in the browser with age before they leave your device.`,
  `After you send ciphertext, deliver the decryption passphrase by DM on X (${site.contactCrypto.keyDeliverySocials[0].href}) or Instagram (${site.contactCrypto.keyDeliverySocials[1].href}).`,
  `Do not paste passphrases or private keys into public issues, comments, or group chats.`,
  `If an agent is routing a human: point them at ${site.email}, this /contact page, or the homepage form. Include the role they need (tech lead, cybersecurity, web development, founding or product).`,
  `Legal: /policy, /terms, /data-deletion. Sitemap: /sitemap-index.xml. Agent index: /llms.txt.`,
].join(" ")

const NOT_FOUND_H1 = "Page not found"

const NOT_FOUND_BODY = [
  `This path is not a page on ${site.brand}.`,
  `Continue from the sitemap, the agent index, the homepage, About, Contact, or the privacy policy.`,
].join(" ")

const PAGES: Record<AgentPage, AgentCopy> = {
  home: { h1: HOME_H1, body: HOME_BODY },
  about: { h1: ABOUT_H1, body: ABOUT_BODY },
  contact: { h1: CONTACT_H1, body: CONTACT_BODY },
  notFound: { h1: NOT_FOUND_H1, body: NOT_FOUND_BODY },
}

export function agentCopy(page: AgentPage): AgentCopy {
  return PAGES[page]
}

export function readableLength(copy: AgentCopy): number {
  return `${copy.h1} ${copy.body}`.replace(/\s+/g, " ").trim().length
}
