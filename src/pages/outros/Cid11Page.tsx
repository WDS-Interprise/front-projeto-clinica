import { useEffect, useState } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { OutrosPageShell } from "@/components/outros/OutrosPageShell"
import { CidDetailCard } from "@/components/cid/CidDetailCard"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { Button } from "@/components/ui/button"

type Cid11Item = {
  id: string
  codigo: string
  descricao: string
  bloco: string
  blocoDesc: string
  capitulo: string
  capituloDesc: string
  tipo: string
  cid10Equivalente: string | null
}

const PAGE_SIZE = 20

export default function Cid11Page() {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [capitulo, setCapitulo] = useState("")
  const [bloco, setBloco] = useState("")
  const [tipo, setTipo] = useState("")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Cid11Item[]>([])
  const [selected, setSelected] = useState<Cid11Item | null>(null)
  const [capitulos, setCapitulos] = useState<Array<{ codigo: string; descricao: string }>>([])
  const [blocos, setBlocos] = useState<Array<{ codigo: string; descricao: string }>>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.cid11
      .capitulos()
      .then(setCapitulos)
      .catch((err: unknown) => toast(toastMessageFromApiError(err, "Erro ao carregar capítulos"), "error"))
  }, [toast])

  useEffect(() => {
    api.cid11
      .blocos(capitulo || undefined)
      .then(setBlocos)
      .catch(() => setBlocos([]))
    setBloco("")
  }, [capitulo])

  useEffect(() => {
    setPage(1)
  }, [query, capitulo, bloco, tipo])

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      setError(false)
      api.cid11
        .search({
          search: query || undefined,
          capitulo: capitulo || undefined,
          bloco: bloco || undefined,
          tipo: tipo || undefined,
          page,
          limit: PAGE_SIZE,
        })
        .then((res) => {
          setItems(res.data)
          setTotal(res.total)
          setTotalPages(res.totalPages)
          if (res.data.length === 0) setSelected(null)
        })
        .catch((err: unknown) => {
          toast(toastMessageFromApiError(err, "Erro ao buscar CID-11"), "error")
          setItems([])
          setError(true)
        })
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query, capitulo, bloco, tipo, page, toast])

  return (
    <OutrosPageShell title="CID 11" description="Classificação Internacional de Doenças — 11ª revisão.">
      <div className="rounded-xl border border-border bg-surface-alt/50 px-4 py-3 text-sm text-text-secondary">
        A seleção de CID deve ser realizada por profissional habilitado.
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por código ou descrição..."
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-surface text-sm"
            />
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase">Filtros</p>
            <label className="block text-xs text-text-secondary">
              Capítulo
              <select
                value={capitulo}
                onChange={(e) => setCapitulo(e.target.value)}
                className="mt-1 w-full h-9 rounded-lg border border-border bg-surface px-2 text-sm"
              >
                <option value="">Todos</option>
                {capitulos.map((c) => (
                  <option key={c.codigo} value={c.codigo}>
                    {c.codigo} — {c.descricao}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-text-secondary">
              Bloco
              <select
                value={bloco}
                onChange={(e) => setBloco(e.target.value)}
                className="mt-1 w-full h-9 rounded-lg border border-border bg-surface px-2 text-sm"
              >
                <option value="">Todos</option>
                {blocos.map((b) => (
                  <option key={b.codigo} value={b.codigo}>
                    {b.codigo}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-text-secondary">
              Tipo
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="mt-1 w-full h-9 rounded-lg border border-border bg-surface px-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="categoria">Categoria</option>
                <option value="extensao">Extensão</option>
              </select>
            </label>
          </div>
        </aside>

        <div className="grid lg:grid-cols-2 gap-4 min-h-[480px]">
          <div className="rounded-xl border border-border bg-surface overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border text-sm font-medium">
              Resultados {loading ? "…" : `(${total})`}
            </div>
            {error ? (
              <p className="p-6 text-sm text-text-secondary text-center">
                Não foi possível carregar a base CID. Tente novamente em alguns instantes.
              </p>
            ) : loading ? (
              <div className="flex-1 p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-surface-alt animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="p-6 text-sm text-text-secondary text-center">
                Nenhum CID encontrado para sua busca.
                <br />
                Tente pesquisar por outro termo ou código.
              </p>
            ) : (
              <ul className="divide-y divide-border flex-1 overflow-y-auto max-h-[420px]">
                {items.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      className={`w-full text-left px-4 py-3 hover:bg-surface-alt ${
                        selected?.id === c.id ? "bg-primary-light/40" : ""
                      }`}
                    >
                      <span className="text-sm font-mono font-semibold text-primary">{c.codigo}</span>
                      <p className="text-sm text-text mt-0.5">{c.descricao}</p>
                      {c.cid10Equivalente && (
                        <p className="text-xs text-text-secondary mt-1">CID-10: {c.cid10Equivalente}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-text-secondary">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            {selected ? (
              <CidDetailCard
                codigo={selected.codigo}
                descricao={selected.descricao}
                capitulo={selected.capitulo}
                capituloDesc={selected.capituloDesc}
                bloco={selected.bloco}
                blocoDesc={selected.blocoDesc}
                tipo={selected.tipo}
                cid10Equivalente={selected.cid10Equivalente}
              />
            ) : (
              <p className="text-sm text-text-secondary text-center py-12">
                Selecione um código para ver o detalhe
              </p>
            )}
          </div>
        </div>
      </div>
    </OutrosPageShell>
  )
}
