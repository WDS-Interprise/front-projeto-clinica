import type { LucideIcon } from "lucide-react"
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Package,
  Smile,
  Wallet,
} from "lucide-react"
import type { Permission } from "@/lib/permissions"
import type { PlanFeature } from "@/lib/plan-features"

export type GestaoItem = {
  to: string
  label: string
  description: string
  icon: LucideIcon
  anyPermission?: Permission[]
  planFeature?: PlanFeature
  implemented?: boolean
  group: "financas" | "operacao"
}

export const gestaoItems: GestaoItem[] = [
  { to: "/gestao/financas", label: "Resumo", description: "Saldo e resumo", icon: LayoutDashboard, anyPermission: ["finance:view"], planFeature: "FINANCE", implemented: true, group: "financas" },
  { to: "/gestao/financas/extrato", label: "Extrato", description: "Todos os lançamentos", icon: Wallet, anyPermission: ["finance:view"], planFeature: "FINANCE", implemented: true, group: "financas" },
  { to: "/gestao/financas/receitas", label: "Receitas", description: "Entradas financeiras", icon: ArrowUpRight, anyPermission: ["finance:view"], planFeature: "FINANCE", implemented: true, group: "financas" },
  { to: "/gestao/financas/despesas", label: "Despesas", description: "Saídas financeiras", icon: ArrowDownRight, anyPermission: ["finance:view"], planFeature: "FINANCE", implemented: true, group: "financas" },
  { to: "/gestao/financas/fluxo-de-caixa", label: "Fluxo de caixa", description: "Visão diária/mensal", icon: BarChart3, anyPermission: ["finance:view"], planFeature: "FINANCE", implemented: true, group: "financas" },
  { to: "/gestao/relatorios", label: "Relatórios", description: "Atendimentos e indicadores", icon: ClipboardList, anyPermission: ["reports:view"], planFeature: "REPORTS", implemented: true, group: "operacao" },
  { to: "/gestao/estoque", label: "Estoque", description: "Produtos e movimentações", icon: Package, anyPermission: ["finance:view"], planFeature: "INVENTORY", implemented: true, group: "operacao" },
  { to: "/gestao/tiss", label: "TISS", description: "Guias de consulta", icon: ClipboardList, anyPermission: ["finance:view"], planFeature: "TISS", implemented: true, group: "operacao" },
  { to: "/gestao/pesquisa-satisfacao", label: "Pesquisa de satisfação", description: "Envios e resultados", icon: Smile, anyPermission: ["reports:view"], planFeature: "SATISFACTION", implemented: true, group: "operacao" },
]

export function canAccessGestaoItem(
  hasPermission: (p: Permission) => boolean,
  item: Pick<GestaoItem, "anyPermission" | "planFeature">,
  hasPlanFeature?: (f: PlanFeature) => boolean
) {
  if (item.planFeature && hasPlanFeature && !hasPlanFeature(item.planFeature)) return false
  if (!item.anyPermission?.length) return true
  return item.anyPermission.some((p) => hasPermission(p))
}

export function isGestaoPath(pathname: string) {
  return pathname.startsWith("/gestao")
}

export function isFinancePath(pathname: string) {
  return pathname.startsWith("/gestao/financas")
}

export function isGestaoOpsPath(pathname: string) {
  return pathname.startsWith("/gestao") && !pathname.startsWith("/gestao/financas")
}

export function gestaoNavItemsForHeader() {
  return [
    { to: "/gestao/financas", label: "Finanças", anyPermission: ["finance:view"] as Permission[], planFeature: "FINANCE" as const },
    { to: "/gestao/relatorios", label: "Relatórios", anyPermission: ["reports:view"] as Permission[], planFeature: "REPORTS" as const },
    { to: "/gestao/estoque", label: "Estoque", anyPermission: ["finance:view"] as Permission[], planFeature: "INVENTORY" as const },
    { to: "/gestao/tiss", label: "TISS", anyPermission: ["finance:view"] as Permission[], planFeature: "TISS" as const },
    { to: "/gestao/pesquisa-satisfacao", label: "Pesquisa", anyPermission: ["reports:view"] as Permission[], planFeature: "SATISFACTION" as const },
  ]
}
