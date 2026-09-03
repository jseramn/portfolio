# Tinity

Tinity is an agentic systems engineering framework designed to build a harness-of-harnesses infrastructure for AI testing and evaluation. MIT license. The vision is not to replace or drive any other harness out of the market. Tinity exists to be a friend to all, to work alongside other harnesses and orchestrate them, putting advanced tools in creative developers' hands. Layer 8 will be agent-based.

- Version: 0.1.0
- Repository: https://github.com/jseramn/tinity
- License: MIT
- Production path: https://www.jseramn.tech/tinity/

## What runs today

| Slice | Status |
|-------|--------|
| Marketing landing (Vite React 19, lattice Stage) | shipped |
| cursor-gateway v0.1.0 (localhost OpenAI-compat wrap around cursor-agent) | shipped |
| Connector pattern library | shipped (library only, no live Slack) |
| OpenClaw ↔ Hermes contract | in design |
| Policy layer 2.1 (rules, SQLite audit, CLI) | next |
| Harness adoption over Slack | next |
| Layer 8 (runtimes, sandboxes, fleets) | later |

There is not yet an in-tree sandbox controller or fleet scheduler.

## Harnesses

17 harnesses on the landing. All status `idle` until a connector reports live.

| Label | Id | Status | URL |
|-------|----|--------|-----|
| Grok Bot | `grok-bot` | idle | https://x.ai/bot |
| OpenClaw | `openclaw` | idle | https://openclaw.ai |
| OpenHands | `openhands` | idle | https://openhands.dev |
| Cursor CLI | `cursor-cli` | idle | https://cursor.com/cli |
| Qwen Code | `qwen-code` | idle | https://qwen.ai/qwencode |
| Claude Code | `claude-code` | idle | https://claude.com/product/claude-code |
| Mastra Code | `mastra-code` | idle | https://mastra.ai |
| dcode | `dcode` | idle | https://www.langchain.com/dcode |
| Cline | `cline` | idle | https://cline.bot |
| Crush | `crush` | idle | https://github.com/charmbracelet/crush |
| Goose | `goose` | idle | https://block.github.io/goose |
| Aider | `aider` | idle | https://aider.chat |
| Grok Build | `grok-build` | idle | https://x.ai/build |
| Cursor | `cursor` | idle | https://cursor.com |
| Pi | `pi` | idle | https://pi.ai |
| Hermes | `hermes` | idle | https://hermes-agent.nousresearch.com |
| OpenCode | `opencode` | idle | https://opencode.ai |

## Agent files

- [llms.txt](./llms.txt)
- [index.md](./index.md) (this page)
- [changelog.md](./changelog.md)
- [design.md](./design.md)
- [README](https://github.com/jseramn/tinity/blob/main/README.md)
