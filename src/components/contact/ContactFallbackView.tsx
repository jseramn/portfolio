import { CopyField } from "./CopyField"
import type { FallbackState } from "./types"

export function ContactFallbackView({ fallback }: { fallback: FallbackState }) {
  return (
    <div className="flex flex-col gap-3 rounded border border-vesper-accent/30 bg-black/30 p-3">
      <p className="font-mono text-[11px] text-vesper-accent/70">Manual fallback</p>
      <CopyField label="Armored ciphertext" value={fallback.armored} />
      <CopyField label="Decryption key" value={fallback.passphrase} />
      <button
        type="button"
        onClick={() => {
          window.location.href = fallback.mailtoHref
        }}
        className="w-full border border-vesper-accent/50 py-2 font-mono text-xs text-vesper-accent hover:border-vesper-accent"
      >
        Open email client
      </button>
    </div>
  )
}
