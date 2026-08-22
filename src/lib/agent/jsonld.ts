import { site } from "../../config/site"

export function buildGraphJsonLd(sameAs: string[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
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
    ],
  }
}
