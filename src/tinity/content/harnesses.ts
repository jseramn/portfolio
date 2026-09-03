import { AGENTS, type Agent } from "../experience/agents";

export type HarnessStatus = "idle" | "configured" | "live";

export type Harness = Agent & { status: HarnessStatus };

export const HARNESSES: readonly Harness[] = AGENTS.map((agent) => ({
  ...agent,
  status: "idle" as const,
}));

export const IDLE_COUNT = HARNESSES.filter((h) => h.status === "idle").length;
