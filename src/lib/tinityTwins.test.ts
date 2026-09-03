import { describe, expect, it } from "vitest"
import { TWIN_MARKDOWN_TYPE, TWIN_TEXT_TYPE, tinityTwin, tinityTwinResponse } from "./tinityTwins"

describe("tinity twins", () => {
  it("exposes version and 17 idle harnesses in the overview twin", () => {
    const index = tinityTwin("index.md")
    expect(index).toMatch(/^# Tinity\n/)
    expect(index).toContain("0.1.0")
    expect(index).toContain("https://github.com/jseramn/tinity")
    expect(index.match(/\| idle \|/g)?.length).toBe(17)
  })

  it("returns markdown and plain-text bodies", async () => {
    const index = tinityTwinResponse("index.md")
    expect(index.headers.get("Content-Type")).toBe(TWIN_MARKDOWN_TYPE)
    expect(await index.text()).toBe(tinityTwin("index.md"))

    const changelog = tinityTwinResponse("changelog.md")
    expect(await changelog.text()).toBe(tinityTwin("changelog.md"))

    const design = tinityTwinResponse("design.md")
    expect(await design.text()).toBe(tinityTwin("design.md"))

    const llms = tinityTwinResponse("llms.txt")
    expect(llms.headers.get("Content-Type")).toBe(TWIN_TEXT_TYPE)
    expect(await llms.text()).toBe(tinityTwin("llms.txt"))
  })
})
