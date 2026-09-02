// Icons copied from lucide-react v0.454.0 (ISC). https://github.com/lucide-icons/lucide

import { createElement, type FunctionComponent } from "react"

export type IconProps = {
  className?: string
  size?: number
  "aria-hidden"?: boolean | "true"
}

export type IconComponent = FunctionComponent<IconProps>

type IconNode = readonly [tag: string, attrs: Record<string, string>]

function icon(name: string, nodes: readonly IconNode[]): IconComponent {
  const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
  const Icon: IconComponent = ({ className, size = 24, ...rest } = {}) => {
    return createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: className ? `lucide lucide-${kebab} ${className}` : `lucide lucide-${kebab}`,
        ...rest,
      },
      nodes.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs })),
    )
  }
  Icon.displayName = name
  return Icon
}

export const Github = icon("Github", [
  [
    "path",
    {
      d: "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",
    },
  ],
  ["path", { d: "M9 18c-4.51 2-5-2-7-2" }],
])

export const Twitter = icon("Twitter", [
  [
    "path",
    {
      d: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",
    },
  ],
])

export const Linkedin = icon("Linkedin", [
  [
    "path",
    {
      d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z",
    },
  ],
  ["rect", { width: "4", height: "12", x: "2", y: "9" }],
  ["circle", { cx: "4", cy: "4", r: "2" }],
])

export const Instagram = icon("Instagram", [
  ["rect", { width: "20", height: "20", x: "2", y: "2", rx: "5", ry: "5" }],
  ["path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }],
  ["line", { x1: "17.5", x2: "17.51", y1: "6.5", y2: "6.5" }],
])

export const Mail = icon("Mail", [
  ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
  ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }],
])

export const Volume2 = icon("Volume2", [
  [
    "path",
    {
      d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",
    },
  ],
  ["path", { d: "M16 9a5 5 0 0 1 0 6" }],
  ["path", { d: "M19.364 18.364a9 9 0 0 0 0-12.728" }],
])

export const VolumeX = icon("VolumeX", [
  [
    "path",
    {
      d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",
    },
  ],
  ["line", { x1: "22", x2: "16", y1: "9", y2: "15" }],
  ["line", { x1: "16", x2: "22", y1: "9", y2: "15" }],
])

export const SkipBack = icon("SkipBack", [
  ["polygon", { points: "19 20 9 12 19 4 19 20" }],
  ["line", { x1: "5", x2: "5", y1: "19", y2: "5" }],
])

export const SkipForward = icon("SkipForward", [
  ["polygon", { points: "5 4 15 12 5 20 5 4" }],
  ["line", { x1: "19", x2: "19", y1: "5", y2: "19" }],
])

export const Shuffle = icon("Shuffle", [
  ["path", { d: "M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" }],
  ["path", { d: "m18 2 4 4-4 4" }],
  ["path", { d: "M2 6h1.9c1.5 0 2.9.9 3.6 2.2" }],
  ["path", { d: "M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" }],
  ["path", { d: "m18 14 4 4-4 4" }],
])

export const X = icon("X", [
  ["path", { d: "M18 6 6 18" }],
  ["path", { d: "m6 6 12 12" }],
])

export const Copy = icon("Copy", [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }],
])

export const Check = icon("Check", [["path", { d: "M20 6 9 17l-5-5" }]])

export const ExternalLink = icon("ExternalLink", [
  ["path", { d: "M15 3h6v6" }],
  ["path", { d: "M10 14 21 3" }],
  ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }],
])

export const SOCIAL_ICONS: Record<string, IconComponent> = {
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
}
