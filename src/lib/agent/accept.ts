export const ACCEPT_VARY = "Accept, Accept-Encoding" as const

export type NegotiatedType = "text/html" | "text/markdown" | "application/ld+json"

const PRODUCES: readonly NegotiatedType[] = ["text/html", "text/markdown", "application/ld+json"]

type AcceptEntry = {
  type: string
  q: number
  specificity: number
}

function parseAccept(header: string): AcceptEntry[] {
  const entries: AcceptEntry[] = []
  for (const raw of header.split(",")) {
    const parts = raw
      .trim()
      .split(";")
      .map((s) => s.trim())
    const type = parts[0]?.toLowerCase()
    if (!type) continue

    let q = 1
    for (const param of parts.slice(1)) {
      const eq = param.indexOf("=")
      if (eq === -1) continue
      const name = param.slice(0, eq).trim().toLowerCase()
      if (name !== "q") continue
      const value = param
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "")
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed))
    }

    const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2
    entries.push({ type, q, specificity })
  }
  return entries
}

function matches(entry: AcceptEntry, candidate: string): boolean {
  if (entry.type === "*/*") return true
  if (entry.type.endsWith("/*")) return candidate.startsWith(entry.type.slice(0, -1))
  return entry.type === candidate
}

/** Parse Accept with q-values and specificity. null means 406 (no type scores > 0). */
export function negotiate(header: string | null): NegotiatedType | null {
  if (!header?.trim()) return "text/html"

  const entries = parseAccept(header)
  if (entries.length === 0) return "text/html"

  let best: NegotiatedType | null = null
  let bestQ = -1
  let bestPosition = Infinity

  for (const candidate of PRODUCES) {
    let matched: AcceptEntry | null = null
    let matchedPosition = Infinity
    for (let idx = 0; idx < entries.length; idx++) {
      const e = entries[idx]
      if (!matches(e, candidate)) continue
      if (
        matched === null ||
        e.specificity > matched.specificity ||
        (e.specificity === matched.specificity && idx < matchedPosition)
      ) {
        matched = e
        matchedPosition = idx
      }
    }
    if (matched === null || matched.q <= 0) continue
    if (matched.q > bestQ || (matched.q === bestQ && matchedPosition < bestPosition)) {
      bestQ = matched.q
      bestPosition = matchedPosition
      best = candidate
    }
  }

  return best
}
