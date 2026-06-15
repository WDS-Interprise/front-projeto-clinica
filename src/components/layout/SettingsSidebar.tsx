import { useEffect, useRef, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  BookOpen,
  Building2,
  CalendarClock,
  ChevronDown,
  ExternalLink,
  LogOut,
  Mail,
  MessageCircle,
  Palette,
  Pill,
  Settings2,
  Sparkles,
  UserCircle,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { outrosItems, canAccessOutrosItem, isOutrosPath } from "@/lib/outros-nav"
import type { Permission } from "@/lib/permissions"

type SettingsNavItem = {
  to: string
  label: string
  description: string
  icon: LucideIcon
  permission?: Permission
}

type SettingsNavGroup = {
  title: string
  items: SettingsNavItem[]
}

const groups: SettingsNavGroup[] = [
  {
    title: "Clínica",
    items: [
      {
        to: "/configuracoes/clinicas",
        label: "Dados da clínica",
        description: "Nome, contato e identidade",
        icon: Building2,
        permission: "clinics:manage",
      },
      {
        to: "/configuracoes/agenda",
        label: "Horários da agenda",
        description: "Expediente, almoço e slots",
        icon: CalendarClock,
        permission: "clinics:manage",
      },
      {
        to: "/configuracoes/financeiro",
        label: "Financeiro",
        description: "Contas, categorias e padrões",
        icon: Wallet,
        permission: "clinics:manage",
      },
      {
        to: "/configuracoes/convites",
        label: "Convites",
        description: "Código da clínica e e-mail",
        icon: Mail,
        permission: "clinics:manage",
      },
    ],
  },
  {
    title: "Equipe",
    items: [
      {
        to: "/configuracoes/usuarios",
        label: "Usuários da clínica",
        description: "Profissionais e recepção",
        icon: Users,
        permission: "users:manage",
      },
    ],
  },
  {
    title: "Integrações",
    items: [
      {
        to: "/configuracoes/whatsapp",
        label: "WhatsApp",
        description: "Conexões, templates e lembretes",
        icon: MessageCircle,
        permission: "clinics:manage",
      },
    ],
  },
  {
    title: "Preferências",
    items: [
      {
        to: "/configuracoes/aparencia",
        label: "Aparência",
        description: "Tema claro ou escuro",
        icon: Palette,
      },
    ],
  },
]

const outrosIcons: Record<string, LucideIcon> = {
  Bulas: Pill,
  "CID 10": BookOpen,
  "CID 11": BookOpen,
}

function NavItem({ item }: { item: SettingsNavItem }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
            : "text-text-secondary hover:bg-surface-alt hover:text-text"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-primary text-white shadow-sm shadow-primary/25"
                : "bg-surface-alt text-text-secondary group-hover:bg-primary/10 group-hover:text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium leading-tight">{item.label}</span>
            <span
              className={cn(
                "mt-0.5 block text-[11px] leading-snug",
                isActive ? "text-primary/80" : "text-text-secondary/80"
              )}
            >
              {item.description}
            </span>
          </span>
        </>
      )}
    </NavLink>
  )
}

function OutrosAccordion() {
  const { hasPermission } = useAuth()
  const location = useLocation()

  const items = outrosItems.filter((item) => canAccessOutrosItem(hasPermission, item))
  const onOutrosRoute = isOutrosPath(location.pathname)
  const [open, setOpen] = useState(onOutrosRoute)

  useEffect(() => {
    if (onOutrosRoute) setOpen(true)
  }, [onOutrosRoute])

  if (items.length === 0) return null

  return (
    <div>
      <div className="mb-4 border-t border-border/70" />
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary/70">
        Referências clínicas
      </p>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-surface-alt/30">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between gap-2 px-3 py-3 text-left transition-colors hover:bg-surface-alt/60",
            open && "border-b border-border/70"
          )}
          aria-expanded={open}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">Bulas e CID</p>
            <p className="text-[10px] text-text-secondary">Referências para consulta</p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <nav className="overflow-hidden">
            <div className="space-y-0.5 p-2">
              {items.map((item) => {
                const Icon = outrosIcons[item.label] ?? BookOpen
                const isActive =
                  location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "group flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                        : "text-text-secondary hover:bg-surface-alt hover:text-text"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                        isActive
                          ? "bg-primary text-white shadow-sm shadow-primary/25"
                          : "bg-surface-alt text-text-secondary group-hover:bg-primary/10 group-hover:text-primary"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-tight">{item.label}</span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[10px] leading-snug",
                          isActive ? "text-primary/80" : "text-text-secondary/80"
                        )}
                      >
                        {item.description}
                      </span>
                    </span>
                  </NavLink>
                )
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}

function SidebarUserMenu({
  initials,
  name,
  email,
}: {
  initials: string
  name: string
  email: string
}) {
  const { logout, clinicName } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate("/login")
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors",
          open ? "bg-surface-alt" : "hover:bg-surface-alt/80"
        )}
        aria-expanded={open}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary text-xs font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">{name}</p>
          <p className="truncate text-[11px] text-text-secondary">{email}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-1.5 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
          {clinicName && (
            <p className="border-b border-border px-3 py-2 text-[11px] text-text-secondary truncate">
              {clinicName}
            </p>
          )}
          <NavLink
            to="/configuracoes/conta"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-text transition-colors hover:bg-surface-alt"
          >
            <UserCircle className="h-4 w-4 shrink-0 text-text-secondary" />
            Minha conta
          </NavLink>
          <NavLink
            to="/configuracoes/aparencia"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-text transition-colors hover:bg-surface-alt"
          >
            <Palette className="h-4 w-4 shrink-0 text-text-secondary" />
            Aparência
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sair da conta
          </button>
        </div>
      )}
    </div>
  )
}

export default function SettingsSidebar() {
  const { hasPermission, user, clinicName } = useAuth()

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
    }))
    .filter((group) => group.items.length > 0)

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CL"

  return (
    <aside className="sticky top-0 flex h-[calc(100vh-5rem)] w-72 shrink-0 flex-col self-start overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="shrink-0 border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-sm shadow-primary/20">
            <Settings2 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text">Configurações</p>
            <p className="truncate text-xs text-text-secondary">{clinicName ?? "Sua clínica"}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-hidden p-3">
        {visibleGroups.map((group, index) => (
          <div key={group.title}>
            {index > 0 && <div className="mb-4 border-t border-border/70" />}
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary/70">
              {group.title}
            </p>
            <nav className="space-y-1">
              {group.items.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </nav>
          </div>
        ))}

        <OutrosAccordion />
      </div>

      <div className="mt-auto shrink-0 space-y-3 border-t border-border p-4">
        <div className="rounded-xl bg-surface-alt/80 p-3 ring-1 ring-border/60">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <p className="text-[11px] font-semibold uppercase tracking-wide">Plataforma</p>
          </div>
          <p className="text-xs leading-relaxed text-text-secondary">
            Assinatura, cobrança e exportação ficam no{" "}
            <a
              href="/backoffice/plataforma"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
            >
              backoffice
              <ExternalLink className="h-3 w-3" />
            </a>
            .
          </p>
        </div>

        {user && (
          <SidebarUserMenu initials={initials} name={user.name} email={user.email} />
        )}
      </div>
    </aside>
  )
}
