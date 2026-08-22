export const API_NO_STORE = "private, no-store"

export function applyApiNoStoreHeaders(pathname: string, headers: Headers): void {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/"
  if (path === "/api" || path.startsWith("/api/")) {
    headers.set("Cache-Control", API_NO_STORE)
    headers.set("Vercel-CDN-Cache-Control", API_NO_STORE)
  }
}
