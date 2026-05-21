import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

const variants = {
  scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
  confirmed: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/25",
  in_progress: "bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-500/25",
  completed: "bg-surface-alt text-text-secondary border-border",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25",
} as const

type Status = keyof typeof variants

const labels: Record<Status, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em Atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: Status
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, status, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
          status ? variants[status] : "bg-surface-alt text-text-secondary border-border",
          className
        )}
        {...props}
      >
        {children || (status ? labels[status] : null)}
      </span>
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
