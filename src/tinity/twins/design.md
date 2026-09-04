# Tinity — DESIGN.md

Agent-readable design system.
Tinity is an engineering agentic system that studies, evaluates, designs, and implements infrastructure for AI harnesses.

Not a firm. Not a chatbot. The engineer that builds the harness.

Fused from:
- Vercel / Geist — grayscale precision, hairline structure, Geist pair, 4px grid
- Cursor — one scarce accent, calm light canvas, magazine display weight
- SpaceX — industrial labels, cinematic void, ghost outline, no chrome
- xAI / Grok — dark-first canvas, mono eyebrows, no shadows, weight-400 display

The only chromatic voltage is `#1fdb12`. Same hex in dark and light.

---

## 1. Visual Theme & Atmosphere

Dark-first infrastructure. Light is a second skin, not the origin.

Mood: live harness. Quiet chassis. One LED.

The interface should feel like a runtime rack:
- surfaces are graphite or paper
- type is engineered, not marketed
- the green is a status pin, not a brand wash

If you remove `#1fdb12`, the system must still hold.
If you flood `#1fdb12`, the system is broken.

No neon cyberpunk. No mesh gradients. No glass stacks. No second accent.

---

## 2. Color Palette & Roles

### Accent (invariant)

```
--accent:            #1fdb12
--accent-hover:      #18c20c
--accent-active:     #14a80a
--on-accent:         #061008
--accent-wash-dark:  rgba(31, 219, 18, 0.10)
--accent-wash-light: rgba(31, 219, 18, 0.12)
--accent-ring:       rgba(31, 219, 18, 0.45)
--accent-line:       #1fdb12
```

Rules for `#1fdb12`:
- Same hex in both themes. Do not lighten it for light mode. Do not desaturate it for dark mode.
- Never use as body text, captions, or muted copy. Contrast fails on white and fights on black at small sizes.
- Use as: primary fill, focus ring, live/online indicator, active tab tick, selection caret analog, chart series 1.
- On-accent text and icons are always `#061008`.
- Success state reuses `--accent`. Do not invent a second green.

### Dark (default)

```
--bg:              #050505
--bg-alt:          #0a0a0a
--surface:         #111111
--surface-2:       #171717
--text:            #f5f5f5
--text-muted:      #a3a3a3
--text-dim:        #737373
--border:          #262626
--border-strong:   #3f3f3f
--hairline:        rgba(255,255,255,0.08)
--inverse:         #fafafa
--on-inverse:      #0a0a0a
```

### Light

```
--bg:              #f7f7f4
--bg-alt:          #fafaf7
--surface:         #ffffff
--surface-2:       #efeee8
--text:            #171717
--text-muted:      #525252
--text-dim:        #737373
--border:          #e5e5e5
--border-strong:   #d4d4d4
--hairline:        rgba(0,0,0,0.08)
--inverse:         #0a0a0a
--on-inverse:      #fafafa
```

Light canvas is warm paper (Cursor), not sterile `#ffffff` page-bleed.
Ink is Vercel `#171717`, not pure black.

### Semantic (shared)

```
--danger:          #ee0000
--danger-wash:     rgba(238,0,0,0.12)
--warning:         #f5a623
--info:            #0a72ef
```

Info blue is utility only (links in docs, external refs). Never brand.

---

## 3. Typography Rules

Pair (Vercel + xAI):

- **UI / display / body:** `Geist Sans` (same face as `Geist` on jseramn.tech), fallback `ui-sans-serif, system-ui, sans-serif`
- **Code / labels / eyebrows / metrics:** `Geist Mono`, fallback `ui-monospace, SFMono-Regular, Menlo, monospace`

No serif. No third family. No italics except inline emphasis in prose.

Weights: 400 default. 500 UI. 600 max. Never 700+.

Display tracking (Vercel / xAI):
- 72–96px → letter-spacing `-0.04em` to `-0.05em`
- 32–48px → `-0.02em`
- ≤24px → `0`

SpaceX industrial voice lives only in mono eyebrows:
- 11–13px Geist Mono
- uppercase
- letter-spacing `0.08em` to `0.12em`
- color `--text-dim`
- example: `HARNESS / RUNTIME`

