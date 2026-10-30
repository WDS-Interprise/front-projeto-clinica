import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { format, subDays } from "date-fns"
import { ArrowDownRight, ArrowUpRight, Inbox, RefreshCw, Scale, Wallet } from "lucide-react"
import { GestaoPageShell } from "@/components/gestao/GestaoPageShell"
import { MetricCard } from "@/components/ui/metric-card"
import { Button } from "@/components/ui/button"
import DatePicker from "@/components/ui/date-picker"
import { api, type FinanceSummary } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const CHART_COLORS = ["#006B4D", "#3D6A8A", "#6D4C9A", "#C45C26", "#2B6CB0"]

function BreakdownCard({
  title,
  rows,
  loading,
}: {
  title: string
  rows: Array<{ label: string; value: number }>
  loading: boolean
}) {
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  const gradient = rows.length
    ? rows
        .map((row, index) => {
          const start = rows.slice(0, index).reduce((sum, item) => sum + (item.value / total) * 100, 0)
          const end = start + (row.value / total) * 100
          return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${end}%`
        })
        .join(", ")
    : undefined

  const empty = !loading && rows.length === 0

  return (
    <div className="rounded-[14px] border border-border bg-surface p-5">
      <h2 className="text-[16px] font-semibold text-text">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        {empty ? (
          <div
            className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[10px] border-border bg-transparent"
            aria-hidden
          />
        ) : (
          <div
            className="mx-auto h-28 w-28 shrink-0 rounded-full"
            style={{
              background: rows.length
                ? `conic-gradient(${gradient})`
                : "transparent",
            }}
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          {loading && <p className="text-sm text-text-secondary">Carregando...</p>}
          {empty && (
            <p className="text-sm text-text-secondary">Nenhuma receita no período.</p>
          )}
          <ul className="space-y-2">
            {rows.map((row, index) => (
              <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-text-secondary">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="truncate">{row.label}</span>
                </span>
                <span className="shrink-0 font-medium text-text">{formatCurrency(row.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
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
        <DatePicker label="De" value={dateFrom} onChange={setDateFrom} className="w-[180px]" />
        <DatePicker label="Até" value={dateTo} onChange={setDateTo} className="w-[180px]" />
        <Button type="button" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </Button>
        <Link to="/gestao/financas/extrato" className="ml-auto">
          <Button type="button">Ver extrato completo</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Saldo geral"
          value={loading ? "..." : summary ? formatCurrency(summary.balance) : "-"}
          icon={Wallet}
          accentClass="text-[#3D6A8A] bg-[#E8F1F8]"
        />
        <MetricCard
          label="Receitas pagas"
          value={loading ? "..." : summary ? formatCurrency(summary.incomePaid) : "-"}
          icon={ArrowUpRight}
          accentClass="text-[#006B4D] bg-[#E8F6EE]"
        />
        <MetricCard
          label="Despesas pagas"
          value={loading ? "..." : summary ? formatCurrency(summary.expensePaid) : "-"}
          icon={ArrowDownRight}
          accentClass="text-danger bg-red-50"
        />
        <MetricCard
          label="Balanço do período"
          value={loading ? "..." : summary ? formatCurrency(summary.balancePeriod) : "-"}
          icon={Scale}
          accentClass="text-[#6D4C9A] bg-[#EDE7F6]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownCard title="Receitas x convênio" rows={summary?.byInsurance ?? []} loading={loading} />
        <BreakdownCard title="Receitas x categoria" rows={summary?.byCategory ?? []} loading={loading} />
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
          <h2 className="text-[16px] font-semibold text-text">Transações recentes</h2>
          <p className="text-[13px] text-text-secondary">
            Pendentes: receitas {formatCurrency(summary?.incomePending ?? 0)} · despesas{" "}
            {formatCurrency(summary?.expensePending ?? 0)}
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-text-secondary">
            <tr>
              <th className="p-3 text-left font-medium">Data</th>
              <th className="p-3 text-left font-medium">Descrição</th>
              <th className="p-3 text-left font-medium">Tipo</th>
              <th className="p-3 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {!summary?.recentTransactions.length && !loading && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-text-secondary">
                  <Inbox className="mx-auto mb-2 h-8 w-8 text-text-secondary/50" />
                  Nenhuma transação no período.
                </td>
              </tr>
            )}
            {summary?.recentTransactions.map((tx) => (
              <tr key={tx.id} className="border-t border-border">
                <td className="whitespace-nowrap p-3 text-text">
                  {format(new Date(tx.date), "dd/MM/yyyy")}
                </td>
                <td className="p-3 text-text">{tx.description}</td>
                <td className="p-3 text-text-secondary">
                  {tx.type === "INCOME" ? "Receita" : tx.type === "EXPENSE" ? "Despesa" : "Transferência"}
                </td>
                <td
                  className={cn(
                    "p-3 text-right font-medium",
                    tx.type === "INCOME" ? "text-[#3B9B7A]" : tx.type === "EXPENSE" ? "text-danger" : "text-text"
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
