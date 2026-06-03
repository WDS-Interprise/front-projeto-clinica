import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { WhatsappChat } from "@/services/api"

export function whatsappChatDisplayName(chat: WhatsappChat): string {
  return chat.patient?.name ?? chat.contactName ?? chat.phoneDigits
}

export function whatsappChatInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

export function whatsappRelativeTime(iso: string | null | undefined): string {
  if (!iso) return ""
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR })
  } catch {
    return ""
  }
}

export function whatsappChatStatusLine(chat: WhatsappChat): string {
  if (chat.contactComposing) return "digitando…"
  if (chat.aiComposing && !chat.aiPaused) return "Assistente digitando…"
  if (chat.aiPaused) return "Atendimento manual"
  if (chat.unreadCount > 0 && !(chat.lastMessageFromMe ?? false)) {
    return `${chat.unreadCount} nova${chat.unreadCount > 1 ? "s" : ""} mensagem${chat.unreadCount > 1 ? "ns" : ""}`
  }
  if (chat.lastMessageFromMe ?? false) return "Aguardando visualização"
  if (chat.lastMessage) return "Respondeu"
  return "Sem mensagens"
}

export function whatsappChatBadge(chat: WhatsappChat): string {
  if (chat.unreadCount > 0 && !(chat.lastMessageFromMe ?? false)) return "Nova"
  if (chat.lastMessageFromMe ?? false) return "Enviado"
  if (chat.lastMessage) return "Respondeu"
  return ""
}
