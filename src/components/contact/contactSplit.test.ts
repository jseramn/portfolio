import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const src = join(dirname(fileURLToPath(import.meta.url)), "../..")

function read(rel: string): string {
  return readFileSync(join(src, rel), "utf8")
}

describe("ContactModal presentational split", () => {
  it("keeps the public ContactModal export and one modal GlassSurface in the shell", () => {
    const shell = read("components/ContactModal.tsx")
    expect(shell).toContain("export function ContactModal")
    expect(shell).toContain('from "./contact/')
    expect(shell.match(/<GlassSurface\b/g)?.length).toBe(1)
    expect(shell).toContain('preset="modal"')
    expect(shell).toContain("mouseContainer={mouseContainer}")
    expect(shell).toContain("data-contact-modal-open")
    expect(shell).toContain("onContactOpened")
    expect(shell).toContain("onContactDismissed")
    expect(shell).toContain("onContactSubmittedClient")
    expect(shell).toContain("onContactFailed")
    expect(shell).toContain("useFocusTrap")
  })

  it("moves form, success, fallback, copy, and send helpers under contact/", () => {
    const names = readdirSync(join(src, "components/contact"))
      .filter((name) => !name.includes(".test."))
      .sort()
    expect(names).toEqual(
      expect.arrayContaining([
        "ContactFallbackView.tsx",
        "ContactFormView.tsx",
        "ContactSuccessView.tsx",
        "CopyField.tsx",
        "copyText.ts",
        "sendEncryptedEmail.ts",
      ]),
    )
    expect(read("components/contact/ContactFormView.tsx")).toContain("Encrypt and send")
    expect(read("components/contact/ContactFormView.tsx")).toContain('name="company"')
    expect(read("components/contact/ContactSuccessView.tsx")).toContain("Last step:")
    expect(read("components/contact/ContactFallbackView.tsx")).toContain("Manual fallback")
    expect(read("components/contact/CopyField.tsx")).toContain("Copy")
    expect(read("components/contact/sendEncryptedEmail.ts")).toContain('fetch("/api/contact"')
  })
})
