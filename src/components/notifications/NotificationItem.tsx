import {
  AlertTriangle,
  Calendar,
  CreditCard,
  MessageSquare,
  Settings,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Notification, NotificationType } from "@/types/notification"

const typeConfig: Record<
  NotificationType,
  { icon: typeof Calendar; className: string }
> = {
  appointment: { icon: Calendar, className: "bg-primary/15 text-primary" },
  payment: { icon: CreditCard, className: "bg-emerald-500/15 text-emerald-400" },
  message: { icon: MessageSquare, className: "bg-sky-500/15 text-sky-400" },
  system: { icon: Settings, className: "bg-slate-500/20 text-slate-300" },
  warning: { icon: AlertTriangle, className: "bg-amber-500/15 text-amber-400" },
}

type Props = {
  notification: Notification
  onClick: () => void
}

export default function NotificationItem({ notification, onClick }: Props) {
  const cfg = typeConfig[notification.type]
  const Icon = cfg.icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-surface-alt/80",
        !notification.read && "bg-primary/[0.04]"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          cfg.className
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          {!notification.read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-text">{notification.title}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-text-secondary">
              {notification.description}
            </span>
            <span className="mt-1 block text-[11px] text-text-secondary/70">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </span>
        </span>
      </span>
    </button>
  )
}
