const RECENTS_KEY = "clinmax_medicamentos_recents"
const FAVORITES_KEY = "clinmax_medicamentos_favorites"
const VIEW_COUNTS_KEY = "clinmax_medicamentos_view_counts"
const SEARCH_QUERY_KEY = "clinmax_medicamentos_search_query"

export type MedicamentoBookmark = {
  id: string
  name: string
  subtitle?: string
  bulaId?: string
}

const MAX_RECENTS = 12
const MAX_FAVORITES = 40

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getMedicamentoRecents(): MedicamentoBookmark[] {
  return readJson<MedicamentoBookmark[]>(RECENTS_KEY, [])
}

export function pushMedicamentoRecent(entry: MedicamentoBookmark) {
  const list = getMedicamentoRecents().filter((x) => x.id !== entry.id)
  list.unshift(entry)
  writeJson(RECENTS_KEY, list.slice(0, MAX_RECENTS))
}

export function getMedicamentoFavorites(): MedicamentoBookmark[] {
  return readJson<MedicamentoBookmark[]>(FAVORITES_KEY, [])
}

export function isMedicamentoFavorite(id: string) {
  return getMedicamentoFavorites().some((x) => x.id === id)
}

export function toggleMedicamentoFavorite(entry: MedicamentoBookmark): boolean {
  const list = getMedicamentoFavorites()
  const idx = list.findIndex((x) => x.id === entry.id)
  if (idx >= 0) {
    list.splice(idx, 1)
    writeJson(FAVORITES_KEY, list)
    return false
  }
  writeJson(FAVORITES_KEY, [entry, ...list].slice(0, MAX_FAVORITES))
  return true
}

export function getMostConsultedMedicamentos(limit = 6): MedicamentoBookmark[] {
  const counts = readJson<Record<string, number>>(VIEW_COUNTS_KEY, {})
  const recents = getMedicamentoRecents()
  const byId = new Map(recents.map((r) => [r.id, r]))

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => byId.get(id))
    .filter((x): x is MedicamentoBookmark => Boolean(x))
}

export function recordMedicamentoView(entry: MedicamentoBookmark) {
  pushMedicamentoRecent(entry)
  const counts = readJson<Record<string, number>>(VIEW_COUNTS_KEY, {})
  counts[entry.id] = (counts[entry.id] ?? 0) + 1
  writeJson(VIEW_COUNTS_KEY, counts)
}

/** Mantém o termo da busca ao voltar da tela de bula. */
export function getMedicamentosSearchQuery(): string {
  try {
    return sessionStorage.getItem(SEARCH_QUERY_KEY) ?? ""
  } catch {
    return ""
  }
}

export function setMedicamentosSearchQuery(query: string) {
  try {
    const trimmed = query.trim()
    if (trimmed) sessionStorage.setItem(SEARCH_QUERY_KEY, trimmed)
    else sessionStorage.removeItem(SEARCH_QUERY_KEY)
  } catch {
    // ignore quota / private mode
  }
}
