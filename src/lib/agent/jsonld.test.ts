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
})
