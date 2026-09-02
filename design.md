# jseramn.tech design system

Authoritative design, UX, and agentic contract for implementation units and review.
Extracted facts cite `file:line` or report IDs (`A-##`, `B-##`, `C-##`, `D-##`). Rules that are not yet in code are labelled **Proposed**.

**How to use:** match tokens and invariants first, then layout/motion/a11y, then the DoD recipes. Do not restyle frozen tokens to “fix” contrast; fix stacking and size.

## 1. Purpose and principles

| Principle | Rule |
|-----------|------|
| Vesper terminal | Full-viewport white ASCII portrait on black; glass HUD chrome; Geist / Geist Mono. The portrait is the hero. Chrome is glass, not a second hero. |
| Black until glyphs | First paint is `#000`. Boot overlay exists only on `/` until ASCII paints or fallback signals ready (`src/pages/index.astro:12–27`, `src/lib/bootLoader.ts:1–6`). |
| ASCII is the identity | Hidden 480p sampler drives glyphs. No visible video pixels. No colourful still (`portrait.jpg` / ascii-poster). |
| Chrome is glass | Exactly six `GlassSurface` wraps (5 hero + 1 modal). Live liquid glass only on Chromium desktop + fine pointer. |
| Agent-first | Every human HTML surface has a machine-readable twin (`Accept: text/markdown`, `/llms.txt`). |
| Performance is a constraint | Budgets in §7 bind layout and motion. JS/TBT overruns are design failures, not polish debt. |
| Accessibility is not optional | Contrast, 44×44 targets, keyboard, landmarks, and reduced-motion fallback are ship gates. |

Supersedes outdated OpenSpec fallback `portrait.jpg` (`openspec/specs/hero-ascii-background/spec.md`). Current lock: invariant 3.

## 2. Identity tokens (extracted from code, not invented)

### Palette

| Token | Hex / value | Source | Status |
|-------|-------------|--------|--------|
| `vesper.bg` / `--vesper-bg` | `#0A0B12` | `tailwind.config.ts:52`, `globals.css:24` | Adjustable (non-hero) |
| `vesper.elevated` / `--vesper-bg-elevated` | `#1C1F2E` | `tailwind.config.ts:53`, `globals.css:25` | Adjustable |
| `vesper.accent` / `--vesper-accent` | `#00F0FF` | `tailwind.config.ts:54`, `globals.css:26` | Adjustable off-hero; secondary pages use this ink |
| `vesper.purple` | `#B026FF` | `tailwind.config.ts:55`, `globals.css:27` | Adjustable; unused on hero chrome |
| `vesper.pink` / `--vesper-pink` | `#FF2A9E` | `tailwind.config.ts:56`, `globals.css:28` | Modal CTA / errors |
| `--hero-ink` | `#E8E4D9` | `globals.css:30` | **FROZEN** |
| `--hero-ink-hover` | `#FAF8F3` | `globals.css:31` | **FROZEN** |
| Page / ASCII paper | `#000` | `globals.css:39`, `globals.css:116` | **FROZEN** as first-paint field |
| Theme color | `#000000` | `Layout.astro:74` | Keep |

Hero scrims (**FROZEN colours**; stacking may change, §3):

| Scrim | Geometry | Gradient | Source |
|-------|----------|----------|--------|
| `.hero-scrim-top` | `height: 28vh` | `to bottom`, `color-mix(in srgb, #000 72%, transparent)` → transparent | `globals.css:169–176` |
| `.hero-scrim-bottom` | `height: 36vh` | `to top`, same 72% mix | `globals.css:178–185` |
| `.hero-scrim-social` | full width | dual `to right` / `to left`, `#000 68%` over 16% | `globals.css:188–201` |

Resting on-video treatment `.hero-on-video`: `color: var(--hero-ink)` plus `text-shadow: 0 1px 2px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.7)` (`globals.css:204–209`). `.hero-ink-muted` is `color-mix(in srgb, var(--hero-ink) 50%, transparent)` (`globals.css:215–217`). Bone vs white glyphs is **1.27:1** (C-04); do not retint ink — raise scrims.

`--radius` is named in `tailwind.config.ts:60–62` and **has no `:root` value** in `globals.css`. Hero chrome does not use it. Do not invent a number.

### Typography

| Face | Weights | Display | Source |
|------|---------|---------|--------|
| Geist | 100–900 variable | `swap`, preloaded on every page | `globals.css:1–7`, `Layout.astro:53–60` |
| Geist Mono | 100–900 variable | `optional` | `globals.css:9–15` |
| CSS vars | `--font-geist-sans`, `--font-geist-mono` | Tailwind `font-sans` / `font-mono` | `globals.css:22–23`, `tailwind.config.ts:64–67` |

Scale **actually used** (Tailwind defaults: xs 12 / sm 14 / base 16 / xl 20 / 2xl 24 / 3xl 30):

