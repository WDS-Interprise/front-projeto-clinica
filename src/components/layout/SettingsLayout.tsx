import type { ReactNode } from "react"
import SettingsSidebar from "@/components/layout/SettingsSidebar"
import { cn } from "@/lib/utils"

type Props = {
  children: ReactNode
  className?: string
}

export default function SettingsLayout({ children, className }: Props) {
  return (
    <div className="flex h-full min-h-0 gap-4 overflow-hidden p-4 lg:gap-6 lg:p-6">
      <SettingsSidebar />
      <div className={cn("min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto", className)}>
        {children}
      </div>
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
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          {icon}
          {title}
        </h1>
        {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}
