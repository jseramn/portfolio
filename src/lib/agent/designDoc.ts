import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

export const DESIGN_DOC_PATH = "/design.md"
export const DESIGN_MARKDOWN_TYPE = "text/markdown; charset=utf-8"

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..")

export function designMarkdown(): string {
  return readFileSync(join(root, "design.md"), "utf8")
}

export function designMarkdownResponse(): Response {
  return new Response(designMarkdown(), {
    status: 200,
    headers: { "Content-Type": DESIGN_MARKDOWN_TYPE },
  })
}
