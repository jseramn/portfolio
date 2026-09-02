import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X } from "./icons"
import { site } from "../config/site"
import {
  buildEncryptedMailto,
  createDecryptionPassphrase,
  createEnvelopeId,
  encryptContactPayload,
} from "../lib/contactEncrypt"
import { turnstileEnabled } from "./TurnstileField"
import {
  contactFailedOutcomeFromClientError,
  onContactDismissed,
  onContactFailed,
  onContactOpened,
  onContactSubmittedClient,
} from "../lib/analytics/productCapture"
import { useFocusTrap } from "../lib/useFocusTrap"
import { ContactFormView } from "./contact/ContactFormView"
import { ContactSuccessView } from "./contact/ContactSuccessView"
import { sendEncryptedEmail } from "./contact/sendEncryptedEmail"
import type { FallbackState, SuccessState } from "./contact/types"

type ContactModalProps = {
  open: boolean
  onClose: () => void
  contextRole: string
}

export function ContactModal({ open, onClose, contextRole }: ContactModalProps) {
  const channelId = useId()
  const noteId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessState | null>(null)
  const [fallback, setFallback] = useState<FallbackState | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)

  useFocusTrap({ active: open, containerRef: dialogRef, initialRef: nameRef })

  useEffect(() => {
    if (open) return
    setSuccess(null)
    setFallback(null)
    setError(null)
    setBusy(false)
    setTurnstileToken(null)
    setTurnstileKey((k) => k + 1)
  }, [open])

  useEffect(() => {
    if (!open) return
    onContactOpened()
  }, [open])

  const handleDismiss = useCallback(() => {
    onContactDismissed(success !== null)
    onClose()
  }, [success, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open, handleDismiss])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFallback(null)
    setBusy(true)

    const fd = new FormData(e.currentTarget)
    const name = String(fd.get("name") ?? "").trim()
    const email = String(fd.get("email") ?? "").trim()
    const subject = String(fd.get("subject") ?? "").trim()
    const message = String(fd.get("message") ?? "").trim()
    const company = String(fd.get("company") ?? "").trim()
    const envelopeId = createEnvelopeId()
    const passphrase = createDecryptionPassphrase()
    const subjectLine = `[${contextRole}] ${subject || "Contact"}`

    if (turnstileEnabled() && !turnstileToken) {
      onContactFailed("turnstile")
      setError("Complete the anti-bot check before sending.")
      setBusy(false)
      return
    }

    let armored: string | null = null

    try {
      armored = await encryptContactPayload(
        {
          version: 1,
          envelopeId,
          sentAt: new Date().toISOString(),
          contextRole,
          name,
          email,
          subject,
          message,
        },
        passphrase,
      )

      await sendEncryptedEmail({
        envelopeId,
        armored,
        visitorEmail: email,
        subjectLine,
        company,
        turnstileToken: turnstileToken ?? undefined,
      })

      onContactSubmittedClient("sent")
      setSuccess({ envelopeId, passphrase })
    } catch (err) {
      const code = err instanceof Error ? err.message : "send_failed"
      if (!armored) {
        onContactFailed("encrypt_failed")
      } else {
        onContactFailed(contactFailedOutcomeFromClientError(code))
      }
      if (armored) {
        const { href, truncated } = buildEncryptedMailto({
          to: site.email,
          envelopeId,
          visitorEmail: email,
          subjectLine,
          armored,
        })
        setFallback({
          envelopeId,
          passphrase,
          armored,
          mailtoHref: href,
          mailtoTruncated: truncated,
        })
      }

      if (code === "server_not_configured") {
        setError("Automatic sending is not configured in this environment.")
      } else if (code === "rate_limited") {
        setError("Too many attempts. Wait a moment and try again.")
      } else {
        setError("We could not send the email automatically. Use the manual fallback below.")
      }
      setTurnstileKey((k) => k + 1)
    } finally {
      setBusy(false)
    }
  }

  const { ageRepo, typageRepo, keyDeliverySocials } = site.contactCrypto

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          data-contact-modal-open=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
        >
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
            aria-label="Close contact form"
            onClick={handleDismiss}
          />
          <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={channelId}
              aria-describedby={success ? undefined : noteId}
              className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-md overflow-y-auto rounded-[15px] border border-vesper-accent/70 bg-black/25 px-6 py-8 shadow-[0_0_40px_rgba(0,240,255,0.15),inset_0_0_60px_rgba(0,240,255,0.03)]"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <p
                id={channelId}
                className={
                  success ? "sr-only" : "mb-2 font-mono text-xs tracking-wide text-vesper-accent/60"
                }
              >
                secure channel · {contextRole}
              </p>
              {success ? (
                <ContactSuccessView
                  success={success}
                  keyDeliverySocials={keyDeliverySocials}
                  onDismiss={handleDismiss}
                />
              ) : (
                <ContactFormView
                  nameRef={nameRef}
                  noteId={noteId}
                  contextRole={contextRole}
                  busy={busy}
                  error={error}
                  fallback={fallback}
                  turnstileKey={turnstileKey}
                  onToken={setTurnstileToken}
                  onSubmit={handleSubmit}
                  ageRepo={ageRepo}
                  typageRepo={typageRepo}
                  keyDeliverySocials={keyDeliverySocials}
                />
              )}
              <button
                type="button"
                onClick={handleDismiss}
                className="absolute right-2 top-2 flex h-12 w-12 items-center justify-center text-vesper-accent/70 transition-colors hover:text-vesper-accent"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
