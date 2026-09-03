export const SLICE_STATUSES = ["shipped", "in-design", "next", "later"] as const;

export type SliceStatus = (typeof SLICE_STATUSES)[number];

export type Slice = {
  id: string;
  eyebrow: string;
  title: string;
  dek: string;
  status: SliceStatus;
};

export const SLICES: readonly Slice[] = [
  {
    id: "cursor-gateway",
    eyebrow: "SLICE 1",
    title: "cursor-gateway v0.1.0",
    dek: "Localhost OpenAI-compat wrap around the existing cursor-agent CLI on 127.0.0.1:4390. One job at a time. Never Fast.",
    status: "shipped",
  },
  {
    id: "connector",
    eyebrow: "SLICE 2.0",
    title: "Connector pattern",
    dek: "Typed Connector library so a harness can talk to Slack via OpenClaw. Tests use mocks. No live Slack.",
    status: "shipped",
  },
  {
    id: "openclaw-contract",
    eyebrow: "CONTRACT",
    title: "OpenClaw and Hermes",
    dek: "Directive and report schema between the policy layer and OpenClaw. Prose spec today. Types come next.",
    status: "in-design",
  },
  {
    id: "policy-21",
    eyebrow: "SLICE 2.1",
    title: "Policy layer",
    dek: "Rules, SQLite audit, and tinity policy inspect / simulate / replay. Directories exist. Runtime does not.",
    status: "next",
  },
  {
    id: "slack-adoption",
    eyebrow: "SLICE 2.2 / 3",
    title: "Harness adoption over Slack",
    dek: "Reserved channels (#tinity-ops, #tinity-audit, #tinity-jr, #tinity-escalation). The bus is not open yet.",
    status: "next",
  },
  {
    id: "layer-8",
    eyebrow: "LAYER 8",
    title: "Runtimes, sandboxes, fleets",
    dek: "Layer 8 will be agent-based. There is not yet an in-tree sandbox controller or fleet scheduler.",
    status: "later",
  },
];

export const SLICE_BADGE: Record<SliceStatus, string> = {
  shipped: "SHIPPED",
  "in-design": "IN DESIGN",
  next: "NEXT",
  later: "LATER",
};
