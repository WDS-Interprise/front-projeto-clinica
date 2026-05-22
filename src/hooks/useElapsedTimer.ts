import { useEffect, useState } from "react"

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":")
}

export function useElapsedTimer(startedAt: string | Date | null | undefined) {
  const [elapsed, setElapsed] = useState("00:00:00")

  useEffect(() => {
    if (!startedAt) {
      setElapsed("00:00:00")
      return
    }

    const start = startedAt instanceof Date ? startedAt.getTime() : new Date(startedAt).getTime()
    if (Number.isNaN(start)) {
      setElapsed("00:00:00")
      return
    }

    const tick = () => setElapsed(formatElapsed(Date.now() - start))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [startedAt])

  return elapsed
}
