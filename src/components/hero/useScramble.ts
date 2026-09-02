import { useCallback, useEffect, useRef, useState } from "react"
import { getCapabilities } from "../../lib/capabilities"
import { CHARS } from "./chrome"

export function useScramble(text: string, { autoStart = false }: { autoStart?: boolean } = {}) {
  const [display, setDisplay] = useState(autoStart ? ".".repeat(text.length) : text)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (getCapabilities().reducedMotion) {
      setDisplay(text)
      return
    }
    if (intervalRef.current) clearInterval(intervalRef.current)
    let iteration = 0
    intervalRef.current = setInterval(() => {
      const keepCount = Math.floor(iteration / 2)
      let newText = ""
      for (let i = 0; i < text.length; i++) {
        if (
          text[i] === " " ||
          text[i] === "·" ||
          text[i] === "." ||
          text[i] === "&" ||
          text[i] === "'" ||
          text[i] === "\n"
        ) {
          newText += text[i]
        } else if (i < keepCount) {
          newText += text[i]
        } else {
          newText += CHARS[Math.floor(Math.random() * CHARS.length)]
        }
      }
      setDisplay(newText)
      iteration++
      if (iteration >= text.length * 2) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        setDisplay(text)
      }
    }, 30)
  }, [text])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setDisplay(text)
  }, [text])

  useEffect(() => {
    if (autoStart) start()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { display, start, stop }
}
