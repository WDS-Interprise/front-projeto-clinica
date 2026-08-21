import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useLocation, useNavigate } from "react-router-dom"
import { BookOpen, ChevronDown, Pill, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { navItemClass } from "@/lib/nav-ui"
import { useAuth } from "@/context/AuthContext"
import { usePlanFeatures } from "@/context/PlanFeatureContext"
import {
  canAccessClinicalToolsItem,
  clinicalToolsItems,
  isClinicalToolsPath,
} from "@/lib/clinical-tools-nav"

const itemIcons: Record<string, LucideIcon> = {
  Medicamentos: Pill,
  "CID-10": BookOpen,
  "CID-11": BookOpen,
}

export function ClinicalToolsNavDropdown({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { hasFeature } = usePlanFeatures()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  const items = clinicalToolsItems.filter((item) =>
    canAccessClinicalToolsItem(hasPermission, item, hasFeature)
  )

  const active = isClinicalToolsPath(location.pathname)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener("mousedown", onDoc)
    window.addEventListener("scroll", onScroll, true)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      window.removeEventListener("scroll", onScroll, true)
    }
  }, [open])

  if (items.length === 0) return null

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 6, left: rect.left })
    }
    setOpen((v) => !v)
  }

  const goTo = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className={navItemClass(active || open, compact)}
        title="Ferramentas clínicas"
      >
        {compact ? (
          <>
            <Pill className="h-[18px] w-[18px] shrink-0 xl:hidden" strokeWidth={1.75} />
            <span className="hidden xl:inline">Ferramentas clínicas</span>
          </>
        ) : (
          "Ferramentas clínicas"
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[100]" aria-hidden onClick={() => setOpen(false)} />
            <div
              ref={menuRef}
              className="fixed z-[101] min-w-[240px] rounded-xl border border-border bg-surface shadow-xl py-1.5"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {items.map((item) => {
                const Icon = itemIcons[item.label] ?? Pill
                const isActive =
                  location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => goTo(item.to)}
                    className={cn(
                      "w-full flex flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors",
                      isActive
                        ? "bg-primary-light text-primary"
                        : "text-text hover:bg-surface-alt"
                    )}
                  >
                    <span className="flex items-center gap-3 text-sm font-medium">
                      <Icon className="w-4 h-4 shrink-0 text-text-secondary" />
                      {item.label}
                    </span>
                    <span className="pl-7 text-xs text-text-secondary">{item.description}</span>
                  </button>
                )
              })}
            </div>
          </>,
          document.body
        )}
    </>
  )
}
