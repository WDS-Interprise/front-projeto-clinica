import type { Permission } from "@/lib/permissions"

export type OutrosItem = {
  to: string
  label: string
  description: string
  /** Pelo menos uma permissão necessária; vazio = todos autenticados */
  anyPermission?: Permission[]
}

export const outrosItems: OutrosItem[] = [
  {
    to: "/outros/bulas",
    label: "Bulas",
    description: "Medicamentos e posologia",
    anyPermission: ["records:view", "prescriptions:write"],
  },
  {
    to: "/outros/cid-10",
    label: "CID 10",
    description: "Classificação — 10ª revisão",
    anyPermission: ["records:view", "prescriptions:write"],
  },
  {
    to: "/outros/cid-11",
    label: "CID 11",
    description: "Classificação — 11ª revisão",
    anyPermission: ["records:view", "prescriptions:write"],
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
