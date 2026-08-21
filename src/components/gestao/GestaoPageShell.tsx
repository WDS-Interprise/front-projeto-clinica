import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import {
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { gestaoItems, canAccessGestaoItem } from "@/lib/gestao-nav"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

const navActive = "bg-[#E8F6EE] text-[#006B4D]"
const navIdle = "text-[#1B2E26] hover:bg-[#F4F7F5]"

type Props = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function GestaoPageShell({ title, description, children, className }: Props) {
  const { hasPermission } = useAuth()
  const nav = gestaoItems.filter((item) => canAccessGestaoItem(hasPermission, item))
  const financeItems = nav.filter((item) => item.group === "financas")
  const operacaoItems = nav.filter((item) => item.group === "operacao")
  const hasFinance = financeItems.length > 0

  return (
    <div className="flex h-full min-h-0 gap-5 overflow-hidden bg-[#F4F7F5] p-5">
      <aside className="flex h-full w-[268px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-[#E4EBE6] bg-white">
        <div className="flex shrink-0 items-center gap-2.5 border-b border-[#E4EBE6] px-5 py-4">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F6EE] text-[#006B4D]">
            <Wallet className="h-4 w-4" />
          </span>
          <p className="text-[17px] font-bold leading-tight text-[#12261E]">
            {hasFinance ? "Finanças" : "Gestão"}
          </p>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
          {financeItems.length > 0 && (
            <NavGroup title="Caixa" items={financeItems} />
          )}
          {operacaoItems.length > 0 && (
            <NavGroup title="Operação" items={operacaoItems} />
          )}
        </div>
      </aside>

      <div className={cn("min-h-0 min-w-0 flex-1 overflow-auto", className)}>
        <div className="mb-5">
          <h1 className="text-[28px] font-bold leading-tight text-[#12261E]">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[#6B7C74]">{description}</p>
          )}
        </div>
        <div className="space-y-5 pb-2">{children}</div>
      </div>
    </div>
  )
}

function NavGroup({
  title,
  items,
}: {
  title: string
  items: Array<{ to: string; label: string; icon: LucideIcon }>
}) {
  return (
    <div>
      <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A9A90]">
        {title}
      </p>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/gestao/financas"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-[9px] text-[13.5px] font-medium transition-colors",
                  isActive ? navActive : navIdle
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-[#006B4D]" : "text-[#5B6B63]")} />
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
