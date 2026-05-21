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
  | "users:manage"
  | "clinics:manage"
  | "whatsapp:send"

export function can(permissions: string[] | undefined, perm: Permission): boolean {
  return permissions?.includes(perm) ?? false
}
