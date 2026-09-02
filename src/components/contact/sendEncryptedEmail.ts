export async function sendEncryptedEmail(payload: {
  envelopeId: string
  armored: string
  visitorEmail: string
  subjectLine: string
  company: string
  turnstileToken?: string
}): Promise<void> {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (res.ok) return
  const data = (await res.json().catch(() => null)) as { error?: string } | null
  throw new Error(data?.error ?? "send_failed")
}
