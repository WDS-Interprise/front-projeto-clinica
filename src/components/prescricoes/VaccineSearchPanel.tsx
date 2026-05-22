import { useCallback, useEffect, useRef, useState } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import type { VacinaProduto, VacinaSearchResponse } from "@/types/vacina"

const MIN_CHARS = 2

type Props = {
  onSelectVaccine: (vaccine: VacinaProduto) => void
  onAddFreeText: () => void
}

function VaccineRow({
  item,
  onSelect,
}: {
  item: VacinaProduto
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left px-4 py-3 hover:bg-surface-alt transition-colors border-b border-border last:border-b-0"
    >
      <div className="flex justify-between gap-3">
        <p className="text-sm font-medium text-text leading-snug">{item.displayName}</p>
        {item.via && (
          <span className="text-[11px] text-text-secondary shrink-0">{item.via}</span>
        )}
      </div>
      {item.formasDosagens.length > 0 && (
        <p className="text-xs text-text-secondary mt-1 line-clamp-2">
          {item.formasDosagens.slice(0, 3).join(" · ")}
        </p>
      )}
      {item.rxcuis.length > 0 && (
        <p className="text-[11px] text-text-secondary/80 mt-1 font-mono">
          RXCUI: {item.rxcuis.slice(0, 2).join(", ")}
          {item.rxcuis.length > 2 ? "…" : ""}
        </p>
      )}
    </button>
  )
}

export function VaccineSearchPanel({ onSelectVaccine, onAddFreeText }: Props) {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [data, setData] = useState<VacinaSearchResponse | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (debounced.length < MIN_CHARS) {
      setData(null)
      setLoading(false)
      setError(false)
      return
    }

    setLoading(true)
    setError(false)
    api.vacinas
      .search(debounced)
      .then((res) => {
        setData(res)
        setOpen(true)
      })
      .catch((err: unknown) => {
        setError(true)
        setData(null)
        toast(toastMessageFromApiError(err, "Não foi possível buscar vacinas agora."), "error")
      })
      .finally(() => setLoading(false))
  }, [debounced, toast])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const clearSearch = useCallback(() => {
    setQuery("")
    setDebounced("")
    setData(null)
    setOpen(false)
    setError(false)
  }, [])

  const showDropdown = open && debounced.length >= MIN_CHARS

  return (
    <div ref={containerRef} className="relative space-y-3 z-20">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (debounced.length >= MIN_CHARS) setOpen(true)
          }}
          placeholder="Digite para buscar vacina..."
          className={cn(
            "w-full h-11 pl-10 pr-10 rounded-lg border bg-surface text-sm text-text",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors",
            showDropdown ? "border-primary" : "border-border"
          )}
        />
        {loading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary animate-spin" />
        )}
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-secondary hover:text-text hover:bg-surface-alt"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={onAddFreeText}
          className="px-3 py-1.5 rounded-lg font-medium text-primary hover:bg-primary-light transition-colors"
        >
          Adicionar Texto Livre
        </button>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-border bg-surface shadow-xl overflow-hidden">
          {loading && !data && (
            <p className="px-4 py-6 text-sm text-text-secondary text-center">Buscando vacinas...</p>
          )}

          {error && !loading && (
            <p className="px-4 py-6 text-sm text-danger text-center">
              Não foi possível consultar a API de vacinas. Tente novamente.
            </p>
          )}

          {!loading && !error && data && (
            <>
              <div className="px-4 py-2.5 border-b border-border bg-surface-alt/80">
                <p className="text-[11px] font-semibold tracking-wide text-text-secondary uppercase">
                  {data.total > 0
                    ? `${data.total} resultado${data.total === 1 ? "" : "s"} encontrado${data.total === 1 ? "" : "s"}`
                    : "Nenhuma vacina encontrada"}
                </p>
              </div>

              <div className="max-h-[320px] overflow-y-auto overscroll-contain">
                {data.items.length === 0 ? (
                  <div className="px-4 py-6 text-center space-y-3">
                    <p className="text-sm text-text-secondary">
                      Nenhuma vacina encontrada para &quot;{data.query}&quot;.
                    </p>
                    <button
                      type="button"
                      onClick={onAddFreeText}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Adicionar como texto livre
                    </button>
                  </div>
                ) : (
                  data.items.map((item) => (
                    <VaccineRow
                      key={item.id}
                      item={item}
                      onSelect={() => {
                        onSelectVaccine(item)
                        clearSearch()
                      }}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {!showDropdown && debounced.length === 0 && (
        <p className="text-xs text-text-secondary">Digite o nome de uma vacina para buscar.</p>
      )}
    </div>
  )
}
