import type { APIRoute } from "astro"
import { designMarkdownResponse } from "../lib/agent/designDoc"

export const prerender = true

export const GET: APIRoute = () => designMarkdownResponse()
