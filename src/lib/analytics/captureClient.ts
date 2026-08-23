import { ANALYTICS_EVENTS, isAnalyticsEvent, type AnalyticsEvent } from "./events"

const PII_KEYS = new Set([
  "name",
  "email",
  "subject",
  "message",
  "passphrase",
  "ciphertext",
  "armored",
  "envelopeid",
  "envelope_id",
  "visitoremail",
  "visitor_email",
  "ip",
  "$ip",
  "clientip",
  "client_ip",
  "remoteip",
  "remote_ip",
  "company",
  "turnstiletoken",
  "turnstile_token",
  "token",
  "distinctid",
  "distinct_id",
  "userid",
  "user_id",
])

function projectKey(): string | undefined {
  const key = import.meta.env.PUBLIC_POSTHOG_KEY?.trim()
  return key || undefined
}

function browserPosthog(): Window["posthog"] | undefined {
  const g = globalThis as typeof globalThis & { window?: Window }
  return g.window?.posthog
}

function isPiiKey(key: string): boolean {
  const normalized = key.toLowerCase()
  return PII_KEYS.has(normalized) || normalized.startsWith("$set") || normalized === "$unset"
}

function sanitizeProperties(
  event: AnalyticsEvent,
  properties: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (event === ANALYTICS_EVENTS.contactSubmitted || event === ANALYTICS_EVENTS.contactFailed) {
    const outcome = properties?.outcome
    return typeof outcome === "string" ? { outcome } : undefined
  }

  if (!properties) return undefined

  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(properties)) {
    if (isPiiKey(key)) continue
    if (value === null || value === undefined) continue
    const kind = typeof value
    if (kind === "string" || kind === "number" || kind === "boolean") {
      next[key] = value
    }
  }

  return Object.keys(next).length > 0 ? next : undefined
}

export function captureClient(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
): void {
  if (!projectKey()) return
  if (!isAnalyticsEvent(event)) return

  const posthog = browserPosthog()
  if (!posthog || typeof posthog.capture !== "function") return

  posthog.capture(event, sanitizeProperties(event, properties))
}
