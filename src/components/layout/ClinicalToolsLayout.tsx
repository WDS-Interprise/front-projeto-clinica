import type { ReactNode } from "react"
import ClinicalToolsSidebar from "@/components/layout/ClinicalToolsSidebar"
import { cn } from "@/lib/utils"

type Props = {
  children: ReactNode
  className?: string
}

export default function ClinicalToolsLayout({ children, className }: Props) {
  return (
    <div className="flex h-full min-h-0 gap-5 overflow-hidden bg-[#F4F7F5] p-5">
      <ClinicalToolsSidebar />
      <div className={cn("min-h-0 min-w-0 flex-1 overflow-auto space-y-6", className)}>
        {children}
      </div>
    </div>
  )
}
