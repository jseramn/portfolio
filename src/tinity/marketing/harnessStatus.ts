import type { HarnessStatus } from "../content/harnesses";

const STATUS_LABEL: Record<HarnessStatus, string> = {
  idle: "idle",
  configured: "configured",
  live: "live",
};

export function harnessStatusLabel(status: HarnessStatus): string {
  return STATUS_LABEL[status];
}

export function harnessTooltip(label: string, status: HarnessStatus): string {
  return `${label} — ${harnessStatusLabel(status)}`;
}
