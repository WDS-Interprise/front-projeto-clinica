import { useEffect, useState } from "react"

import { useNavigate } from "react-router-dom"

import { Search, Pill, ChevronLeft, ChevronRight } from "lucide-react"

import { OutrosPageShell } from "@/components/outros/OutrosPageShell"

import { api } from "@/services/api"

import { useToast } from "@/context/ToastContext"

import { toastMessageFromApiError } from "@/lib/api-errors"

import { Button } from "@/components/ui/button"



type Medicine = {

  id: string

  name: string

  substanceName?: string

  manufacturerName?: string

  regulatoryCategory?: string

  therapeuticClass?: string

  variantCount?: number

}



const PAGE_SIZE = 20



const SOURCE_LABELS: Record<string, string> = {

  anvisa: "Anvisa (Bulário Eletrônico)",

  bulapi: "Bulapi (dados farmacêuticos BR)",

}



export default function BulasPage() {

  const navigate = useNavigate()

  const { toast } = useToast()

  const [query, setQuery] = useState("")

  const [page, setPage] = useState(1)

  const [results, setResults] = useState<Medicine[]>([])

  const [source, setSource] = useState("")

  const [total, setTotal] = useState(0)

  const [totalPages, setTotalPages] = useState(1)

  const [loading, setLoading] = useState(false)



  useEffect(() => {

    setPage(1)

  }, [query])



  useEffect(() => {

    const t = setTimeout(() => {

      setLoading(true)

      api.outros

        .searchBulas({ q: query || undefined, page, limit: PAGE_SIZE })

        .then((res) => {

          setSource(res.source)

          setResults(res.items)

          setTotal(res.total)

          setTotalPages(res.totalPages)

        })

        .catch((err: unknown) => {

          toast(toastMessageFromApiError(err, "Erro ao buscar bulas"), "error")

          setResults([])

          setTotal(0)

          setTotalPages(1)

        })

        .finally(() => setLoading(false))

    }, 350)

    return () => clearTimeout(t)

  }, [query, page, toast])



  const openDetail = (item: Medicine) => {

    navigate(`/outros/bulas/${encodeURIComponent(item.id)}`)

  }



  const canGoPrev = page > 1

  const canGoNext = page < totalPages



  return (

    <OutrosPageShell

      title="Bulas"

      description="Consulta de medicamentos por princípio ativo para apoio clínico."

    >

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-text-secondary">

        As informações exibidas são para consulta. Sempre confirme os dados na bula oficial e siga a

        avaliação do profissional de saúde.

      </div>



      <div className="max-w-3xl space-y-4">

        <div className="relative">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />

          <input

            type="text"

            value={query}

            onChange={(e) => setQuery(e.target.value)}

            placeholder="Buscar por princípio ativo (ex.: dipirona, amoxicilina)..."

            className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-surface text-sm"

          />

        </div>

        {source && (

          <p className="text-xs text-text-secondary">

            Fonte: {SOURCE_LABELS[source] ?? source}

          </p>

        )}

      </div>



      <div className="rounded-xl border border-border bg-surface overflow-hidden flex flex-col">

        <div className="px-4 py-3 border-b border-border text-sm font-medium text-text">

          Resultados{" "}

          {loading

            ? "…"

            : `(${results.length}${total > results.length ? ` de ${total.toLocaleString("pt-BR")}` : ""})`}

        </div>

        <ul className="divide-y divide-border flex-1 min-h-[280px]">

          {results.length === 0 && !loading ? (

            <li className="p-8 text-sm text-text-secondary text-center">

              {query ? "Nenhum princípio ativo encontrado" : "Digite um termo para buscar"}

            </li>

          ) : (

            results.map((m) => (

              <li key={m.id}>

                <button

                  type="button"

                  onClick={() => openDetail(m)}

                  className="w-full text-left px-4 py-3 hover:bg-surface-alt transition-colors"

                >

                  <div className="flex items-start gap-3">

                    <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0 mt-0.5">

                      <Pill className="w-4 h-4 text-primary" />

                    </div>

                    <div className="min-w-0">

                      <p className="text-sm font-medium text-text">{m.name}</p>

                      <p className="text-xs text-text-secondary mt-0.5">

                        {[

                          m.variantCount && m.variantCount > 1

                            ? `${m.variantCount} apresentações comerciais`

                            : "Princípio ativo",

                          m.regulatoryCategory,

                        ]

                          .filter(Boolean)

                          .join(" · ")}

                      </p>

                    </div>

                  </div>

                </button>

              </li>

            ))

          )}

        </ul>



        {totalPages > 1 && (

          <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-2">

            <Button

              type="button"

              variant="secondary"

              size="sm"

              disabled={!canGoPrev || loading}

              onClick={() => setPage((p) => Math.max(1, p - 1))}

              className="gap-1"

            >

              <ChevronLeft className="w-4 h-4" />

              Anterior

            </Button>

            <span className="text-xs text-text-secondary whitespace-nowrap">

              Página {page} de {totalPages.toLocaleString("pt-BR")}

            </span>

            <Button

              type="button"

              variant="secondary"

              size="sm"

              disabled={!canGoNext || loading}

              onClick={() => setPage((p) => p + 1)}

              className="gap-1"

            >

              Próxima

              <ChevronRight className="w-4 h-4" />

            </Button>

          </div>

        )}

      </div>

    </OutrosPageShell>

  )

}


