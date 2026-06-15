import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import SettingsLayout from "@/components/layout/SettingsLayout"
import { gestaoItems, canAccessGestaoItem } from "@/lib/gestao-nav"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

type Props = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function GestaoPageShell({ title, description, children, className }: Props) {
  const { hasPermission } = useAuth()
  const nav = gestaoItems.filter((item) => canAccessGestaoItem(hasPermission, item))

  return (
    <SettingsLayout className={className}>
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary px-2 mb-2">
            Gestão
          </p>
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm transition-colors",
                  "text-text-secondary hover:bg-surface-alt hover:text-text"
                )}
              >
                {item.label}
                {!item.implemented && (
                  <span className="ml-1 text-[10px] text-text-secondary">(em breve)</span>
                )}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-text">{title}</h1>
            {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </SettingsLayout>
  )
}
