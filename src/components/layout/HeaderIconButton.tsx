import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type HeaderIconButtonProps = {
  icon: ReactNode
  label: string
  onClick?: () => void
  active?: boolean
  badge?: number
  className?: string
}

export default function HeaderIconButton({
  icon,
  label,
  onClick,
  active,
  badge,
  className,
}: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={active}
      className={cn(
        "relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-alt hover:text-text",
        active && "bg-surface-alt text-primary",
        className
      )}
    >
      {icon}
      {badge != null && badge > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white animate-in fade-in zoom-in duration-200">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  )
}
