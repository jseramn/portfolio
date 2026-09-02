import type { APIRoute } from "astro"
import { Resend } from "resend"
import { site } from "../../config/site"
import { captureNode } from "../../lib/analytics/captureNode"
import type { ContactSubmittedOutcome } from "../../lib/analytics/events"
import { buildEncryptedEmailContent, validateContactSubmission } from "../../lib/contactEmail"
import {
  enforceContactRateLimit,
  getClientIp,
  isAllowedContactOrigin,
  readContactJsonBody,
  turnstileRequired,
  verifyTurnstileToken,
} from "../../lib/security/contactApi"

export const prerender = false

const genericError = () => Response.json({ error: "request_rejected" }, { status: 400 })

const methodNotAllowed = () =>
  Response.json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } })

export const GET: APIRoute = () => methodNotAllowed()

export const OPTIONS: APIRoute = () => methodNotAllowed()

async function recordOutcome(outcome: ContactSubmittedOutcome): Promise<void> {
  try {
    await captureNode(outcome)
  } catch {
    // Analytics must not fail the request
  }
}

export const POST: APIRoute = async ({ request }) => {
  if (request.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 })
  }

  const apiKey = import.meta.env.RESEND_API_KEY
  if (!apiKey) {
    await recordOutcome("not_configured")
    return Response.json({ error: "server_not_configured" }, { status: 503 })
  }

  if (!isAllowedContactOrigin(request)) {
    await recordOutcome("rejected")
    return genericError()
  }

  const rateLimited = await enforceContactRateLimit(request)
  if (rateLimited) {
    await recordOutcome("rate_limited")
    return rateLimited
  }

  const bodyOrResponse = await readContactJsonBody(request)
  if (bodyOrResponse instanceof Response) {
    await recordOutcome("rejected")
    return bodyOrResponse
  }

  const parsed = validateContactSubmission(bodyOrResponse)
  if (!parsed.ok) {
    await recordOutcome("rejected")
    return genericError()
  }

  if (parsed.value.honeypot) {
    await recordOutcome("honeypot")
    return Response.json({ ok: true })
  }

  const ip = getClientIp(request)
  if (turnstileRequired()) {
    const ok = await verifyTurnstileToken(parsed.value.turnstileToken ?? "", ip)
    if (!ok) {
      await recordOutcome("rejected")
      return genericError()
    }
  }

  const { envelopeId, armored, visitorEmail, subjectLine } = parsed.value
  const { subject, text } = buildEncryptedEmailContent({
    envelopeId,
    visitorEmail,
    subjectLine,
    armored,
  })

  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from: site.contactEmail.from,
    to: [site.contactEmail.to],
    replyTo: visitorEmail,
    subject,
    text,
  })

  if (error) {
    console.error("[contact]", error)
    await recordOutcome("send_failed")
    return Response.json({ error: "send_failed" }, { status: 502 })
  }

  await recordOutcome("sent")
  return Response.json({ ok: true })
}
