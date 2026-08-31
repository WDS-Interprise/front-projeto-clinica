import { Outlet, NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Receipt,
  Layers,
  Users,
  Plug,
  Bot,
  BarChart3,
  Settings,
  Lock,
  Search,
  Bell,
  Shield,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCompanyCopyright } from "@/lib/company-legal"
import { backofficeApi, clearBackofficeSession } from "@/services/backoffice-api"

const navItems = [
  { to: "/backoffice", end: true, icon: LayoutDashboard, label: "Visão geral" },
  { to: "/backoffice/clinicas", icon: Building2, label: "Clínicas" },
  { to: "/backoffice/planos", icon: Layers, label: "Planos" },
  { to: "/backoffice/assinaturas", icon: CreditCard, label: "Assinaturas" },
  { to: "/backoffice/cobrancas", icon: Receipt, label: "Cobranças" },
  { to: "/backoffice/usuarios", icon: Users, label: "Usuários" },
  { to: "/backoffice/integracoes", icon: Plug, label: "Integrações" },
  { to: "/backoffice/ia-automacao", icon: Bot, label: "IA e Automação" },
  { to: "/backoffice/relatorios", icon: BarChart3, label: "Relatórios" },
  { to: "/backoffice/plataforma", icon: Settings, label: "Configurações da plataforma" },
]

export default function BackofficeLayout() {
  const navigate = useNavigate()
  const user = backofficeApi.getStoredUser()

  const handleLogout = () => {
    clearBackofficeSession()
    navigate("/backoffice/login", { replace: true })
  }

  const initials = user.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AD"

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7F5]">
      <aside className="fixed left-0 top-0 z-40 flex h-full w-[248px] flex-col border-r border-[#E4EBE6] bg-white">
        <div className="border-b border-[#E4EBE6] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006B4D] text-white font-bold text-sm">
              CM
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#12261E] leading-tight">ClinMax</p>
              <p className="text-[11px] text-[#6B7C74]">Gestão de Clínicas Inteligente</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                  isActive
                    ? "bg-[#E8F6EE] text-[#006B4D]"
                    : "text-[#5B6B63] hover:bg-[#F4F7F5] hover:text-[#12261E]"
                )
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#E4EBE6] p-4">
          <div className="rounded-xl bg-[#F4F7F5] px-3 py-3">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#006B4D]" />
              <div>
                <p className="text-xs font-semibold text-[#12261E]">Ambiente privado</p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#6B7C74]">
                  Dados criptografados. Acesso restrito a proprietários.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="ml-[248px] flex h-full min-h-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 shrink-0 border-b border-[#E4EBE6] bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-4 px-6">
            <div className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8A9A90] md:flex">
              <Lock className="h-3.5 w-3.5" />
              Backoffice privado
              <span className="text-[#C5D0CA]">/</span>
              Console do proprietário
            </div>

            <div className="relative mx-auto hidden max-w-xl flex-1 md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9A90]" />
              <input
                type="search"
                placeholder="Buscar clínicas, usuários, cobranças..."
                className="h-10 w-full rounded-full border border-[#E4EBE6] bg-[#F4F7F5] pl-10 pr-4 text-sm text-[#12261E] placeholder:text-[#8A9A90] focus:border-[#006B4D]/40 focus:outline-none focus:ring-2 focus:ring-[#006B4D]/10"
              />
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="relative rounded-lg p-2 text-[#5B6B63] hover:bg-[#F4F7F5]"
                aria-label="Notificações"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#006B4D] text-[10px] font-bold text-white">
                  3
                </span>
              </button>

              <div className="hidden items-center gap-1.5 rounded-full border border-[#E4EBE6] bg-[#F4F7F5] px-3 py-1.5 text-xs font-medium text-[#006B4D] sm:flex">
                <Shield className="h-3.5 w-3.5" />
                Ambiente seguro
              </div>

              <div className="flex items-center gap-2 pl-1">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-[#12261E]">{user.name || "Administrador"}</p>
                  <p className="text-xs text-[#6B7C74]">Proprietário</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#006B4D] text-xs font-bold text-white">
                  {initials}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-[#8A9A90] hover:bg-red-50 hover:text-red-600"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>

        <footer className="shrink-0 border-t border-[#E4EBE6] bg-white px-6 py-4 text-xs text-[#8A9A90]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>ClinMax Backoffice v2.4.0</span>
            <span>{formatCompanyCopyright()}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
