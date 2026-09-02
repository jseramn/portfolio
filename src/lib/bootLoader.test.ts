import { describe, expect, it, vi } from "vitest"
import {
  ASCII_PAINT_SELECTOR,
  BOOT_FALLBACK_SELECTOR,
  BOOT_LOADER_ID,
  BOOT_READY_EVENT,
  BOOT_TIMEOUT_MS,
  applyBootLoaderHidden,
  BOOT_MUTATION_OBSERVER_INIT,
  bootReadyFromMutations,
  createBootLoaderSession,
  isBootReadyAttributeTarget,
  isHeroBootReady,
  shouldDismissBootLoader,
  signalHeroBootReady,
  takeFirstAsciiPaint,
} from "./bootLoader"

function fakeRoot(hits: string[]) {
  return {
    querySelector(selector: string) {
      return hits.includes(selector) ? {} : null
    },
  }
}

describe("boot loader dismiss", () => {
  it("is ready on first ASCII stamp or the reduced-motion fallback", () => {
    expect(isHeroBootReady(fakeRoot([]))).toBe(false)
    expect(isHeroBootReady(fakeRoot([ASCII_PAINT_SELECTOR]))).toBe(true)
    expect(isHeroBootReady(fakeRoot([BOOT_FALLBACK_SELECTOR]))).toBe(true)
  })

  it("dismisses on ready, timeout, or bfcache restore — not otherwise", () => {
    expect(
      shouldDismissBootLoader({ ready: true, timedOut: false, pageshowPersisted: false }),
    ).toBe(true)
    expect(
      shouldDismissBootLoader({ ready: false, timedOut: true, pageshowPersisted: false }),
    ).toBe(true)
    expect(
      shouldDismissBootLoader({ ready: false, timedOut: false, pageshowPersisted: true }),
    ).toBe(true)
    expect(
      shouldDismissBootLoader({ ready: false, timedOut: false, pageshowPersisted: false }),
    ).toBe(false)
  })

  it("hides the overlay and clears busy state once", () => {
    const overlay = { hidden: false, setAttribute: vi.fn() }
    const html = { removeAttribute: vi.fn() }
    applyBootLoaderHidden(overlay, html)
    expect(overlay.hidden).toBe(true)
    expect(overlay.setAttribute).toHaveBeenCalledWith("aria-hidden", "true")
    expect(html.removeAttribute).toHaveBeenCalledWith("aria-busy")
    expect(html.removeAttribute).toHaveBeenCalledWith("data-boot-pending")
  })

  it("session dismisses once across ready, timeout, and persisted pageshow", () => {
    const hide = vi.fn()
    const session = createBootLoaderSession({ hide })
    session.onReady()
    session.onTimeout()
    session.onPageshow(true)
    expect(hide).toHaveBeenCalledTimes(1)
    session.onPageshow(false)
    expect(hide).toHaveBeenCalledTimes(1)
  })

  it("does not dismiss on a normal pageshow", () => {
    const hide = vi.fn()
    const session = createBootLoaderSession({ hide })
    session.onPageshow(false)
    expect(hide).not.toHaveBeenCalled()
  })

  it("signals ready on an EventTarget", () => {
    const target = new EventTarget()
    const onReady = vi.fn()
    target.addEventListener(BOOT_READY_EVENT, onReady)
    signalHeroBootReady(target)
    expect(onReady).toHaveBeenCalledTimes(1)
  })

  it("keeps overlay id and 8s failsafe stable", () => {
    expect(BOOT_LOADER_ID).toBe("boot-loader")
    expect(BOOT_TIMEOUT_MS).toBe(8_000)
  })

  it("signals boot only on the first ASCII paint mark", () => {
    const dataset: { asciiPaint?: string } = {}
    expect(takeFirstAsciiPaint(dataset)).toBe(true)
    expect(dataset.asciiPaint).toBe("1")
    expect(takeFirstAsciiPaint(dataset)).toBe(false)
  })

  it("observes paint attributes without watching childList on html", () => {
    expect(BOOT_MUTATION_OBSERVER_INIT.childList).toBe(false)
    expect(BOOT_MUTATION_OBSERVER_INIT.subtree).toBe(true)
    expect(BOOT_MUTATION_OBSERVER_INIT.attributes).toBe(true)
    expect(BOOT_MUTATION_OBSERVER_INIT.attributeFilter).toEqual([
      "data-ascii-paint",
      "data-hero-boot-fallback",
    ])
    const canvas = {
      getAttribute: (name: string) => (name === "data-ascii-paint" ? "1" : null),
      hasAttribute: () => false,
    }
    const other = {
      getAttribute: () => null,
      hasAttribute: () => false,
    }
    expect(isBootReadyAttributeTarget(canvas)).toBe(true)
    expect(isBootReadyAttributeTarget(other)).toBe(false)
    expect(bootReadyFromMutations([{ type: "childList", target: canvas }])).toBe(false)
    expect(bootReadyFromMutations([{ type: "attributes", target: canvas }])).toBe(true)
  })
})
