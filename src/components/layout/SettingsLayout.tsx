import type { ReactNode } from "react"
import SettingsSidebar from "@/components/layout/SettingsSidebar"
import { cn } from "@/lib/utils"

type Props = {
  children: ReactNode
  className?: string
}

export default function SettingsLayout({ children, className }: Props) {
  return (
    <div className="flex h-full min-h-0 gap-5 overflow-hidden bg-[#F4F7F5] p-5">
      <SettingsSidebar />
      <div className={cn("min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-12", className)}>{children}</div>
    </div>
  )
}

export function SettingsPageHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-[28px] font-bold leading-tight text-[#12261E]">
          {icon}
          {title}
        </h1>
        {description && <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[#6B7C74]">{description}</p>}
      </div>
      {action}
    </div>
  )
}
