import { describe, expect, it, vi } from "vitest"
import { resolve } from "./resolve-ts-specifiers.mjs"

const context = { parentURL: "file:///tmp/legalCopy.ts" }

async function resolvedSpecifier(specifier: string) {
  const nextResolve = vi.fn(async (nextSpecifier: string) => ({
    url: nextSpecifier,
    shortCircuit: true,
  }))
  await resolve(specifier, context, nextResolve)
  return nextResolve.mock.calls[0]?.[0]
}

describe("resolve-ts-specifiers", () => {
  it("rewrites dotted TypeScript siblings to .ts", async () => {
    expect(await resolvedSpecifier("./legalCopy.dataDeletion")).toBe("./legalCopy.dataDeletion.ts")
  })

  it("leaves real JavaScript and TypeScript extensions unchanged", async () => {
    expect(await resolvedSpecifier("./foo.ts")).toBe("./foo.ts")
    expect(await resolvedSpecifier("./bar.js")).toBe("./bar.js")
  })

  it("appends .ts to extensionless relative specifiers", async () => {
    expect(await resolvedSpecifier("./markdown")).toBe("./markdown.ts")
  })
})
