import type { ReactNode } from "react"
import ClinicalToolsLayout from "@/components/layout/ClinicalToolsLayout"

type Props = {
  title: string
  description?: string
  children: ReactNode
  action?: ReactNode
}

export function ClinicalToolsPageShell({ title, description, children, action }: Props) {
  return (
    <ClinicalToolsLayout>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-[#12261E]">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[#6B7C74]">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </ClinicalToolsLayout>
  )
}
