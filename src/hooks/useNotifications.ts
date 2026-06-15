import { useCallback, useEffect, useMemo, useState } from "react"
import {
  NOTIFICATIONS_READ_STATE_KEY,
} from "@/data/mock-notifications"
import type { Notification } from "@/types/notification"

function loadReadState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_READ_STATE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function saveReadState(state: Record<string, boolean>) {
  localStorage.setItem(NOTIFICATIONS_READ_STATE_KEY, JSON.stringify(state))
}

function mergeReadState(items: Notification[]): Notification[] {
  const readState = loadReadState()
  return items.map((n) => ({
    ...n,
    read: readState[n.id] ?? n.read,
  }))
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    mergeReadState([])
  )

  useEffect(() => {
    setNotifications(mergeReadState([]))
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      const state = loadReadState()
      state[id] = true
      saveReadState(state)
      return next
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const state = loadReadState()
      for (const n of prev) state[n.id] = true
      saveReadState(state)
      return prev.map((n) => ({ ...n, read: true }))
    })
  }, [])

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}
