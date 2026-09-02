import { describe, expect, it } from "vitest"
import {
  SAMPLE_COLS,
  SAMPLE_ROWS,
  VIDEO_ZOOM,
  activeSamplerZoom,
  cameraDistance,
  cameraPanOffset,
  clipFromMvp,
  samplerMvp,
} from "./scene"

describe("hero ASCII camera", () => {
  it("fits the 16:9 plane through the 50° FOV with 118% bleed", () => {
    expect(cameraDistance(1)).toBeCloseTo(8.178, 3)
    expect(cameraDistance(16 / 9)).toBeCloseTo(8.178, 3)
    expect(cameraDistance(2)).toBeLessThan(cameraDistance(1))
    expect(VIDEO_ZOOM.default).toBe(1.08)
    expect(VIDEO_ZOOM.bleedPercent).toBe(118)
  })

  it("keeps the 96×54 fallback grid identity", () => {
    expect(SAMPLE_COLS).toBe(96)
    expect(SAMPLE_ROWS).toBe(54)
  })

  it("adds the center zoom bonus only while the pointer is hovering the bust", () => {
    expect(activeSamplerZoom(VIDEO_ZOOM.default, 0, 0, false)).toBe(VIDEO_ZOOM.default)
    expect(activeSamplerZoom(VIDEO_ZOOM.default, 0, 0, true)).toBeCloseTo(
      VIDEO_ZOOM.default + VIDEO_ZOOM.centerBonus,
    )
    expect(activeSamplerZoom(VIDEO_ZOOM.max, 0, 0, true)).toBe(VIDEO_ZOOM.max)
    expect(activeSamplerZoom(VIDEO_ZOOM.default, 0.9, 0, true)).toBe(VIDEO_ZOOM.default)
  })

  it("pans the camera opposite the pointer for the 18px parallax", () => {
    const pan = cameraPanOffset(1, -1, 160, 90, 160, 90)
    expect(pan.x).toBeCloseTo(-VIDEO_ZOOM.parallaxPx)
    expect(pan.y).toBeCloseTo(-VIDEO_ZOOM.parallaxPx)
  })

  it("cover-crops the plane and zoom pulls the corners out of clip space", () => {
    const aspect = 16 / 9
    const z = cameraDistance(aspect)
    const wide = samplerMvp({ aspect, zoom: 1, position: { x: 0, y: 0, z } })
    const zoomed = samplerMvp({
      aspect,
      zoom: VIDEO_ZOOM.default,
      position: { x: 0, y: 0, z },
    })
    const origin = clipFromMvp(wide, 0, 0, 0)
    expect(origin.x).toBeCloseTo(0, 3)
    expect(origin.y).toBeCloseTo(0, 3)

    const cornerWide = clipFromMvp(wide, 8, 4.5, 0)
    const cornerZoom = clipFromMvp(zoomed, 8, 4.5, 0)
    expect(Math.abs(cornerWide.x)).toBeGreaterThan(1)
    expect(Math.abs(cornerZoom.x)).toBeGreaterThan(Math.abs(cornerWide.x))
  })
})
