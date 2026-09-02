export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type Matrix = { a: number; b: number; c: number; d: number; e: number; f: number };

const IDENTITY: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

function multiply(p: Matrix, q: Matrix): Matrix {
  return {
    a: p.a * q.a + p.c * q.b,
    b: p.b * q.a + p.d * q.b,
    c: p.a * q.c + p.c * q.d,
    d: p.b * q.c + p.d * q.d,
    e: p.a * q.e + p.c * q.f + p.e,
    f: p.b * q.e + p.d * q.f + p.f,
  };
}

function apply(m: Matrix, x: number, y: number): [number, number] {
  return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
}

function parseTransform(value: string | null): Matrix {
  if (!value) return IDENTITY;
  let matrix = IDENTITY;
  const re = /(translate|scale|matrix)\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value))) {
    const args = match[2]
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (match[1] === "translate") {
      matrix = multiply(matrix, {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: args[0] ?? 0,
        f: args[1] ?? 0,
      });
    } else if (match[1] === "scale") {
      const sx = args[0] ?? 1;
      matrix = multiply(matrix, {
        a: sx,
        b: 0,
        c: 0,
        d: args[1] ?? sx,
        e: 0,
        f: 0,
      });
    } else if (match[1] === "matrix" && args.length === 6) {
      matrix = multiply(matrix, {
        a: args[0],
        b: args[1],
        c: args[2],
        d: args[3],
        e: args[4],
        f: args[5],
      });
    }
  }
  return matrix;
}

function parentEl(node: Element): Element | null {
  if (node.parentElement) return node.parentElement;
  const parent = node.parentNode;
  return parent instanceof Element ? parent : null;
}

function ancestorMatrix(node: Element, root: Element): Matrix {
  const stack: string[] = [];
  let current: Element | null = parentEl(node);
  while (current && current !== root) {
    const transform = current.getAttribute("transform");
    if (transform) stack.push(transform);
    current = parentEl(current);
  }
  let matrix = IDENTITY;
  for (const transform of stack.reverse()) {
    matrix = multiply(matrix, parseTransform(transform));
  }
  return matrix;
}

function makeReader(d: string) {
  let i = 0;
  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i]!)) i += 1;
  };
  return {
    done: () => {
      skip();
      return i >= d.length;
    },
    peekCmd: () => {
      skip();
      const ch = d[i];
      return ch && /[MmLlHhVvCcSsQqTtAaZz]/.test(ch) ? ch : null;
    },
    takeCmd: () => {
      skip();
      return d[i++];
    },
    takeNum: () => {
      skip();
      const match = /^-?\d*\.?\d+(?:e[-+]?\d+)?/i.exec(d.slice(i));
      if (!match) return Number.NaN;
      i += match[0].length;
      return Number(match[0]);
    },
    takeFlag: () => {
      skip();
      const flag = d[i] === "1" ? 1 : 0;
      i += 1;
      return flag;
    },
  };
}

function sampleCubic(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  into: Array<[number, number]>,
) {
  for (let i = 1; i <= 16; i++) {
    const t = i / 16;
    const u = 1 - t;
    into.push([
      u * u * u * p0[0] +
        3 * u * u * t * p1[0] +
        3 * u * t * t * p2[0] +
        t * t * t * p3[0],
      u * u * u * p0[1] +
        3 * u * u * t * p1[1] +
        3 * u * t * t * p2[1] +
        t * t * t * p3[1],
    ]);
  }
}

function sampleQuadratic(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  into: Array<[number, number]>,
) {
  for (let i = 1; i <= 12; i++) {
    const t = i / 12;
    const u = 1 - t;
    into.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]);
  }
}

