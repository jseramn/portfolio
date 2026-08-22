import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { fetchGitHubStats } = vi.hoisted(() => ({
  fetchGitHubStats: vi.fn(),
}))

vi.mock("./githubStats", () => ({
  fetchGitHubStats,
}))

const SAMPLE = {
  today: 1,
  month: 10,
  year: 100,
  total: 1000,
  lastCommit: { message: "fix", repo: "portfolio", url: "https://github.com/jseramn/portfolio" },
}

const CACHE_MS = 5 * 60 * 1000

async function loadGET() {
  const { GET } = await import("../pages/api/github-stats")
  return GET
}

function expectNoStore(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe("private, no-store")
  expect(response.headers.get("Vercel-CDN-Cache-Control")).toBe("private, no-store")
  const joined = [
    response.headers.get("Cache-Control") ?? "",
    response.headers.get("Vercel-CDN-Cache-Control") ?? "",
  ].join(" ")
  expect(joined).not.toMatch(/public/)
  expect(joined).not.toMatch(/s-maxage/)
}

describe("GET /api/github-stats", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-22T12:00:00.000Z"))
    fetchGitHubStats.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("sets both no-store headers on a fresh fetch", async () => {
    fetchGitHubStats.mockResolvedValue(SAMPLE)
    const GET = await loadGET()
    const response = await GET({} as never)
    expect(response.status).toBe(200)
    expectNoStore(response)
    expect(fetchGitHubStats).toHaveBeenCalledOnce()
  })

  it("reuses memory within CACHE_MS and does not refetch", async () => {
    fetchGitHubStats.mockResolvedValue(SAMPLE)
    const GET = await loadGET()
    const first = await GET({} as never)
    const second = await GET({} as never)
    expectNoStore(first)
    expectNoStore(second)
    expect(fetchGitHubStats).toHaveBeenCalledOnce()
  })

  it("returns stale JSON with no-store when fetch fails after CACHE_MS", async () => {
    fetchGitHubStats.mockResolvedValueOnce(SAMPLE)
    const GET = await loadGET()
    await GET({} as never)
    vi.advanceTimersByTime(CACHE_MS)
    fetchGitHubStats.mockRejectedValueOnce(new Error("upstream"))
    const stale = await GET({} as never)
    expect(stale.status).toBe(200)
    expectNoStore(stale)
    await expect(stale.json()).resolves.toEqual(SAMPLE)
    expect(fetchGitHubStats).toHaveBeenCalledTimes(2)
  })

  it("returns 503 JSON with no-store when fetch fails with empty cache", async () => {
    fetchGitHubStats.mockRejectedValueOnce(new Error("upstream"))
    const GET = await loadGET()
    const response = await GET({} as never)
    expect(response.status).toBe(503)
    expectNoStore(response)
    await expect(response.json()).resolves.toEqual({ error: "unavailable" })
  })
})
