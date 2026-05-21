import { useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  Hospital,
  Bell,
  MessageSquare,
  User,
  LogOut,
  ChevronDown,
  Plus,
  CalendarPlus,
  UserPlus,
  Stethoscope,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import ThemeToggle from "@/components/ui/ThemeToggle"
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
    activeWhen: (p) => p === "/pacientes" || p.startsWith("/pacientes/"),
  },
  {
    to: "/records",
    label: "Prontuários",
    permission: "records:view",
    activeWhen: (p) => p === "/records" || p.startsWith("/prontuario/"),
  },
  { to: "/prescricoes/novo", label: "Prescrições", permission: "prescriptions:write" },
  {
    to: "/mensagens",
    label: "Mensagens",
    permission: "whatsapp:send",
    activeWhen: (p) => p === "/mensagens",
  },
  { to: "/configuracoes/usuarios", label: "Gestão", permission: "users:manage" },
  { to: "/configuracoes/clinicas", label: "Configurações", permission: "clinics:manage" },
]

export default function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clinicName, hasPermission, logout } = useAuth()
  const [quickOpen, setQuickOpen] = useState(false)

  const mainNav = allNav.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-surface/95 backdrop-blur">
      <div className="h-full px-4 lg:px-6 flex items-center gap-6">
        <NavLink to={mainNav[0]?.to ?? "/agenda"} className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Hospital className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-text leading-tight">ClinicHub</p>
            <p className="text-[10px] text-text-secondary leading-tight">
              {clinicName || "Clínica Geral"}
            </p>
          </div>
        </NavLink>

        <nav className="hidden lg:flex items-center gap-1 flex-1 overflow-x-auto">
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
                  "px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
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
                      Adicionar Paciente
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

          <button
            type="button"
            className="p-2 rounded-lg text-text-secondary hover:bg-surface-alt relative"
            title="Notificações"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
          </button>
          <button
            type="button"
            className="p-2 rounded-lg text-text-secondary hover:bg-surface-alt"
            title="Mensagens"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border ml-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-xs font-bold">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left max-w-[140px]">
              <p className="text-xs font-medium text-text truncate">
                {user?.name || "Usuário"}
              </p>
              <p className="text-[10px] text-text-secondary truncate">
                {user?.role || "ADMIN"}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
