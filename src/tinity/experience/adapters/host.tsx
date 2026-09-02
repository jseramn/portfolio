import {
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

type PaintableCanvas = HTMLCanvasElement & {
  requestPaint?: () => void;
};

type ElementImageContext = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, x: number, y: number) => void;
};

function supportsHtmlInCanvas(): boolean {
  if (typeof document === "undefined") return false;
  const probe = document.createElement("canvas") as PaintableCanvas;
  const ctx = probe.getContext("2d") as ElementImageContext | null;
  return Boolean(
    ctx &&
      typeof ctx.drawElementImage === "function" &&
      typeof probe.requestPaint === "function",
  );
}

const emptySubscribe = () => () => {};

const fill: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

const contentStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  overflow: "visible",
  zIndex: 2,
};

export function CanvasEffectHost({
  className,
  children,
  sourceRef,
  contentRef,
  outputRef,
}: {
  className?: string;
  children?: ReactNode;
  sourceRef: RefObject<HTMLCanvasElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  outputRef: RefObject<HTMLCanvasElement | null>;
}) {
  const native = useSyncExternalStore(
    emptySubscribe,
    supportsHtmlInCanvas,
    () => false,
  );

  return (
    <div className={className} style={{ position: "absolute", inset: 0 }}>
      <canvas
        ref={sourceRef}
        // @ts-expect-error experimental html-in-canvas attribute
        layoutsubtree="true"
        suppressHydrationWarning
        style={native ? fill : { display: "none" }}
      >
        {native ? (
          <div ref={contentRef} style={contentStyle}>
            {children}
          </div>
        ) : null}
      </canvas>
      <canvas
        ref={outputRef}
        aria-hidden
        style={{ ...fill, pointerEvents: "none" }}
      />
      {native ? null : (
        <div ref={contentRef} style={contentStyle}>
          {children}
        </div>
      )}
    </div>
  );
}
