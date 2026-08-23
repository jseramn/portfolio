import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import tailwind from "@astrojs/tailwind"
import sitemap from "@astrojs/sitemap"
import vercel from "@astrojs/vercel"

export default defineConfig({
  site: "https://jseramn.tech",
  compressHTML: false,
  output: "static",
  adapter: vercel({
    // Installed @astrojs/vercel@8 uses edgeMiddleware (not middlewareMode).
    edgeMiddleware: true,
  }),
  integrations: [react(), tailwind({ applyBaseStyles: false }), sitemap()],
  vite: {
    build: {
      sourcemap: false,
    },
  },
})
