import { useEffect, useState } from "react"
import { Receipt, TrendingUp, AlertCircle, Wallet } from "lucide-react"
import { backofficeApi } from "@/services/backoffice-api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { BillingStatusBadge } from "@/components/billing/PlanBadges"
import { MetricCard } from "@/components/ui/metric-card"

const filters = ["ALL", "PENDING", "PAID", "OVERDUE", "CANCELLED", "REFUNDED"]

function formatMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function BackofficeCobrancasPage() {
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [status, setStatus] = useState("ALL")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    backofficeApi.billing
      .list({ status: status === "ALL" ? undefined : status })
      .then((res) => {
        setInvoices(res.invoices)
        setSummary(res.summary)
      })
      .catch((err: unknown) => toast(toastMessageFromApiError(err, "Erro ao carregar cobranças"), "error"))
      .finally(() => setLoading(false))
  }, [status])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#12261E]">Cobranças SaaS</h1>
        <p className="mt-1 text-sm text-[#6B7C74]">Mensalidades das clínicas na plataforma (separado do ClinMax Pay).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="MRR" value={formatMoney(summary?.mrr ?? 0)} icon={TrendingUp} />
        <MetricCard label="A receber" value={formatMoney(summary?.receivable ?? 0)} icon={Wallet} />
        <MetricCard label="Em atraso" value={formatMoney(summary?.overdue ?? 0)} icon={AlertCircle} />
        <MetricCard label="Recebido no mês" value={formatMoney(summary?.receivedMonth ?? 0)} icon={Receipt} />
      </div>

      <div className="flex flex-wrap gap-1">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatus(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${status === f ? "bg-[#E8F6EE] text-[#006B4D]" : "border border-[#E4EBE6] bg-white text-[#6B7C74]"}`}
          >
            {f === "ALL" ? "Todos" : f === "PENDING" ? "Pendentes" : f === "PAID" ? "Pagas" : f === "OVERDUE" ? "Vencidas" : f === "CANCELLED" ? "Canceladas" : "Estornadas"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E4EBE6] bg-white">
        {loading ? (
          <p className="p-6 text-sm text-[#6B7C74]">Carregando...</p>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="mx-auto h-10 w-10 text-[#8A9A90]" />
            <p className="mt-2 text-sm text-[#6B7C74]">Nenhuma cobrança registrada.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F4F7F5] text-left text-xs uppercase text-[#8A9A90]">
              <tr>
                <th className="px-4 py-3">Clínica</th>
                <th className="px-4 py-3">Plano</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Asaas</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-[#E4EBE6]">
                  <td className="px-4 py-3 font-medium">{inv.clinicName}</td>
                  <td className="px-4 py-3">{inv.planName}</td>
                  <td className="px-4 py-3">{formatMoney(inv.amount)}</td>
                  <td className="px-4 py-3">{new Date(inv.dueDate).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <BillingStatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8A9A90]">{inv.asaasPaymentId ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