| Surface | Spec | Source | Status |
|---------|------|--------|--------|
| Marquee | `font-mono text-xs md:text-base` (12 / 16) | `Hero.tsx:417` | Adjustable. **Proposed:** ≥14 px (`text-sm`) on all breakpoints (C-01) |
| Now-playing | `font-mono text-xs md:text-sm` (12 / 14) | `Hero.tsx:464` | Adjustable |
| Roles / hire | `font-sans text-2xl md:text-3xl font-semibold tracking-tight` | `Hero.tsx:537` | **FROZEN** hero typography |
| Tagline | `font-sans text-base md:text-xl font-normal leading-relaxed` | `Hero.tsx:558` | **FROZEN** hero typography |
| Boot “Loading...” | 30px bold monospace | `globals.css:353–357` | Home only |
| Legal h1 | `font-sans text-3xl font-semibold tracking-tight` | `LegalDocument.astro:24` | Adjustable |
| Last updated | `font-mono text-xs text-vesper-accent/50` | `LegalDocument.astro:27` | Contrast fail **3.99:1** (B-12). **Proposed:** ≥4.5:1 |
| Legal body | `font-sans text-sm leading-relaxed text-vesper-accent/85` | `LegalDocument.astro:28` | Adjustable |
| Modal meta | `font-mono text-xs` / `text-[11px] tracking-wide` | `ContactModal.tsx:273–314` | Adjustable |
| Modal fields | `font-mono text-sm` | `ContactModal.tsx:42` | Adjustable |

Hover glow duration 300 ms (`Hero.tsx:36`). Letter-spacing: `tracking-tight` on hire + legal h1; `tracking-wide` on modal channel line.

### Spacing, radius, blur, shadow

| Token | Value | Source |
|-------|-------|--------|
| Home lock | `h-dvh max-h-dvh`; CSS `[data-hero-root]` `height/max-height: 100dvh` | `Hero.tsx:394`, `globals.css:43–47`, `viewportLock.test.ts:9–14` |
| Safe area | `pt-[max(1.25rem,env(safe-area-inset-top))]`, `pb-[max(1.5rem,env(safe-area-inset-bottom))]` | `Hero.tsx:414,504` |
| Mobile pad / gaps | `px-4` (16), `gap-2` (8), `gap-3` (12) | `Hero.tsx:414,504` |
| Desktop HUD inset | `pt-8`, `left-8`/`right-8`, `top-24`, `px-16`, `pb-12` | `Hero.tsx:414,462,505,529` |
| Marquee slider gap | `32` px; speed `50` / hover `20` | `Hero.tsx:416` |
| Social gap | `gap-4 md:gap-5` | `Hero.tsx:507` |
| Scrollbar | 8×8, thumb `#00f0ff33` / hover `#00f0ff66`, radius 2 | `globals.css:49–65` |
| Fallback frost card | `blur(4px) saturate(1)` plus `rgba(0,0,0,0.72)` `::after` veil | `globals.css` `.glass-fallback-card` |
| Fallback frost button | `blur(7px) saturate(1)` plus the same `::after` veil | `globals.css` `.glass-fallback-button` |
| Live frost CSS var | `--glass-frost = 4 + blurAmount * 32` (card family 4px, button family 7.2px) | `GlassSurface.tsx:269` |
| Refraction filter | `blur(var(--glass-frost, 4px)) brightness(2.6) contrast(1.45)` | `globals.css:233,309` |
| Glass settle | 220 ms, ease `1 - (1 - t)^3` | `Hero.tsx:307–308` |
| Modal overlay | `bg-black/75 backdrop-blur-[2px]` | `ContactModal.tsx:242` |
| Modal panel | `bg-black/25`, radius 15, cyan inset glow | `ContactModal.tsx:251` |

### Glass presets (`PRESETS`)

| Preset | padding | radius | elasticity | displacement | blurAmount | saturation | aberration | Family |
|--------|---------|--------|------------|--------------|------------|------------|------------|--------|
| `bar` | `8px 12px` | 15 | 0.75 | 88 | 0 | 100 | 3 | card |
| `pill` | `6px 10px` | 999 | 0.05 | 0 | 0.1 | 100 | 20 | button |
| `dock` | `8px` | 999 | 0.05 | 0 | 0.1 | 100 | 20 | button |
| `button` | `4px 8px` | 10 | 0.05 | 0 | 0.1 | 100 | 20 | button |
| `card` | `12px 16px` | 15 | 0.75 | 88 | 0 | 100 | 3 | card |
| `modal` | `0` | 15 | 0.75 | 88 | 0 | 100 | 3 | card |

Source: `GlassSurface.tsx:17–90`. Optical knobs are the shipped recipe (openspec hero-liquid-glass). Padding/radius are chrome geometry. `bar` and `modal` stretch to 100% width (`GlassSurface.tsx:92,472–473`). Hosts use `overflow: hidden` (`globals.css:262–264`) which **clips** hire text under live glass (C-01). **Proposed:** size hosts to content; do not clip labels.

Live engine gate (`shouldUseLiquidGlass.ts:11–26` + `pointer.ts:1–9`): Chromium desktop, fine pointer, not Firefox/FxiOS/CriOS/Safari, not reduced-motion. Headless Chromium is `pointer: fine`, so width≤430 screenshots can show live glass; real phones match coarse fallback (`C-report` layout rule, `/tmp/swarm/ui/home-390x844-pointer-coarse.png`).

### Iconography (14 lucide icons)

