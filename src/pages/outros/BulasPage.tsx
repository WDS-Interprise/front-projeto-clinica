import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { Search, Pill, ChevronLeft, ChevronRight, Star, Clock, TrendingUp } from "lucide-react"
import { ClinicalToolsPageShell } from "@/components/clinical/ClinicalToolsPageShell"
import { MedicationFormModal } from "@/components/prescricoes/MedicationFormModal"
import { Button } from "@/components/ui/button"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { resolveBulaId } from "@/components/outros/BulaDetailDrawer"
import {
  getMedicamentoFavorites,
  getMedicamentoRecents,
  getMostConsultedMedicamentos,
  getMedicamentosSearchQuery,
  pushMedicamentoRecent,
  setMedicamentosSearchQuery,
  type MedicamentoBookmark,
} from "@/lib/medicamentos-preferences"
import type { MedicamentoProduto, MedicamentoSubstancia } from "@/types/medicamento"
import type { MedicationFormValues } from "@/types/prescription"

const PAGE_SIZE = 20
const MIN_CHARS = 2

type UnifiedResult =
  | { kind: "product"; product: MedicamentoProduto }
  | { kind: "substance"; substance: MedicamentoSubstancia }

function productSubtitle(product: MedicamentoProduto) {
  return [
    product.presentation ?? product.pharmaceuticalForm,
    product.productType,
    product.laboratory,
  ]
    .filter(Boolean)
    .join(" · ")
}

function substanceSubtitle(substance: MedicamentoSubstancia) {
  return substance.productCount
    ? `${substance.productCount} apresentações`
    : "Princípio ativo"
}

function bookmarkFromProduct(product: MedicamentoProduto): MedicamentoBookmark {
  return {
    id: `product:${product.id}`,
    name: product.name,
    subtitle: productSubtitle(product),
  }
}

function bookmarkFromSubstance(substance: MedicamentoSubstancia): MedicamentoBookmark {
  return {
    id: `substance:${substance.id}`,
    name: substance.name,
    subtitle: substanceSubtitle(substance),
  }
}

function productToForm(product: MedicamentoProduto): MedicationFormValues {
  return {
    name: product.name,
    presentation: product.presentation ?? product.pharmaceuticalForm ?? "",
    dosage: product.activeIngredient ?? "",
    frequency: "",
    duration: "",
    quantity: product.packageQuantity ?? "",
    instructions: "",
    continuousUse: false,
    activeIngredient: product.activeIngredient ?? "",
    laboratory: product.laboratory ?? "",
  }
}

function BookmarkChip({
  item,
  onOpen,
}: {
  item: MedicamentoBookmark
  onOpen: (item: MedicamentoBookmark) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm hover:bg-surface-alt transition-colors"
    >
      <Pill className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 truncate font-medium text-text">{item.name}</span>
    </button>
  )
}

function readInitialSearchQuery(searchParams: URLSearchParams) {
  const fromUrl = searchParams.get("q")?.trim()
  if (fromUrl) return fromUrl
  return getMedicamentosSearchQuery()
}

