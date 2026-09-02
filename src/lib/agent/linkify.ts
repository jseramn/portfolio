export type LinkSegment =
  | { kind: "text"; text: string }
  | { kind: "link"; href: string; text: string }

const TOKEN =
  /https?:\/\/[^\s)]+|\/[A-Za-z0-9][\w./-]*|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g

export function linkifySegments(source: string): LinkSegment[] {
  const segments: LinkSegment[] = []
  let last = 0
  for (const match of source.matchAll(TOKEN)) {
    const index = match.index ?? 0
    if (index > last) segments.push({ kind: "text", text: source.slice(last, index) })
    const raw = match[0]
    const text = raw.replace(/[.,;:]+$/, "")
    const trailing = raw.slice(text.length)
    if (text) {
      const href = text.includes("@") && !text.startsWith("http") ? `mailto:${text}` : text
      segments.push({ kind: "link", href, text })
    }
    if (trailing) segments.push({ kind: "text", text: trailing })
    last = index + raw.length
  }
  if (last < source.length) segments.push({ kind: "text", text: source.slice(last) })
  return segments
}

export function linkifyMarkdown(source: string): string {
  return linkifySegments(source)
    .map((segment) =>
      segment.kind === "link" ? `[${segment.text}](${segment.href})` : segment.text,
    )
    .join("")
}

export function linkedHrefs(source: string): string[] {
  return [
    ...new Set(
      linkifySegments(source).flatMap((segment) => (segment.kind === "link" ? [segment.href] : [])),
    ),
  ]
}
