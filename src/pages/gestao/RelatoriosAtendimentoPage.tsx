import { useEffect, useState } from "react"
import { format } from "date-fns"
import { RefreshCw, Users } from "lucide-react"
import { GestaoPageShell } from "@/components/gestao/GestaoPageShell"
import { Button } from "@/components/ui/button"
import { MetricCard } from "@/components/ui/metric-card"
import { api, type AttendanceReport } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Faltou",
  RESCHEDULED: "Remarcado",
}

export default function RelatoriosAtendimentoPage({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<AttendanceReport | null>(null)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    return format(new Date(d.getFullYear(), d.getMonth(), 1), "yyyy-MM-dd")
  })
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"))

  const load = () => {
    setLoading(true)
    api.reports
      .attendance({ dateFrom, dateTo })
      .then(setReport)
      .catch((err: unknown) => {
        toast(toastMessageFromApiError(err, "Erro ao gerar relatório"), "error")
        setReport(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [dateFrom, dateTo])

  const content = (
    <>
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
          Gerar relatório
        </Button>
      </div>

      <MetricCard
        label="Total de atendimentos"
        value={loading ? "..." : String(report?.total ?? 0)}
        icon={Users}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text mb-3">Por status</h2>
          <ul className="space-y-2">
            {report?.byStatus.map((row) => (
              <li key={row.label} className="flex justify-between text-sm">
                <span className="text-text-secondary">{statusLabels[row.label] ?? row.label}</span>
                <span className="font-medium">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text mb-3">Por convênio</h2>
          <ul className="space-y-2">
            {report?.byInsurance.map((row) => (
              <li key={row.label} className="flex justify-between text-sm">
                <span className="text-text-secondary">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text mb-3">Por profissional</h2>
          <ul className="space-y-2">
            {report?.byDoctor.map((row) => (
              <li key={row.id} className="flex justify-between text-sm">
                <span className="text-text-secondary">{row.name}</span>
                <span className="font-medium">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Paciente</th>
              <th className="text-left p-3">Profissional</th>
              <th className="text-left p-3">Convênio</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {!report?.rows.length && !loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">
                  Nenhum atendimento no período.
                </td>
              </tr>
            )}
            {report?.rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="p-3 whitespace-nowrap">
                  {format(new Date(row.date), "dd/MM/yyyy")} {row.startTime}
                </td>
                <td className="p-3">{row.patient?.name ?? "—"}</td>
                <td className="p-3">{row.doctor.name}</td>
                <td className="p-3">{row.insurancePlan || "Particular"}</td>
                <td className="p-3">{statusLabels[row.status] ?? row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )

  if (embedded) return content

  return (
    <GestaoPageShell title="Atendimentos realizados" description="Relatório de consultas por período, convênio, profissional e status.">
      {content}
    </GestaoPageShell>
  )
}
