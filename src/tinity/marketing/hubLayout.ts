import { MARK_VIEWBOX } from "./Lockup";

export type HubEdge = "north" | "east" | "south" | "west";

export type HubNode = {
  id: string;
  index: number;
  edge: HubEdge;
  x: number;
  y: number;
};

export const HUB_CX = 0.5;
export const HUB_CY = 0.5;
export const HUB_HALF = 0.38;
export const HUB_SIZE = 800;
export const MARK_HUB_SCALE = 28;
export const HUB_EDGE_COUNTS = {
  north: 5,
  east: 4,
  south: 4,
  west: 4,
} as const;

const EDGES: readonly HubEdge[] = ["north", "east", "south", "west"];
const EPS = 0.0005;

function pointOnEdge(
  edge: HubEdge,
  t: number,
  cx: number,
  cy: number,
  half: number,
): { x: number; y: number } {
  const left = cx - half;
  const right = cx + half;
  const top = cy - half;
  const bottom = cy + half;
  switch (edge) {
    case "north":
      return { x: left + t * (right - left), y: top };
    case "east":
      return { x: right, y: top + t * (bottom - top) };
    case "south":
      return { x: right - t * (right - left), y: bottom };
    case "west":
      return { x: left, y: bottom - t * (bottom - top) };
  }
}

export function hubLayout(
  ids: readonly string[],
  cx = HUB_CX,
  cy = HUB_CY,
  half = HUB_HALF,
): HubNode[] {
  const nodes: HubNode[] = [];
  let index = 0;
  for (const edge of EDGES) {
    const count = HUB_EDGE_COUNTS[edge];
    for (let i = 0; i < count; i += 1) {
      const id = ids[index];
      if (!id) return nodes;
      const t = i / count;
      const { x, y } = pointOnEdge(edge, t, cx, cy, half);
      nodes.push({ id, index, edge, x, y });
      index += 1;
    }
  }
  return nodes;
}

function fmt(n: number): string {
  return n.toFixed(3);
}

function elbowPx(
  edge: HubEdge,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x: number; y: number } | null {
  const elbow =
    edge === "north" || edge === "south"
      ? { x: x1, y: y2 }
      : { x: x2, y: y1 };
  const onStart = Math.abs(elbow.x - x1) < EPS && Math.abs(elbow.y - y1) < EPS;
  const onEnd = Math.abs(elbow.x - x2) < EPS && Math.abs(elbow.y - y2) < EPS;
  if (onStart || onEnd) return null;
  return elbow;
}

function tracePath(
  node: HubNode,
  cx: number,
  cy: number,
  size: number,
  direction: "in" | "out",
): string {
  const x1 = node.x * size;
  const y1 = node.y * size;
  const x2 = cx * size;
  const y2 = cy * size;
  const mid = elbowPx(node.edge, x1, y1, x2, y2);
  const points =
    direction === "in"
      ? mid
        ? [
            [x1, y1],
            [mid.x, mid.y],
            [x2, y2],
          ]
        : [
            [x1, y1],
            [x2, y2],
          ]
      : mid
        ? [
            [x2, y2],
            [mid.x, mid.y],
            [x1, y1],
          ]
        : [
            [x2, y2],
            [x1, y1],
          ];
  const [start, ...rest] = points;
  return `M${fmt(start![0])} ${fmt(start![1])} ${rest
    .map(([x, y]) => `L${fmt(x)} ${fmt(y)}`)
    .join(" ")}`;
}

export function spokePath(
  node: HubNode,
  cx = HUB_CX,
  cy = HUB_CY,
  size = HUB_SIZE,
): string {
  return tracePath(node, cx, cy, size, "in");
}

export function sendPath(
  node: HubNode,
  cx = HUB_CX,
  cy = HUB_CY,
  size = HUB_SIZE,
): string {
  return tracePath(node, cx, cy, size, "out");
}

export function markHubTransform(
  cx = HUB_CX,
  cy = HUB_CY,
  size = HUB_SIZE,
  scale = MARK_HUB_SCALE,
): string {
  return `translate(${cx * size} ${cy * size}) scale(${scale}) translate(${MARK_VIEWBOX.minX} ${MARK_VIEWBOX.minY})`;
}
