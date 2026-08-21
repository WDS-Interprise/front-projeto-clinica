import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  TRIAL: "bg-sky-100 text-sky-800",
  ACTIVE: "bg-[#E8F6EE] text-[#006B4D]",
  PAST_DUE: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-orange-100 text-orange-800",
  CANCELLED: "bg-slate-100 text-slate-600",
  EXPIRED: "bg-red-100 text-red-700",
}

const statusLabels: Record<string, string> = {
  TRIAL: "Trial",
  ACTIVE: "Ativo",
  PAST_DUE: "Em atraso",
  SUSPENDED: "Suspenso",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
}

export function SubscriptionStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[status] ?? "bg-slate-100 text-slate-600",
        className
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  )
}

export function PlanBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-md bg-[#E8F6EE] px-2 py-0.5 text-xs font-semibold text-[#006B4D]", className)}>
      {name}
    </span>
  )
}

export function BillingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Pendente", cls: "bg-amber-100 text-amber-800" },
    PAID: { label: "Pago", cls: "bg-[#E8F6EE] text-[#006B4D]" },
    OVERDUE: { label: "Vencido", cls: "bg-red-100 text-red-700" },
    REFUNDED: { label: "Estornado", cls: "bg-slate-100 text-slate-600" },
    CANCELLED: { label: "Cancelado", cls: "bg-slate-100 text-slate-600" },
    FAILED: { label: "Falhou", cls: "bg-red-100 text-red-700" },
  }
  const item = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" }
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", item.cls)}>{item.label}</span>
}
