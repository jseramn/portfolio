/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly RESEND_API_KEY?: string
  readonly TURNSTILE_SECRET_KEY?: string
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string
  readonly PUBLIC_POSTHOG_KEY?: string
  readonly PUBLIC_POSTHOG_HOST?: string
  readonly UPSTASH_REDIS_REST_URL?: string
  readonly UPSTASH_REDIS_REST_TOKEN?: string
  readonly GITHUB_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace App {
  interface Locals {
    preferredType?: "text/html" | "text/markdown" | "application/ld+json" | null
  }
}

interface Window {
  posthog?: {
    capture?: (event: string, properties?: Record<string, unknown>) => void
    identify?: (...args: unknown[]) => void
    alias?: (...args: unknown[]) => void
    group?: (...args: unknown[]) => void
  }
  turnstile?: {
    render: (
      container: HTMLElement,
      options: {
        sitekey: string
        theme?: "light" | "dark" | "auto"
        callback?: (token: string) => void
        "expired-callback"?: () => void
        "error-callback"?: () => void
      },
    ) => string
    reset: (widgetId: string) => void
  }
}
