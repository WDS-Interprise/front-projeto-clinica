import { useEffect, useState } from "react"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"

export function useUnreadMessages() {
  const { hasPermission } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!hasPermission("whatsapp:send")) {
      setCount(0)
      return
    }
    api.whatsapp
      .listChats()
      .then((chats) => setCount(chats.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)))
      .catch(() => setCount(0))
  }, [hasPermission])

  return count
}
