import { useCallback, useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  ChevronDown,
  HelpCircle,
  LogOut,
  Palette,
  Settings,
  Shield,
  User,
  UserCircle,
} from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import UserAvatar from "@/components/user/UserAvatar"
import { useClickOutside } from "@/hooks/useClickOutside"
import { useUserAvatar } from "@/hooks/useUserAvatar"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  DOCTOR: "Médico",
  RECEPTION: "Recepção",
}

type MenuItem = {
  label: string
  icon: typeof User
  to: string
}

const menuItems: MenuItem[] = [
  { label: "Minha conta", icon: UserCircle, to: "/configuracoes/conta" },
  { label: "Editar perfil", icon: User, to: "/configuracoes/conta" },
  { label: "Configurações", icon: Settings, to: "/configuracoes/clinicas" },
  { label: "Preferências", icon: Palette, to: "/configuracoes/aparencia" },
  { label: "Segurança", icon: Shield, to: "/configuracoes/conta" },
  { label: "Ajuda e suporte", icon: HelpCircle, to: "/dashboard" },
]

export default function UserMenu() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { imageUrl, name } = useUserAvatar()
  const [open, setOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])
  const ref = useClickOutside<HTMLDivElement>(open, close)

  useEffect(() => {
    if (!logoutOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLogoutOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [logoutOpen])

  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : "Usuário"

  const confirmLogout = () => {
    setLogoutOpen(false)
    close()
    logout()
    navigate("/login")
  }

  if (!user) return null

  return (
    <>
      <div ref={ref} className="relative border-l border-border pl-2 ml-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-xl border border-transparent py-1.5 pl-2 pr-2 transition-all duration-200",
            "hover:border-border/80 hover:bg-surface-alt/80",
            open && "border-border bg-surface-alt"
          )}
        >
          <UserAvatar name={name} imageUrl={imageUrl} size="sm" />
          <div className="hidden max-w-[140px] text-left md:block">
            <p className="truncate text-xs font-medium text-text">{user.name}</p>
            <p className="truncate text-[10px] text-text-secondary">{roleLabel}</p>
          </div>
          <ChevronDown
            className={cn(
              "hidden h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200 md:block",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div
            role="menu"
            className={cn(
              "absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,320px)] overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-xl",
              "animate-in fade-in zoom-in-95 duration-200"
            )}
          >
            <div className="border-b border-border px-4 py-4">
              <div className="flex items-center gap-3">
                <UserAvatar name={user.name} imageUrl={imageUrl} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{user.name}</p>
                  <p className="text-xs text-text-secondary">{roleLabel}</p>
                  <p className="mt-0.5 truncate text-[11px] text-text-secondary/80">
                    {user.email}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online
                  </span>
                </div>
              </div>
            </div>

            <nav className="py-1">
              {menuItems.map(({ label, icon: Icon, to }) => (
                <NavLink
                  key={label}
                  to={to}
                  role="menuitem"
                  onClick={close}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text transition-colors hover:bg-surface-alt"
                >
                  <Icon className="h-4 w-4 shrink-0 text-text-secondary" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-border py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close()
                  setLogoutOpen(true)
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Sair da conta"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-danger text-white hover:bg-danger/90"
              onClick={confirmLogout}
            >
              Sair da conta
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-text-secondary">
          Deseja sair da sua conta?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Você será desconectado do sistema e precisará fazer login novamente para acessar a
          plataforma.
        </p>
      </Modal>
    </>
  )
}
