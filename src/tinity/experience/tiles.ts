import { FIELD_OPTIONS } from "./adapters/options";
import { AGENT_COUNT, AGENTS } from "./agents";

export type Tile = {
  id: string;
  role: "cta" | "number" | "occupancy";
  col: number;
  row: number;
  x: number;
  y: number;
  size: number;
  inside: boolean;
};

export type Cell = Omit<Tile, "id" | "role">;

export type Layout = {
  tiles: Tile[];
  cellCss: number;
  cols: number;
  rows: number;
  offsetX: number;
  offsetY: number;
  padX: number;
  padY: number;
  cta: { col: number; row: number };
  reservedRows: number;
};

export type LayoutOptions = {
  seed?: number;
  reservedRows?: number;
};

export function numberStride(colCount: number, rowCount: number): number {
  return Math.max(2, Math.round(Math.sqrt((colCount * rowCount) / 16)));
}

function chebyshev(
  a: Pick<Cell, "col" | "row">,
  b: Pick<Cell, "col" | "row">,
) {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const current = out[i]!;
    out[i] = out[j]!;
    out[j] = current;
  }
  return out;
}

function wouldFillSquare(cell: Cell, taken: Set<string>): boolean {
  for (const dc of [-1, 0]) {
    for (const dr of [-1, 0]) {
      const square = [
        cellKey(cell.col + dc, cell.row + dr),
        cellKey(cell.col + dc + 1, cell.row + dr),
        cellKey(cell.col + dc, cell.row + dr + 1),
        cellKey(cell.col + dc + 1, cell.row + dr + 1),
      ];
      if (
        square.every(
          (key) => key === cellKey(cell.col, cell.row) || taken.has(key),
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function plusZero(n: number): number {
  return n === 0 ? 0 : n;
}

const EDGE_EPSILON = 0.5;

function cellSizeCss(w: number, h: number, dpr: number, cellScale: number): number {
  const shortCss = Math.min(w, h);
  const cssCell = shortCss / cellScale;
  const snapped = Math.max(1, Math.round(shortCss * dpr)) / cellScale / dpr;
  const snappedCount = Math.ceil(shortCss / snapped - 1e-9);
  if (
    snappedCount === cellScale &&
    snapped * cellScale <= shortCss + EDGE_EPSILON
  ) {
    return snapped;
  }
  return cssCell;
}

export function fitsViewport(
  cell: Pick<Tile, "x" | "y" | "size">,
  w: number,
  h: number,
): boolean {
  return (
    cell.x >= -EDGE_EPSILON &&
    cell.y >= -EDGE_EPSILON &&
    cell.x + cell.size <= w + EDGE_EPSILON &&
    cell.y + cell.size <= h + EDGE_EPSILON
  );
}

export function pickAgentCells(
  cells: Cell[],
  cta: { col: number; row: number },
  seed: number,
  reservedRows: number,
  w: number,
  h: number,
): Cell[] {
  // Reserved rows are counted from the first row that is fully visible, so a
  // bottom row already clipped by the symmetric offset does not consume the
  // reservation (mobile browser chrome needs a truly free row above it).
  const visibleRows = cells
    .filter((cell) => fitsViewport(cell, w, h))
    .map((cell) => cell.row);
  const firstVisibleRow = visibleRows.length ? Math.min(...visibleRows) : 0;
  const minAgentRow = firstVisibleRow + reservedRows;
  const eligible = cells.filter(
    (cell) =>
      !(cell.col === cta.col && cell.row === cta.row) &&
      cell.row >= minAgentRow &&
      fitsViewport(cell, w, h),
  );
  const target = Math.min(AGENT_COUNT, eligible.length);
  const colCount = Math.max(0, ...cells.map((cell) => cell.col)) + 1;
  const rowCount = Math.max(0, ...cells.map((cell) => cell.row)) + 1;
  const gridSeed =
    ((colCount * 73856093) ^
      (rowCount * 19349663) ^
      (cta.col * 83492791) ^
      (cta.row * 50331653)) >>>
    0;
  const pool = shuffle(eligible, mulberry32((gridSeed ^ (seed >>> 0)) >>> 0));
  const selected: Cell[] = [];
  const taken = new Set<string>();

  const minDist = (cell: Cell) => {
    let min = Infinity;
    for (const other of selected) {
      min = Math.min(min, chebyshev(cell, other));
    }
    return min;
  };

  const adjacent = (cell: Cell) =>
    selected.filter((other) => chebyshev(cell, other) === 1);

  const take = (cell: Cell) => {
    selected.push(cell);
    taken.add(cellKey(cell.col, cell.row));
  };

  const clusterBudget = Math.max(2, Math.round(target * 0.36));
  const isolatedTarget = Math.max(1, target - clusterBudget);

  for (const cell of pool) {
    if (selected.length >= isolatedTarget) break;
    if (selected.length === 0 || minDist(cell) >= 2) take(cell);
  }

  for (const cell of pool) {
    if (selected.length >= target) break;
    if (taken.has(cellKey(cell.col, cell.row))) continue;
    const neighbors = adjacent(cell);
    if (neighbors.length !== 1) continue;
    const hub = neighbors[0]!;
    const hubPaired = adjacent(hub).length >= 1;
    if (hubPaired || wouldFillSquare(cell, taken)) continue;
    take(cell);
  }

  for (const cell of pool) {
    if (selected.length >= target) break;
    if (taken.has(cellKey(cell.col, cell.row))) continue;
    if (minDist(cell) >= 2) take(cell);
  }

  for (const cell of pool) {
    if (selected.length >= target) break;
    if (taken.has(cellKey(cell.col, cell.row))) continue;
    if (!wouldFillSquare(cell, taken)) take(cell);
  }

  for (const cell of pool) {
    if (selected.length >= target) break;
    if (taken.has(cellKey(cell.col, cell.row))) continue;
    take(cell);
  }

  return selected.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
}

export function nearestCell(tiles: Tile[], x: number, y: number): Tile | undefined {
  let best: Tile | undefined;
  let bestDist = Infinity;
  for (const tile of tiles) {
    if (!tile.inside) continue;
    const dx = tile.x + tile.size / 2 - x;
    const dy = tile.y + tile.size / 2 - y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = tile;
    }
  }
  return best;
}

const EMPTY_LAYOUT: Layout = {
  tiles: [],
  cellCss: 0,
  cols: 0,
  rows: 0,
  offsetX: 0,
  offsetY: 0,
  padX: 0,
  padY: 0,
  cta: { col: 0, row: 0 },
  reservedRows: 0,
};

export function layoutTiles(
  w: number,
  h: number,
  dpr = 1,
  options: LayoutOptions = {},
): Layout {
  const seed = options.seed ?? 0;
  const reservedRows = options.reservedRows ?? 0;
  if (w <= 0 || h <= 0) {
    return { ...EMPTY_LAYOUT, reservedRows };
  }

  const cellScale = FIELD_OPTIONS.cellScale;
  // Tile math prefers a CSS cell that fits `cellScale` whole cells on the short
  // axis. Device-pixel snapping (what the shader uses) is kept only when it
  // still yields exactly that count; otherwise 9 * snapped can be < h enough
  // for ceil(h / cell) to invent a 10th landscape row. Shader mismatch < 1px.
  const cellCss = cellSizeCss(w, h, dpr, cellScale);
  const cols = Math.ceil(w / cellCss);
  const rows = Math.ceil(h / cellCss);
  const extraX = cols * cellCss - w;
  const extraY = rows * cellCss - h;
  const landscape = w >= h;
  const offsetX = plusZero(landscape ? -extraX / 2 : 0);
  const offsetY = plusZero(landscape ? 0 : -extraY / 2);
  const padX = plusZero(-offsetX);
  const padY = plusZero(-offsetY);

  const ctaCol = Math.min(
    cols - 1,
    Math.max(0, Math.floor((w / 2 - offsetX) / cellCss)),
  );
  const ctaRow = Math.min(
    rows - 1,
    Math.max(0, Math.floor((h / 2 - offsetY) / cellCss)),
  );

  const cells: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellCss + offsetX;
      const y = h - (row + 1) * cellCss - offsetY;
      const size = cellCss;
      cells.push({
        col,
        row,
        x,
        y,
        size,
        inside: fitsViewport({ x, y, size }, w, h),
      });
    }
  }

  const numbered = pickAgentCells(
    cells,
    { col: ctaCol, row: ctaRow },
    seed,
    reservedRows,
    w,
    h,
  );
  const numberIds = new Map<string, string>();
  numbered.forEach((cell, index) => {
    const agent = AGENTS[index];
    if (agent) numberIds.set(cellKey(cell.col, cell.row), agent.id);
  });

  const tiles = cells.map((cell) => {
    if (cell.col === ctaCol && cell.row === ctaRow) {
      return { ...cell, id: "cta", role: "cta" as const };
    }
    const numberId = numberIds.get(cellKey(cell.col, cell.row));
    if (numberId) {
      return { ...cell, id: numberId, role: "number" as const };
    }
    return {
      ...cell,
      id: `o:${cell.col},${cell.row}`,
      role: "occupancy" as const,
    };
  });

  return {
    tiles,
    cellCss,
    cols,
    rows,
    offsetX,
    offsetY,
    padX,
    padY,
    cta: { col: ctaCol, row: ctaRow },
    reservedRows,
  };
}

export function layoutTilesList(
  w: number,
  h: number,
  dpr?: number,
  options?: LayoutOptions,
): Tile[] {
  return layoutTiles(w, h, dpr, options).tiles;
}
