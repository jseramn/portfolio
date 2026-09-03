import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
export const PORTFOLIO_ROOT = join(here, "..")
export const TINIT_DIR = join(PORTFOLIO_ROOT, "src/tinity")
export const TWINS_DIR = join(TINIT_DIR, "twins")
export const TINIT_PUBLIC_DIR = join(PORTFOLIO_ROOT, "public/tinity")
export const SOURCE_MANIFEST = join(TINIT_DIR, ".tinity-source.json")
export const DEFAULT_REPO = "jseramn/tinity"
export const DEFAULT_REF = "main"
export const TARBALL_HOST = "https://codeload.github.com"

/** Portfolio-owned files that a pull must not replace. */
export const PRESERVE = [
  "TinityApp.tsx",
  "parity.test.ts",
  ".tinity-source.json",
  "experience/AgentMark.test.ts",
]

const SKIP_FROM_LANDING = new Set(["main.tsx", "vite-env.d.ts"])

export const TWIN_NAMES = ["llms.txt", "index.md", "changelog.md", "design.md"]

export function posixRel(from, to) {
  return relative(from, to).split(sep).join("/")
}

export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex")
}

export function shouldSkipLandingRel(rel) {
  if (PRESERVE.includes(rel)) return true
  if (SKIP_FROM_LANDING.has(rel)) return true
  if (rel === "test" || rel.startsWith("test/")) return true
  if (/\.test\.(ts|tsx)$/.test(rel)) return true
  return false
}

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walkFiles(full, acc)
    else acc.push(full)
  }
  return acc
}

export function hashTinityTree(root = TINIT_DIR) {
  const files = {}
  for (const full of walkFiles(root)) {
    const rel = posixRel(root, full)
    if (PRESERVE.includes(rel)) continue
    files[rel] = sha256(readFileSync(full))
  }
  return files
}

function snapshotPreserve() {
  const saved = {}
  for (const rel of PRESERVE) {
    const full = join(TINIT_DIR, rel)
    if (existsSync(full)) saved[rel] = readFileSync(full)
  }
  return saved
}

function restorePreserve(saved) {
  for (const [rel, bytes] of Object.entries(saved)) {
    const full = join(TINIT_DIR, rel)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, bytes)
  }
}

function copyLandingSrc(landingSrc) {
  for (const full of walkFiles(landingSrc)) {
    const rel = posixRel(landingSrc, full)
    if (shouldSkipLandingRel(rel)) continue
    const dest = join(TINIT_DIR, rel)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(full, dest)
  }
}

export function writeTwinModule(twinsDir = TWINS_DIR) {
  const lines = TWIN_NAMES.map((name) => {
    const body = readFileSync(join(twinsDir, name), "utf8")
    return `  ${JSON.stringify(name)}: ${JSON.stringify(body)}`
  })
  const source = `export const twins = {\n${lines.join(",\n")},\n} as const\n\nexport type TwinName = keyof typeof twins\n`
  writeFileSync(join(PORTFOLIO_ROOT, "src/lib/tinityTwinContent.ts"), source)
}

function copyTwins(landingPublic) {
  mkdirSync(TWINS_DIR, { recursive: true })
  for (const name of TWIN_NAMES) {
    const from = join(landingPublic, name)
    if (!existsSync(from)) {
      throw new Error(`tinity:pull missing twin ${name} in ${landingPublic}`)
    }
    copyFileSync(from, join(TWINS_DIR, name))
  }
  for (const extra of ["favicon.svg", "tinity-mark.svg", "tinity-og.png"]) {
    const from = join(landingPublic, extra)
    if (existsSync(from)) copyFileSync(from, join(TWINS_DIR, extra))
  }
  writeTwinModule(TWINS_DIR)
}

function generateOg(dest) {
  execFileSync("python3", [join(here, "tinity-og.py"), dest], { stdio: "inherit" })
}

function copyPublicAssets(landingPublic) {
  mkdirSync(TINIT_PUBLIC_DIR, { recursive: true })
  for (const name of ["favicon.svg", "tinity-mark.svg", "tinity-og.png"]) {
    const from = join(landingPublic, name)
    if (existsSync(from)) copyFileSync(from, join(TINIT_PUBLIC_DIR, name))
  }
  const og = join(TINIT_PUBLIC_DIR, "tinity-og.png")
  if (!existsSync(og)) generateOg(og)
}

