export const FIELD_COLOR: [number, number, number] = [0.122, 0.859, 0.071];
export const FIELD_EDGE_COLOR: [number, number, number] = [0.45, 1, 0.55];

export const FIELD_OPTIONS = {
  shape: "square" as const,
  cellScale: 9,
  color: FIELD_COLOR,
  edgeColor: FIELD_EDGE_COLOR,
  clickRipples: false,
  lineWidth: 0.035,
  gridOpacity: 0.15,
  gridReveal: "both" as const,
  gridRevealStrength: 0.4,
  gridRevealRadius: 800,
  gridFade: 1,
  flowIntensity: 0.95,
  flowSpeed: 1.45,
  flashIntensity: 0.24,
  edgeGlow: 0,
  hoverGlow: 0.25,
  hoverRadius: 230,
  hoverCharge: 0.3,
  hideOnHover: false,
  rippleIntensity: 0.1,
  rippleSpeed: 0.75,
  rippleBlend: 1,
  refraction: 12,
  aberration: 2.1,
  haze: 0,
  pageReact: 1,
  tint: 0.28,
  reveal: 1,
  dim: 0.24,
  bloom: 0,
  grain: 0.14,
};

export const GLITCH_OPTIONS = {
  interval: 1_000_000,
};

export const GLITCH_BURST_MS = 400;

export const DECRYPT_OPTIONS = {
  color: "#1fdb12",
  background: "#050505",
};
