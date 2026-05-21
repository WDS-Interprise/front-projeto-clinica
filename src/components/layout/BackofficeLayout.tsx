import { Outlet, NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Shield,
  LogOut,
  ExternalLink,
  Building2,
  Users,
  UserCircle,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { backofficeApi, clearBackofficeSession } from "@/services/backoffice-api"
import ThemeToggle from "@/components/ui/ThemeToggle"

const navItems = [
  { to: "/backoffice", end: true, icon: LayoutDashboard, label: "Métricas" },
  { to: "/backoffice/clinicas", icon: Building2, label: "Clínicas" },
  { to: "/backoffice/usuarios", icon: Users, label: "Usuários" },
  { to: "/backoffice/pacientes", icon: UserCircle, label: "Pacientes" },
  { to: "/backoffice/plataforma", icon: Settings, label: "Plataforma" },
]

export default function BackofficeLayout() {
  const navigate = useNavigate()
  const user = backofficeApi.getStoredUser()

  const handleLogout = () => {
    clearBackofficeSession()
    navigate("/backoffice/login", { replace: true })
  }

  const initials = user.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
    : "AD"

  return (
    <div className="flex min-h-screen bg-surface-alt">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-surface flex flex-col">
        <div className="flex items-center justify-between gap-2 px-4 h-16 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-text truncate">Backoffice</h1>
              <p className="text-xs text-text-secondary truncate">Somente donos</p>
            </div>
          </div>
          <ThemeToggle compact />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "text-text-secondary hover:bg-surface-alt hover:text-text"
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-alt hover:text-text transition-colors mt-4"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir ClinMax
          </a>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{user.name || "Dono"}</p>
                <p className="text-xs text-text-secondary truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  )
}
