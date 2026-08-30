import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Plus, Search } from "lucide-react"
import { GestaoPageShell } from "@/components/gestao/GestaoPageShell"
import { Button } from "@/components/ui/button"
import { api, type FinanceTransaction, type FinanceLookup } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useAuth } from "@/context/AuthContext"
import { useConfirm } from "@/hooks/useConfirm"
import TransactionFormModal from "@/components/gestao/TransactionFormModal"
import { cn } from "@/lib/utils"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const typeLabels = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  TRANSFER: "Transferência",
} as const

export default function ExtratoPage({
  fixedType,
  pageTitle = "Extrato",
  pageDescription = "Receitas, despesas e transferências com filtros por texto e tipo.",
}: {
  fixedType?: "INCOME" | "EXPENSE"
  pageTitle?: string
  pageDescription?: string
}) {
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const { hasPermission } = useAuth()
  const canManage = hasPermission("finance:manage")

  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [lookup, setLookup] = useState<FinanceLookup | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"" | "INCOME" | "EXPENSE" | "TRANSFER">(fixedType ?? "")
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"INCOME" | "EXPENSE" | "TRANSFER">("INCOME")

  const load = () => {
    setLoading(true)
    Promise.all([
      api.finance.listTransactions({
        search: search || undefined,
        type: (fixedType ?? typeFilter) || undefined,
      }),
      api.finance.lookup(),
    ])
      .then(([rows, lk]) => {
        setTransactions(rows)
        setLookup(lk)
      })
      .catch((err: unknown) => {
        toast(toastMessageFromApiError(err, "Erro ao carregar extrato"), "error")
        setTransactions([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, typeFilter, fixedType])

  const openModal = (type: "INCOME" | "EXPENSE" | "TRANSFER") => {
    setModalType(type)
    setModalOpen(true)
  }

  return (
    <GestaoPageShell title={pageTitle} description={pageDescription}>
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar descrição..."
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-surface text-sm"
          />
        </div>
        {!fixedType && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
          >
            <option value="">Todos os tipos</option>
            <option value="INCOME">Receitas</option>
            <option value="EXPENSE">Despesas</option>
            <option value="TRANSFER">Transferências</option>
          </select>
        )}
        {canManage && (
          <div className="flex flex-wrap gap-2 ml-auto">
            <Button type="button" onClick={() => openModal("INCOME")}>
              <Plus className="w-4 h-4 mr-1" />
              Nova receita
            </Button>
            <Button type="button" variant="outline" onClick={() => openModal("EXPENSE")}>
              Nova despesa
            </Button>
            <Button type="button" variant="outline" onClick={() => openModal("TRANSFER")}>
              Nova transferência
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Descrição</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Conta / Categoria</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Valor</th>
              {canManage && <th className="text-right p-3">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {!transactions.length && !loading && (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="p-8 text-center text-text-secondary">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-border">
                <td className="p-3 whitespace-nowrap">
                  {format(new Date(tx.date), "dd/MM/yyyy")}
                </td>
                <td className="p-3">
                  <div>{tx.description}</div>
                  {tx.patient?.name && (
                    <div className="text-xs text-text-secondary">{tx.patient.name}</div>
                  )}
                </td>
                <td className="p-3">{typeLabels[tx.type]}</td>
                <td className="p-3 text-text-secondary">
                  {tx.account?.name ??
                    (tx.transferFrom && tx.transferTo
                      ? `${tx.transferFrom.name} → ${tx.transferTo.name}`
                      : "-")}
                  {tx.category?.name ? ` · ${tx.category.name}` : ""}
                </td>
                <td className="p-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      tx.status === "PAID"
                        ? "bg-green-50 text-success"
                        : "bg-yellow-50 text-yellow-700"
                    )}
                  >
                    {tx.status === "PAID" ? "Pago" : "Pendente"}
                  </span>
                </td>
                <td
                  className={cn(
                    "p-3 text-right font-medium",
                    tx.type === "INCOME" ? "text-success" : tx.type === "EXPENSE" ? "text-danger" : "text-text"
                  )}
                >
                  {formatCurrency(tx.amount)}
                </td>
                {canManage && (
                  <td className="p-3 text-right whitespace-nowrap">
                    <select
                      className="h-8 mr-2 rounded-md border border-border bg-surface px-2 text-xs"
                      value={tx.status}
                      onChange={(e) => {
                        const status = e.target.value as "PAID" | "PENDING" | "CANCELLED"
                        api.finance
                          .updateTransactionStatus(tx.id, status)
                          .then(() => {
                            load()
                            toast("Status atualizado.")
                          })
                          .catch((err: unknown) => {
                            toast(toastMessageFromApiError(err, "Erro ao alterar status"), "error")
                          })
                      }}
                    >
                      <option value="PAID">Pago</option>
                      <option value="PENDING">Pendente</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        void confirm({
                          title: "Cancelar lançamento",
                          message: "O lançamento fica cancelado e deixa de entrar no saldo. O histórico é preservado.",
                          confirmLabel: "Cancelar lançamento",
                          cancelLabel: "Manter",
                          variant: "danger",
                        }).then((ok) => {
                          if (!ok) return
                          api.finance
                            .cancelTransaction(tx.id)
                            .then(() => {
                              load()
                              toast("Lançamento cancelado.")
                            })
                            .catch((err: unknown) => {
                              toast(toastMessageFromApiError(err, "Erro ao cancelar lançamento"), "error")
                            })
                        })
                      }}
                    >
                      Cancelar
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lookup && (
        <TransactionFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          type={modalType}
          lookup={lookup}
          onSaved={() => {
            setModalOpen(false)
            load()
            toast("Lançamento salvo com sucesso!")
          }}
        />
      )}
      <ConfirmDialog />
    </GestaoPageShell>
  )
}