Github, Twitter, Linkedin, Instagram, Mail, Volume2, VolumeX, SkipBack, SkipForward, Shuffle, X, Copy, Check, ExternalLink (`A-report` metrics; `Hero.tsx:2–13`, `ContactModal.tsx:3`).

Sizes in use: music 16–18 px (`Hero.tsx:487–496`), socials 24 / md 26 (`Hero.tsx:522`), modal close 20 (`ContactModal.tsx:264`). All below 44×44 except some marquee links’ width (C-01).

### Z-index layers

| Layer | Current z | Source | Status |
|-------|-----------|--------|--------|
| ASCII host | `0` | `globals.css:114` | Keep below chrome |
| Glyph canvas | `1` | `globals.css:151`, `Hero.tsx:399` | Keep |
| Zone scrims | `2` | `Hero.tsx` (`z-[2]`), `globals.css` `.hero-scrim-*` | Above canvas, below HUD. `pointer-events: none`. Not sampled by glass (`data-glass-gen` is the ASCII canvas only). |
| HUD chrome | `z-10` | `Hero.tsx:394,414,504` | Keep |
| Contact overlay | `z-50` | `ContactModal.tsx:232` | Keep |
| Boot loader | `9999` | `globals.css:342` | Home only |

**FROZEN:** hero typography (roles + tagline + `.hero-on-video`), scrim colours, `--hero-ink*`. **Adjustable:** layout, stacking, tap targets, marquee size, secondary IA, modal a11y, legal contrast.

## 3. Layout and responsive rules

Home is a locked HUD over a full-viewport ASCII field. Four-corner chrome uses the `hud:` variant: **`(min-width: 768px) and (min-height: 700px)`**. Compact chrome uses `short:`: **`height < 500px`, or width ≥ 768px with height < 700px**. Width-only `md:` remains for type scale, not HUD placement. 844×390 previously used the desktop four-corner HUD and TextLoop fragments overlapped (`/tmp/swarm/ui/home-844x390.png`).

### Regions

| Region | Current placement | Glass preset |
|--------|-------------------|--------------|
| Marquee | Top; full width | `bar` |
| Now-playing + transport | Below marquee on mobile; `md:right-8 md:top-24` | `pill` |
| Socials | Above hire on mobile; `md:left-8 md:top-24` | `dock` |
| Roles + hire CTA | Bottom-left cluster | `button` |
| Tagline | Bottom; `md:text-right md:max-w-md` | `card` |
| Identity wordmark | **Absent** as a dedicated mark (name lives in marquee + sr-only `h1`) | — |
| Secondary nav | **Absent** (no chrome path to `/about`, `/contact`) | — |

### Breakpoints

**(a) Portrait phones, width < 768px** — keep the column HUD (`/tmp/swarm/ui/home-390x844-pointer-coarse.png`).

```
+---------------------------+
| [======= marquee =======] |
| [ now-playing | ctrls   ] |
|                           |
|        ASCII bust         |
|                           |
|     [ socials dock ]      |
|  roles CTA                |
|  [ tagline card         ] |
|  jseramn · about · contact|  Proposed
+---------------------------+
```

**(b) Short viewports, height < 500px (e.g. 844×390)** — **Proposed:** do **not** use the desktop four-corner HUD even if width ≥ 768. Stack compact chrome or a single bottom dock; never overlap TextLoop lines inside `overflow-hidden`.

```
+------------------------------------------+
| [marquee                                 ] |
| ASCII (full bleed)                         |
| [play][socials][roles][tagline][nav] dock  |
+------------------------------------------+
```

**(c) Tablets/desktop, width ≥ 768 **and** height ≥ 700** — four-corner HUD is allowed (`/tmp/swarm/ui/home-1920x1080.png`) after CTA min-width and tap padding.

```
+----------------------------------------------+
| [============== marquee ===================] |
| [socials]                      [now-playing] |
|                                              |
|                 ASCII bust                   |
|                                              |
| [roles CTA]                    [tagline    ] |
| jseramn · about · contact          Proposed  |
+----------------------------------------------+
```

**(d) Ultra-wide** — same HUD as (c). Do not stretch chrome with the viewport. Tagline stays `md:max-w-md` (`Hero.tsx:558`). ASCII remains `inset: 0`.

**(e) Width ≥ 768 and 500 ≤ height < 700** — same compact chrome as (b), never four-corner. The four-corner HUD requires both `min-width: 768px` and `min-height: 700px` (`hud:`). This closes the gap left unspecified in R-U00-02.

### Rules

