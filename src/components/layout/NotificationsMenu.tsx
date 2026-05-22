import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell } from "lucide-react"
import HeaderIconButton from "@/components/layout/HeaderIconButton"
import NotificationItem from "@/components/notifications/NotificationItem"
import NotificationsEmptyState from "@/components/notifications/NotificationsEmptyState"
import { useClickOutside } from "@/hooks/useClickOutside"
import { useNotifications } from "@/hooks/useNotifications"
import { cn } from "@/lib/utils"

export default function NotificationsMenu() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  const close = useCallback(() => setOpen(false), [])
  const ref = useClickOutside<HTMLDivElement>(open, close)

  const handleItemClick = (id: string, href?: string) => {
    markAsRead(id)
    if (href) {
      close()
      navigate(href)
    }
  }

  return (
    <div ref={ref} className="relative">
      <HeaderIconButton
        icon={<Bell className="h-5 w-5" />}
        label="Notificações"
        active={open}
        badge={unreadCount}
        onClick={() => setOpen((v) => !v)}
      />

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,400px)] overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-xl",
            "animate-in fade-in slide-in-from-top-2 duration-200"
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-text">Notificações</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-primary hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-[min(420px,60vh)] overflow-y-auto">
            {notifications.length === 0 ? (
              <NotificationsEmptyState />
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => handleItemClick(n.id, n.href)}
                />
              ))
            )}
          </div>

          <div className="border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={() => {
                close()
                navigate("/dashboard")
              }}
              className="w-full text-center text-xs font-medium text-primary hover:underline"
            >
              Ver todas as notificações
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
