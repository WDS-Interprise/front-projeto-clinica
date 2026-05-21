import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  description?: string
  icon: LucideIcon
  accentClass?: string
}

export function MetricCard({ label, value, description, icon: Icon, accentClass }: MetricCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-3xl font-bold text-text tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-text-secondary pt-1">{description}</p>
          )}
        </div>
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
            accentClass ?? "text-primary bg-primary-light"
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