| Rule | Current | Proposed |
|------|---------|----------|
| `min(100dvh)` lock | `h-dvh max-h-dvh` + `lockScroll` → `h-dvh overflow-hidden overscroll-none` on `html`/`body` (`Layout.astro:24`, `index.astro:12`) | Keep. Gate **desktop absolute chrome** on `min-height` as well as `md` (C-02) |
| `env(safe-area-inset-*)` | Home top/bottom only | Add to `LegalDocument` padding (C-report secondary pages) |
| CTA min-width | Hire box 86×32 at 390; 32×36 at 1920 live glass; label `web development` (`site.ts:9`, metrics `hireOverflow`) | Min-width ≥ longest role **“web development”**; host must not clip |
| Tap targets | Music 16×16, socials 24×24, hire h=32, modal Close 20×20, 404 links ~8×18 (C-01, `/tmp/swarm/ui/metrics.json`) | ≥44×44 px, ≥8 px gaps |
| Marquee type | 12 px mobile | ≥14 px; pause ticker on pointer/focus, not hover-only (`InfiniteSlider.tsx:68–77`) |
| Overflow | `[data-glass-host]{overflow:hidden}` and stretch pane `overflow-hidden` | No `overflow: hidden` clipping of text |
| Glass host size | `bar`/`modal` 100% width; others hug | Hug content for hire/pill/dock; bar may stay full width |
| Identity mark | Only marquee “Hi, I am {name}” | Visible `jseramn` wordmark, Geist Mono, `--hero-ink` (layout, not a restyle) |
| Secondary nav | None | Visible links to `/about` and `/contact` on home; legal footer row on secondary pages (`/policy`, `/terms`, `/data-deletion`) |

## 4. Motion

Shared **12 fps** budget: ASCII `ASCII_FPS = 12` (`heroAsciiBudget.ts:1–2`); glass pump `GLASS_MS = 1000 / 12` (`GlassSurface.tsx:145`). Warmup: 1 fps for 4 s then 12 fps (`heroAsciiBudget.ts:9–10`). Stamp slices 8 ms (`heroAsciiBudget.ts:11`). Raster skip if last pass > 50 ms (`heroAsciiBudget.ts:7`). Pause ASCII + glass while the contact modal is open or the document is hidden.

| Motion | Allowed | Source |
|--------|---------|--------|
| TextLoop | interval 2.5 s, transition 0.4 s, `y: 20` default variants | `Hero.tsx:541–543`, `TextLoop.tsx:41–45` |
| Scramble | 30 ms ticks; **hover-only** (`autoStart` default false) | `Hero.tsx:46–88,559–560` |
| Marquee | linear loop; speed 50, hover 20 | `Hero.tsx:416`, `InfiniteSlider.tsx:44–47` |
| Glow | `glow-pulse` 2 s ease-in-out; hover 300 ms | `globals.css:96–107`, `Hero.tsx:36,471` |
| Sound bars | 1.2 s ease-in-out infinite | `globals.css:90–93` |
| Glass settle | 220 ms cubic | `Hero.tsx:307` |
| Modal overlay | 0.2 s opacity | `ContactModal.tsx:237` |
| Modal panel | 0.25 s, ease `[0.22, 1, 0.36, 1]` | `ContactModal.tsx:255` |
| Boot wipe | `l21` 2 s linear; **off** under reduced-motion | `globals.css:372–382` |

**Reduced-motion / no-WebGL:** live glass off (`shouldUseLiquidGlass.ts:18`); ASCII phase `"photo"` is an **empty black** host today (`HeroAsciiBackground.tsx:19–23,65–72`; `/tmp/swarm/ui/home-390x844-reduced-motion.png`). **Proposed:** static monochrome ASCII frame (white glyphs on black) generated from the sampler’s first frame as text/SVG — never a colourful still. Stop TextLoop, InfiniteSlider, scramble, sound-bars, and glow-pulse (C-report reduced-motion unit). Modal enter may snap.

## 5. Accessibility

| Rule | Current | Required / Proposed |
|------|---------|---------------------|
| Text contrast on glyphs | Zone scrims at `z-index: 2` (above canvas `1`, below HUD `10`). Fallback card/button frost adds a `rgba(0,0,0,0.72)` veil so bone ink stays ≥4.5:1 over white glyphs. Ink and scrim colours unchanged. | Do not retint `--hero-ink*` or scrim colours |
| Legal “Last updated” | `#007880` on `#000` **3.99:1**, 12 px (B-12) | ≥4.5:1 |
| Focus-visible | Hire CTA only: 2px outline, offset 4, `--hero-ink` (`Hero.tsx:537`) | Same token on every interactive chrome control |
| Skip link | Absent | **Proposed:** skip to `#main` / first chrome landmark |
| `main` landmark | `class="contents"` (`index.astro:28`) | **Proposed:** `main` must be a real box if `display: contents` drops the landmark |
| Boot live region | `role="status" aria-live="polite"` (`index.astro:21–24`) | Keep; dismiss sets `aria-hidden` (`bootLoader.ts:30–37`) |
| Now-playing | Playing title is a YouTube `<a>`; idle is a `<button>` | Name the control; **Proposed:** `aria-live` when track changes |
| Hire naming | Visible roles `aria-hidden`; button `aria-label="Open contact form — current role: …"` (`Hero.tsx:538–540`) | Keep an accessible name that says hire/contact, not only the looping title |
| Modal keyboard | Escape dismisses. Focus trap on `[role="dialog"]`, Name autofocus after open, Close ≥44×44 (48 CSS px under live glass), return focus to hire | Shipped: trap, Name autofocus, return focus to hire, Close ≥44×44 |
| Language | `html lang="en"` (`Layout.astro:37`). Hero tagline is EN (`Hero.tsx:33`). Modal encryption note is English (`ContactModal.tsx`, “Encrypted in your browser”) | UI copy English. Spanish tagline (`site.ts:7`) is the **alternate string only** (markdown/agents), not a second locale. No `hreflang` without `/es` (D-12) |
| Forced-colors | Not specified | Must not gate ship (openspec hero-on-video-contrast) |

