import { useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  Hospital,
  MessageSquare,
  ChevronDown,
  Plus,
  CalendarPlus,
  UserPlus,
  Stethoscope,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { OutrosNavDropdown } from "@/components/outros/OutrosNavDropdown"
import { GestaoNavDropdown } from "@/components/gestao/GestaoNavDropdown"
import ThemeToggle from "@/components/ui/ThemeToggle"
import NotificationsMenu from "@/components/layout/NotificationsMenu"
import UserMenu from "@/components/layout/UserMenu"
import HeaderIconButton from "@/components/layout/HeaderIconButton"
import { useUnreadMessages } from "@/hooks/useUnreadMessages"
import { APP_NAME } from "@/lib/brand"
import type { Permission } from "@/lib/permissions"

type NavItem = {
  to: string
  label: string
  permission?: Permission
  /** Evita dois links na mesma rota ficarem ativos juntos. */
  activeWhen?: (pathname: string) => boolean
}

const allNav: NavItem[] = [
  { to: "/dashboard", label: "Painel", permission: "dashboard:view" },
  { to: "/agenda", label: "Agenda", permission: "agenda:view" },
  {
    to: "/pacientes",
    label: "Pacientes",
    permission: "patients:view",
    activeWhen: (p) =>
      p === "/pacientes" ||
      p.startsWith("/pacientes/") ||
      p.startsWith("/prontuario/") ||
      p.startsWith("/atendimento/") ||
      p.startsWith("/prescricoes/"),
  },
  {
    to: "/mensagens",
    label: "Mensagens",
    permission: "whatsapp:send",
    activeWhen: (p) => p === "/mensagens",
  },
  { to: "/configuracoes/clinicas", label: "Configurações", permission: "clinics:manage" },
]

export default function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { clinicName, hasPermission } = useAuth()
  const unreadMessages = useUnreadMessages()
  const [quickOpen, setQuickOpen] = useState(false)

  const mainNav = allNav.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-surface/95 backdrop-blur">
      <div className="h-full px-4 lg:px-6 flex items-center gap-6">
        <NavLink to={mainNav[0]?.to ?? "/agenda"} className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Hospital className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-text leading-tight">{APP_NAME}</p>
            <p className="text-[10px] text-text-secondary leading-tight">
              {clinicName || "Clínica Geral"}
            </p>
          </div>
        </NavLink>

        <nav className="hidden lg:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {mainNav.map(({ to, label, activeWhen }) => {
            const isActive = activeWhen
              ? activeWhen(location.pathname)
              : location.pathname === to || location.pathname.startsWith(`${to}/`)
            return (
              <NavLink
                key={`${to}-${label}`}
                to={to}
                className={() =>
                  cn(
                    "px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                    isActive
                      ? "bg-primary-light text-primary"
                      : "text-text-secondary hover:text-text hover:bg-surface-alt"
                  )
                }
              >
                {label}
              </NavLink>
            )
          })}
          <GestaoNavDropdown />
          <OutrosNavDropdown />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle compact />
          <div className="relative">
            <button
              type="button"
              onClick={() => setQuickOpen(!quickOpen)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark"
            >
              <Plus className="w-4 h-4" />
              Ações rápidas
              <ChevronDown className="w-3 h-3" />
            </button>
            {quickOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setQuickOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full mt-1 w-56 bg-surface rounded-xl border border-border shadow-lg z-50 py-1">
                  {hasPermission("agenda:manage") && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-surface-alt"
                      onClick={() => {
                        setQuickOpen(false)
                        navigate("/agenda", { state: { openNewAppointment: true } })
                      }}
                    >
                      <CalendarPlus className="w-4 h-4 text-primary" />
                      Novo Agendamento
                    </button>
                  )}
                  {hasPermission("patients:create") && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-surface-alt"
                      onClick={() => {
                        setQuickOpen(false)
                        navigate("/pacientes", { state: { openNewPatient: true } })
                      }}
                    >
                      <UserPlus className="w-4 h-4 text-primary" />
                      Adicionar paciente
                    </button>
                  )}
                  {hasPermission("users:manage") && (
                    <>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-surface-alt"
                        onClick={() => {
                          setQuickOpen(false)
                          navigate("/configuracoes/usuarios/profissional/novo")
                        }}
                      >
                        <Stethoscope className="w-4 h-4 text-primary" />
                        Adicionar Prof. de Saúde
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-surface-alt"
                        onClick={() => {
                          setQuickOpen(false)
                          navigate("/configuracoes/usuarios/novo")
                        }}
                      >
                        <UserPlus className="w-4 h-4 text-primary" />
                        Adicionar Recepcionista
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <NotificationsMenu />
          <HeaderIconButton
            icon={<MessageSquare className="h-5 w-5" />}
            label="Mensagens"
            badge={unreadMessages}
            onClick={() => navigate("/mensagens")}
          />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
