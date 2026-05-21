/** IDs de rota que não são entidades no banco (ex.: /prescricoes/novo). */
const PLACEHOLDER_ROUTE_IDS = new Set(["novo", "new"])

export function isResolvableEntityId(id: string | undefined | null): id is string {
  if (!id) return false
  if (PLACEHOLDER_ROUTE_IDS.has(id.toLowerCase())) return false
  return id.length >= 12
}