### Keyboard map

| Order | Surface | Target | Keys / notes |
|------|---------|--------|----------------|
| 1 | Home chrome | Skip link | Proposed; not shipped on this branch |
| 2 | HUD | Marquee links | Org and last-commit anchors in the ticker |
| 3 | HUD | Now-playing / transport | Listen CTA or track title, then previous, mute, next, shuffle |
| 4 | HUD | Socials | Profile and mailto icons. Secondary nav is Proposed |
| 5 | HUD | Hire CTA | Enter opens the dialog. Tagline is not a link |
| 6 | Dialog | Name | Autofocus after the 0.25 s panel transition |
| 7 | Dialog | Email → Subject → Message → Turnstile → Encrypt and send → Close | Age/typage notes stay tabbable. Tab wraps inside `[role="dialog"]` |
| 8 | Dialog | Escape, Close, Done | Closes and returns focus to the hire CTA |

## 6. Components and states

Shared chrome states unless noted: **idle** bone ink + resting shadow; **hover** `--hero-ink-hover` + 300 ms glow (`Hero.tsx:36`); **focus** 2px `--hero-ink` outline (Proposed on all); **active** press; **disabled** `opacity-50` (modal submit); **loading** boot overlay / encrypting; **error** `text-vesper-pink` + `role="alert"`.

### HUD marquee

Purpose: identity + orgs + GitHub stats ticker. Anatomy: `GlassSurface bar` > `InfiniteSlider` of mono spans/links (`Hero.tsx:415–460`). States: idle scroll; hover slows (desktop only); **Proposed:** pause on pointer/focus. Stats omit until `/api/github-stats` resolves (`Hero.tsx:91–109`). Responsive: full width; **Proposed** `text-sm`.

### Now-playing / music

Purpose: YouTube audio, no visible video (`#yt-player` clipped, `globals.css:132–142`). Anatomy: title or “click to listen”, sound-bars, prev / mute / next / shuffle. Idle: muted CTA, `VolumeX`. Playing: unmute, volume **100** on `onReady` (`Hero.tsx:157–159`) — **Proposed:** no volume jump; do not jump to 100 with no visible now-playing until actually playing (C-05). **Error (Proposed):** when `iframe_api` / CSP / offline blocks YT, surface failure; do not look like playing. YouTube loads on gesture only (`Hero.tsx:210–213`). Responsive: `max-w-[60vw]` ellipsis on the title (`Hero.tsx:470`).

### Socials dock

Purpose: outbound profiles + mailto (`site.ts:24–30`). Anatomy: five 24 px icons, `aria-label={id}`. States: idle/hover/focus. **Proposed:** 44×44 hit boxes, ≥8 px gaps. `md:` left column on tall desktop.

### Roles / hire CTA

Purpose: open encrypted contact with current role context. Anatomy: `GlassSurface button` wrapping `TextLoop` of `site.roles`. States: looping unless modal `paused` (`Hero.tsx:545`); hover underline bone/50. Responsive: `md:w-[30%]` clips under live glass (C-01). **Proposed:** min-width of “web development”.

### Tagline card

Purpose: LCP node (`B-report`: `p.hero-on-video`). Anatomy: `GlassSurface card` + stable SSR text; scramble on hover only. Must not remount when live glass starts (openspec). Responsive: left on mobile, right + `max-w-md` on desktop.

### Identity wordmark (**Proposed**)

Purpose: visible `jseramn` in Geist Mono + `--hero-ink`. Not a restyle of ASCII. Place with secondary nav; do not cover the bust.

### Secondary nav (**Proposed**)

Purpose: human path to `/about` and `/contact`. Compact text links, ≥44×44, bone ink. Secondary pages: footer row with `/policy`, `/terms`, `/data-deletion` plus `← jseramn` back control (`LegalDocument.astro:18–23` already has the back link; 404 does not).

### ContactModal

Purpose: age-encrypt then POST `/api/contact` (production POST is **404 HTML**, D-01; agents use mailto). Anatomy: overlay, `GlassSurface modal`, fields Name / Email / Subject / Message, honeypot `company` (`ContactModal.tsx:338–345`), Turnstile slot when `PUBLIC_TURNSTILE_SITE_KEY` (`TurnstileField.tsx:3–6`), Encrypt and send. Overlay `bg-black/75` + `backdrop-blur-[2px]` is locked (openspec).

| State | Behaviour |
|-------|-----------|
| Idle | EN field labels; English encryption note (typage + ciphertext relay + X/Instagram DM). Close ≥44×44 |
| Busy | `Encrypting & sending…`, fields disabled |
| Success | Envelope ID + passphrase copy; DM key via X/Instagram (`site.ts:79–82`) |
| Error | Generic pink alert; Turnstile remounts (`ContactModal.tsx:220`) |
| Fallback | Armored ciphertext + mailto if send fails after encrypt (`ContactModal.tsx:202–211`) |
| Keyboard | Trap Tab inside the dialog; Name autofocus; Escape / Close / Done return focus to hire; Close ≥44×44 |

### LegalDocument

