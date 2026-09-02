import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ForceFieldAdapter, type ForceFieldHandle } from "./adapters/forceField";
import {
  RIPPLE_SPEED,
  ctaOrigin,
  flipAxis,
  flipTargets,
  flipTilt,
  scheduledFlipDelay,
} from "./delays";
import { AgentMark } from "./AgentMark";
import { AGENTS, agentById } from "./agents";
import { reduce, type Phase } from "./machine";
import { usePrefersReducedMotion } from "./motion";
import { layoutTiles, type Tile } from "./tiles";
import { useBoard, type BoardPositions } from "./useBoard";
import { useDecryptLabel } from "./useDecryptLabel";

const AGENT_IDS = AGENTS.map((agent) => agent.id);

type CubeProps = {
  tile: Tile;
  flipped: boolean;
  onCta?: () => void;
  armed?: boolean;
  flipX?: number;
  flipY?: number;
  flipTilt?: number;
  padX: number;
  padY: number;
  dragging?: boolean;
  dragX?: number;
  dragY?: number;
  describedBy?: string;
  onDragDown?: (event: ReactPointerEvent<HTMLElement>) => void;
  onDragMove?: (event: ReactPointerEvent<HTMLElement>) => void;
  onDragUp?: (event: ReactPointerEvent<HTMLElement>) => void;
  onMarkClickCapture?: (event: ReactMouseEvent<HTMLElement>) => void;
};

function cubeBox(
  tile: Tile,
  padX: number,
  padY: number,
  axis?: { x: number; y: number },
  tilt?: number,
  drag?: { x: number; y: number },
): CSSProperties {
  return {
    left: tile.x + padX,
    top: tile.y + padY,
    width: tile.size,
    height: tile.size,
    ["--cell-css"]: `${tile.size}px`,
    ...(drag
      ? {
          ["--drag-x"]: `${drag.x}px`,
          ["--drag-y"]: `${drag.y}px`,
        }
      : {}),
    ...(axis
      ? {
          ["--flip-x"]: String(axis.x),
          ["--flip-y"]: String(axis.y),
          ["--flip-twist"]: Math.abs(axis.x) >= Math.abs(axis.y) ? "90deg" : "0deg",
          ...(tilt != null ? { ["--flip-tilt"]: String(tilt) } : {}),
        }
      : {}),
  } as CSSProperties;
}

function CubeLabel({ label, active }: { label: string; active: boolean }) {
  const text = useDecryptLabel(label, active);
  return (
    <span className="cube-label" aria-hidden="true">
      {text}
    </span>
  );
}

function reservedRowsFor(height: number): number {
  return window.matchMedia("(pointer: coarse)").matches || height < 700 ? 1 : 0;
}

function viewSize(): { w: number; h: number } {
  const visual = window.visualViewport;
  return {
    w: visual?.width ?? window.innerWidth,
    h: visual?.height ?? window.innerHeight,
  };
}

function finePointer(): boolean {
  return window.matchMedia("(pointer: fine)").matches;
}

