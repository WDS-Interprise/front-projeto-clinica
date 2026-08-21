import { NavLink, useLocation } from "react-router-dom"
import { BookOpen, Pill, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import {
  canAccessClinicalToolsItem,
  clinicalToolsItems,
} from "@/lib/clinical-tools-nav"

const navActive = "bg-[#E8F6EE] text-[#006B4D]"
const navIdle = "text-[#1B2E26] hover:bg-[#F4F7F5]"

const itemIcons: Record<string, LucideIcon> = {
  Medicamentos: Pill,
  "CID-10": BookOpen,
  "CID-11": BookOpen,
}

export default function ClinicalToolsSidebar() {
  const { hasPermission } = useAuth()
  const location = useLocation()
  const items = clinicalToolsItems.filter((item) =>
    canAccessClinicalToolsItem(hasPermission, item)
  )

  return (
    <aside className="flex h-full w-[268px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-[#E4EBE6] bg-white">
      <div className="shrink-0 border-b border-[#E4EBE6] px-5 py-4">
        <p className="select-none text-[17px] font-bold leading-tight text-[#12261E]">
          Ferramentas clínicas
        </p>
        <p className="mt-0.5 text-[13px] text-[#6B7C74]">
          Medicamentos, CID e referências
        </p>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2.5 py-4">
        {items.map((item) => {
          const Icon = itemIcons[item.label] ?? Pill
          const isActive =
            location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col gap-0.5 rounded-lg px-3 py-[9px] transition-colors",
                isActive ? navActive : navIdle
              )}
            >
              <span className="flex items-center gap-3 text-[13.5px] font-medium">
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isActive ? "text-[#006B4D]" : "text-[#5B6B63]"
                  )}
                />
                {item.label}
              </span>
              <span className="pl-[30px] text-[11.5px] text-[#6B7C74]">{item.description}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