Purpose: about/contact/policy/terms/data-deletion. Anatomy: `max-w-2xl` column, back link, h1, last-updated, `text-sm` body (`LegalDocument.astro:16–30`). **Proposed:** last-updated ≥4.5:1; `env(safe-area-inset-*)`; footer legal row; linkify about/contact URLs in copy (C-report).

### 404

Purpose: recovery. Anatomy: h1, body, bulleted `RECOVERY_PATHS` (`markdown.ts:3–10`, `404.astro:16–24`). No back control. **Proposed:** `← jseramn`; recovery rows ≥44 px; include `/terms` `/data-deletion`.

## 7. Performance budget (design constraint)

Home `/` lab targets from `B-report` budget (production HEAD `8f9a743`; mobile median n=3: P97, LCP 932 ms, TBT 209 ms, CLS 0, JS 258 KiB, total 506–624 KB):

| Metric | Budget | Current (B) |
|--------|--------|-------------|
| JS compressed in LH window | **≤ 150 KB** | 258 KB mobile / 296 KB desktop |
| LCP mobile | **≤ 1.5 s** | 0.93 s — hold (tagline, not canvas) |
| TBT mobile | **≤ 100 ms** | 209 ms median |
| CLS | **0** | 0 |
| INP | **≤ 200 ms** | no CrUX; lab max-potential-FID 364 ms |
| Total transfer mobile | **≤ 350 KB** | 506–624 KB; video Range is the swing |

### Load order

| When | What | Source |
|------|------|--------|
| Before first paint | Black field, inlined CSS, Geist preload (`swap`), SSR tagline, boot overlay on `/` | `Layout.astro:53–61`, `index.astro:12–27` |
| `client:load` chrome only | Hero island (hire + tagline + marquee). Must **not** start YouTube, live LiquidGlass, ASCII three/video, or ContactModal/`age-encryption` | openspec site-performance |
| After first paint / idle | ASCII Three: `HeroAsciiBackground` waits double-rAF then `requestIdleCallback` (1.5 s timeout, or `setTimeout(0)` if rIC is missing) before `mountHeroAscii` / `import("three")`. Startup yields between renderer, scene, first `readPixels`, `prepareCellGlyphs`, and the first glyph stamp. Boot overlay dismisses on the first glyph slice (`data-ascii-paint` + `hero:boot-ready`), not the finished first frame. Live glass after `requestIdleCallback` 2 s (`GlassSurface.tsx:297–304`) | |
| Gesture | YouTube `iframe_api` | `Hero.tsx:170–173` |
| Hire click | ContactModal + `age-encryption` | `Hero.tsx:570–578` |
| 6 s | PostHog `setTimeout(arm, 6000)` — **never** `requestIdleCallback` | `posthog.astro:27`, invariant 6 |

**Video:** element `VIDEO_PRELOAD = "none"` (`heroAsciiBudget.ts:8`). Document `<link rel="preload" as="video">` still exists (`index.astro:13–18`) and pulls ~188–294 KiB Range (B-02). **Owner decision:** remove that preload link; keep element `preload="none"`; no colourful poster.

## 8. Agentic surface contract

Is Agentic already **100/100** (D-report, 2026-09-02). Remaining work is off-scoreboard.

| Topic | Current | Contract |
|-------|---------|----------|
| Markdown | SSR `/` `/about` `/contact` 404: `text/markdown; charset=utf-8`, `Vary: Accept, Accept-Encoding` (`accept.ts:1–5`, `middleware.ts:21–23`) | Same on **legal** pages. Today `/policy` `/terms` `/data-deletion` ignore Accept (HTML CDN HIT, D-03). **Owner:** `prerender = false` on legal |
| 406 | No produced type → 406 `text/plain`, `no-store` (`middleware.ts:40–48`) | Keep. Generic `application/json` stays 406 (D-08) |
| `Vary` | `Accept, Accept-Encoding` on negotiated responses | Keep. Do not attach `Vary: Accept` to hashed `/_astro` (B-05) |
| `llms.txt` | Prose H2s, not v2 file lists (D-04) | v2 outline below |
| `llms-full.txt` | 404 (D-07) | Build-time concatenation of page markdown, under 50 kB |
| Discovery | oEmbed `rel=alternate` only (`Layout.astro:63–67`) | Add `rel=describedby` → `/llms.txt` and `rel=alternate` `type="text/markdown"` on the canonical URL (negotiation, not `.md` twins; tests ban twins) |
| JSON-LD | Same ProfilePage graph on every Layout page (`jsonld.ts:8–62`) | ProfilePage **only** on `/`. WebPage elsewhere. Add `ContactAction` `mailto:contacto@jseramn.tech`, `givenName`/`familyName`, `knowsLanguage: ["en","es"]` (D-05) |
| `application/ld+json` | 406 | Produce ld+json = in-page graph. Do **not** add generic JSON to `PRODUCES` |
| `security.txt` | 404 (D-02) | `/.well-known/security.txt`: `Contact: mailto:contacto@jseramn.tech`, `Expires:` ≤1 year, `Preferred-Languages: en, es`, `Canonical: https://www.jseramn.tech/.well-known/security.txt`, `Policy: https://jseramn.tech/policy`. No invented PGP |
| robots | `Allow: /`, `Disallow: /api/` (`public/robots.txt`) | **Policy A:** allow all cooperating crawlers. Never `Disallow: /` on `User-agent: *`. Never block Googlebot |
| CORS agent files | ACAO apex origin + CORP same-site (D-06) | `*` + CORP `cross-origin` on `/llms.txt`, `/llms-full.txt`, `/robots.txt`, `/.well-known/security.txt` |
| oEmbed | `type: rich` iframe (`oembed.ts:56–63`) vs CSP `frame-ancestors 'none'` (D-09) | Type consistent with CSP (`photo`/`link` + thumbnail, or `rich` only where framing is allowed) |
| Agent contact | mailto in llms.txt; form POST 404 (D-01) | **mailto for agents.** Do not list `/api/contact` in llms.txt until the route is proven. Do not skip Turnstile |

