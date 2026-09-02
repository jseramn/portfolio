import { useEffect, useRef, type RefObject } from "react"

export type TabbableProbe = { id?: string; tabIndex: number; disabled?: boolean; hidden?: boolean }

export function isTabbable(el: TabbableProbe): boolean {
  return !el.disabled && !el.hidden && el.tabIndex >= 0
}

export function orderTabbable<T extends TabbableProbe>(els: readonly T[]): T[] {
  return els.filter(isTabbable)
}

export function wrapFocusIndex(current: number, shift: boolean, count: number): number {
  if (count <= 0) return 0
  if (current < 0) return shift ? count - 1 : 0
  return shift ? (current - 1 + count) % count : (current + 1) % count
}

const SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])'

export function listTabbable(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(SELECTOR)].filter((el) =>
    isTabbable({
      tabIndex: el.tabIndex,
      disabled: "disabled" in el && Boolean((el as HTMLInputElement).disabled),
      hidden: el.hidden || Boolean(el.closest("[hidden],[aria-hidden='true']")),
    }),
  )
}

export function useFocusTrap({
  active,
  containerRef,
  initialRef,
}: {
  active: boolean
  containerRef: RefObject<HTMLElement | null>
  initialRef?: RefObject<HTMLElement | null>
}): void {
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const timer = window.setTimeout(() => {
      const initial = initialRef?.current
      if (initial) {
        initial.focus()
        return
      }
      const root = containerRef.current
      if (root) listTabbable(root)[0]?.focus()
    }, 280)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return
      const root = containerRef.current
      if (!root) return
      const items = listTabbable(root)
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const index = items.indexOf(document.activeElement as HTMLElement)
      const edge =
        index < 0 ||
        (!event.shiftKey && index === items.length - 1) ||
        (event.shiftKey && index === 0)
      if (!edge) return
      event.preventDefault()
      items[wrapFocusIndex(index, event.shiftKey, items.length)]?.focus()
    }

    document.addEventListener("keydown", onKeyDown, true)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("keydown", onKeyDown, true)
      if (openerRef.current?.isConnected) openerRef.current.focus()
    }
  }, [active, containerRef, initialRef])
}
