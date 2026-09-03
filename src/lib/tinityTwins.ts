import { twins, type TwinName } from "./tinityTwinContent"

export const TWIN_MARKDOWN_TYPE = "text/markdown; charset=utf-8"
export const TWIN_TEXT_TYPE = "text/plain; charset=utf-8"

export function tinityTwin(name: TwinName): string {
  return twins[name]
}

export function tinityTwinResponse(name: TwinName): Response {
  const markdown = name.endsWith(".md")
  return new Response(twins[name], {
    status: 200,
    headers: {
      "Content-Type": markdown ? TWIN_MARKDOWN_TYPE : TWIN_TEXT_TYPE,
    },
  })
}
