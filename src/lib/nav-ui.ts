import { cn } from "@/lib/utils"

export function navItemClass(active: boolean, compact = false) {
  return cn(
    "inline-flex shrink-0 select-none items-center gap-1.5 rounded-lg py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
    compact ? "px-2" : "px-2.5",
    active
      ? "bg-[#E6F4F1] text-[#006B4D]"
      : "text-[#5A6B64] hover:bg-[#F3F7F5] hover:text-[#1B2E26]"
  )
}
