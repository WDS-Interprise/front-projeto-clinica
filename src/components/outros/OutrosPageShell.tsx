import type { ReactNode } from "react"
import SettingsLayout from "@/components/layout/SettingsLayout"

type Props = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function OutrosPageShell({ title, description, children, className }: Props) {
  return (
    <SettingsLayout className={className}>
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {children}
    </SettingsLayout>
  )
}