function sampleArc(
  from: [number, number],
  rx: number,
  ry: number,
  phiDeg: number,
  largeArc: number,
  sweep: number,
  to: [number, number],
  into: Array<[number, number]>,
) {
  if (rx === 0 || ry === 0) {
    into.push(to);
    return;
  }
  const phi = (phiDeg * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (from[0] - to[0]) / 2;
  const dy = (from[1] - to[1]) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  let rxAbs = Math.abs(rx);
  let ryAbs = Math.abs(ry);
  const lambda = (x1 * x1) / (rxAbs * rxAbs) + (y1 * y1) / (ryAbs * ryAbs);
  if (lambda > 1) {
    const scale = Math.sqrt(lambda);
    rxAbs *= scale;
    ryAbs *= scale;
  }
  const rx2 = rxAbs * rxAbs;
  const ry2 = ryAbs * ryAbs;
  const num = rx2 * ry2 - rx2 * y1 * y1 - ry2 * x1 * x1;
  const den = rx2 * y1 * y1 + ry2 * x1 * x1;
  let coeff = den === 0 ? 0 : Math.sqrt(Math.max(0, num / den));
  if (largeArc === sweep) coeff = -coeff;
  const cx1 = coeff * ((rxAbs * y1) / ryAbs);
  const cy1 = coeff * (-(ryAbs * x1) / rxAbs);
  const cx = cos * cx1 - sin * cy1 + (from[0] + to[0]) / 2;
  const cy = sin * cx1 + cos * cy1 + (from[1] + to[1]) / 2;
  const start = Math.atan2((y1 - cy1) / ryAbs, (x1 - cx1) / rxAbs);
  const end = Math.atan2((-y1 - cy1) / ryAbs, (-x1 - cx1) / rxAbs);
  let delta = end - start;
  if (sweep === 0 && delta > 0) delta -= 2 * Math.PI;
  if (sweep === 1 && delta < 0) delta += 2 * Math.PI;
  const steps = Math.max(12, Math.ceil(Math.abs(delta) / (Math.PI / 12)));
  for (let i = 1; i <= steps; i++) {
    const t = start + (delta * i) / steps;
    const x = rxAbs * Math.cos(t);
    const y = ryAbs * Math.sin(t);
    into.push([cos * x - sin * y + cx, sin * x + cos * y + cy]);
  }
}

export function pathBounds(d: string): Bounds {
  const reader = makeReader(d);
  const points: Array<[number, number]> = [];
  let cmd = "M";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let px = 0;
  let py = 0;
  let qx = 0;
  let qy = 0;

  while (!reader.done()) {
    const nextCmd = reader.peekCmd();
    if (nextCmd) cmd = reader.takeCmd()!;
    if (cmd === "Z" || cmd === "z") {
      x = sx;
      y = sy;
      points.push([x, y]);
      continue;
    }
    const rel = cmd === cmd.toLowerCase();
    const kind = cmd.toUpperCase();
    if (kind === "M" || kind === "L") {
      const nx = rel ? x + reader.takeNum() : reader.takeNum();
      const ny = rel ? y + reader.takeNum() : reader.takeNum();
      x = nx;
      y = ny;
      points.push([x, y]);
      if (kind === "M") {
        sx = x;
        sy = y;
        cmd = rel ? "l" : "L";
      }
      px = x;
      py = y;
      continue;
    }
    if (kind === "H") {
      x = rel ? x + reader.takeNum() : reader.takeNum();
      points.push([x, y]);
      continue;
    }
    if (kind === "V") {
      y = rel ? y + reader.takeNum() : reader.takeNum();
      points.push([x, y]);
      continue;
    }
    if (kind === "C") {
      const x1 = rel ? x + reader.takeNum() : reader.takeNum();
      const y1 = rel ? y + reader.takeNum() : reader.takeNum();
      const x2 = rel ? x + reader.takeNum() : reader.takeNum();
      const y2 = rel ? y + reader.takeNum() : reader.takeNum();
      const nx = rel ? x + reader.takeNum() : reader.takeNum();
      const ny = rel ? y + reader.takeNum() : reader.takeNum();
      sampleCubic([x, y], [x1, y1], [x2, y2], [nx, ny], points);
      px = x2;
      py = y2;
      x = nx;
      y = ny;
      continue;
    }
    if (kind === "S") {
      const x1 = 2 * x - px;
      const y1 = 2 * y - py;
      const x2 = rel ? x + reader.takeNum() : reader.takeNum();
      const y2 = rel ? y + reader.takeNum() : reader.takeNum();
      const nx = rel ? x + reader.takeNum() : reader.takeNum();
      const ny = rel ? y + reader.takeNum() : reader.takeNum();
      sampleCubic([x, y], [x1, y1], [x2, y2], [nx, ny], points);
      px = x2;
      py = y2;
      x = nx;
      y = ny;
      continue;
    }
    if (kind === "Q") {
      const x1 = rel ? x + reader.takeNum() : reader.takeNum();
      const y1 = rel ? y + reader.takeNum() : reader.takeNum();
      const nx = rel ? x + reader.takeNum() : reader.takeNum();
      const ny = rel ? y + reader.takeNum() : reader.takeNum();
      sampleQuadratic([x, y], [x1, y1], [nx, ny], points);
      qx = x1;
      qy = y1;
      px = x1;
      py = y1;
      x = nx;
      y = ny;
      continue;
    }
    if (kind === "T") {
      const x1 = 2 * x - qx;
      const y1 = 2 * y - qy;
      const nx = rel ? x + reader.takeNum() : reader.takeNum();
      const ny = rel ? y + reader.takeNum() : reader.takeNum();
      sampleQuadratic([x, y], [x1, y1], [nx, ny], points);
      qx = x1;
      qy = y1;
      x = nx;
      y = ny;
      continue;
    }
    if (kind === "A") {
      const rx = reader.takeNum();
      const ry = reader.takeNum();
      const phi = reader.takeNum();
      const large = reader.takeFlag();
      const sweep = reader.takeFlag();
      const nx = rel ? x + reader.takeNum() : reader.takeNum();
      const ny = rel ? y + reader.takeNum() : reader.takeNum();
      sampleArc([x, y], rx, ry, phi, large, sweep, [nx, ny], points);
      x = nx;
      y = ny;
      px = x;
      py = y;
    }
  }

  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [px, py] of points) {
    minX = Math.min(minX, px);
    minY = Math.min(minY, py);
    maxX = Math.max(maxX, px);
    maxY = Math.max(maxY, py);
  }
  return { minX, minY, maxX, maxY };
}

export function boundsForSvg(svg: Element): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const path of svg.querySelectorAll("path")) {
    const d = path.getAttribute("d") ?? "";
    if (!d) continue;
    const matrix = ancestorMatrix(path, svg);
    const local = pathBounds(d);
    const stroke = path.getAttribute("stroke");
    const painted = stroke && stroke !== "none";
    const strokeWidth = painted ? Number(path.getAttribute("stroke-width") ?? 1) : 0;
    const pad = strokeWidth / 2;
    const corners: Array<[number, number]> = [
      [local.minX - pad, local.minY - pad],
      [local.maxX + pad, local.minY - pad],
      [local.minX - pad, local.maxY + pad],
      [local.maxX + pad, local.maxY + pad],
    ];
    for (const [x, y] of corners) {
      const [tx, ty] = apply(matrix, x, y);
      minX = Math.min(minX, tx);
      minY = Math.min(minY, ty);
      maxX = Math.max(maxX, tx);
      maxY = Math.max(maxY, ty);
    }
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return { minX, minY, maxX, maxY };
}
