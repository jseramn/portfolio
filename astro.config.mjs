import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import tailwind from "@astrojs/tailwind"
import sitemap from "@astrojs/sitemap"
import vercel from "@astrojs/vercel"

// @astrojs/vercel@8 Edge next() fetch("/_render") omits method and body, so POST
// becomes GET. Pages are already prerender = false, so middleware can run in Node.
export const vercelAdapterOptions = {
  edgeMiddleware: false,
}

export default defineConfig({
  site: "https://jseramn.tech",
  compressHTML: true,
  output: "static",
  adapter: vercel(vercelAdapterOptions),
  integrations: [react(), tailwind({ applyBaseStyles: false }), sitemap()],
  vite: {
    build: {
      sourcemap: false,
    },
  },
})
