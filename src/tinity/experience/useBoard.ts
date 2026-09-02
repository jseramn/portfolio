import { useCallback, useMemo, useState } from "react";
import {
  cellKey,
  nearestCell,
  pickAgentCells,
  type Layout,
  type Tile,
} from "./tiles";

export type BoardPositions = ReadonlyMap<string, string>;

export type DragDrop = {
  agentId: string;
  from: string;
  to: string;
  swappedWith?: string;
  dropX: number;
  dropY: number;
};

type DragState = {
  agentId: string;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  moved: boolean;
};

function viewportOf(layout: Layout): { w: number; h: number } {
  return {
    w: layout.cols * layout.cellCss + 2 * layout.offsetX,
    h: layout.rows * layout.cellCss + 2 * layout.offsetY,
  };
}

function layoutSizeKey(layout: Layout, agentIds: readonly string[]): string {
  return [
    layout.cols,
    layout.rows,
    layout.cellCss,
    layout.offsetX,
    layout.offsetY,
    layout.reservedRows,
    agentIds.join("\0"),
  ].join(":");
}

function buildPositions(
  layout: Layout,
  agentIds: readonly string[],
  seed: number,
): Map<string, string> {
  const { w, h } = viewportOf(layout);
  const picked = pickAgentCells(
    layout.tiles,
    layout.cta,
    seed,
    layout.reservedRows,
    w,
    h,
  );
  const positions = new Map<string, string>();
  picked.forEach((cell, index) => {
    const agentId = agentIds[index];
    if (agentId) positions.set(agentId, cellKey(cell.col, cell.row));
  });
  return positions;
}

function relabel(layout: Layout, positions: BoardPositions): Tile[] {
  const byCell = new Map<string, string>();
  for (const [agentId, key] of positions) byCell.set(key, agentId);
  return layout.tiles.map((tile) => {
    if (tile.col === layout.cta.col && tile.row === layout.cta.row) {
      return { ...tile, id: "cta", role: "cta" as const };
    }
    const agentId = byCell.get(cellKey(tile.col, tile.row));
    if (agentId) {
      return { ...tile, id: agentId, role: "number" as const };
    }
    return {
      ...tile,
      id: `o:${tile.col},${tile.row}`,
      role: "occupancy" as const,
    };
  });
}

function occupantAt(
  positions: BoardPositions,
  key: string,
  except?: string,
): string | undefined {
  for (const [agentId, cell] of positions) {
    if (cell === key && agentId !== except) return agentId;
  }
  return undefined;
}

export function useBoard(layout: Layout, agentIds: readonly string[]) {
  const [seed, setSeed] = useState(0);
  const [positions, setPositions] = useState<Map<string, string>>(() =>
    buildPositions(layout, agentIds, 0),
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const sizeKey = layoutSizeKey(layout, agentIds);
  const [appliedKey, setAppliedKey] = useState(sizeKey);

  if (sizeKey !== appliedKey) {
    setAppliedKey(sizeKey);
    setPositions(buildPositions(layout, agentIds, seed));
  }

  const tilesWithAgents = useMemo(
    () => relabel(layout, positions),
    [layout, positions],
  );

  const shuffle = useCallback(() => {
    const next = seed + 1;
    setSeed(next);
    setPositions(buildPositions(layout, agentIds, next));
  }, [agentIds, layout, seed]);

  const reset = useCallback(() => {
    setSeed(0);
    setPositions(buildPositions(layout, agentIds, 0));
  }, [agentIds, layout]);

  const begin = useCallback((agentId: string, pointerX: number, pointerY: number) => {
    setDragState({
      agentId,
      startX: pointerX,
      startY: pointerY,
      dx: 0,
      dy: 0,
      moved: false,
    });
  }, []);

  const move = useCallback((pointerX: number, pointerY: number) => {
    setDragState((current) => {
      if (!current) return current;
      const dx = pointerX - current.startX;
      const dy = pointerY - current.startY;
      return {
        ...current,
        dx,
        dy,
        moved: current.moved || Math.hypot(dx, dy) > 6,
      };
    });
  }, []);

  const end = useCallback((): DragDrop | null => {
    if (!dragState) return null;
    const { agentId, dx, dy } = dragState;
    const from = positions.get(agentId);
    const fromTile = from
      ? layout.tiles.find(
          (tile) => cellKey(tile.col, tile.row) === from,
        )
      : undefined;
    setDragState(null);
    if (!from || !fromTile) return null;

    const dropPointX = fromTile.x + fromTile.size / 2 + dx;
    const dropPointY = fromTile.y + fromTile.size / 2 + dy;
    const target = nearestCell(layout.tiles, dropPointX, dropPointY);
    const originX = fromTile.x + fromTile.size / 2;
    const originY = fromTile.y + fromTile.size / 2;

    const isCta =
      !!target &&
      target.col === layout.cta.col &&
      target.row === layout.cta.row;

    if (!target || isCta) {
      return {
        agentId,
        from,
        to: from,
        dropX: target ? target.x + target.size / 2 : originX,
        dropY: target ? target.y + target.size / 2 : originY,
      };
    }

    const to = cellKey(target.col, target.row);
    const swappedWith = occupantAt(positions, to, agentId);
    const dropX = target.x + target.size / 2;
    const dropY = target.y + target.size / 2;

    if (to !== from) {
      setPositions((current) => {
        const next = new Map(current);
        next.set(agentId, to);
        if (swappedWith) next.set(swappedWith, from);
        return next;
      });
    }

    return swappedWith
      ? { agentId, from, to, swappedWith, dropX, dropY }
      : { agentId, from, to, dropX, dropY };
  }, [dragState, layout, positions]);

  const cancel = useCallback(() => {
    setDragState(null);
  }, []);

  return {
    positions,
    tilesWithAgents,
    shuffle,
    reset,
    drag: {
      active: dragState
        ? { agentId: dragState.agentId, dx: dragState.dx, dy: dragState.dy }
        : null,
      begin,
      move,
      end,
      cancel,
      moved: dragState?.moved ?? false,
    },
  };
}
