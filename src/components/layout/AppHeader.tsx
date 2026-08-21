import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { createPortal } from "react-dom"
import {
  Calendar,
  CalendarPlus,
  ChevronDown,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Stethoscope,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react"
import { navItemClass } from "@/lib/nav-ui"
import { useAuth } from "@/context/AuthContext"
import { GestaoNavDropdown } from "@/components/gestao/GestaoNavDropdown"
import { ClinicalToolsNavDropdown } from "@/components/clinical/ClinicalToolsNavDropdown"
import AppLogo from "@/components/brand/AppLogo"
import NotificationsMenu from "@/components/layout/NotificationsMenu"
import ClinicSwitcher from "@/components/layout/ClinicSwitcher"
import UserMenu from "@/components/layout/UserMenu"
import HeaderIconButton from "@/components/layout/HeaderIconButton"
import { useUnreadMessages } from "@/hooks/useUnreadMessages"
import { usePlanFeatures } from "@/context/PlanFeatureContext"
import { useAnchoredDropdown } from "@/hooks/useAnchoredDropdown"
import type { Permission } from "@/lib/permissions"

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  permission?: Permission
  planFeature?: import("@/lib/plan-features").PlanFeature
  visible?: (has: (p: Permission) => boolean) => boolean
  resolveTo?: (has: (p: Permission) => boolean) => string
  activeWhen?: (pathname: string) => boolean
}

const allNav: NavItem[] = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard, permission: "dashboard:view" },
  { to: "/agenda", label: "Agenda", icon: Calendar, permission: "agenda:view" },
  {
    to: "/pacientes",
    label: "Pacientes",
    icon: User,
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
    icon: MessageSquare,
    permission: "whatsapp:send",
    planFeature: "WHATSAPP",
    activeWhen: (p) => p === "/mensagens",
  },
]

export default function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { hasFeature } = usePlanFeatures()
  const unreadMessages = useUnreadMessages()
  const {
    anchorRef: quickRef,
    menuRef: quickMenuRef,
    open: quickOpen,
    toggle: toggleQuick,
    close: closeQuick,
    menuStyle: quickMenuStyle,
  } = useAnchoredDropdown("right")

  const mainNav = allNav.filter((item) => {
    if (item.planFeature && !hasFeature(item.planFeature)) return false
    return item.visible ? item.visible(hasPermission) : !item.permission || hasPermission(item.permission)
  })
  const showMessagesInNav = mainNav.some((item) => item.to === "/mensagens")

  return (
    <header className="fixed top-0 right-0 left-0 z-50 h-16 border-b border-[#E6EEE9] bg-white">
      <div className="flex h-full min-w-0 items-center gap-2 px-2 sm:gap-3 sm:px-3">
        <NavLink
          to={mainNav[0]?.to ?? "/agenda"}
          className="relative z-10 block h-12 w-[132px] shrink-0 overflow-hidden sm:w-[150px] xl:w-[172px]"
        >
          <AppLogo
            size="lg"
            rounded={false}
            className="absolute top-1/2 left-0 h-14 max-w-none origin-left -translate-y-1/2 scale-[1.32] sm:scale-[1.42] xl:h-16 xl:scale-[1.55]"
          />
        </NavLink>

        <nav className="hidden min-w-0 flex-1 items-center gap-0 overflow-x-auto lg:flex lg:overflow-x-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mainNav.map(({ to, label, icon: Icon, activeWhen, resolveTo }) => {
            const href = resolveTo ? resolveTo(hasPermission) : to
            const isActive = activeWhen
              ? activeWhen(location.pathname)
              : location.pathname === href || location.pathname.startsWith(`${href}/`)
            return (
              <NavLink
                key={`${href}-${label}`}
                to={href}
                title={label}
                className={navItemClass(isActive, true)}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                <span>{label}</span>
              </NavLink>
            )
          })}
          <ClinicalToolsNavDropdown compact />
          <GestaoNavDropdown compact />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="relative">
            <button
              ref={quickRef}
              type="button"
              onClick={toggleQuick}
              className="hidden h-9 items-center gap-1.5 rounded-lg bg-[#006B4D] px-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-[#005840] sm:flex xl:px-3"
              title="Ações rápidas"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">Ações rápidas</span>
              <ChevronDown className="hidden h-3.5 w-3.5 lg:block" />
            </button>
            {quickOpen &&
              createPortal(
                <>
                  <div className="fixed inset-0 z-[100]" onClick={closeQuick} aria-hidden />
                  <div
                    ref={quickMenuRef}
                    className="fixed z-[101] w-56 rounded-xl border border-[#E6EEE9] bg-white py-1 shadow-lg"
                    style={quickMenuStyle}
                  >
                  {hasPermission("agenda:manage") && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#1B2E26] hover:bg-[#F3F7F5]"
                      onClick={() => {
                        closeQuick()
                        navigate("/agenda", { state: { openNewAppointment: true } })
                      }}
                    >
                      <CalendarPlus className="h-4 w-4 text-[#006B4D]" />
                      Novo Agendamento
                    </button>
                  )}
                  {hasPermission("patients:create") && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#1B2E26] hover:bg-[#F3F7F5]"
                      onClick={() => {
                        closeQuick()
                        navigate("/pacientes", { state: { openNewPatient: true } })
                      }}
                    >
                      <UserPlus className="h-4 w-4 text-[#006B4D]" />
                      Adicionar paciente
                    </button>
                  )}
                  {hasPermission("users:manage") && (
                    <>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#1B2E26] hover:bg-[#F3F7F5]"
                        onClick={() => {
                          closeQuick()
                          navigate("/configuracoes/usuarios/profissional/novo")
                        }}
                      >
                        <Stethoscope className="h-4 w-4 text-[#006B4D]" />
                        Adicionar Prof. de Saúde
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#1B2E26] hover:bg-[#F3F7F5]"
                        onClick={() => {
                          closeQuick()
                          navigate("/configuracoes/usuarios/novo")
                        }}
                      >
                        <UserPlus className="h-4 w-4 text-[#006B4D]" />
                        Adicionar Recepcionista
                      </button>
                    </>
                  )}
                  </div>
                </>,
                document.body
              )}
          </div>

          <NotificationsMenu />
          <ClinicSwitcher />
          {!showMessagesInNav && (
            <HeaderIconButton
              icon={<MessageSquare className="h-5 w-5" strokeWidth={1.75} />}
              label="Mensagens"
              badge={unreadMessages}
              onClick={() => navigate("/mensagens")}
            />
          )}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
