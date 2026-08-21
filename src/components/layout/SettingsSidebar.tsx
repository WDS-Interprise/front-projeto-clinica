import { useEffect, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  BookOpen,
  Building2,
  CalendarClock,
  ChevronDown,
  Bot,
  CreditCard,
  ExternalLink,
  Info,
  LogOut,
  Mail,
  MessageCircle,
  Palette,
  Phone,
  ScrollText,
  UserCircle,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { outrosItems, canAccessOutrosItem, isOutrosPath } from "@/lib/outros-nav"
import type { Permission } from "@/lib/permissions"

const navActive = "bg-[#E8F6EE] text-[#006B4D]"
const navIdle = "text-[#1B2E26] hover:bg-[#F4F7F5]"

type SettingsNavItem = {
  to: string
  label: string
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
      { to: "/configuracoes/clinicas", label: "Dados da clínica", icon: Building2, permission: "clinics:manage" },
      { to: "/configuracoes/agenda", label: "Horários da agenda", icon: CalendarClock, permission: "clinics:manage" },
      { to: "/configuracoes/financeiro", label: "Financeiro (cadastros)", icon: Wallet, permission: "clinics:manage" },
      { to: "/configuracoes/whatsapp", label: "WhatsApp", icon: MessageCircle, permission: "clinics:manage" },
      { to: "/configuracoes/inteligencia-artificial", label: "Inteligência Artificial", icon: Bot, permission: "clinics:manage" },
    ],
  },
  {
    title: "Equipe",
    items: [
      { to: "/configuracoes/convites", label: "Convites", icon: Mail, permission: "invites:manage" },
      { to: "/configuracoes/cargos", label: "Cargos e permissões", icon: Users, permission: "users:manage" },
      { to: "/configuracoes/usuarios", label: "Usuários da clínica", icon: Users, permission: "users:manage" },
    ],
  },
  {
    title: "Integrações",
    items: [
      { to: "/configuracoes/whatsapp", label: "WhatsApp", icon: MessageCircle, permission: "clinics:manage" },
    ],
  },
  {
    title: "Conta e plano",
    items: [
      { to: "/configuracoes/plano", label: "Plano e assinatura", icon: CreditCard, permission: "clinics:manage" },
    ],
  },
  {
    title: "Preferências",
    items: [
      { to: "/configuracoes/aparencia", label: "Aparência", icon: Palette },
    ],
  },
]

const outrosIcons: Record<string, LucideIcon> = {
  Contatos: Phone,
  "Logs de agenda": ScrollText,
}

function NavItem({ item }: { item: SettingsNavItem }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn("flex items-center gap-3 rounded-lg px-3 py-[9px] text-[13.5px] font-medium transition-colors", isActive ? navActive : navIdle)
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
}

function OutrosAccordion() {
  const { hasPermission } = useAuth()
  const location = useLocation()
  const items = outrosItems.filter((item) => canAccessOutrosItem(hasPermission, item))
  const onOutrosRoute = isOutrosPath(location.pathname)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (onOutrosRoute) setOpen(true)
  }, [onOutrosRoute])

  if (items.length === 0) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-1 flex w-full items-center justify-between px-3 py-1 text-left"
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A9A90]">
          Utilitários
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-[#8A9A90] transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <nav className="space-y-0.5">
          {items.map((item) => {
            const Icon = outrosIcons[item.label] ?? BookOpen
            const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-[9px] text-[13.5px] font-medium transition-colors",
                  isActive ? navActive : navIdle
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-[#006B4D]" : "text-[#5B6B63]")} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      )}
    </div>
  )
}

export default function SettingsSidebar() {
  const { hasPermission, clinicName, logout } = useAuth()
  const navigate = useNavigate()

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <aside className="flex h-full w-[268px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-[#E4EBE6] bg-white">
      <div className="shrink-0 border-b border-[#E4EBE6] px-5 py-4">
        <p className="select-none text-[17px] font-bold leading-tight text-[#12261E]">Configurações</p>
        <p className="mt-0.5 truncate text-[13px] text-[#6B7C74]">{clinicName ?? "Sua clínica"}</p>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
        {visibleGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A9A90]">
              {group.title}
            </p>
            <nav className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={`${group.title}-${item.to}`} item={item} />
              ))}
            </nav>
          </div>
        ))}
        <OutrosAccordion />
      </div>

      <div className="shrink-0 space-y-2 border-t border-[#E4EBE6] p-3">
        <div className="flex gap-2 rounded-xl bg-[#EAF4FF] px-3 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2B6CB0]" />
          <div>
            <p className="text-[12px] leading-snug text-[#3D4F5F]">
              Cobrança da plataforma e gestão comercial ficam no backoffice do proprietário.
            </p>
            <a
              href="/backoffice/plataforma"
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1D4ED8] hover:underline"
            >
              Acessar backoffice
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <NavLink
          to="/configuracoes/conta"
          className={({ isActive }) =>
            cn("flex items-center gap-3 rounded-lg px-3 py-[9px] text-[13.5px] font-medium", isActive ? navActive : navIdle)
          }
        >
          <UserCircle className="h-[18px] w-[18px] text-[#5B6B63]" />
          Minha conta
        </NavLink>
        <button
          type="button"
          onClick={() => {
            logout()
            navigate("/login")
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-[9px] text-[13.5px] font-medium text-[#DC2626] hover:bg-red-50"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sair da conta
        </button>
      </div>
    </aside>
  )
}
