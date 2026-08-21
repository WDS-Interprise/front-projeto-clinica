import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import {
  getWhatsappUnreadCount,
  setWhatsappUnreadCount,
  subscribeWhatsappUnread,
  visibleUnreadCount,
} from "@/lib/whatsapp-unread"

export function useUnreadMessages() {
  const { hasPermission } = useAuth()
  const location = useLocation()
  const [count, setCount] = useState(getWhatsappUnreadCount)
  const onMessagesPage = location.pathname === "/mensagens"

  useEffect(() => subscribeWhatsappUnread(setCount), [])

  useEffect(() => {
    if (!hasPermission("whatsapp:send")) {
      setWhatsappUnreadCount(0)
      return
    }

    const refresh = () => {
      api.whatsapp
        .listChats()
        .then((chats) => setWhatsappUnreadCount(visibleUnreadCount(chats)))
        .catch(() => undefined)
    }

    refresh()
    if (onMessagesPage) return

    const timer = window.setInterval(refresh, 12_000)
    return () => window.clearInterval(timer)
  }, [hasPermission, onMessagesPage])

  return count
}
