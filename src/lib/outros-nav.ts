import type { Permission } from "@/lib/permissions"

export type OutrosItem = {
  to: string
  label: string
  description: string
  /** Pelo menos uma permissão necessária; vazio = todos autenticados */
  anyPermission?: Permission[]
}

/** Itens administrativos que permanecem em Configurações */
export const outrosItems: OutrosItem[] = [
  {
    to: "/outros/contatos",
    label: "Contatos",
    description: "Pacientes, profissionais e equipe",
    anyPermission: ["patients:view"],
  },
  {
    to: "/outros/logs",
    label: "Logs de agenda",
    description: "Auditoria de alterações",
    anyPermission: ["users:manage"],
  },
]

export function canAccessOutrosItem(
  hasPermission: (p: Permission) => boolean,
  item: OutrosItem
) {
  if (!item.anyPermission?.length) return true
  return item.anyPermission.some((p) => hasPermission(p))
}

export function isOutrosPath(pathname: string) {
  return pathname.startsWith("/outros")
}

export function isSettingsPath(pathname: string) {
  return pathname.startsWith("/configuracoes")
}

export function isSettingsOrOutrosPath(pathname: string) {
  if (pathname.startsWith("/configuracoes")) return true
  if (pathname === "/outros/contatos" || pathname.startsWith("/outros/contatos/")) return true
  if (pathname === "/outros/logs" || pathname.startsWith("/outros/logs/")) return true
  return false
}

export function canSeeSettingsNav(hasPermission: (p: Permission) => boolean) {
  if (hasPermission("clinics:manage")) return true
  return outrosItems.some((item) => canAccessOutrosItem(hasPermission, item))
}

export function settingsNavHome(hasPermission: (p: Permission) => boolean) {
  if (hasPermission("clinics:manage")) return "/configuracoes/clinicas"
  return outrosItems.find((item) => canAccessOutrosItem(hasPermission, item))?.to ?? "/configuracoes/aparencia"
}