### Recommended `llms.txt` outline (D-report WU3)

```markdown
# José Ramón García Del Risco (jseramn)

> Personal portfolio and contact surface at https://jseramn.tech. Tech lead, cybersecurity, web developer, and founder.

When to use this: reach jseramn for tech lead, cybersecurity, web development, or founding/product work. Not a product catalog. No pricing.

Fetch HTML pages with `Accept: text/markdown` at the same URL. Prefer email over any JSON API.

## Pages

- [Home](https://jseramn.tech/): identity and contact routing
- [About](https://jseramn.tech/about): who operates the domain
- [Contact](https://jseramn.tech/contact): mailto:contacto@jseramn.tech; encrypted browser form for humans

## Legal

- [Privacy policy](https://jseramn.tech/policy)
- [Terms](https://jseramn.tech/terms)
- [Data deletion](https://jseramn.tech/data-deletion)

## Optional

- [Open Graph image](https://jseramn.tech/thumbnail.png)
- [oEmbed](https://jseramn.tech/oembed.json)
- [Sitemap](https://jseramn.tech/sitemap-index.xml)
- [Source](https://github.com/jseramn/portfolio)
```

### Do not ship

A2A `agent-card.json`, `/.well-known/mcp.json`, `ai-plugin.json`, WebMCP tools, Web Bot Auth verification, `humans.txt`, `/agents.md` on the site, `hreflang` without a distinct `/es` URL (D-11, D-12, D-14, D-15). Empty cards would be a lie. Defer until a real endpoint exists.

## 9. Invariants (do not break)

1. Visual identity stays: full-viewport white ASCII portrait on black (Vesper terminal aesthetic), glass chrome, Geist/Geist Mono. Layout, responsive behaviour, stacking and interaction details may change; Hero typography, scrim colours and `--hero-ink*` colours may NOT.
2. Six `GlassSurface` wraps on the home chrome (5 hero + 1 modal). Live `liquid-glass-react` only on Chromium desktop with a fine pointer; CSS fallback everywhere else (Safari/WebKit/CriOS/Firefox/coarse pointers/reduced motion).
3. ASCII runs on mobile too. Reduced-motion or no-WebGL users get a static monochrome fallback — never a colourful still (no portrait.jpg / ascii-poster).
4. First paint is black until glyphs paint; the boot loader overlay exists only on `/`.
5. `prerender = false` stays on `/`, `/about`, `/contact`, `/404` and the API routes. Middleware runs at the Edge. `Accept: text/markdown` negotiation, 406 for unacceptable types, and `Vary: Accept, Accept-Encoding` on negotiated responses must keep working (tests in `src/lib/agent/*.test.ts`).
6. `<video preload="none">` on the ASCII sampler element; PostHog init stays `setTimeout(6000)` (never `requestIdleCallback`).
7. No debug ingest (`dbg()` / localhost collectors). Astro stays on major 5. No new analytics vendors.
8. Security posture stays: CSP/HSTS/COOP/CORP headers come from `siteSecurityHeaders.mjs`; contact API keeps same-origin check, honeypot, Turnstile-when-configured, rate limit, generic errors.

Additional tooling locks: **no Prettier + ESLint alongside Biome**; **`vercel.json` only via** `scripts/sync-vercel-security-headers.mjs` (`package.json:8`). Never edit `vercel.json` by hand.

## 10. Definition of Done and verification recipes

`package.json` today exposes `dev` / `build` / `preview` / `test` only. `pnpm check`, Biome, `astro check`, and Playwright are **not** in this branch (A-15). Run them when those units land. This documentation unit does not run builds.

### Gates

- [ ] `pnpm exec tsc --noEmit`
- [ ] `pnpm test` (144 tests at audit HEAD)
- [ ] `pnpm check` when added (expect `tsc` + `astro check` + Biome)
- [ ] `pnpm exec astro check` when the tool exists
- [ ] `pnpm exec biome check .` when Biome exists (Biome **or** Oxc; never Prettier+ESLint with it)
- [ ] `flock /tmp/swarm/build.lock -c "pnpm exec astro build"` (use `pnpm build` if headers changed; `vercel.json` diff must match the source module)
- [ ] `pnpm test:e2e` when Playwright exists

### Production / preview

- [ ] Apex `308` → `www`
- [ ] Home ASCII on mobile; live glass 0 on coarse pointer; 5 fallback hosts
- [ ] Boot overlay only on `/`
- [ ] No `portrait.jpg` / ascii-poster
- [ ] POST `/api/contact` is not 404 HTML (D-01)

