import { useCallback, useEffect, useRef, useState } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import type {
  MedicamentoProduto,
  MedicamentoSearchResponse,
  MedicamentoSubstancia,
  MedicationSearchTab,
} from "@/types/medicamento"

const MIN_CHARS = 2

function formatPrice(price?: number | null) {
  if (price == null) return null
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

type Props = {
  onSelectProduct: (product: MedicamentoProduto) => void
  onSelectSubstance: (substance: MedicamentoSubstancia) => void
  onAddFreeText: () => void
}

export function MedicationSearchPanel({
  onSelectProduct,
  onSelectSubstance,
  onAddFreeText,
}: Props) {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [resultTab, setResultTab] = useState<MedicationSearchTab>("products")
  const [data, setData] = useState<MedicamentoSearchResponse | null>(null)
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
    api.medicamentos
      .search(debounced)
      .then((res) => {
        setData(res)
        setOpen(true)
        if (res.totalProducts > 0) setResultTab("products")
        else if (res.totalSubstances > 0) setResultTab("substances")
      })
      .catch((err: unknown) => {
        setError(true)
        setData(null)
        toast(toastMessageFromApiError(err, "Não foi possível buscar medicamentos agora."), "error")
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

  const totalCount =
    resultTab === "products" ? (data?.totalProducts ?? 0) : (data?.totalSubstances ?? 0)

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
          placeholder="Digite para buscar..."
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
          onClick={() => setResultTab("products")}
          className={cn(
            "px-3 py-1.5 rounded-lg font-medium transition-colors",
            resultTab === "products"
              ? "bg-primary-light text-primary"
              : "text-text-secondary hover:bg-surface-alt"
          )}
        >
          Produtos
        </button>
        <button
          type="button"
          onClick={() => setResultTab("substances")}
          className={cn(
            "px-3 py-1.5 rounded-lg font-medium transition-colors",
            resultTab === "substances"
              ? "bg-primary-light text-primary"
              : "text-text-secondary hover:bg-surface-alt"
          )}
        >
          Substâncias
        </button>
        <span className="text-text-secondary/60 px-1">Ou</span>
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
            <p className="px-4 py-6 text-sm text-text-secondary text-center">Buscando medicamentos...</p>
          )}

          {error && !loading && (
            <p className="px-4 py-6 text-sm text-danger text-center">
              Não foi possível buscar medicamentos agora. Tente novamente em instantes.
            </p>
          )}

          {!loading && !error && data && (
            <>
              <div className="px-4 py-2.5 border-b border-border bg-surface-alt/80">
                <p className="text-[11px] font-semibold tracking-wide text-text-secondary uppercase">
                  {totalCount > 0
                    ? `${totalCount} resultado${totalCount === 1 ? "" : "s"} encontrado${totalCount === 1 ? "" : "s"}`
                    : `Nenhum medicamento encontrado para "${data.query}"`}
                </p>
              </div>

              <div className="max-h-[320px] overflow-y-auto overscroll-contain">
                {resultTab === "products" && data.products.length === 0 && (
                  <div className="px-4 py-6 text-center space-y-3">
                    <p className="text-sm text-text-secondary">
                      Nenhum produto encontrado para &quot;{data.query}&quot;.
                    </p>
                    <button
                      type="button"
                      onClick={onAddFreeText}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Adicionar como texto livre
                    </button>
                  </div>
                )}

                {resultTab === "products" &&
                  data.products.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onSelect={() => {
                        onSelectProduct(product)
                        setOpen(false)
                      }}
                    />
                  ))}

                {resultTab === "substances" && data.substances.length === 0 && (
                  <p className="px-4 py-6 text-sm text-text-secondary text-center">
                    Nenhuma substância encontrada.
                  </p>
                )}

                {resultTab === "substances" &&
                  data.substances.map((substance) => (
                    <button
                      key={substance.id}
                      type="button"
                      onClick={() => {
                        onSelectSubstance(substance)
                        setOpen(false)
                      }}
                      className="w-full text-left px-4 py-3 border-b border-border/60 last:border-b-0 hover:bg-surface-alt transition-colors"
                    >
                      <p className="text-sm font-medium text-text">{substance.name}</p>
                      {substance.productCount != null && substance.productCount > 0 && (
                        <p className="text-xs text-text-secondary mt-0.5">
                          {substance.productCount} produto(s) relacionado(s)
                        </p>
                      )}
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {debounced.length > 0 && debounced.length < MIN_CHARS && (
        <p className="text-xs text-text-secondary">Digite pelo menos {MIN_CHARS} caracteres para buscar.</p>
      )}
    </div>
  )
}

function ProductRow({
  product,
  onSelect,
}: {
  product: MedicamentoProduto
  onSelect: () => void
}) {
  const price = formatPrice(product.price)
  const meta = [product.pharmaceuticalForm, product.packageQuantity].filter(Boolean).join(" · ")

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left px-4 py-3 border-b border-border/60 last:border-b-0 hover:bg-surface-alt transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
              {product.name}
            </p>
            {product.highlighted && (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary-light text-primary">
                Destaque
              </span>
            )}
          </div>
          {meta && <p className="text-xs text-text-secondary mt-0.5">{meta}</p>}
          {product.activeIngredient && (
            <p className="text-xs text-text-secondary mt-1">{product.activeIngredient}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-text-secondary">
            {product.laboratory && <span>{product.laboratory}</span>}
            {product.productType && (
              <span className="text-text-secondary/80">{product.productType}</span>
            )}
          </div>
        </div>
        {price && (
          <p className="text-sm font-semibold text-text shrink-0 tabular-nums">{price}</p>
        )}
      </div>
    </button>
  )
}
