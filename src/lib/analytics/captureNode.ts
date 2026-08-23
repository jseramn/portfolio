import { PostHog } from "posthog-node"
import { ANALYTICS_EVENTS, DEFAULT_POSTHOG_HOST, type ContactSubmittedOutcome } from "./events"

function projectKey(): string | undefined {
  const key = import.meta.env.PUBLIC_POSTHOG_KEY?.trim()
  return key || undefined
}

function projectHost(): string {
  return import.meta.env.PUBLIC_POSTHOG_HOST?.trim() || DEFAULT_POSTHOG_HOST
}

/** Node.js only. Do not import from middleware or Edge. */
export async function captureNode(outcome: ContactSubmittedOutcome): Promise<void> {
  const key = projectKey()
  if (!key) return

  const client = new PostHog(key, {
    host: projectHost(),
    disableGeoip: true,
    personProfiles: "identified_only",
  })

  try {
    client.capture({
      distinctId: crypto.randomUUID(),
      event: ANALYTICS_EVENTS.contactSubmitted,
      properties: {
        outcome,
        $process_person_profile: false,
      },
      disableGeoip: true,
    })
  } catch {
    // Analytics must not fail the caller
  } finally {
    try {
      await client.shutdown()
    } catch {
      // Ignore flush failures
    }
  }
}