Scale (px): `11 / 12 / 13 / 14 / 16 / 18 / 20 / 24 / 32 / 40 / 48 / 64 / 80`

Roles:

| Role            | Size | Weight | Line | Face        |
|-----------------|------|--------|------|-------------|
| display         | 56–80| 400–500| 1.05 | Geist Sans  |
| h1              | 48–56| 500    | 1.10 | Geist Sans  |
| h2              | 40–48| 500    | 1.12 | Geist Sans  |
| body            | 16–18| 400    | 1.45–1.55 | Geist Sans  |
| ui              | 14–15| 400–500| 1.40 | Geist Sans  |
| caption         | 12–13| 400    | 1.40 | Geist Sans  |
| eyebrow         | 12   | 500    | 1.00 | Geist Mono  |
| code / metric   | 13–18| 400    | 1.45 | Geist Mono  |

Body line-height 1.55 marketing, 1.4 app.

---

## 4. Component Stylings

### Buttons

Primary
- fill `--accent` (`#1fdb12`)
- text `--on-accent` (`#061008`)
- radius `0`
- padding `8px 16px`
- weight 500
- hover `--accent-hover`
- no shadow
- no gradient

Secondary
- transparent
- radius `0`
- 1px `--border` on surface, `1px solid rgba(245,245,245,0.35)` on void hero
- text `--text`
- hover: occupancy-cube lift — `perspective(560px)` + `translateZ(18px)` + `scale(1.04)`, shadow `0 12px 32px rgba(0,0,0,0.55)`, 220ms `--ease`. Border → `--border-strong` (void hero → `--text`). No fill, no mint glow.

Danger
- fill `--danger`, text white, same radius

Never put `#1fdb12` outline + `#1fdb12` fill on the same row as two competing primaries. One primary per cluster.

### Cards / panels

- bg `--surface`
- 1px `--border` (Vercel shadow-as-border allowed: `box-shadow: 0 0 0 1px var(--border)`)
- radius `0` on `/tinity` chrome
- no rest drop shadow
- hover: same cube lift as buttons (Z + scale + elevation shadow). Border → `--border-strong`
- no inset accent tick on shipped cards

### Inputs

- 1px `--border-strong`, radius `0`, padding `8px 12px`
- focus: 2px ring `--accent-ring` + 1px border `--accent`
- placeholder `--text-dim`
- mono for IDs, hashes, cron, paths

### Nav / tabs

- hairline bottom
- active item: text `--text` + 2px `#1fdb12` underline or left pip
- inactive: `--text-muted`

### Tables

- hairline rows
- header Geist Mono 12px uppercase tracked
- numeric columns mono
- selected row wash `--accent-wash-*`

### Badges / status

- `LIVE` `RUNNING` `HEALTHY` → `#1fdb12` fill or 1px `#1fdb12` + wash
- label `--on-accent` if filled, `#1fdb12` if outline on dark
- `FAILED` uses danger. `IDLE` uses `--text-dim`

### Code blocks

- Geist Mono 13
- bg `--surface-2`
- 1px `--border`
- radius `0`
- syntax green for strings / success tokens may use `#1fdb12` sparingly

---

## 5. Layout Principles

- Base unit: `4px`
- Scale: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128`
- Marketing max width `1280px`
- App shell `1440px`
- Gutter `32px` desktop, `16px` mobile
- Section rhythm marketing: `96px`
- Dashboard density: tight, 12–16px stack

SpaceX contribution: heroes may go full-bleed void (`--bg`) with type sitting on empty canvas. No card wrapping the hero.

Cursor contribution: light pages keep cream field and generous air. Do not pack marketing like a terminal.

Vercel contribution: product UI is infrastructural. Every pixel earns.

---

## 6. Depth & Elevation

Flat system.

Allowed:
- 1px hairline
- 0 0 0 1px border-as-shadow
- popover only: `0 8px 24px rgba(0,0,0,0.28)` dark / `0 8px 24px rgba(0,0,0,0.08)` light + 1px border

Forbidden:
- colored glow under every card
- glassmorphism blur stacks
- multi-stop brand gradients
- inner neon spread on the whole page

The green may glow once: focus ring or a 4–8px soft halo on a live node in a topology view. Not on buttons.

---

## 7. Do's and Don'ts

**Do**
- Default to dark.
- Use `#1fdb12` as the only brand voltage.
- Set on-accent to `#061008`.
- Let Geist Mono carry harness language: runtime, cron, audit, sandbox, fleet.
- Prefer hairlines over shadows.
- Keep one primary action per view.
- Treat status LEDs as first-class UI.

