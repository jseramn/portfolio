import type { APIRoute } from "astro"
import { resolveOEmbed } from "../lib/oembed"

export const prerender = false

export const GET: APIRoute = ({ url }) => {
  const payload = resolveOEmbed(url.searchParams.get("url"))
  if (!payload) {
    return Response.json({ error: "url_required" }, { status: 400 })
  }
  return Response.json(payload)
}
