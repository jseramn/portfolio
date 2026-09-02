import { site } from "../../config/site"
import { CopyField } from "./CopyField"
import type { KeyDeliverySocial, SuccessState } from "./types"

export function ContactSuccessView({
  success,
  keyDeliverySocials,
  onDismiss,
}: {
  success: SuccessState
  keyDeliverySocials: readonly KeyDeliverySocial[]
  onDismiss: () => void
}) {
  return (
    <div className="flex flex-col gap-5 pr-6">
      <p className="font-mono text-xs tracking-wide text-vesper-accent/60">
        sent · {success.envelopeId}
      </p>
      <p className="font-sans text-sm leading-relaxed text-vesper-accent/90">
        The encrypted email was sent to {site.email}.{" "}
        <strong className="font-medium text-vesper-accent">Last step:</strong> send me the key by DM
        (it is not in the email).
      </p>

      <CopyField label="Envelope ID (include it in the DM)" value={success.envelopeId} />
      <CopyField label="Decryption key (socials only)" value={success.passphrase} />

      <p className="font-mono text-xs text-vesper-accent/70">
        {keyDeliverySocials.map((s, i) => (
          <span key={s.id}>
            {i > 0 ? " · " : ""}
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-vesper-pink underline-offset-2 hover:underline"
            >
              {s.label}
            </a>
          </span>
        ))}
      </p>

      <button
        type="button"
        onClick={onDismiss}
        className="w-full border border-vesper-accent/40 py-2 font-mono text-xs text-vesper-accent/70 hover:text-vesper-accent"
      >
        Done
      </button>
    </div>
  )
}