### Performance medians (home `/`, n≥3 mobile)

```bash
export CHROME_PATH=/home/jseramn/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome
# sequential; serialize with flock /tmp/swarm/build.lock
npx --yes lighthouse@13.4.1 https://www.jseramn.tech/ \
  --chrome-path="$CHROME_PATH" --only-categories=performance,accessibility,best-practices,seo \
  --form-factor=mobile --screenEmulation.mobile --output=json \
  --output-path=./lh-home-mobile.json
```

Hold LCP ≤ 1.5 s, TBT ≤ 100 ms, CLS 0, JS in LH window ≤ 150 KB, total ≤ 350 KB (§7).

### Code limits

Authored diff ≤ 400 lines unless `size:exception`. No drive-by restyle of frozen tokens. No new analytics vendors.

### UI screenshot matrix

Headless Chromium, wait until boot hidden and `canvas.hero-ascii-display[data-ascii-paint]` (or fallback attr). Viewports: **360×800, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1920×1080, 844×390**. Extra runs: `--force-prefers-reduced-motion` and `pointer: coarse` (emulate `(pointer: coarse)` so live glass is off). Compare to `/tmp/swarm/ui/*.png`.

### Tap-target measurement

Use a CDP script in the same shape as `/tmp/swarm/ui/measure.mjs` (do not copy that file into the repo): connect to Chromium, `Runtime.evaluate` a query of interactive nodes (`a, button, input, textarea, [role=button]`), record `getBoundingClientRect` width/height, flag any box under 44×44 or gap under 8 px to the next target. Include hire `scrollWidth` vs `clientWidth` to catch glass clipping.

### Agentic curl set

```bash
# markdown
curl -sSI -H 'Accept: text/markdown' https://www.jseramn.tech/
curl -sSI -H 'Accept: text/markdown' https://www.jseramn.tech/about
curl -sSI -H 'Accept: text/markdown' https://www.jseramn.tech/contact
curl -sSI -H 'Accept: text/markdown' https://www.jseramn.tech/policy
# 406
curl -sSI -H 'Accept: image/png' https://www.jseramn.tech/
curl -sSI -H 'Accept: application/json' https://www.jseramn.tech/
# ld+json (after unit)
curl -sSI -H 'Accept: application/ld+json' https://www.jseramn.tech/
# discovery
curl -sSI https://www.jseramn.tech/llms.txt
curl -sSI https://www.jseramn.tech/.well-known/security.txt
curl -sS https://www.jseramn.tech/robots.txt
```

Expect markdown `content-type: text/markdown; charset=utf-8` and `vary: Accept, Accept-Encoding`; 406 `text/plain`; Chrome-like Accept still HTML (`accept.test.ts`).

### A11y checks

Keyboard: tab HUD, open modal, trap, Escape, focus restore. Screen: skip link visible on focus. Landmark: `main` in accessibility tree. Contrast: hire/tagline over bright glyph frames; legal last-updated ≥4.5:1.

## 11. Open decisions log

Owner decisions already taken (sanitation plan). Change them only by updating this log in a follow-up PR; do not silently override in implementation units.

| Decision | Choice | How to change |
|----------|--------|---------------|
| Git history rewrite of full-res `videobg.*` | **Not now.** Drop files from HEAD only (A-01, B-14) | Separate destructive owner approval (`git filter-repo` + force-push) |
| Video preload link | **Remove** `<link rel="preload" as="video">`; keep element `preload="none"` (B-02) | Re-add only with LH proof that LCP/SI need it |
| Analytics | **PostHog-only, slim** (disable session recording / surveys / console recording on public). Delete dead SpeedInsights import; do not add vendors (A-09, B-08, B-10, invariant 7) | Owner PR if Vercel Analytics must emit |
| Points cloud (`sampleLuminance`) | **Remove only if indistinguishable** from plane+readPixels (A-08) | Side-by-side visual; keep if the bust look depends on it |
| Replace Three | **Conditional on TBT > 100 ms** after cheaper ASCII-first-frame work (B-03, B-04) | If mobile TBT median still > 100 ms, a tiny WebGL sampler may replace `three` |
| Reduced-motion / no-WebGL | **Monochrome ASCII fallback** (text/SVG from first sampler frame). Not `portrait.jpg` | Only with a new invariant change |
| Legal pages | **`prerender = false`** so Accept markdown is honest (D-03) | Static `.md` twins are forbidden by tests |
| Agent contact | **mailto** `contacto@jseramn.tech`. Humans use the form + Turnstile (D-report Q2) | Agent POST without Turnstile needs Web Bot Auth + rate limit — explicit owner ask |
| robots | **Policy A** — allow all (D-10 Q1) | Switch to B (training opt-out) or C (comment-only Content-Signal) in this log first |
| Destructive hygiene | **End of swarm**, with an explicit list: merged local branches, stale worktrees, leftover `openspec/changes` (A-16). No history rewrite in that list | Owner-approved commands only |

Related non-decisions still open in audits (not blocking this doc): HTML `s-maxage` vs always-MISS (B-06); immutable `/_astro` (B-05); idle-defer `/api/github-stats` (B-07); age pubkey in `security.txt` `Encryption:` (D-04 Q4).
