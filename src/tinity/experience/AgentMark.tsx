import { agentById, type AgentId } from "./agents";
import aiderMark from "./marks/aider.png";
import claudeCodeMark from "./marks/claude-code.png";
import clineMark from "./marks/cline.png";
import crushMark from "./marks/crush.png";
import cursorMark from "./marks/cursor.png";
import cursorCliMark from "./marks/cursor-cli.png";
import dcodeMark from "./marks/dcode.png";
import gooseMark from "./marks/goose.png";
import grokBotMark from "./marks/grok-bot.png";
import grokBuildMark from "./marks/grok-build.png";
import hermesMark from "./marks/hermes.png";
import mastraCodeMark from "./marks/mastra-code.png";
import openclawMark from "./marks/openclaw.png";
import opencodeMark from "./marks/opencode.png";
import openhandsMark from "./marks/openhands.png";
import piMark from "./marks/pi.png";
import qwenCodeMark from "./marks/qwen-code.png";

type Raster = string | { readonly src: string };

function markUrl(asset: Raster): string {
  return typeof asset === "string" ? asset : asset.src;
}

const MARK_SRC: Record<AgentId, Raster> = {
  "grok-bot": grokBotMark,
  openclaw: openclawMark,
  openhands: openhandsMark,
  "cursor-cli": cursorCliMark,
  "qwen-code": qwenCodeMark,
  "claude-code": claudeCodeMark,
  "mastra-code": mastraCodeMark,
  dcode: dcodeMark,
  cline: clineMark,
  crush: crushMark,
  goose: gooseMark,
  aider: aiderMark,
  "grok-build": grokBuildMark,
  cursor: cursorMark,
  pi: piMark,
  hermes: hermesMark,
  opencode: opencodeMark,
};

type Props = {
  id: string;
};

export function AgentMark({ id }: Props) {
  const agent = agentById(id);
  if (!agent) return null;
  return (
    <a
      className="cube-mark-link"
      href={agent.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        className="cube-mark"
        data-mark={agent.id}
        src={markUrl(MARK_SRC[agent.id])}
        alt={agent.label}
        draggable={false}
      />
    </a>
  );
}
