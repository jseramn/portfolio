import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { useState, useEffect, Children, cloneElement, isValidElement } from "react"
import type { Transition, Variants, AnimatePresenceProps } from "motion/react"

type TextLoopProps = {
  children: React.ReactNode[]
  className?: string
  interval?: number
  transition?: Transition
  variants?: Variants
  mode?: AnimatePresenceProps["mode"]
  onIndexChange?: (index: number) => void
  paused?: boolean
}

export function TextLoop({
  children,
  className,
  interval = 2,
  transition = { duration: 0.3 },
  variants,
  mode = "popLayout",
  onIndexChange,
  paused = false,
}: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const items = Children.toArray(children)
  const reducedMotion = Boolean(useReducedMotion())
  const freeze = paused || reducedMotion

  useEffect(() => {
    onIndexChange?.(currentIndex)
  }, [currentIndex, onIndexChange])

  useEffect(() => {
    if (freeze) return
    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % items.length)
    }, interval * 1000)
    return () => clearInterval(timer)
  }, [items.length, interval, freeze])

  const defaultVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  }

  return (
    <div className={`relative inline-grid justify-items-start overflow-hidden ${className ?? ""}`}>
      {items.map((item) =>
        isValidElement(item) ? (
          <div
            key={`sizer-${item.key}`}
            className="col-start-1 row-start-1 invisible"
            aria-hidden="true"
          >
            {cloneElement(item)}
          </div>
        ) : null,
      )}
      <div className="col-start-1 row-start-1 h-full overflow-hidden">
        {freeze ? (
          items[currentIndex]
        ) : (
          <AnimatePresence mode={mode} initial={false}>
            <motion.div
              key={currentIndex}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              variants={variants || defaultVariants}
            >
              {items[currentIndex]}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
