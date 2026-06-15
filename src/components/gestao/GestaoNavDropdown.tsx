import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useLocation, useNavigate } from "react-router-dom"
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  Package,
  Smile,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { gestaoNavItemsForHeader, canAccessGestaoItem, isGestaoPath } from "@/lib/gestao-nav"

const itemIcons: Record<string, LucideIcon> = {
  Finanças: Wallet,
  Relatórios: BarChart3,
  Estoque: Package,
  TISS: ClipboardList,
  Pesquisa: Smile,
}

export function GestaoNavDropdown() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  const items = gestaoNavItemsForHeader().filter((item) =>
    canAccessGestaoItem(hasPermission, {
      to: item.to,
      label: item.label,
      description: "",
      anyPermission: item.anyPermission,
    })
  )

  if (items.length === 0) return null

  const active = isGestaoPath(location.pathname)

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
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
          active || open
            ? "bg-primary-light text-primary"
            : "text-text-secondary hover:text-text hover:bg-surface-alt"
        )}
      >
        Gestão
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[100]" aria-hidden onClick={() => setOpen(false)} />
            <div
              ref={menuRef}
              className="fixed z-[101] min-w-[220px] rounded-xl border border-border bg-surface shadow-xl py-1.5"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {items.map((item) => {
                const Icon = itemIcons[item.label] ?? Wallet
                const isActive =
                  location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => goTo(item.to)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                      isActive
                        ? "bg-primary-light text-primary font-medium"
                        : "text-text hover:bg-surface-alt"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-text-secondary" />
                    {item.label}
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
