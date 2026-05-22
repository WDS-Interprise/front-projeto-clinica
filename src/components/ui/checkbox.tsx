import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type CheckboxProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
  disabled?: boolean
  className?: string
}

export function Checkbox({
  checked,
  onCheckedChange,
  id,
  disabled,
  className,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border shadow-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#256993]/40 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-[#256993] bg-[#256993] text-white"
          : "border-slate-300 bg-white text-transparent",
        className
      )}
    >
      <Check
        className={cn("h-3.5 w-3.5 stroke-[3]", !checked && "scale-0 opacity-0")}
        strokeWidth={3}
      />
    </button>
  )
}
