import { describe, expect, it } from "vitest"
import { site } from "../../config/site"
import {
  buildGraphJsonLd,
  jsonLdCanonicalFromPath,
  jsonLdPageKindFromPath,
  jsonLdSameAs,
} from "./jsonld"

describe("buildGraphJsonLd", () => {
  it("adds Medellín PostalAddress and keeps email-only contactPoint", () => {
    const graph = buildGraphJsonLd(["https://github.com/jseramn"])
    const org = graph["@graph"].find((node) => node["@type"] === "Organization") as {
      contactPoint: { email: string; telephone?: string; contactType: string }
      address: { "@type": string; addressLocality: string; addressCountry: string }
    }
    expect(org.address["@type"]).toBe("PostalAddress")
    expect(org.address.addressLocality).toBe("Medellín")
    expect(org.address.addressCountry).toBe("CO")
    expect(org.contactPoint.email).toBe("contacto@jseramn.tech")
    expect(org.contactPoint.contactType).toBe("inquiries")
    expect(org.contactPoint.telephone).toBeUndefined()
    expect(JSON.stringify(graph).toLowerCase()).not.toMatch(/"telephone"/)
  })

  it("attaches the live snapshot as Person image and Organization logo", () => {
    const graph = buildGraphJsonLd(["https://github.com/jseramn"])
    const person = graph["@graph"].find((node) => node["@type"] === "Person") as {
      image: string
    }
    const org = graph["@graph"].find((node) => node["@type"] === "Organization") as {
      logo: string
      image: string
    }
    expect(person.image).toBe("https://jseramn.tech/thumbnail.png")
    expect(org.image).toBe("https://jseramn.tech/thumbnail.png")
    expect(org.logo).toBe("https://jseramn.tech/apple-touch-icon.png")
  })

  it("emits @ids, WebSite, ProfilePage, Person names, and no telephone or street", () => {
    const graph = buildGraphJsonLd(["https://github.com/jseramn"])
    const nodes = graph["@graph"] as { "@type": string; "@id": string }[]
    const byType = Object.fromEntries(nodes.map((node) => [node["@type"], node]))

    expect(byType.Person["@id"]).toBe("https://jseramn.tech/#person")
    expect(byType.Organization["@id"]).toBe("https://jseramn.tech/#organization")
    expect(byType.WebSite["@id"]).toBe("https://jseramn.tech/#website")
    expect(byType.ProfilePage["@id"]).toBe("https://jseramn.tech/#profile")
    expect(nodes.map((node) => node["@type"])).toEqual(
      expect.arrayContaining(["Person", "Organization", "WebSite", "ProfilePage"]),
    )

    const person = graph["@graph"].find((node) => node["@type"] === "Person") as {
      givenName: string
      familyName: string
      knowsLanguage: string[]
      potentialAction: { "@type": string; target: string }
    }
    expect(person.givenName).toBe("José Ramón")
    expect(person.familyName).toBe("García Del Risco")
    expect(person.knowsLanguage).toEqual(["en", "es"])
    expect(person.potentialAction).toEqual({
      "@type": "ContactAction",
      target: "mailto:contacto@jseramn.tech",
    })

    const profile = graph["@graph"].find((node) => node["@type"] === "ProfilePage") as {
      mainEntity: { "@id": string }
      isPartOf: { "@id": string }
    }
    expect(profile.mainEntity["@id"]).toBe("https://jseramn.tech/#person")
    expect(profile.isPartOf["@id"]).toBe("https://jseramn.tech/#website")

    const serialized = JSON.stringify(graph)
    expect(serialized.toLowerCase()).not.toMatch(/"telephone"/)
    expect(serialized).not.toMatch(/streetAddress/)
  })

  it("uses WebPage/ContactPage off-home and keeps negotiated home JSON equal to in-page JSON-LD", () => {
    expect(jsonLdPageKindFromPath("/")).toBe("profile")
    expect(jsonLdPageKindFromPath("/about")).toBe("profile")
    expect(jsonLdPageKindFromPath("/contact")).toBe("contact")
    expect(jsonLdPageKindFromPath("/policy")).toBe("legal")
    expect(jsonLdPageKindFromPath("/does-not-exist")).toBeNull()

    const missing = "https://jseramn.tech/does-not-exist"
    const notFound = buildGraphJsonLd(["https://github.com/jseramn"], {
      kind: "notfound",
      canonical: missing,
    })
    expect(notFound["@graph"].some((node) => node["@type"] === "ProfilePage")).toBe(false)
    const webPage = notFound["@graph"].find((node) => node["@type"] === "WebPage") as {
      url: string
      about: { "@id": string }
    }
    expect(webPage.url).toBe(missing)
    expect(webPage.about["@id"]).toBe(`${site.url}/#person`)

    const contact = buildGraphJsonLd(["https://github.com/jseramn"], {
      kind: "contact",
      canonical: `${site.url}/contact`,
    })
    const contactPage = contact["@graph"].find((node) => Array.isArray(node["@type"])) as {
      "@type": string[]
    }
    expect(contactPage["@type"]).toEqual(["WebPage", "ContactPage"])

    const kind = jsonLdPageKindFromPath("/")
    expect(kind).toBe("profile")
    if (kind !== "profile") return
    expect(
      buildGraphJsonLd(jsonLdSameAs(), { kind, canonical: jsonLdCanonicalFromPath("/") }),
    ).toEqual(buildGraphJsonLd(jsonLdSameAs(), { kind: "profile", canonical: site.url }))
  })
})
