import { useEffect, type RefObject } from "react"
import { getCapabilities } from "../../lib/capabilities"

export function useHeroPointer(heroRootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = heroRootRef.current
    if (!root) return
    let smoothRaf = 0
    let settleRaf = 0
    let pressed = false
    let curX = 0
    let curY = 0
    let tgtX = 0
    let tgtY = 0
    let seeded = false
    const emit = (x: number, y: number) => {
      root.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: x,
          clientY: y,
          bubbles: true,
        }),
      )
    }
    const hosts = () => [...root.querySelectorAll("[data-glass-host]")] as HTMLElement[]
    const stopSettle = () => {
      if (settleRaf) {
        cancelAnimationFrame(settleRaf)
        settleRaf = 0
      }
      delete root.dataset.glassSettling
      for (const host of hosts()) host.classList.remove("is-settling")
    }
    const tick = () => {
      smoothRaf = 0
      curX += (tgtX - curX) * 0.15
      curY += (tgtY - curY) * 0.15
      emit(curX, curY)
      if (Math.hypot(tgtX - curX, tgtY - curY) > 0.5) {
        smoothRaf = requestAnimationFrame(tick)
        return
      }
      curX = tgtX
      curY = tgtY
      emit(curX, curY)
    }
    const aim = (x: number, y: number) => {
      tgtX = x
      tgtY = y
      if (!seeded) {
        curX = x
        curY = y
        seeded = true
      }
      if (!smoothRaf) smoothRaf = requestAnimationFrame(tick)
    }
    const rest = () => {
      if (smoothRaf) {
        cancelAnimationFrame(smoothRaf)
        smoothRaf = 0
      }
      stopSettle()
      const origins = hosts().map((el) => {
        const cs = getComputedStyle(el)
        return {
          el,
          x: Number.parseFloat(cs.left) || 0,
          y: Number.parseFloat(cs.top) || 0,
          sx: Number.parseFloat(cs.getPropertyValue("--glass-sx")) || 1,
          sy: Number.parseFloat(cs.getPropertyValue("--glass-sy")) || 1,
        }
      })
      if (origins.every((o) => Math.abs(o.x) < 0.5 && Math.abs(o.y) < 0.5)) {
        const box = root.getBoundingClientRect()
        tgtX = box.left + box.width / 2
        tgtY = box.top - 2000
        curX = tgtX
        curY = tgtY
        seeded = false
        emit(tgtX, tgtY)
        return
      }
      const settleMs = getCapabilities().reducedMotion ? 0 : 220
      if (settleMs === 0) {
        stopSettle()
        const box = root.getBoundingClientRect()
        tgtX = box.left + box.width / 2
        tgtY = box.top - 2000
        curX = tgtX
        curY = tgtY
        seeded = false
        emit(tgtX, tgtY)
        return
      }
      root.dataset.glassSettling = "1"
      for (const host of hosts()) host.classList.add("is-settling")
      const started = performance.now()
      const tickSettle = (now: number) => {
        const t = Math.min(1, (now - started) / settleMs)
        const ease = 1 - (1 - t) ** 3
        for (const origin of origins) {
          const x = origin.x * (1 - ease)
          const y = origin.y * (1 - ease)
          const sx = 1 + (origin.sx - 1) * (1 - ease)
          const sy = 1 + (origin.sy - 1) * (1 - ease)
          origin.el.style.left = `${x.toFixed(2)}px`
          origin.el.style.top = `${y.toFixed(2)}px`
          origin.el.style.setProperty("--glass-ex", `${x.toFixed(2)}px`)
          origin.el.style.setProperty("--glass-ey", `${y.toFixed(2)}px`)
          origin.el.style.setProperty("--glass-sx", sx.toFixed(4))
          origin.el.style.setProperty("--glass-sy", sy.toFixed(4))
        }
        if (t < 1) {
          settleRaf = requestAnimationFrame(tickSettle)
          return
        }
        settleRaf = 0
        stopSettle()
        const box = root.getBoundingClientRect()
        tgtX = box.left + box.width / 2
        tgtY = box.top - 2000
        curX = tgtX
        curY = tgtY
        seeded = false
        emit(tgtX, tgtY)
      }
      settleRaf = requestAnimationFrame(tickSettle)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return
      pressed = true
      stopSettle()
      const onControl =
        event.target instanceof Element &&
        Boolean(event.target.closest("a,button,input,textarea,label,[role='dialog']"))
      if (!onControl) {
        try {
          root.setPointerCapture(event.pointerId)
        } catch {
          /* Safari may reject capture on a non-element target */
        }
      }
      seeded = true
      curX = tgtX = event.clientX
      curY = tgtY = event.clientY
      emit(curX, curY)
    }
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return
      if (!pressed) return
      aim(event.clientX, event.clientY)
    }
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return
      if (!pressed) return
      pressed = false
      try {
        root.releasePointerCapture(event.pointerId)
      } catch {
        /* capture may already be released */
      }
      rest()
    }
    root.addEventListener("pointerdown", onPointerDown, { passive: true })
    root.addEventListener("pointermove", onPointerMove, { passive: true })
    root.addEventListener("pointerup", onPointerUp, { passive: true })
    root.addEventListener("pointercancel", onPointerUp, { passive: true })
    return () => {
      cancelAnimationFrame(smoothRaf)
      cancelAnimationFrame(settleRaf)
      delete root.dataset.glassSettling
      root.removeEventListener("pointerdown", onPointerDown)
      root.removeEventListener("pointermove", onPointerMove)
      root.removeEventListener("pointerup", onPointerUp)
      root.removeEventListener("pointercancel", onPointerUp)
    }
  }, [])
}
