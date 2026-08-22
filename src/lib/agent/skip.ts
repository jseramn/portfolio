/** True when Accept negotiation must not rewrite the response. */
export function skipNegotiate(pathname: string): boolean {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/"
  if (path === "/llms.txt") return true
  if (path === "/api" || path.startsWith("/api/")) return true
  if (path === "/_astro" || path.startsWith("/_astro/")) return true
  const segments = path.split("/").filter(Boolean)
  return segments.some((segment) => segment.includes("."))
}
