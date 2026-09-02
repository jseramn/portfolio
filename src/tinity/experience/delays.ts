import type { Tile } from "./tiles";

export const RIPPLE_SPEED = 1.6;

export function flipAxis(
  tile: Tile,
  origin: { x: number; y: number },
): { x: number; y: number } {
  const dx = tile.x + tile.size / 2 - origin.x;
  const dy = tile.y + tile.size / 2 - origin.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 0, y: -1 };
  const x = dy / len;
  const y = -dx / len;
  // 180deg around a diagonal in-plane axis reflects the square into a diamond.
  if (Math.abs(x) >= Math.abs(y)) {
    return { x: x < 0 ? -1 : 1, y: 0 };
  }
  return { x: 0, y: y < 0 ? -1 : 1 };
}

export function flipTilt(
  tile: Tile,
  origin: { x: number; y: number },
): number {
  const dx = tile.x + tile.size / 2 - origin.x;
  const dy = tile.y + tile.size / 2 - origin.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return 0;
  const x = dy / len;
  const y = -dx / len;
  const leftover = Math.abs(x) >= Math.abs(y) ? y : x;
  const tilt = Math.min(1, Math.max(-1, leftover));
  return tilt === 0 ? 0 : tilt;
}

export function flipDelay(
  tile: Tile,
  origin: { x: number; y: number },
  speed: number,
  minSide: number,
): number {
  const dist = Math.hypot(
    tile.x + tile.size / 2 - origin.x,
    tile.y + tile.size / 2 - origin.y,
  );
  return dist / (speed * minSide);
}

export function scheduledFlipDelay(
  tile: Tile,
  origin: { x: number; y: number },
  speed: number,
  minSide: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 0;
  return flipDelay(tile, origin, speed, minSide);
}

export function flipTargets(tiles: Tile[]): Tile[] {
  return tiles.filter((tile) => tile.role === "number");
}

export function ctaOrigin(
  tiles: Tile[],
): { x: number; y: number } | null {
  const cta = tiles.find((tile) => tile.role === "cta");
  if (!cta) return null;
  return { x: cta.x + cta.size / 2, y: cta.y + cta.size / 2 };
}
