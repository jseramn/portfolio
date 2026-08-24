import { site } from "../../config/site"

export function buildGraphJsonLd(sameAs: string[]) {
  const personId = `${site.url}/#person`
  const organizationId = `${site.url}/#organization`
  const websiteId = `${site.url}/#website`
  const profileId = `${site.url}/#profile`

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: site.name,
        url: site.url,
        alternateName: site.brand,
        jobTitle: site.roles.join(", "),
        description: site.tagline.en,
        email: site.email,
        image: site.seo.ogImage,
        sameAs,
        knowsAbout: site.seo.knowsAbout,
        worksFor: site.seo.worksFor,
      },
      {
        "@type": "Organization",
        "@id": organizationId,
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
        "@id": websiteId,
        url: site.url,
        name: site.brand,
        description: site.tagline.en,
        publisher: { "@id": organizationId },
      },
      {
        "@type": "ProfilePage",
        "@id": profileId,
        url: site.url,
        name: site.seo.title,
        about: { "@id": personId },
        mainEntity: { "@id": personId },
        isPartOf: { "@id": websiteId },
      },
    ],
  }
}
