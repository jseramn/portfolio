import { describe, expect, it } from "vitest"
import { cameraDistance, EXTRUDE, SAMPLE_COLS, SAMPLE_ROWS, VIDEO_ZOOM } from "./scene"

describe("hero ASCII camera", () => {
  it("fits the 16:9 plane through the 50° FOV with 118% bleed", () => {
    expect(cameraDistance(1)).toBeCloseTo(8.178, 3)
    expect(cameraDistance(16 / 9)).toBeCloseTo(8.178, 3)
    expect(cameraDistance(2)).toBeLessThan(cameraDistance(1))
    expect(VIDEO_ZOOM.default).toBe(1.08)
    expect(VIDEO_ZOOM.bleedPercent).toBe(118)
  })

  it("keeps the 96×54 extruded point cloud as identity", () => {
    expect(SAMPLE_COLS).toBe(96)
    expect(SAMPLE_ROWS).toBe(54)
    expect(EXTRUDE).toBe(2.4)
  })
})
