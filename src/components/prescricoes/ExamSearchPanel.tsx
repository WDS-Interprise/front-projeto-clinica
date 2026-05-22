import { useCallback, useEffect, useRef, useState } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import type { TussSearchResponse, TussTerm } from "@/types/tuss"
import type { ExamFormValues } from "@/types/prescription"

const MIN_CHARS = 2

type Props = {
  onAddExam: (values: ExamFormValues) => void
  saving?: boolean
}

function TermRow({ term, onSelect }: { term: TussTerm; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left px-4 py-3 hover:bg-surface-alt transition-colors border-b border-border last:border-b-0"
    >
      <p className="text-sm font-medium text-text leading-snug">{term.name}</p>
      <p className="text-[11px] text-text-secondary mt-1 font-mono">TUSS {term.tussCode}</p>
    </button>
  )
}

function ExamOptionCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
      />
      <span className="text-sm text-text">{label}</span>
    </label>
  )
}

export function ExamSearchPanel({ onAddExam, saving }: Props) {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [data, setData] = useState<TussSearchResponse | null>(null)
  const [selected, setSelected] = useState<TussTerm | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualName, setManualName] = useState("")
  const [manualCode, setManualCode] = useState("")
  const [showTussCode, setShowTussCode] = useState(true)
  const [generateSadtGuide, setGenerateSadtGuide] = useState(true)
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
    api.exames
      .search(debounced)
      .then((res) => {
        setData(res)
        setOpen(true)
      })
      .catch((err: unknown) => {
        setError(true)
        setData(null)
        toast(toastMessageFromApiError(err, "Não foi possível buscar exames agora."), "error")
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

  const pickTerm = (term: TussTerm) => {
    setSelected(term)
    setManualMode(false)
    setShowTussCode(true)
    setGenerateSadtGuide(true)
    clearSearch()
  }

  const clearSelection = () => {
    setSelected(null)
    setManualMode(false)
    setManualName("")
    setManualCode("")
  }

  const startManual = () => {
    setSelected(null)
    setManualMode(true)
    setManualName("")
    setManualCode("")
    setShowTussCode(true)
    setGenerateSadtGuide(true)
    clearSearch()
  }

  const handleAdd = () => {
    const name = manualMode ? manualName.trim() : selected?.name
    const tussCode = manualMode ? manualCode.replace(/\D/g, "") : (selected?.tussCode ?? "")

    if (!name) {
      toast("Selecione um exame ou informe o nome.", "error")
      return
    }

    onAddExam({
      name,
      tussCode,
      showTussCode,
      generateSadtGuide,
    })
    clearSelection()
  }

  const showDropdown = open && debounced.length >= MIN_CHARS && !selected && !manualMode
  const displayLabel =
    selected && showTussCode && selected.tussCode
      ? `${selected.tussCode} - ${selected.name}`
      : selected?.name

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
          placeholder="Digite para buscar..."
          disabled={Boolean(selected) || manualMode}
          className={cn(
            "w-full h-11 pl-10 pr-10 rounded-lg border bg-surface text-sm text-text",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            showDropdown ? "border-primary" : "border-border"
          )}
        />
        {loading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary animate-spin" />
        )}
        {query && !selected && !manualMode && (
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

      {!selected && !manualMode && (
        <button
          type="button"
          onClick={startManual}
          className="text-sm font-medium text-primary hover:underline"
        >
          Adicionar exame manualmente
        </button>
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-border bg-surface shadow-xl overflow-hidden">
          {loading && !data && (
            <p className="px-4 py-6 text-sm text-text-secondary text-center">Buscando exames...</p>
          )}

          {error && !loading && (
            <p className="px-4 py-6 text-sm text-danger text-center">
              Não foi possível buscar exames agora. Tente novamente em instantes.
            </p>
          )}

          {!loading && !error && data && (
            <>
              <div className="px-4 py-2.5 border-b border-border bg-surface-alt/80">
                <p className="text-[11px] font-semibold tracking-wide text-text-secondary uppercase">
                  {data.total > 0
                    ? `${data.total} resultado${data.total === 1 ? "" : "s"} encontrado${data.total === 1 ? "" : "s"}`
                    : `Nenhum exame encontrado para "${data.query}"`}
                </p>
              </div>

              <div className="max-h-[320px] overflow-y-auto overscroll-contain">
                {data.items.length === 0 ? (
                  <div className="px-4 py-6 text-center space-y-3">
                    <p className="text-sm text-text-secondary">
                      Nenhum procedimento TUSS para &quot;{data.query}&quot;.
                    </p>
                    <button
                      type="button"
                      onClick={startManual}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Adicionar exame manualmente
                    </button>
                  </div>
                ) : (
                  data.items.map((term) => (
                    <TermRow key={term.tussCode} term={term} onSelect={() => pickTerm(term)} />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {manualMode && (
        <div className="rounded-xl border border-primary/30 bg-primary-light/20 p-4 space-y-3">
          <div className="flex justify-between gap-3">
            <p className="text-sm font-medium text-text">Exame manual</p>
            <button
              type="button"
              onClick={clearSelection}
              className="text-text-secondary hover:text-text"
              aria-label="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Nome do exame..."
            className="w-full h-10 rounded-lg border border-border px-3 text-sm bg-surface text-text focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
          />
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
            placeholder="Código TUSS (opcional)"
            className="w-full h-10 rounded-lg border border-border px-3 text-sm bg-surface text-text focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none font-mono"
          />
          <ExamOptionCheckbox
            checked={showTussCode}
            onChange={setShowTussCode}
            label="Exibir código TUSS"
          />
          <ExamOptionCheckbox
            checked={generateSadtGuide}
            onChange={setGenerateSadtGuide}
            label="Gerar guia SADT"
          />
          <div className="flex justify-end pt-1">
            <Button onClick={handleAdd} disabled={saving}>
              Adicionar à receita
            </Button>
          </div>
        </div>
      )}

      {selected && (
        <div className="rounded-xl border border-primary/30 bg-primary-light/20 p-4 space-y-3">
          <div className="flex justify-between gap-3">
            <p className="text-sm font-medium text-text leading-snug">{displayLabel}</p>
            <button
              type="button"
              onClick={clearSelection}
              className="text-text-secondary hover:text-text shrink-0"
              aria-label="Remover seleção"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <ExamOptionCheckbox
              checked={showTussCode}
              onChange={setShowTussCode}
              label="Exibir código TUSS"
            />
            <ExamOptionCheckbox
              checked={generateSadtGuide}
              onChange={setGenerateSadtGuide}
              label="Gerar guia SADT"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button onClick={handleAdd} disabled={saving}>
              Adicionar à receita
            </Button>
          </div>
        </div>
      )}

      {!showDropdown && !selected && !manualMode && debounced.length === 0 && (
        <p className="text-xs text-text-secondary">Digite para buscar um exame ou procedimento TUSS.</p>
      )}
    </div>
  )
}