const Cube = memo(function Cube({
  tile,
  flipped,
  onCta,
  armed,
  flipX,
  flipY,
  flipTilt: tilt,
  padX,
  padY,
  dragging,
  dragX,
  dragY,
  describedBy,
  onDragDown,
  onDragMove,
  onDragUp,
  onMarkClickCapture,
}: CubeProps) {
  const [hot, setHot] = useState(false);
  const box =
    tile.role === "number" && flipX != null && flipY != null
      ? cubeBox(
          tile,
          padX,
          padY,
          { x: flipX, y: flipY },
          tilt,
          dragging ? { x: dragX ?? 0, y: dragY ?? 0 } : undefined,
        )
      : cubeBox(tile, padX, padY);
  if (tile.role === "cta") {
    return (
      <button
        type="button"
        className={armed ? "cube cube--cta is-armed" : "cube cube--cta"}
        style={box}
        aria-describedby={describedBy}
        onPointerUp={onCta}
      >
        <span className="cube-lift">tinity me</span>
      </button>
    );
  }
  if (tile.role === "occupancy") {
    return (
      <div className="cube cube--occupancy" style={box}><div className="cube-face" /></div>
    );
  }
  const label = agentById(tile.id)?.label ?? "";
  const className = [
    "cube",
    "cube--number",
    flipped ? "is-flipped" : "",
    dragging ? "is-dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={className}
      style={box}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      onPointerDown={onDragDown}
      onPointerMove={onDragMove}
      onPointerUp={onDragUp}
      onPointerCancel={onDragUp}
      onClickCapture={onMarkClickCapture}
    >
      <div className="cube-tumble">
        <div className="cube-lift">
          <div className="cube-inner">
            <div className="cube-face cube-face--front" />
            <div className="cube-spine" aria-hidden="true" />
            <div
              className="cube-face cube-face--back"
              aria-hidden={!flipped}
              data-agent={tile.id}
            >
              <AgentMark id={tile.id} />
              <CubeLabel label={label} active={flipped && hot} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => (
  prev.flipped === next.flipped &&
  prev.onCta === next.onCta &&
  prev.armed === next.armed &&
  prev.tile.id === next.tile.id &&
  prev.tile.role === next.tile.role &&
  prev.tile.x === next.tile.x &&
  prev.tile.y === next.tile.y &&
  prev.tile.size === next.tile.size &&
  prev.flipX === next.flipX &&
  prev.flipY === next.flipY &&
  prev.flipTilt === next.flipTilt &&
  prev.padX === next.padX &&
  prev.padY === next.padY &&
  prev.dragging === next.dragging &&
  prev.dragX === next.dragX &&
  prev.dragY === next.dragY &&
  prev.describedBy === next.describedBy &&
  prev.onDragDown === next.onDragDown &&
  prev.onDragMove === next.onDragMove &&
  prev.onDragUp === next.onDragUp &&
  prev.onMarkClickCapture === next.onMarkClickCapture
));

export function Stage() {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("loader");
  const [docReady, setDocReady] = useState(
    () => document.readyState !== "loading",
  );
  const [fieldReady, setFieldReady] = useState(false);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(() => new Set());
  const [size, setSize] = useState(viewSize);
  const stageRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<ForceFieldHandle>(null);
  const timersRef = useRef<number[]>([]);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const pendingShuffleRef = useRef(false);
  const positionsRef = useRef<BoardPositions>(new Map());
  const dragMovedRef = useRef(false);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reservedRows = reservedRowsFor(size.h);
  const layout = useMemo(
    () => layoutTiles(size.w, size.h, dpr, { reservedRows }),
    [size.w, size.h, dpr, reservedRows],
  );
  const board = useBoard(layout, AGENT_IDS);
  const boardRef = useRef(board);
  boardRef.current = board;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const tiles = board.tilesWithAgents;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const apply = () => {
      const view = viewSize();
      const rect = el.getBoundingClientRect();
      setSize({
        w: rect.width > 1 ? Math.min(rect.width, view.w) : view.w,
        h: rect.height > 1 ? Math.min(rect.height, view.h) : view.h,
      });
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    const visual = window.visualViewport;
    window.addEventListener("resize", apply);
    visual?.addEventListener("resize", apply);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
      visual?.removeEventListener("resize", apply);
    };
  }, []);

  useEffect(() => {
    fieldRef.current?.resize();
  }, [layout.padX, layout.padY, size.w, size.h]);

  useEffect(() => {
    if (docReady) return;
    const mark = () => setDocReady(true);
    document.addEventListener("DOMContentLoaded", mark);
    window.addEventListener("load", mark);
    return () => {
      document.removeEventListener("DOMContentLoaded", mark);
      window.removeEventListener("load", mark);
    };
  }, [docReady]);

  useEffect(() => {
    if (phase === "loader" && docReady && fieldReady) {
      setPhase((current) => reduce(current, { type: "ready" }, reducedMotion));
    }
  }, [phase, docReady, fieldReady, reducedMotion]);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const startFlips = useCallback(
    (origin: { x: number; y: number }, currentTiles: Tile[]) => {
      clearTimers();
      const targets = flipTargets(currentTiles);
      const minSide = Math.min(size.w, size.h) || 1;
      if (reducedMotion) {
        setFlippedIds((prev) => {
          const next = new Set(prev);
          for (const tile of targets) next.add(tile.id);
          return next;
        });
        return;
      }
      for (const tile of targets) {
        const delayMs =
          scheduledFlipDelay(tile, origin, RIPPLE_SPEED, minSide, false) * 1000;
        const id = window.setTimeout(() => {
          setFlippedIds((prev) => {
            const next = new Set(prev);
            next.add(tile.id);
            return next;
          });
        }, delayMs);
        timersRef.current.push(id);
      }
    },
    [clearTimers, reducedMotion, size.h, size.w],
  );

  useEffect(() => {
    if (!pendingShuffleRef.current) {
      positionsRef.current = board.positions;
      return;
    }
    const prev = positionsRef.current;
    positionsRef.current = board.positions;
    pendingShuffleRef.current = false;
    const origin = ctaOrigin(board.tilesWithAgents);
    const movedTiles = board.tilesWithAgents.filter(
      (tile) =>
        tile.role === "number" &&
        prev.get(tile.id) !== board.positions.get(tile.id),
    );
    setFlippedIds((ids) => {
      const next = new Set(ids);
      for (const tile of movedTiles) next.delete(tile.id);
      return next;
    });
    if (origin) startFlips(origin, movedTiles);
  }, [board.positions, board.tilesWithAgents, startFlips]);

  const onCta = useCallback(() => {
    const current = phaseRef.current;
    const origin = ctaOrigin(boardRef.current.tilesWithAgents);
    if (!origin) return;
    const { padX, padY } = layoutRef.current;
    if (current === "idle") {
      fieldRef.current?.impact(origin.x + padX, origin.y + padY);
      setPhase(reduce(current, { type: "cta" }, reducedMotion));
      startFlips(origin, boardRef.current.tilesWithAgents);
      return;
    }
    if (current === "revealed") {
      fieldRef.current?.impact(origin.x + padX, origin.y + padY);
      pendingShuffleRef.current = true;
      boardRef.current.shuffle();
    }
  }, [reducedMotion, startFlips]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (phaseRef.current !== "revealed") return;
      pendingShuffleRef.current = false;
      clearTimers();
      setFlippedIds(new Set());
      setPhase((current) => reduce(current, { type: "escape" }, reducedMotion));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearTimers, reducedMotion]);

  const draggingRef = useRef(false);

  const onNumberPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      if (!finePointer()) return;
      if (!event.currentTarget.classList.contains("is-flipped")) return;
      const agentId = event.currentTarget
        .querySelector("[data-agent]")
        ?.getAttribute("data-agent");
      if (!agentId) return;
      dragMovedRef.current = false;
      draggingRef.current = true;
      boardRef.current.drag.begin(agentId, event.clientX, event.clientY);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [],
  );

  const onDragMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return;
    boardRef.current.drag.move(event.clientX, event.clientY);
  }, []);

  const onDragUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    dragMovedRef.current = boardRef.current.drag.moved;
    const drop = boardRef.current.drag.end();
    const { padX, padY } = layoutRef.current;
    if (drop && drop.to !== drop.from) {
      fieldRef.current?.impact(drop.dropX + padX, drop.dropY + padY);
    }
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  }, []);

  const onMarkClickCapture = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (boardRef.current.drag.moved || dragMovedRef.current) {
        event.preventDefault();
      }
    },
    [],
  );

  const origin = ctaOrigin(tiles);
  const drag = board.drag.active;

  return (
    <main
      className="stage"
      ref={stageRef}
      style={{ width: size.w, height: size.h }}
    >
      <div
        className="stage-slot"
        style={{
          left: -layout.padX,
          right: -layout.padX,
          top: -layout.padY,
          bottom: -layout.padY,
        }}
      >
        <ForceFieldAdapter
          ref={fieldRef}
          onReady={() => setFieldReady(true)}
        >
          <div className="overlay">
            {phase === "loader"
              ? null
              : tiles.map((tile) => {
                  const axis =
                    tile.role === "number" && origin
                      ? flipAxis(tile, origin)
                      : undefined;
                  const tilt =
                    tile.role === "number" && origin
                      ? flipTilt(tile, origin)
                      : undefined;
                  const dragging = drag?.agentId === tile.id;
                  return (
                    <Cube
                      key={tile.id}
                      tile={tile}
                      flipped={tile.role === "number" && flippedIds.has(tile.id)}
                      onCta={tile.role === "cta" ? onCta : undefined}
                      armed={tile.role === "cta" && phase === "idle"}
                      flipX={axis?.x}
                      flipY={axis?.y}
                      flipTilt={tilt}
                      padX={layout.padX}
                      padY={layout.padY}
                      dragging={dragging}
                      dragX={dragging ? drag?.dx : 0}
                      dragY={dragging ? drag?.dy : 0}
                      describedBy={
                        tile.role === "cta" && phase === "revealed"
                          ? "cta-hint"
                          : undefined
                      }
                      onDragDown={
                        tile.role === "number" ? onNumberPointerDown : undefined
                      }
                      onDragMove={
                        tile.role === "number" ? onDragMove : undefined
                      }
                      onDragUp={
                        tile.role === "number" ? onDragUp : undefined
                      }
                      onMarkClickCapture={
                        tile.role === "number" ? onMarkClickCapture : undefined
                      }
                    />
                  );
                })}
            {phase === "revealed" ? (
              <span id="cta-hint" className="sr-only">
                Shuffle the agents
              </span>
            ) : null}
          </div>
        </ForceFieldAdapter>
      </div>
    </main>
  );
}
