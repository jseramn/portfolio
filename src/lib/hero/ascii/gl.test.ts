import { describe, expect, it } from "vitest"
import { createAsciiSampler } from "./gl"

function stubCanvas(ids: string[] = []) {
  return {
    width: 0,
    height: 0,
    getContext: (id: string) => {
      ids.push(id)
      return null
    },
  }
}

describe("hero ASCII WebGL sampler", () => {
  it("asks for WebGL2 then WebGL1 and returns null when neither context exists", () => {
    const ids: string[] = []
    expect(createAsciiSampler(stubCanvas(ids))).toBeNull()
    expect(ids[0]).toBe("webgl2")
    expect(ids).toContain("webgl")
  })
})