**Don't**
- Recolor the accent per theme.
- Use `#1fdb12` for paragraphs or nav wordmarks at small size.
- Add gold, cyan, purple, or orange as brand.
- Use radius on `/tinity` chrome. LEDs, lockup tittles, and traffic dots stay circular.
- Use font-weight > 600.
- Imitate SpaceX photography-as-UI unless the surface is a cinematic landing.
- Write “firm”, “agency”, or SaaS hype in the product voice.

---

## 8. Responsive Behavior

- 768px: nav → icon + drawer. No bottom app bar unless mobile runtime console.
- Hero type: 80 → 48 → 36.
- Topology / fleet grids collapse to stacked live tiles.
- Tables → key-value below 640px.
- Keep the green pip visible at every breakpoint. Status must not disappear.

---

## 9. Motion

Vercel restraint + harness liveness.

- Duration: `120ms` ui, `180ms` panel, `220ms` chrome/cube hover, `280ms` route
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Prefer opacity + translateY(4px) for enter
- Chrome hover matches occupancy cubes: `perspective(var(--hover-perspective)) translateZ(var(--hover-lift)) scale(var(--hover-scale))` plus `--hover-shadow`. Hub SVG nodes scale the inner `.hub-node-lift` group to `1.12` so the node's `translate()` is not overwritten.
- Live nodes: opacity pulse 2s on the `#1fdb12` pip only
- No bounce. `prefers-reduced-motion` kills lift, scale, and traveling dots.

---

## 10. Voice (for UI copy)

Short. Exact. Engineering.

Tinity studies, evaluates, designs, and implements infrastructure for AI harnesses.

Preferred words: harness, runtime, sandbox, fleet, audit, schedule, isolate, persist.
Avoid: revolutionary, magical, copilot-for-X, all-in-one, firm.

Eyebrow pattern: `TIVITY / HARNESS` — wait, no. Product name is **Tinity**.
Eyebrow pattern: `TINITY / HARNESS`

---

## 11. Agent Prompt Guide

When generating UI for Tinity:

1. Read this file. Do not invent tokens.
2. Dark theme first. Light maps 1:1 with the same accent hex.
3. Geist Sans + Geist Mono only.
4. Primary fill is `#1fdb12`, label `#061008`.
5. Hairline structure. Square chrome (`radius: 0`). No card shadows at rest. Hover uses the occupancy-cube lift.
6. One green event per view unless it is a fleet of status pips.
7. Uppercase mono eyebrows for section labels.
8. Display tracking tight. Weight ≤ 600.

Reject: neon city, glassmorphism, second accent, Inter/Roboto as primary, purple AI clichés, rounded-2xl everywhere, green text on white body.

Bias: rack, LED, runtime, quiet luxury of infrastructure.

---

## 12. CSS starter

```css
:root {
  --accent: #1fdb12;
  --accent-hover: #18c20c;
  --on-accent: #061008;
  --bg: #050505;
  --bg-alt: #0a0a0a;
  --surface: #111111;
  --text: #f5f5f5;
  --text-muted: #a3a3a3;
  --border: #262626;
  --radius: 0;
  --font-sans: "Geist Sans", "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}

[data-theme="light"] {
  --bg: #f7f7f4;
  --bg-alt: #fafaf7;
  --surface: #ffffff;
  --text: #171717;
  --text-muted: #525252;
  --border: #e5e5e5;
}

html, body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
}
```

---

## Token dump (machine)

