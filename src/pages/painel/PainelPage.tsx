import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  CalendarCheck,
  CalendarClock,
  UserCheck,
  UserX,
  RefreshCw,
  FileText,
  BarChart3,
} from "lucide-react"
import { api } from "@/services/api"
import { MetricCard } from "@/components/ui/metric-card"
import { MetricCardSkeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PanelMetrics, TodayPatientSlot } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PainelPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<PanelMetrics | null>(null)
  const [dayList, setDayList] = useState<TodayPatientSlot[]>([])

  const load = () => {
    setLoading(true)
    Promise.all([api.dashboard.panelMetrics(), api.dashboard.todayPatients()])
      .then(([m, today]) => {
        setMetrics(m)
        setDayList(today)
      })
      .catch(() => {
        setMetrics(null)
        setDayList([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const statCards = metrics
    ? [
        { label: "Pacientes agendados", value: metrics.scheduled, icon: CalendarClock, accent: "text-primary bg-primary-light" },
        { label: "Pacientes confirmados", value: metrics.confirmed, icon: CalendarCheck, accent: "text-secondary bg-indigo-50" },
        { label: "Pacientes atendidos", value: metrics.completed, icon: UserCheck, accent: "text-success bg-green-50" },
        { label: "Pacientes que faltaram", value: metrics.noShow, icon: UserX, accent: "text-danger bg-red-50" },
      ]
    : []

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="w-72 shrink-0 border-r border-border bg-surface p-4 hidden md:block">
        <h2 className="text-sm font-semibold text-text px-2 mb-4">Pacientes do dia</h2>
        <div className="space-y-2">
          {dayList.length === 0 && !loading && (
            <p className="text-xs text-text-secondary px-2">Nenhum paciente hoje.</p>
          )}
          {dayList.map((p) => (
            <Link
              key={p.id}
              to={p.patientId ? `/prontuario/${p.patientId}` : "#"}
              className="block p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary-light/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono font-medium text-primary">{p.time}</span>
                <Badge status={p.status.toLowerCase() as "scheduled"} />
              </div>
              <p className="text-sm font-medium text-text mt-1 truncate">
                {p.patient?.name ?? "—"}
              </p>
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Abrir prontuário
              </p>
            </Link>
          ))}
        </div>
      </aside>

      <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-auto">
        <div className="rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 px-5 py-4 text-sm text-text">
          Bem-vindo ao <strong>ClinMax</strong> — dados em tempo real do banco.
        </div>

        <div className="flex justify-end">
          <Button variant="outline" className="gap-2" onClick={load}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar dados
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
            : statCards.map((m) => (
                <MetricCard
                  key={m.label}
                  label={m.label}
                  value={m.value}
                  icon={m.icon}
                  accentClass={m.accent}
                />
              ))}
        </div>

        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Pacientes novos x recorrentes (hoje)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-8 justify-center py-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{metrics.newVsReturning.new}</p>
                  <p className="text-xs text-text-secondary">Novos</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-accent">{metrics.newVsReturning.returning}</p>
                  <p className="text-xs text-text-secondary">Recorrentes</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pacientes por convênio (hoje)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.byInsurance.map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-semibold text-primary">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Procedimentos (hoje)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {metrics.procedures.map((p) => (
                  <div key={p.label} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                    <span>{p.label}</span>
                    <span className="font-semibold">{p.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo do período</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">Duração média do atendimento</p>
                <p className="text-3xl font-bold text-text">
                  {metrics.avgDurationMinutes != null ? `${metrics.avgDurationMinutes} min` : "—"}
                </p>
                {metrics.avgDurationMinutes == null && metrics.appointmentsInPeriod === 0 && (
                  <p className="text-xs text-text-secondary mt-1">
                    Sem atendimentos concluídos nos últimos 30 dias.
                  </p>
                )}
                <p className="text-sm text-text-secondary mt-4">Atendimentos no período</p>
                <p className="text-2xl font-bold text-primary">{metrics.appointmentsInPeriod}</p>
              </CardContent>
            </Card>

            {metrics.ageDistribution && metrics.ageDistribution.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribuição etária (cadastro)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {metrics.ageDistribution.map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span>{item.label} anos</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {metrics.birthdaysToday && metrics.birthdaysToday.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aniversariantes do dia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {metrics.birthdaysToday.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span>{p.name}</span>
                      <span className="text-text-secondary">{p.age} anos</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
