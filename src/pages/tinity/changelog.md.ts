import type { APIRoute } from "astro"
import { tinityTwinResponse } from "../../lib/tinityTwins"

export const prerender = true

export const GET: APIRoute = () => tinityTwinResponse("changelog.md")