export default function BulasPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const fromPrescription = Boolean(
    (location.state as { fromPrescription?: boolean } | null)?.fromPrescription
  )

  const [query, setQuery] = useState(() => readInitialSearchQuery(searchParams))
  const [debounced, setDebounced] = useState(() => readInitialSearchQuery(searchParams))
  const [page, setPage] = useState(1)
  const [results, setResults] = useState<UnifiedResult[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<MedicamentoBookmark[]>([])
  const [recents, setRecents] = useState<MedicamentoBookmark[]>([])
  const [mostConsulted, setMostConsulted] = useState<MedicamentoBookmark[]>([])
  const [medModalOpen, setMedModalOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<MedicationFormValues | null>(null)
  const [openingBula, setOpeningBula] = useState<string | null>(null)

  const refreshBookmarks = useCallback(() => {
    setFavorites(getMedicamentoFavorites())
    setRecents(getMedicamentoRecents())
    setMostConsulted(getMostConsultedMedicamentos())
  }, [])

  useEffect(() => {
    refreshBookmarks()
  }, [refreshBookmarks])

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = query.trim()
      setDebounced(trimmed)
      setMedicamentosSearchQuery(trimmed)

      setSearchParams(
        (prev) => {
          const currentUrlQ = prev.get("q") ?? ""
          if (trimmed.length >= MIN_CHARS) {
            if (currentUrlQ === trimmed) return prev
            return new URLSearchParams({ q: trimmed })
          }
          if (!currentUrlQ) return prev
          return new URLSearchParams()
        },
        { replace: true }
      )
    }, 300)
    return () => clearTimeout(t)
  }, [query, setSearchParams])

  useEffect(() => {
    setPage(1)
  }, [debounced])

  useEffect(() => {
    if (debounced.length < MIN_CHARS) {
      setResults([])
      setTotalProducts(0)
      return
    }

    setLoading(true)
    api.medicamentos
      .search(debounced)
      .then((res) => {
        const unified: UnifiedResult[] = [
          ...res.products.map((product) => ({ kind: "product" as const, product })),
          ...res.substances.map((substance) => ({ kind: "substance" as const, substance })),
        ]
        setResults(unified)
        setTotalProducts(res.totalProducts)
      })
      .catch((err: unknown) => {
        toast(toastMessageFromApiError(err, "Erro ao buscar medicamentos"), "error")
        setResults([])
        setTotalProducts(0)
      })
      .finally(() => setLoading(false))
  }, [debounced, toast])

  const pagedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))

  const openBula = async (bookmark: MedicamentoBookmark, searchTerm: string) => {
    setOpeningBula(bookmark.id)
    try {
      pushMedicamentoRecent(bookmark)
      refreshBookmarks()
      let bulaId = bookmark.bulaId
      if (!bulaId) {
        bulaId = (await resolveBulaId(searchTerm)) ?? undefined
      }
      if (!bulaId) {
        toast("Bula não encontrada para este termo.", "error")
        return
      }
      navigate(`/outros/bulas/${encodeURIComponent(bulaId)}`, {
        state: { fromPrescription, bookmark, returnSearch: debounced || query.trim() },
      })
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao abrir bula"), "error")
    } finally {
      setOpeningBula(null)
    }
  }

  const handleOpenBookmark = (item: MedicamentoBookmark) => {
    const term = item.name
    void openBula(item, term)
  }

  const handleAddProduct = (product: MedicamentoProduto) => {
    setSelectedForm(productToForm(product))
    setMedModalOpen(true)
  }

  const handleAddSubstance = (substance: MedicamentoSubstancia) => {
    setSelectedForm({
      name: substance.name,
      presentation: "",
      dosage: substance.name,
      frequency: "",
      duration: "",
      quantity: "",
      instructions: "",
      continuousUse: false,
      activeIngredient: substance.name,
      laboratory: "",
    })
    setMedModalOpen(true)
  }

  const handlePrescriptionSubmit = (values: MedicationFormValues) => {
    if (fromPrescription) {
      navigate(-1, { state: { pendingMedication: values } })
      return
    }
    toast("Medicamento configurado. Adicione durante um atendimento em prescrição.", "success")
  }

  return (
    <ClinicalToolsPageShell
      title="Medicamentos"
      description="Consulte medicamentos, apresentações e informações de bula."
    >
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-text-secondary">
        As informações exibidas são para consulta. Sempre confirme os dados na bula oficial e siga a
        avaliação do profissional de saúde.
      </div>

      <div className="relative max-w-3xl">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por medicamento ou princípio ativo"
          className="h-12 w-full rounded-xl border border-border bg-surface pl-12 pr-4 text-[15px] shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          autoFocus
        />
      </div>

      {!debounced && (
        <div className="space-y-6">
          {favorites.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <Star className="h-4 w-4 text-amber-500" />
                Meus medicamentos
              </h2>
              <div className="flex flex-wrap gap-2">
                {favorites.map((item) => (
                  <BookmarkChip key={item.id} item={item} onOpen={handleOpenBookmark} />
                ))}
              </div>
            </section>
          )}

          {recents.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <Clock className="h-4 w-4 text-text-secondary" />
                Consultados recentemente
              </h2>
              <div className="flex flex-wrap gap-2">
                {recents.slice(0, 8).map((item) => (
                  <BookmarkChip key={item.id} item={item} onOpen={handleOpenBookmark} />
                ))}
              </div>
            </section>
          )}

          {mostConsulted.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <TrendingUp className="h-4 w-4 text-text-secondary" />
                Mais consultados
              </h2>
              <div className="flex flex-wrap gap-2">
                {mostConsulted.map((item) => (
                  <BookmarkChip key={item.id} item={item} onOpen={handleOpenBookmark} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {debounced.length >= MIN_CHARS && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 text-sm font-medium text-text">
            Resultados{" "}
            {loading
              ? "…"
              : `(${pagedResults.length}${results.length > pagedResults.length ? ` de ${results.length}` : ""}${totalProducts ? ` · ${totalProducts} produtos na base` : ""})`}
          </div>

          <ul className="min-h-[200px] divide-y divide-border">
            {pagedResults.length === 0 && !loading ? (
              <li className="p-8 text-center text-sm text-text-secondary">
                Nenhum medicamento encontrado
              </li>
            ) : (
              pagedResults.map((row) => {
                if (row.kind === "product") {
                  const { product } = row
                  const bookmark = bookmarkFromProduct(product)
                  const searchTerm = product.activeIngredient ?? product.name
                  return (
                    <li key={bookmark.id} className="px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                            <Pill className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-text">{product.name}</p>
                            <p className="mt-0.5 text-sm text-text-secondary">{productSubtitle(product)}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={openingBula === bookmark.id}
                            onClick={() => void openBula(bookmark, searchTerm)}
                          >
                            Ver bula
                          </Button>
                          <Button type="button" size="sm" onClick={() => handleAddProduct(product)}>
                            Adicionar à prescrição
                          </Button>
                        </div>
                      </div>
                    </li>
                  )
                }

                const { substance } = row
                const bookmark = bookmarkFromSubstance(substance)
                return (
                  <li key={bookmark.id} className="px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                          <Pill className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-text">{substance.name}</p>
                          <p className="mt-0.5 text-sm text-text-secondary">{substanceSubtitle(substance)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={openingBula === bookmark.id}
                          onClick={() => void openBula(bookmark, substance.name)}
                        >
                          Ver bula
                        </Button>
                        <Button type="button" size="sm" onClick={() => handleAddSubstance(substance)}>
                          Adicionar à prescrição
                        </Button>
                      </div>
                    </div>
                  </li>
                )
              })
            )}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="whitespace-nowrap text-xs text-text-secondary">
                Página {page} de {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="gap-1"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <MedicationFormModal
        open={medModalOpen}
        onClose={() => {
          setMedModalOpen(false)
          setSelectedForm(null)
        }}
        initialValues={selectedForm}
        onSubmit={handlePrescriptionSubmit}
      />
    </ClinicalToolsPageShell>
  )
}
