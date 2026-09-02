export const AGENTS = [
  { id: "grok-bot", label: "Grok Bot", href: "https://x.ai/bot" },
  { id: "openclaw", label: "OpenClaw", href: "https://openclaw.ai" },
  { id: "openhands", label: "OpenHands", href: "https://openhands.dev" },
  { id: "cursor-cli", label: "Cursor CLI", href: "https://cursor.com/cli" },
  { id: "qwen-code", label: "Qwen Code", href: "https://qwen.ai/qwencode" },
  { id: "claude-code", label: "Claude Code", href: "https://claude.com/product/claude-code" },
  { id: "mastra-code", label: "Mastra Code", href: "https://mastra.ai" },
  { id: "dcode", label: "dcode", href: "https://www.langchain.com/dcode" },
  { id: "cline", label: "Cline", href: "https://cline.bot" },
  { id: "crush", label: "Crush", href: "https://github.com/charmbracelet/crush" },
  { id: "goose", label: "Goose", href: "https://block.github.io/goose" },
  { id: "aider", label: "Aider", href: "https://aider.chat" },
  { id: "grok-build", label: "Grok Build", href: "https://x.ai/build" },
  { id: "cursor", label: "Cursor", href: "https://cursor.com" },
  { id: "pi", label: "Pi", href: "https://pi.ai" },
  { id: "hermes", label: "Hermes", href: "https://hermes-agent.nousresearch.com" },
  { id: "opencode", label: "OpenCode", href: "https://opencode.ai" },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];
export type Agent = (typeof AGENTS)[number];

export const AGENT_COUNT = AGENTS.length;

export function agentById(id: string): Agent | undefined {
  return AGENTS.find((agent) => agent.id === id);
}
