import type { Appointment } from "@/types"

export type AptKind = "consulta" | "retorno" | "exame" | "tele" | "block"

export const DAY_ABBR = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"] as const

export const KIND_META: Record<
  AptKind,
  { label: string; bg: string; border: string; accent: string }
> = {
  consulta: { label: "Consulta", bg: "#F0FBF6", border: "#BCE8D3", accent: "#4DBA83" },
  retorno: { label: "Retorno", bg: "#F1F8FF", border: "#B9DBF8", accent: "#4AA3DF" },
  exame: { label: "Exame", bg: "#F6F3FF", border: "#D8CCFA", accent: "#8B75D7" },
  tele: { label: "Teleconsulta", bg: "#FFF9EA", border: "#F6DFA3", accent: "#D7A72D" },
  block: { label: "Bloqueio", bg: "#F8FAFC", border: "#E2E8F0", accent: "#94A3B8" },
}

const NAME_PARTICLES = new Set(["de", "da", "das", "do", "dos", "e"])

export function formatAgendaName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part, index, parts) => {
      const lower = part.toLocaleLowerCase("pt-BR")
      if (index > 0 && index < parts.length - 1 && NAME_PARTICLES.has(lower)) return lower
      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1)
    })
    .join(" ")
}

export function classifyAppointment(a: Appointment): AptKind {
  if (a.type === "BLOCK") return "block"
  const blob = `${a.notes ?? ""} ${a.procedures?.map((p) => p.name ?? "").join(" ")}`.toLowerCase()
  if (blob.includes("tele")) return "tele"
  if (blob.includes("exame")) return "exame"
  if (blob.includes("retorno")) return "retorno"
  return "consulta"
}
