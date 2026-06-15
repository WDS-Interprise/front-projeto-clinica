import type { Permission } from "@/lib/permissions"

export type GestaoItem = {
  to: string
  label: string
  description: string
  anyPermission?: Permission[]
  implemented?: boolean
}

export const gestaoItems: GestaoItem[] = [
  { to: "/gestao/financas", label: "Finanças", description: "Saldo e resumo", anyPermission: ["finance:view"], implemented: true },
  { to: "/gestao/financas/extrato", label: "Extrato", description: "Todos os lançamentos", anyPermission: ["finance:view"], implemented: true },
  { to: "/gestao/financas/receitas", label: "Receitas", description: "Entradas financeiras", anyPermission: ["finance:view"], implemented: true },
  { to: "/gestao/financas/despesas", label: "Despesas", description: "Saídas financeiras", anyPermission: ["finance:view"], implemented: true },
  { to: "/gestao/financas/fluxo-de-caixa", label: "Fluxo de caixa", description: "Visão diária/mensal", anyPermission: ["finance:view"], implemented: true },
  { to: "/gestao/relatorios", label: "Relatórios", description: "Atendimentos e indicadores", anyPermission: ["reports:view"], implemented: true },
  { to: "/gestao/estoque", label: "Estoque", description: "Produtos e movimentações", anyPermission: ["finance:view"], implemented: true },
  { to: "/gestao/tiss", label: "TISS", description: "Guias de consulta", anyPermission: ["finance:view"], implemented: true },
  { to: "/gestao/pesquisa-satisfacao", label: "Pesquisa de satisfação", description: "Envios e resultados", anyPermission: ["reports:view"], implemented: true },
]

export function canAccessGestaoItem(hasPermission: (p: Permission) => boolean, item: GestaoItem) {
  if (!item.anyPermission?.length) return true
  return item.anyPermission.some((p) => hasPermission(p))
}

export function isGestaoPath(pathname: string) {
  return pathname.startsWith("/gestao")
}

export function gestaoNavItemsForHeader() {
  return [
    { to: "/gestao/financas", label: "Finanças", anyPermission: ["finance:view"] as Permission[] },
    { to: "/gestao/relatorios", label: "Relatórios", anyPermission: ["reports:view"] as Permission[] },
    { to: "/gestao/estoque", label: "Estoque", anyPermission: ["finance:view"] as Permission[] },
    { to: "/gestao/tiss", label: "TISS", anyPermission: ["finance:view"] as Permission[] },
    { to: "/gestao/pesquisa-satisfacao", label: "Pesquisa", anyPermission: ["reports:view"] as Permission[] },
  ]
}