async function resolveGithubSha(repo, ref) {
  const url = `https://api.github.com/repos/${repo}/commits/${encodeURIComponent(ref)}`
  const res = await fetch(url, {
    headers: {
      "User-Agent": "jseramn-portfolio-tinity-pull",
      Accept: "application/vnd.github+json",
    },
  })
  if (!res.ok) {
    throw new Error(`tinity:pull SHA lookup failed ${res.status} ${url}`)
  }
  const body = await res.json()
  if (!body.sha) throw new Error(`tinity:pull no sha in ${url}`)
  return body.sha
}

function localSha(src) {
  return execFileSync("git", ["-C", src, "rev-parse", "HEAD"], { encoding: "utf8" }).trim()
}

async function extractTarball(repo, ref) {
  const url = `${TARBALL_HOST}/${repo}/tar.gz/${encodeURIComponent(ref)}`
  const tmp = mkdtempSync(join(tmpdir(), "tinity-pull-"))
  const tarPath = join(tmp, "src.tar.gz")
  const res = await fetch(url, { headers: { "User-Agent": "jseramn-portfolio-tinity-pull" } })
  if (!res.ok) {
    rmSync(tmp, { recursive: true, force: true })
    throw new Error(`tinity:pull tarball failed ${res.status} ${url}`)
  }
  writeFileSync(tarPath, Buffer.from(await res.arrayBuffer()))
  execFileSync("tar", ["-xzf", tarPath, "-C", tmp])
  const names = readdirSync(tmp).filter((name) => name !== "src.tar.gz")
  if (names.length !== 1) {
    rmSync(tmp, { recursive: true, force: true })
    throw new Error(`tinity:pull expected one tarball root, got ${names.join(", ")}`)
  }
  return { root: join(tmp, names[0]), tmp }
}

function landingFrom(checkout) {
  const landingSrc = join(checkout, "landing/src")
  const landingPublic = join(checkout, "landing/public")
  if (!existsSync(landingSrc) || !existsSync(landingPublic)) {
    throw new Error(`tinity:pull ${checkout} is missing landing/src or landing/public`)
  }
  return { landingSrc, landingPublic }
}

export async function pullTinity({
  repo = process.env.TINITY_REPO ?? DEFAULT_REPO,
  ref = process.env.TINITY_REF ?? DEFAULT_REF,
  src = process.env.TINITY_SRC,
} = {}) {
  mkdirSync(TINIT_DIR, { recursive: true })
  const saved = snapshotPreserve()
  let sha
  let source
  let tmp = null

  try {
    if (src) {
      const checkout = src
      sha = localSha(checkout)
      source = { kind: "local", path: checkout }
      const { landingSrc, landingPublic } = landingFrom(checkout)
      rmSync(TINIT_DIR, { recursive: true, force: true })
      mkdirSync(TINIT_DIR, { recursive: true })
      copyLandingSrc(landingSrc)
      copyTwins(landingPublic)
      copyPublicAssets(landingPublic)
    } else {
      sha = await resolveGithubSha(repo, ref)
      source = { kind: "tarball", repo, ref, url: `${TARBALL_HOST}/${repo}/tar.gz/${ref}` }
      const extracted = await extractTarball(repo, ref)
      tmp = extracted.tmp
      const { landingSrc, landingPublic } = landingFrom(extracted.root)
      rmSync(TINIT_DIR, { recursive: true, force: true })
      mkdirSync(TINIT_DIR, { recursive: true })
      copyLandingSrc(landingSrc)
      copyTwins(landingPublic)
      copyPublicAssets(landingPublic)
    }
  } finally {
    restorePreserve(saved)
    if (tmp) rmSync(tmp, { recursive: true, force: true })
  }

  if (!existsSync(join(TINIT_DIR, "TinityApp.tsx"))) {
    throw new Error("tinity:pull lost TinityApp.tsx")
  }

  const files = hashTinityTree()
  const manifest = {
    sha,
    pulledAt: new Date().toISOString(),
    source,
    files,
  }
  writeFileSync(SOURCE_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
  return manifest
}

const invoked = process.argv[1] && basename(process.argv[1]) === "tinity-pull.mjs"
if (invoked) {
  const manifest = await pullTinity()
  const count = Object.keys(manifest.files).length
  console.log(`[tinity:pull] ${manifest.sha.slice(0, 7)} · ${count} files`)
}
