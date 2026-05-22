import { useEffect, useRef, useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

export type CidSelection = {
  codigo: string
  descricao: string
  version: "CID-10" | "CID-11"
}

type Props = {
  value: CidSelection | null
  onChange: (value: CidSelection | null) => void
  disabled?: boolean
  version?: "CID-10" | "CID-11"
}

export function CidSearchField({ value, onChange, disabled, version = "CID-10" }: Props) {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Array<{ codigo: string; descricao: string }>>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim() || disabled) {
      setResults([])
      return
    }
    const t = setTimeout(() => {
      setLoading(true)
      const search =
        version === "CID-10"
          ? api.cid10.search({ search: query, limit: 8 })
          : api.cid11.search({ search: query, limit: 8 })
      search
        .then((res) => setResults(res.data.map((r) => ({ codigo: r.codigo, descricao: r.descricao }))))
        .catch((err: unknown) => {
          toast(toastMessageFromApiError(err, "Erro ao buscar CID"), "error")
          setResults([])
        })
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query, disabled, version, toast])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative space-y-2">
      {value ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-alt px-3 py-2">
          <span className="font-mono font-semibold text-primary">{value.codigo}</span>
          <span className="text-sm text-text">{value.descricao}</span>
          <span className="text-xs text-text-secondary">({value.version})</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="ml-auto text-xs text-text-secondary hover:text-text"
            >
              Remover
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={query}
              disabled={disabled}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              placeholder="Buscar CID por código ou descrição..."
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-surface text-sm disabled:opacity-60"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-text-secondary" />
            )}
          </div>
          {open && results.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
              {results.map((r) => (
                <li key={r.codigo}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-surface-alt text-sm"
                    onClick={() => {
                      onChange({ codigo: r.codigo, descricao: r.descricao, version })
                      setQuery("")
                      setOpen(false)
                    }}
                  >
                    <span className="font-mono font-semibold text-primary">{r.codigo}</span>
                    <span className="text-text ml-2">{r.descricao}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
