import type { Prescription, PrescriptionItem } from "@/types/prescription"

export function itemCounts(items: PrescriptionItem[]) {
  return {
    medication: items.filter((i) => i.type === "MEDICATION").length,
    exam: items.filter((i) => i.type === "EXAM").length,
    vaccine: items.filter((i) => i.type === "VACCINE").length,
    freeText: items.filter((i) => i.type === "FREE_TEXT").length,
  }
}

export function receiptTypeLabel(receiptType: string, items: PrescriptionItem[]): string {
  if (receiptType === "SPECIAL") return "Receituário de Controle Especial"
  const types = new Set(items.map((i) => i.type))
  if (types.size === 1 && types.has("EXAM")) return "Solicitação de Exames"
  if (types.size === 1 && types.has("VACCINE")) return "Prescrição de Vacinas"
  return "Receituário Simples"
}

export function receiptSummaryLine(prescription: Prescription): string {
  const counts = itemCounts(prescription.items)
  const label = receiptTypeLabel(prescription.receiptType, prescription.items)
  const parts: string[] = []
  if (counts.medication) parts.push(`${counts.medication} medicamento${counts.medication > 1 ? "s" : ""}`)
  if (counts.exam) parts.push(`${counts.exam} exame${counts.exam > 1 ? "s" : ""}`)
  if (counts.vaccine) parts.push(`${counts.vaccine} vacina${counts.vaccine > 1 ? "s" : ""}`)
  if (counts.freeText) parts.push(`${counts.freeText} texto${counts.freeText > 1 ? "s" : ""} livre${counts.freeText > 1 ? "s" : ""}`)
  return `${label}${parts.length ? ` — ${parts.join(", ")}` : ""}`
}

export function latestWhatsAppShare(prescription: Prescription) {
  return prescription.shares?.find((s) => s.channel === "WHATSAPP")
}

export function formatEmissionDate(prescription: Prescription): string {
  const raw = prescription.updatedAt || prescription.prescriptionDate
  const d = new Date(raw)
  return `${d.toLocaleDateString("pt-BR")} - ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
}
