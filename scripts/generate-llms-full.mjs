import { writeFileSync } from "node:fs"
import { register } from "node:module"
import { basename, dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const dest = join(here, "../public/llms-full.txt")

register(pathToFileURL(join(here, "resolve-ts-specifiers.mjs")), import.meta.url)

export async function generateLlmsFullTxt() {
  const { buildLlmsFullTxt } = await import("../src/lib/agent/llmsFull.ts")
  writeFileSync(dest, buildLlmsFullTxt())
}

const invoked = process.argv[1] && basename(process.argv[1]) === "generate-llms-full.mjs"
if (invoked) {
  await generateLlmsFullTxt()
}
