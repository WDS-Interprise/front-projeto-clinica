import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Plus, Search } from "lucide-react"
import { GestaoPageShell } from "@/components/gestao/GestaoPageShell"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useAuth } from "@/context/AuthContext"

type Product = {
  id: string
  name: string
  sku: string | null
  unit: string
  minStock: number
  currentStock: number
  expiryDate: string | null
}

const filters = [
  { value: "all", label: "Todos" },
  { value: "low", label: "Estoque baixo" },
  { value: "expiring", label: "Vence em 30 dias" },
  { value: "expired", label: "Vencidos" },
] as const

export default function EstoquePage() {
  const { toast } = useToast()
  const { hasPermission } = useAuth()
  const canManage = hasPermission("finance:manage")
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all")
  const [productModal, setProductModal] = useState(false)
  const [moveModal, setMoveModal] = useState<{ productId: string; type: "IN" | "OUT" } | null>(null)
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [minStock, setMinStock] = useState("0")
  const [qty, setQty] = useState("1")

  const load = () => {
    api.inventory
      .listProducts({ search: search || undefined, filter })
      .then(setProducts)
      .catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao carregar estoque"), "error"))
  }

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, filter])

  const saveProduct = async () => {
    try {
      await api.inventory.createProduct({ name, sku: sku || undefined, minStock: Number(minStock) || 0 })
      toast("Produto cadastrado!")
      setProductModal(false)
      setName("")
      setSku("")
      load()
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao salvar produto"), "error")
    }
  }

  const saveMove = async () => {
    if (!moveModal) return
    try {
      await api.inventory.moveStock({ productId: moveModal.productId, type: moveModal.type, quantity: Number(qty) || 1 })
      toast("Movimentação registrada!")
      setMoveModal(null)
      load()
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro na movimentação"), "error")
    }
  }

  return (
    <GestaoPageShell title="Estoque" description="Controle de produtos, entradas, saídas e alertas.">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto..." className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-surface text-sm" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm">
          {filters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        {canManage && (
          <Button type="button" onClick={() => setProductModal(true)} className="ml-auto">
            <Plus className="w-4 h-4 mr-1" /> Adicionar produto
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Produto</th>
              <th className="text-left p-3">Código</th>
              <th className="text-right p-3">Estoque</th>
              <th className="text-right p-3">Mínimo</th>
              <th className="text-left p-3">Validade</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {!products.length && (
              <tr><td colSpan={6} className="p-8 text-center text-text-secondary">Nenhum produto encontrado.</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-text-secondary">{p.sku ?? "—"}</td>
                <td className={`p-3 text-right font-medium ${p.currentStock <= p.minStock ? "text-danger" : ""}`}>{p.currentStock} {p.unit}</td>
                <td className="p-3 text-right">{p.minStock}</td>
                <td className="p-3">{p.expiryDate ? format(new Date(p.expiryDate), "dd/MM/yyyy") : "—"}</td>
                <td className="p-3 text-right">
                  {canManage && (
                    <div className="flex gap-1 justify-end">
                      <Button type="button" size="sm" variant="outline" onClick={() => { setMoveModal({ productId: p.id, type: "IN" }); setQty("1") }}>Entrada</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => { setMoveModal({ productId: p.id, type: "OUT" }); setQty("1") }}>Saída</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={productModal} onClose={() => setProductModal(false)} title="Novo produto" footer={<><Button variant="outline" onClick={() => setProductModal(false)}>Cancelar</Button><Button onClick={saveProduct}>Salvar</Button></>}>
        <div className="px-6 py-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="w-full h-10 rounded-lg border border-border px-3" />
          <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Código/SKU" className="w-full h-10 rounded-lg border border-border px-3" />
          <input value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="Estoque mínimo" className="w-full h-10 rounded-lg border border-border px-3" />
        </div>
      </Modal>

      <Modal open={!!moveModal} onClose={() => setMoveModal(null)} title={moveModal?.type === "IN" ? "Entrada" : "Saída"} footer={<><Button variant="outline" onClick={() => setMoveModal(null)}>Cancelar</Button><Button onClick={saveMove}>Confirmar</Button></>}>
        <div className="px-6 py-4">
          <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantidade" className="w-full h-10 rounded-lg border border-border px-3" />
        </div>
      </Modal>
    </GestaoPageShell>
  )
}
