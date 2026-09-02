import { useState } from "react"
import { Check, Copy } from "../icons"
import { copyText } from "./copyText"

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    const ok = await copyText(value)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-xs text-vesper-accent/80">{label}</span>
      <div className="flex gap-2">
        <code className="min-w-0 flex-1 break-all border border-vesper-accent/40 bg-black/40 px-2 py-2 font-mono text-xs text-vesper-accent/90">
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 border border-vesper-accent/50 px-2 text-vesper-accent transition-colors hover:border-vesper-accent"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  )
}
