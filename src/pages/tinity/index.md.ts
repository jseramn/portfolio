import type { APIRoute } from "astro"
import { tinityTwinResponse } from "../../lib/tinityTwins"

// SSR: a static tinity/index.md becomes Vercel's directory index and shadows /tinity HTML.
export const prerender = false

export const GET: APIRoute = () => tinityTwinResponse("index.md")
