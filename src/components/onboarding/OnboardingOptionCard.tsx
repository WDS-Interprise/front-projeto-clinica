import { Check } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  label: string
  description?: string
  icon: LucideIcon
  selected: boolean
  onSelect: () => void
  className?: string
}

export function OnboardingOptionCard({
  label,
  description,
  icon: Icon,
  selected,
  onSelect,
  className,
}: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#256993]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        selected
          ? "border-[#256993] bg-[#256993]/8 shadow-[0_0_0_1px_rgba(37,105,147,0.25),0_4px_12px_-4px_rgba(37,105,147,0.3)]"
          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100",
        className
      )}
      aria-pressed={selected}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
          selected
            ? "bg-[#256993] text-white shadow-sm shadow-[#256993]/25"
            : "bg-white text-[#256993] ring-1 ring-slate-200 group-hover:bg-slate-50"
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-tight text-slate-900">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
            {description}
          </span>
        )}
      </span>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
          selected
            ? "border-[#256993] bg-[#256993] text-white scale-100 opacity-100"
            : "border-slate-300 bg-transparent scale-90 opacity-0"
        )}
        aria-hidden
      >
        <Check className="h-3 w-3 stroke-[3]" />
      </span>
    </button>
  )
}
