import { describe, expect, it } from "vitest"
import { linkifyMarkdown, linkifySegments, linkedHrefs } from "./linkify"

describe("linkifySegments", () => {
  it("keeps visible text identical while wrapping urls, paths, and email", () => {
    const source =
      "GitHub https://github.com/jseramn, email a@b.co, Mallanet (https://mallanet.org) /llms.txt."
    expect(
      linkifySegments(source)
        .map((segment) => segment.text)
        .join(""),
    ).toBe(source)
    expect(linkedHrefs(source)).toEqual([
      "https://github.com/jseramn",
      "mailto:a@b.co",
      "https://mallanet.org",
      "/llms.txt",
    ])
    expect(linkifyMarkdown(source)).toContain("[a@b.co](mailto:a@b.co)")
    expect(linkifyMarkdown(source)).toContain("[/llms.txt](/llms.txt)")
  })
})
