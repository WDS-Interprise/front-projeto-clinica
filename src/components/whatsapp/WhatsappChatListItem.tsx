import type { WhatsappChat } from "@/services/api"
import { cn } from "@/lib/utils"
import {
  whatsappChatBadge,
  whatsappChatDisplayName,
  whatsappChatStatusLine,
  whatsappRelativeTime,
} from "@/lib/whatsapp-display"
import WhatsappChatAvatar from "./WhatsappChatAvatar"

type Props = {
  chat: WhatsappChat
  selected: boolean
  onSelect: () => void
}

export default function WhatsappChatListItem({ chat, selected, onSelect }: Props) {
  const name = whatsappChatDisplayName(chat)
  const badge = whatsappChatBadge(chat)
  const statusLine = whatsappChatStatusLine(chat)
  const time = whatsappRelativeTime(chat.lastMessageAt)
  const hasUnread = chat.unreadCount > 0 && !(chat.lastMessageFromMe ?? false)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left px-3 py-3 transition-colors border-b border-[#e9edef]",
        "hover:bg-[#f5f6f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008069]/40 focus-visible:ring-inset",
        selected && "bg-[#f0f2f5]"
      )}
    >
      <div className="flex gap-3 items-start">
        <WhatsappChatAvatar chatId={chat.id} name={name} size="md" />

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span
                className={cn(
                  "truncate text-[15px] leading-tight text-[#111b21]",
                  hasUnread ? "font-semibold" : "font-medium"
                )}
              >
                {name}
              </span>
              {hasUnread && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-[#25d366]"
                  title="Mensagens não lidas"
                />
              )}
            </div>

            <div className="flex flex-col items-end shrink-0 gap-1">
              {time && (
                <span className="text-[11px] leading-none text-[#667781] whitespace-nowrap">
                  {time}
                </span>
              )}
              {badge && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight",
                    selected
                      ? "bg-[#d1e7dd] text-[#008069]"
                      : "bg-[#e9edef] text-[#54656f]"
                  )}
                >
                  {badge}
                </span>
              )}
            </div>
          </div>

          <p className="mt-0.5 text-[13px] text-[#008069] truncate">{statusLine}</p>

          <p
            className={cn(
              "mt-0.5 text-[13px] truncate",
              hasUnread ? "text-[#111b21] font-medium" : "text-[#667781]"
            )}
          >
            {chat.lastMessage ?? "Nenhuma mensagem ainda"}
          </p>
        </div>
      </div>
    </button>
  )
}
