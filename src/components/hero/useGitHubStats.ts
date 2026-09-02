import { useEffect, useState } from "react"
import type { GitHubStats } from "../../lib/githubStats"

export function useGitHubStats() {
  const [stats, setStats] = useState<GitHubStats | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch("/api/github-stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: GitHubStats | null) => {
        if (!cancelled && data) setStats(data)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return stats
}