```json
{
  "name": "tinity",
  "accent": "#1fdb12",
  "onAccent": "#061008",
  "dark": {
    "bg": "#050505",
    "surface": "#111111",
    "text": "#f5f5f5",
    "border": "#262626"
  },
  "light": {
    "bg": "#f7f7f4",
    "surface": "#ffffff",
    "text": "#171717",
    "border": "#e5e5e5"
  },
  "fonts": {
    "sans": "Geist Sans",
    "mono": "Geist Mono"
  },
  "radius": { "control": "0", "panel": "0", "max": "0" },
  "space": [4, 8, 12, 16, 24, 32, 48, 64, 96]
}
```

---

## 13. Marketing IA (`/tinity`)

One page. No subpages. Hash sections. Windows via `?w=`. Agent surface via `?surface=agent`.

| Band | Role |
|------|------|
| Nav | 56px hairline. Lockup (24px mark + wordmark). HUMAN / AGENT. Ghost GitHub. Docs · soon. Under 768px: lockup + switch + menu dialog. |
| Hero | `100svh` grid `auto 1fr auto`. Stage fills the middle. Caption: eyebrow `TINITY / HARNESS`, H1 "A friend to all harnesses.", one-line dek, ghost GitHub + Docs. `tinity me` is the only accent action. |
| Status | `#status`. One-column right-aligned head: `RUNS ON v0.1.0` + `17 IDLE`, then 17 pips packed to the right. `idle` is grayscale. `live` may use the 4–8px green halo. |
| Hub | `#hub`. Split head (title left, dek right-aligned caption). Square sectional rack fills the inner width. Tinity LED at the shared origin, orthogonal traces. 17 bidirectional traffic dots. `prefers-reduced-motion` is static. Mobile: stacked tiles. |
| Slices | `#slices`. Six square `.panel` cells. No shipped tick. Badges: SHIPPED fill, IN DESIGN outline, NEXT/LATER dim. Square, not pills. |
| Changelog | `#changelog`. Three dated `.panel` cards. Full changelog opens a window. |
| Community | `#community`. GitHub, X, Slack coming. One Contribute ghost. |
| FAQ | `#faq`. Five `details[name=faq]`. No JS accordion. |
| Footer | Flow credits (not fixed). MIT + version. |

Marketing sections compose as `Section.Root / Inner / Header / Copy / Title / Dek`. Cards compose as `Panel` inside `PanelGrid`. Windows compose as `Window.Frame` + `Window.Docs` | `Window.Changelog`. Surfaces are explicit: `HumanSurface` vs `AgentSurface`.

Do not add an 8-item mega-nav. Do not wrap the hero in a card. Do not put a second primary next to `tinity me`. Card hover is the occupancy-cube lift, not border-only.

Windows: one native `<dialog>`, max 720px, radius 0, 1px border plus the single allowed popover shadow, 180ms opacity + `translateY(4px)`. Backdrop `rgba(5,5,5,0.6)`.

---

## 14. Agent surface contract

Same origin. Same URL.

- `?surface=agent` sets `data-surface="agent"`. Marketing spine unmounts. Markdown twin renders with Copy page.
- Twins: `/tinity/llms.txt`, `/tinity/index.md`, `/tinity/changelog.md`, `/tinity/design.md`.
- `<link rel="alternate" type="text/markdown">` on the HTML shell.
- `#tinity-state` JSON: version + harness count + status.
- JSON-LD `SoftwareSourceCode`.
- Stage Escape unflips only when no `dialog[open]`.

Present-tense claims are limited to shipped work: landing, cursor-gateway v0.1.0, connector library. Layer 8, eval, Slack bus, fleets, and sandboxes stay future tense.

Do not conflate the internal Hermes orchestrator with the Hermes Agent landing tile.

---

## 15. Skill precedence

Installed project skills (`.agents/skills/`): `frontend-design`, `web-design-guidelines`, `design-taste-frontend`, `impeccable`, `dashmotion`, `svg-animations`.

This file wins on conflict.

- No GSAP (or any motion library) unless a later change names it.
- No second accent from a skill palette.
- No em-dash rewrites of locked copy (`tinity me`, manifesto, DESIGN voice).
- Dashmotion tokens (`#020617`, JetBrains Mono) do not replace Geist or `#050505`.
- Taste-skill variance/motion/density dials: low variance, purposeful motion, medium density. Signature is the lattice Stage plus the hub, not a new art direction.
