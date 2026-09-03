export type HubNode = {
  id: string;
  index: number;
  angle: number;
  x: number;
  y: number;
};

export const HUB_CX = 0.5;
export const HUB_CY = 0.5;
export const HUB_RADIUS = 0.38;

export function hubLayout(
  ids: readonly string[],
  cx = HUB_CX,
  cy = HUB_CY,
  radius = HUB_RADIUS,
): HubNode[] {
  const n = ids.length;
  return ids.map((id, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / n;
    return {
      id,
      index,
      angle,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
}

export function spokePath(
  node: HubNode,
  cx = HUB_CX,
  cy = HUB_CY,
  size = 800,
): string {
  const x1 = node.x * size;
  const y1 = node.y * size;
  const x2 = cx * size;
  const y2 = cy * size;
  return `M${x1.toFixed(3)} ${y1.toFixed(3)} L${x2.toFixed(3)} ${y2.toFixed(3)}`;
}
