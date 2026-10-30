import { cn } from "@/lib/utils"

export function navItemClass(active: boolean, compact = false) {
  return cn(
    "inline-flex shrink-0 select-none items-center gap-1.5 rounded-lg py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
    compact ? "px-2" : "px-2.5",
    active
      ? "bg-primary-light text-primary"
      : "text-text-secondary hover:bg-surface-alt hover:text-text"
  )
}
