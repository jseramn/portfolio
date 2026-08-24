import { describe, expect, it } from "vitest"
import { buildGraphJsonLd } from "./jsonld"

describe("buildGraphJsonLd", () => {
  it("adds Medellín PostalAddress and keeps email-only contactPoint", () => {
    const graph = buildGraphJsonLd(["https://github.com/jseramn"])
    const org = graph["@graph"].find((node) => node["@type"] === "Organization") as {
      contactPoint: { email: string; telephone?: string }
      address: { "@type": string; addressLocality: string; addressCountry: string }
    }
    expect(org.address["@type"]).toBe("PostalAddress")
    expect(org.address.addressLocality).toBe("Medellín")
    expect(org.address.addressCountry).toBe("CO")
    expect(org.contactPoint.email).toBe("contacto@jseramn.tech")
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

  it("emits @ids, WebSite, ProfilePage, and no telephone or street", () => {
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
})
