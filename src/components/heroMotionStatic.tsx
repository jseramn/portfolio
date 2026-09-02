import { Children, cloneElement, isValidElement, lazy, Suspense, type ReactNode } from "react"

const LazyTextLoop = lazy(() => import("./TextLoop").then((mod) => ({ default: mod.TextLoop })))
const LazySlider = lazy(() =>
  import("./InfiniteSlider").then((mod) => ({ default: mod.InfiniteSlider })),
)

export function TextLoopStatic({
  children,
  className,
  index = 0,
}: {
  children: ReactNode
  className?: string
  index?: number
}) {
  const items = Children.toArray(children)
  return (
    <div
      className={`relative inline-grid justify-items-start overflow-hidden ${className ?? ""}`}
      data-text-loop=""
    >
      {items.map((item) =>
        isValidElement(item) ? (
          <div key={`sizer-${item.key}`} className="col-start-1 row-start-1 invisible" aria-hidden>
            {cloneElement(item)}
          </div>
        ) : null,
      )}
      <div className="col-start-1 row-start-1 h-full overflow-hidden">{items[index]}</div>
    </div>
  )
}

export function InfiniteSliderStatic({
  children,
  gap = 16,
  className,
}: {
  children?: ReactNode
  gap?: number
  className?: string
}) {
  return (
    <div className={`overflow-hidden ${className ?? ""}`} data-marquee-pending="">
      <div className="flex w-max" style={{ gap: `${gap}px`, flexDirection: "row" }}>
        {children}
        {children}
      </div>
    </div>
  )
}

export function HeroMotionSlider({ ready, children }: { ready: boolean; children: ReactNode }) {
  const fallback = <InfiniteSliderStatic gap={32}>{children}</InfiniteSliderStatic>
  if (!ready) return fallback
  return (
    <Suspense fallback={fallback}>
      <LazySlider gap={32} speed={50} speedOnHover={20}>
        {children}
      </LazySlider>
    </Suspense>
  )
}

export function HeroMotionRoles(props: {
  ready: boolean
  paused: boolean
  onIndexChange: (index: number) => void
  children: ReactNode[]
}) {
  const fallback = <TextLoopStatic>{props.children}</TextLoopStatic>
  if (!props.ready) return fallback
  return (
    <Suspense fallback={fallback}>
      <LazyTextLoop
        interval={2.5}
        transition={{ duration: 0.4 }}
        onIndexChange={props.onIndexChange}
        paused={props.paused}
      >
        {props.children}
      </LazyTextLoop>
    </Suspense>
  )
}
