import { useEffect, useState } from "react"

export type ElementSize = { width: number; height: number }

type Measurable = {
  getBoundingClientRect: () => { width: number; height: number }
}

type SizeObserver = {
  new (
    cb: () => void,
  ): {
    observe: (target: Measurable) => void
    disconnect: () => void
  }
}

export function readElementSize(el: Measurable): ElementSize {
  const rect = el.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
}

export function observeElementSize(
  el: Measurable,
  onSize: (size: ElementSize) => void,
  Observer: SizeObserver | null | undefined = typeof ResizeObserver === "undefined"
    ? undefined
    : (ResizeObserver as unknown as SizeObserver),
): () => void {
  const report = () => onSize(readElementSize(el))
  report()
  if (!Observer) return () => {}
  const ro = new Observer(report)
  ro.observe(el)
  return () => ro.disconnect()
}

export function useElementWidth(): {
  ref: (node: HTMLElement | null) => void
  width: number
  height: number
} {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    if (!node) return
    return observeElementSize(node, (next) => {
      setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next))
    })
  }, [node])

  return { ref: setNode, width: size.width, height: size.height }
}
