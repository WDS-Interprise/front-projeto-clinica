import type { Permission } from "@/lib/permissions"
import type { PlanFeature } from "@/lib/plan-features"

export type ClinicalToolsItem = {
  to: string
  label: string
  description: string
  anyPermission?: Permission[]
  planFeature?: PlanFeature
}

export const clinicalToolsItems: ClinicalToolsItem[] = [
  {
    to: "/outros/bulas",
    label: "Medicamentos",
    description: "Consulta de bulas e apresentações",
    anyPermission: ["clinical_tools:view"],
    planFeature: "CLINICAL_TOOLS",
  },
  {
    to: "/outros/cid-10",
    label: "CID-10",
    description: "Classificação internacional de doenças",
    anyPermission: ["clinical_tools:view"],
    planFeature: "CLINICAL_TOOLS",
  },
  {
    to: "/outros/cid-11",
    label: "CID-11",
    description: "CID da OMS, 11ª revisão",
    anyPermission: ["clinical_tools:view"],
    planFeature: "CLINICAL_TOOLS",
  },
]

export function canAccessClinicalToolsItem(
  hasPermission: (p: Permission) => boolean,
  item: ClinicalToolsItem,
  hasPlanFeature?: (f: PlanFeature) => boolean
) {
  if (item.planFeature && hasPlanFeature && !hasPlanFeature(item.planFeature)) return false
  if (!item.anyPermission?.length) return true
  return item.anyPermission.some((p) => hasPermission(p))
}

export function canSeeClinicalToolsNav(
  hasPermission: (p: Permission) => boolean,
  hasPlanFeature?: (f: PlanFeature) => boolean
) {
  return clinicalToolsItems.some((item) => canAccessClinicalToolsItem(hasPermission, item, hasPlanFeature))
}

export function isClinicalToolsPath(pathname: string) {
  return (
    pathname.startsWith("/outros/bulas") ||
    pathname.startsWith("/outros/cid-10") ||
    pathname.startsWith("/outros/cid-11")
  )
}

export function clinicalToolsNavHome(
  hasPermission: (p: Permission) => boolean,
  hasPlanFeature?: (f: PlanFeature) => boolean
) {
  return (
    clinicalToolsItems.find((item) => canAccessClinicalToolsItem(hasPermission, item, hasPlanFeature))?.to ??
    "/outros/bulas"
  )
}
