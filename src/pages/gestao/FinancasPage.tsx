import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { format, subDays } from "date-fns"
import { ArrowDownRight, ArrowUpRight, RefreshCw, Wallet } from "lucide-react"
import { GestaoPageShell } from "@/components/gestao/GestaoPageShell"
import { MetricCard } from "@/components/ui/metric-card"
import { Button } from "@/components/ui/button"
import { api, type FinanceSummary } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function FinancasPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"))
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"))

  const load = () => {
    setLoading(true)
    api.finance
      .summary({ dateFrom, dateTo })
      .then(setSummary)
      .catch((err: unknown) => {
        toast(toastMessageFromApiError(err, "Erro ao carregar finanças"), "error")
        setSummary(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [dateFrom, dateTo])

  return (
    <GestaoPageShell
      title="Finanças"
      description="Resumo financeiro com saldo, receitas, despesas e transações do período."
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-text-secondary mb-1">De</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-text-secondary mb-1">Até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
          />
        </label>
        <Button type="button" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
        <Link to="/gestao/financas/extrato" className="ml-auto">
          <Button type="button">Ver extrato completo</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Saldo geral"
          value={loading ? "..." : summary ? formatCurrency(summary.balance) : "—"}
          icon={Wallet}
          accentClass="text-primary bg-primary-light"
        />
        <MetricCard
          label="Receitas pagas"
          value={loading ? "..." : summary ? formatCurrency(summary.incomePaid) : "—"}
          icon={ArrowUpRight}
          accentClass="text-success bg-green-50"
        />
        <MetricCard
          label="Despesas pagas"
          value={loading ? "..." : summary ? formatCurrency(summary.expensePaid) : "—"}
          icon={ArrowDownRight}
          accentClass="text-danger bg-red-50"
        />
        <MetricCard
          label="Balanço do período"
          value={loading ? "..." : summary ? formatCurrency(summary.balancePeriod) : "—"}
          icon={Wallet}
          accentClass="text-secondary bg-indigo-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text mb-3">Receitas x convênio</h2>
          {!summary?.byInsurance.length && !loading && (
            <p className="text-sm text-text-secondary">Nenhuma receita no período.</p>
          )}
          <ul className="space-y-2">
            {summary?.byInsurance.map((row) => (
              <li key={row.label} className="flex justify-between text-sm">
                <span className="text-text-secondary">{row.label}</span>
                <span className="font-medium text-text">{formatCurrency(row.value)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text mb-3">Receitas x categoria</h2>
          {!summary?.byCategory.length && !loading && (
            <p className="text-sm text-text-secondary">Nenhuma receita no período.</p>
          )}
          <ul className="space-y-2">
            {summary?.byCategory.map((row) => (
              <li key={row.label} className="flex justify-between text-sm">
                <span className="text-text-secondary">{row.label}</span>
                <span className="font-medium text-text">{formatCurrency(row.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Transações recentes</h2>
          <div className="text-xs text-text-secondary">
            Pendentes: receitas {formatCurrency(summary?.incomePending ?? 0)} · despesas{" "}
            {formatCurrency(summary?.expensePending ?? 0)}
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Descrição</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-right p-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {!summary?.recentTransactions.length && !loading && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-text-secondary">
                  Nenhuma transação no período.
                </td>
              </tr>
            )}
            {summary?.recentTransactions.map((tx) => (
              <tr key={tx.id} className="border-t border-border">
                <td className="p-3 whitespace-nowrap">
                  {format(new Date(tx.date), "dd/MM/yyyy")}
                </td>
                <td className="p-3">{tx.description}</td>
                <td className="p-3 capitalize text-text-secondary">
                  {tx.type === "INCOME" ? "Receita" : tx.type === "EXPENSE" ? "Despesa" : "Transferência"}
                </td>
                <td
                  className={cn(
                    "p-3 text-right font-medium",
                    tx.type === "INCOME" ? "text-success" : tx.type === "EXPENSE" ? "text-danger" : "text-text"
                  )}
                >
                  {formatCurrency(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GestaoPageShell>
  )
}
