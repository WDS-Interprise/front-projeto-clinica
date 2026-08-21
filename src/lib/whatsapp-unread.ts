import type { WhatsappChat } from "@/services/api"

type UnreadChat = Pick<WhatsappChat, "unreadCount" | "lastMessageFromMe">

let count = 0
const listeners = new Set<(next: number) => void>()

export function visibleUnreadCount(chats: UnreadChat[]) {
  return chats.reduce((sum, chat) => {
    if ((chat.lastMessageFromMe ?? false) || (chat.unreadCount ?? 0) <= 0) return sum
    return sum + chat.unreadCount
  }, 0)
}

export function getWhatsappUnreadCount() {
  return count
}

export function setWhatsappUnreadCount(next: number) {
  const value = Math.max(0, next)
  if (value === count) return
  count = value
  listeners.forEach((fn) => fn(count))
}

export function subscribeWhatsappUnread(listener: (next: number) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
