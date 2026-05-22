export function formatHistoryStatus(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "Agendado",
    CONFIRMED: "Confirmado",
    IN_PROGRESS: "Em atendimento",
    COMPLETED: "Finalizado",
    CANCELLED: "Cancelado",
    NO_SHOW: "Faltou",
    RESCHEDULED: "Reagendado",
    FINALIZED: "Finalizado",
    DRAFT: "Rascunho",
  }
  return map[status] ?? status
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "COMPLETED":
    case "FINALIZED":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    case "IN_PROGRESS":
      return "bg-primary/10 text-primary"
    case "SCHEDULED":
    case "CONFIRMED":
      return "bg-surface-alt text-text-secondary"
    case "CANCELLED":
    case "NO_SHOW":
      return "bg-danger/10 text-danger"
    default:
      return "bg-surface-alt text-text-secondary"
  }
}

export function formatDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null
  return `${minutes} minuto${minutes === 1 ? "" : "s"}`
}
