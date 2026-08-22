import { defineMiddleware } from "astro:middleware"
import { ACCEPT_VARY, negotiate } from "./lib/agent/accept"
import { notFoundMarkdown, pageFromPath, toMarkdown } from "./lib/agent/markdown"
import { skipNegotiate } from "./lib/agent/skip"
import { applySecurityHeaders } from "./lib/security/headers"

const LEGAL_PATH = /^\/(policy|terms|data-deletion|privacy)\/?$/

function applyLegalOverrides(pathname: string, response: Response): void {
  if (!LEGAL_PATH.test(pathname)) return
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Cross-Origin-Resource-Policy", "cross-origin")
  response.headers.delete("X-Frame-Options")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://vitals.vercel-insights.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors *; upgrade-insecure-requests",
  )
}

function finish(pathname: string, response: Response, vary: boolean): Response {
  applySecurityHeaders(response)
  if (vary) {
    response.headers.set("Vary", ACCEPT_VARY)
  }
  applyLegalOverrides(pathname, response)
  return response
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname

  if (skipNegotiate(pathname)) {
    const response = await next()
    return finish(pathname, response, false)
  }

  const preferred = negotiate(context.request.headers.get("accept"))
  context.locals.preferredType = preferred

  if (preferred === null) {
    const response = new Response("Not Acceptable\n", {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
    return finish(pathname, response, true)
  }

  if (preferred === "text/markdown") {
    const page = pageFromPath(pathname)
    if (page) {
      const response = new Response(toMarkdown(page), {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
        },
      })
      return finish(pathname, response, true)
    }

    const html = await next()
    if (html.status === 404 || html.status === 410) {
      const response = new Response(notFoundMarkdown(), {
        status: html.status,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
        },
      })
      return finish(pathname, response, true)
    }
    return finish(pathname, html, true)
  }

  const response = await next()
  return finish(pathname, response, true)
})
