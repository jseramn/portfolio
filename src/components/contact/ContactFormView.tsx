import type { FormEvent, RefObject } from "react"
import { ExternalLink } from "../icons"
import { TurnstileField } from "../TurnstileField"
import { ContactFallbackView } from "./ContactFallbackView"
import type { FallbackState, KeyDeliverySocial } from "./types"

const fieldClass =
  "w-full bg-black/30 border border-vesper-accent/50 px-3 py-2.5 font-mono text-sm text-vesper-accent placeholder:text-vesper-accent/35 transition-colors focus:border-vesper-accent focus:shadow-[0_0_12px_rgba(0,240,255,0.25)]"

export function ContactFormView({
  nameRef,
  noteId,
  contextRole,
  busy,
  error,
  fallback,
  turnstileKey,
  onToken,
  onSubmit,
  ageRepo,
  typageRepo,
  keyDeliverySocials,
}: {
  nameRef: RefObject<HTMLInputElement | null>
  noteId: string
  contextRole: string
  busy: boolean
  error: string | null
  fallback: FallbackState | null
  turnstileKey: number
  onToken: (token: string | null) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  ageRepo: string
  typageRepo: string
  keyDeliverySocials: readonly KeyDeliverySocial[]
}) {
  return (
    <>
      <p id={noteId} className="mb-5 font-mono text-[11px] leading-relaxed text-vesper-accent/50">
        Encrypted in your browser with{" "}
        <a
          href={ageRepo}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-0.5 text-vesper-accent/70 hover:text-vesper-accent"
        >
          age
          <ExternalLink size={10} aria-hidden />
        </a>{" "}
        (
        <a
          href={typageRepo}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-vesper-accent/70 hover:text-vesper-accent"
        >
          typage
        </a>
        ). The server only relays the ciphertext. Send the decryption key via{" "}
        {keyDeliverySocials.map((s) => s.label).join(" or ")} DM.
      </p>

      <form className="flex flex-col gap-5" onSubmit={onSubmit}>
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          aria-hidden
        />
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-sm text-vesper-accent/90">Name</span>
          <input
            ref={nameRef}
            name="name"
            type="text"
            required
            autoComplete="name"
            className={fieldClass}
            placeholder="Your name"
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-sm text-vesper-accent/90">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={fieldClass}
            placeholder="you@example.com"
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-sm text-vesper-accent/90">Subject</span>
          <input
            name="subject"
            type="text"
            key={contextRole}
            defaultValue={`Inquiry — ${contextRole}`}
            className={fieldClass}
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-sm text-vesper-accent/90">Message</span>
          <textarea
            name="message"
            required
            rows={4}
            className={`${fieldClass} resize-y min-h-[100px]`}
            placeholder="Tell me what you're building…"
            disabled={busy}
          />
        </label>
        {error && (
          <p className="font-mono text-xs text-vesper-pink" role="alert">
            {error}
          </p>
        )}
        <TurnstileField resetKey={turnstileKey} onToken={onToken} />
        {fallback && <ContactFallbackView fallback={fallback} />}
        <button
          type="submit"
          disabled={busy}
          className="mt-1 min-h-11 w-full border border-vesper-pink py-3 font-mono text-sm text-vesper-pink transition-all hover:bg-vesper-pink/10 hover:shadow-[0_0_24px_rgba(255,42,158,0.35)] disabled:opacity-50"
        >
          {busy ? "Encrypting & sending…" : "Encrypt and send"}
        </button>
      </form>
    </>
  )
}
