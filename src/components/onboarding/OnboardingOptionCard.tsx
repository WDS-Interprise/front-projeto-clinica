import { Check } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ComponentType, SVGProps } from "react"

export type OnboardingIcon = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>

type Props = {
  label: string
  description?: string
  icon: OnboardingIcon
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
        "relative flex h-full min-h-[148px] w-full flex-col items-center rounded-xl border bg-white px-3 pb-4 pt-5 text-center transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A86B]/40 focus-visible:ring-offset-2",
        selected
          ? "border-[#00A86B] shadow-[0_0_0_1px_#00A86B]"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80",
        className
      )}
      aria-pressed={selected}
    >
      <span
        className={cn(
          "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#00A86B] text-white transition-all",
          selected ? "scale-100 opacity-100" : "scale-75 opacity-0"
        )}
        aria-hidden
      >
        <Check className="h-3 w-3 stroke-[3]" />
      </span>
      <Icon className="h-8 w-8 text-slate-700" strokeWidth={1.4} />
      <span className="mt-3 block text-[13px] font-semibold leading-snug text-slate-900">{label}</span>
      {description ? (
        <span className="mt-1 block text-[11px] leading-snug text-slate-500">{description}</span>
      ) : null}
    </button>
  )
}
