import { useEffect, useState } from "react"
import { GestaoPageShell } from "@/components/gestao/GestaoPageShell"
import { Button } from "@/components/ui/button"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function FluxoCaixaPage() {
  const { toast } = useToast()
  const [mode, setMode] = useState<"daily" | "monthly">("daily")
  const [rows, setRows] = useState<Array<{ period: string; income: number; expense: number; balance: number }>>([])
  const [endingBalance, setEndingBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.finance
      .cashFlow({ mode })
      .then((r) => {
        setRows(r.rows)
        setEndingBalance(r.endingBalance)
      })
      .catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao carregar fluxo"), "error"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [mode])

  return (
    <GestaoPageShell title="Fluxo de caixa" description="Receitas, despesas e saldo acumulado por período.">
      <div className="flex gap-2">
        <Button type="button" variant={mode === "daily" ? "primary" : "outline"} onClick={() => setMode("daily")}>
          Diário
        </Button>
        <Button type="button" variant={mode === "monthly" ? "primary" : "outline"} onClick={() => setMode("monthly")}>
          Mensal
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-text-secondary">Saldo final do período</p>
        <p className="text-2xl font-bold text-text">{loading ? "..." : formatCurrency(endingBalance)}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Período</th>
              <th className="text-right p-3">Receitas</th>
              <th className="text-right p-3">Despesas</th>
              <th className="text-right p-3">Saldo acumulado</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length && !loading && (
              <tr><td colSpan={4} className="p-8 text-center text-text-secondary">Sem movimentações no período.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.period} className="border-t border-border">
                <td className="p-3">{r.period}</td>
                <td className="p-3 text-right text-success">{formatCurrency(r.income)}</td>
                <td className="p-3 text-right text-danger">{formatCurrency(r.expense)}</td>
                <td className="p-3 text-right font-medium">{formatCurrency(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GestaoPageShell>
  )
}
