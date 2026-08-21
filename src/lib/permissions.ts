export type Permission =
  | "dashboard:view"
  | "agenda:view"
  | "agenda:manage"
  | "agenda:print"
  | "waiting_list:manage"
  | "agenda_notes:manage"
  | "patients:view"
  | "patients:create"
  | "patients:edit_basic"
  | "patients:edit_clinical"
  | "records:view"
  | "records:write"
  | "prescriptions:write"
  | "clinical_tools:view"
  | "users:manage"
  | "clinics:manage"
  | "invites:manage"
  | "whatsapp:send"
  | "finance:operational"
  | "finance:view"
  | "finance:manage"
  | "reports:view"

export function can(permissions: string[] | undefined, perm: Permission): boolean {
  return permissions?.includes(perm) ?? false
}

export function defaultHomePath(role?: string): string {
  if (role === "FINANCE") return "/gestao/financas"
  if (role === "DOCTOR" || role === "RECEPTION") return "/agenda"
  return "/dashboard"
}
