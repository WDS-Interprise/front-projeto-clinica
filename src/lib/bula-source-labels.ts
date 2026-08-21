const SOURCE_LABELS: Record<string, string> = {
  anvisa: "Anvisa",
  bulapi: "Bulapi",
  consultaremedios: "Consulta Remédios",
  "consulta remedios": "Consulta Remédios",
  pharmadb: "PharmaDB",
  cache: "Cache local",
}

export function formatBulaSource(fonte: string, fromCache?: boolean): string {
  const key = fonte.trim().toLowerCase()
  const label = SOURCE_LABELS[key] ?? fonte
  if (fromCache) return `Cache local (${label})`
  return label
}

export function formatBulaSourceLine(fonte: string, atualizadoEm?: string): string {
  const label = formatBulaSource(fonte)
  const alt = fonte.toLowerCase() !== "anvisa" && fonte.toLowerCase() !== "cache"
  const prefix = alt ? "Fonte alternativa" : "Fonte"
  const date = atualizadoEm ? ` · Dados consultados em ${atualizadoEm}` : ""
  return `${prefix}: ${label}${date}`
}
