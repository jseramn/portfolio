import { site } from "../../config/site"

export type JsonLdPageKind = "profile" | "contact" | "legal" | "generic" | "notfound"

export type JsonLdPage = {
  kind: JsonLdPageKind
  canonical: string
}

const PERSON_ID = `${site.url}/#person`
const ORGANIZATION_ID = `${site.url}/#organization`
const WEBSITE_ID = `${site.url}/#website`
const HOME_PROFILE_ID = `${site.url}/#profile`

function normalizePath(pathname: string): string {
  return (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/"
}

export function jsonLdSameAs(): string[] {
  return site.socials
    .filter((social) => !social.href.startsWith("mailto:"))
    .map((social) => social.href)
}

export function jsonLdCanonicalFromPath(pathname: string): string {
  const path = normalizePath(pathname)
  return path === "/" ? site.url : `${site.url}${path}`
}

export function jsonLdPageKindFromPath(pathname: string): JsonLdPageKind | null {
  const path = normalizePath(pathname)
  if (path === "/" || path === "/about") return "profile"
  if (path === "/contact") return "contact"
  if (/^\/(policy|terms|data-deletion|privacy)$/.test(path)) return "legal"
  return null
}

function pathFromCanonical(canonical: string): string {
  return normalizePath(canonical.replace(site.url, "") || "/")
}

function pageName(page: JsonLdPage): string {
  const path = pathFromCanonical(page.canonical)
  if (page.kind === "profile" && path === "/about") return `About | ${site.brand}`
  if (page.kind === "contact") return `Contact | ${site.brand}`
  if (page.kind === "notfound") return `Not found | ${site.brand}`
  if (path === "/policy" || path === "/privacy") return `Privacy Policy | ${site.brand}`
  if (path === "/terms") return `Terms of Service | ${site.brand}`
  if (path === "/data-deletion") return `Data Deletion | ${site.brand}`
  return site.seo.title
}

function pageNode(page: JsonLdPage) {
  const homeProfile = page.kind === "profile" && pathFromCanonical(page.canonical) === "/"
  const about = { "@id": PERSON_ID }
  const node = {
    "@id": homeProfile ? HOME_PROFILE_ID : page.canonical,
    url: page.canonical,
    name: pageName(page),
    about,
    isPartOf: { "@id": WEBSITE_ID },
  }
  if (page.kind === "profile") {
    return { "@type": "ProfilePage", ...node, mainEntity: about }
  }
  return {
    "@type": page.kind === "contact" ? ["WebPage", "ContactPage"] : "WebPage",
    ...node,
    author: about,
  }
}

export function buildGraphJsonLd(
  sameAs: string[],
  page: JsonLdPage = { kind: "profile", canonical: site.url },
) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: site.name,
        givenName: "José Ramón",
        familyName: "García Del Risco",
        url: site.url,
        alternateName: site.brand,
        jobTitle: site.roles.join(", "),
        description: site.tagline.en,
        email: site.email,
        image: site.seo.ogImage,
        sameAs,
        knowsAbout: site.seo.knowsAbout,
        knowsLanguage: ["en", "es"],
        worksFor: site.seo.worksFor,
        potentialAction: {
          "@type": "ContactAction",
          target: `mailto:${site.email}`,
        },
      },
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: site.brand,
        url: site.url,
        logo: site.seo.appleTouchIcon,
        image: site.seo.ogImage,
        contactPoint: {
          "@type": "ContactPoint",
          email: site.email,
          contactType: site.contactType,
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: site.address.addressLocality,
          addressCountry: site.address.addressCountry,
        },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: site.url,
        name: site.brand,
        description: site.tagline.en,
        publisher: { "@id": ORGANIZATION_ID },
      },
      pageNode(page),
    ],
  }
}
