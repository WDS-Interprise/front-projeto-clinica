import { forwardRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type HeaderIconButtonProps = {
  icon: ReactNode
  label: string
  onClick?: () => void
  active?: boolean
  badge?: number
  className?: string
}

const HeaderIconButton = forwardRef<HTMLButtonElement, HeaderIconButtonProps>(
  function HeaderIconButton({ icon, label, onClick, active, badge, className }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-expanded={active}
        className={cn(
          "relative rounded-lg p-2 text-[#5A6B64] transition-colors hover:bg-[#F3F7F5] hover:text-[#1B2E26]",
          active && "bg-[#E6F4F1] text-[#006B4D]",
          className
        )}
      >
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2ECC71] px-1 text-[10px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>
    )
  }
)

export default HeaderIconButton
