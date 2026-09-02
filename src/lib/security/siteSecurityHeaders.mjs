/** Shared security header values — imported by Astro middleware and synced into vercel.json at build. */
const SITE_ORIGIN = "https://jseramn.tech"
const POSTHOG_HOST = "https://*.posthog.com"
const VERCEL_ANALYTICS_SCRIPT = "https://va.vercel-scripts.com"
const VERCEL_ANALYTICS_CONNECT = "https://vitals.vercel-insights.com"

export function buildContentSecurityPolicy(isDev) {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://www.youtube.com",
    "https://challenges.cloudflare.com",
    POSTHOG_HOST,
    VERCEL_ANALYTICS_SCRIPT,
  ]

  const connectSrc = [
    "'self'",
    "https://api.github.com",
    "https://github-contributions-api.jogruber.de",
    "https://www.youtube.com",
    "https://challenges.cloudflare.com",
    POSTHOG_HOST,
    VERCEL_ANALYTICS_CONNECT,
  ]

  if (isDev) {
    scriptSrc.push("'unsafe-eval'")
    connectSrc.push(
      "http://localhost:4321",
      "http://127.0.0.1:4321",
      "ws://localhost:4321",
      "ws://127.0.0.1:4321",
    )
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src https://www.youtube.com https://challenges.cloudflare.com ${POSTHOG_HOST}`,
    "worker-src 'self' blob:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]

  return directives.join("; ")
}

/** Tighter CSP for legal routes. Shared by Edge middleware and vercel.json so they cannot drift. */
export function buildLegalContentSecurityPolicy() {
  const scriptSrc = ["'self'", "'unsafe-inline'", POSTHOG_HOST]
  const connectSrc = ["'self'", POSTHOG_HOST]

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${POSTHOG_HOST}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors *",
    "upgrade-insecure-requests",
  ].join("; ")
}

/** Header entries for Vercel `vercel.json` and Astro middleware. */
export function buildSecurityHeaderEntries(isDev) {
  const entries = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(isDev) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-site" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
  ]

  if (!isDev) {
    entries.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    })
    // Override Vercel default ACAO:* on static assets (M-5)
    entries.push({ key: "Access-Control-Allow-Origin", value: SITE_ORIGIN })
  }

  return entries
}

export const ASTRO_ASSET_SOURCE = "/_astro/(.*)"
export const IMMUTABLE_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable"
export const CDN_SWR_CACHE_CONTROL = "public, max-age=0, s-maxage=60, stale-while-revalidate=300"
export const GITHUB_STATS_API_SOURCE = "/api/github-stats"

export function hashedAstroAssetHeaderGroup() {
  return {
    source: ASTRO_ASSET_SOURCE,
    headers: [{ key: "Cache-Control", value: IMMUTABLE_ASSET_CACHE_CONTROL }],
  }
}

export function githubStatsApiHeaderGroup() {
  return {
    source: GITHUB_STATS_API_SOURCE,
    headers: [
      { key: "Cache-Control", value: CDN_SWR_CACHE_CONTROL },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ],
  }
}
