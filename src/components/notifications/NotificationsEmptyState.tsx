import { BellOff } from "lucide-react"

export default function NotificationsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-text-secondary">
        <BellOff className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-text">Nenhuma notificação</p>
      <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-text-secondary">
        Você está em dia. Novas atualizações aparecerão aqui.
      </p>
    </div>
  )
}
