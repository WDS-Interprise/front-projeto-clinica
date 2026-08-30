import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  BarChart3,
  CalendarCheck,
  ChevronDown,
  Lightbulb,
  RefreshCw,
  Stethoscope,
  UserCheck,
  UserX,
} from "lucide-react"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PanelMetrics, TodayPatientSlot } from "@/types"
import { cn } from "@/lib/utils"

const MINT = "#E8F6EE"
const GREEN = "#007D5C"
const TEAL = "#14B8A6"

function formatPct(n: number) {
  const abs = Math.abs(n)
  return `${abs}%`
}

function formatMoney(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })
}

function Trend({
  value,
  suffix = "vs ontem",
  invert = false,
  format = "percent",
}: {
  value: number
  suffix?: string
  invert?: boolean
  format?: "percent" | "pp" | "count"
}) {
  const up = value > 0
  const down = value < 0
  const good = invert ? down : up
  const Icon = down ? ArrowDownRight : ArrowUpRight
  const label =
    format === "count"
      ? `${Math.abs(value)}`
      : format === "pp"
        ? `${Math.abs(value)}pp`
        : formatPct(value)
  return (
    <p
      className={cn(
        "mt-2 flex items-center gap-1 text-[12px] font-medium",
        value === 0 && "text-[#8A9A90]",
        value !== 0 && (good ? "text-emerald-600" : "text-red-500")
      )}
    >
      {value !== 0 && <Icon className="h-3.5 w-3.5" />}
      {value === 0 ? "Sem variação" : label}{" "}
      <span className="font-normal text-[#8A9A90]">{suffix}</span>
    </p>
  )
}

function EmptyDayIllustration() {
  return (
    <svg viewBox="0 0 160 140" className="mx-auto h-32 w-32" aria-hidden>
      <rect x="38" y="28" width="84" height="88" rx="10" fill="#F3F7F4" stroke="#C5D9CC" strokeWidth="2" />
      <rect x="38" y="28" width="84" height="22" rx="10" fill="#D8EDE2" />
      <rect x="38" y="40" width="84" height="10" fill="#D8EDE2" />
      <circle cx="58" cy="34" r="3.5" fill="#007D5C" />
      <circle cx="102" cy="34" r="3.5" fill="#007D5C" />
      <rect x="52" y="62" width="12" height="10" rx="2" fill="#C5D9CC" />
      <rect x="74" y="62" width="12" height="10" rx="2" fill="#C5D9CC" />
      <rect x="96" y="62" width="12" height="10" rx="2" fill="#C5D9CC" />
      <rect x="52" y="80" width="12" height="10" rx="2" fill="#C5D9CC" />
      <rect x="74" y="80" width="12" height="10" rx="2" fill="#C5D9CC" />
      <circle cx="118" cy="108" r="22" fill="#007D5C" />
      <path d="M108 108.5 115 115.5 129 100.5" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WelcomeIllustration() {
  return (
    <svg viewBox="0 0 220 140" className="h-[118px] w-[180px] shrink-0" aria-hidden>
      <rect x="28" y="18" width="148" height="96" rx="10" fill="#1F3D32" />
      <rect x="36" y="26" width="132" height="72" rx="4" fill="#F7FBFA" />
      <path d="M48 78 C68 58 88 86 108 62 C128 40 148 70 160 52" fill="none" stroke="#2ECC71" strokeWidth="3" strokeLinecap="round" />
      <rect x="48" y="34" width="28" height="8" rx="2" fill="#D8EDE2" />
      <rect x="80" y="34" width="18" height="8" rx="2" fill="#BFE3D0" />
      <rect x="86" y="108" width="32" height="8" rx="2" fill="#1F3D32" />
      <rect x="68" y="116" width="68" height="8" rx="3" fill="#C5D9CC" />
    </svg>
  )
}

function Donut({ novos, recorrentes }: { novos: number; recorrentes: number }) {
  const total = Math.max(novos + recorrentes, 1)
  const r = 42
  const c = 2 * Math.PI * r
  const novosLen = (novos / total) * c
  return (
    <svg viewBox="0 0 120 120" className="h-[140px] w-[140px]" aria-hidden>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#E6F4EC" strokeWidth="16" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={TEAL}
        strokeWidth="16"
        strokeDasharray={`${c - novosLen} ${c}`}
        strokeDashoffset={c * 0.25}
        strokeLinecap="butt"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={GREEN}
        strokeWidth="16"
        strokeDasharray={`${novosLen} ${c}`}
        strokeDashoffset={c * 0.25 - (c - novosLen)}
        strokeLinecap="butt"
      />
    </svg>
  )
}

export default function PainelPage() {
  const { toast } = useToast()
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
      .catch((err: unknown) => {
        setMetrics(null)
        setDayList([])
        toast(toastMessageFromApiError(err, "Erro ao carregar o painel"), "error")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const insuranceTotal = useMemo(
    () => (metrics?.byInsurance.reduce((s, i) => s + i.count, 0) ?? 0) || 1,
    [metrics]
  )
  const procedureTotal = useMemo(
    () => (metrics?.procedures.reduce((s, i) => s + i.count, 0) ?? 0) || 1,
    [metrics]
  )

  const kpis = metrics
    ? [
        {
          label: "Pacientes agendados",
          value: metrics.scheduled,
          change: metrics.vsYesterday?.scheduled ?? 0,
          icon: CalendarPlus,
        },
        {
          label: "Pacientes confirmados",
          value: metrics.confirmed,
          change: metrics.vsYesterday?.confirmed ?? 0,
          icon: CalendarCheck,
        },
        {
          label: "Pacientes atendidos",
          value: metrics.completed,
          change: metrics.vsYesterday?.completed ?? 0,
          icon: UserCheck,
        },
        {
          label: "Pacientes que faltaram",
          value: metrics.noShow,
          change: metrics.vsYesterday?.noShow ?? 0,
          icon: UserX,
          invert: true,
        },
      ]
    : []

  const novos = metrics?.newVsReturning.new ?? 0
  const recorrentes = metrics?.newVsReturning.returning ?? 0
  const mixTotal = Math.max(novos + recorrentes, 1)

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-[#F4F7F5]">
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-[#E2EBE5] bg-white md:flex">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="text-[15px] font-semibold text-[#1B2E26]">Pacientes do dia</h2>
          <Link
            to="/agenda"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#007D5C] hover:bg-[#E8F6EE]"
            aria-label="Abrir agenda"
          >
            <CalendarDays className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex-1 overflow-auto px-4">
          {dayList.length === 0 && !loading && (
            <div className="flex flex-col items-center px-2 pt-10 text-center">
              <EmptyDayIllustration />
              <p className="mt-3 text-sm font-semibold text-[#1B2E26]">Nenhum paciente hoje.</p>
              <p className="mt-1 text-[13px] leading-5 text-[#6B7C73]">
                Não há pacientes agendados para hoje.
              </p>
            </div>
          )}
          <div className="space-y-2 pb-4">
            {dayList.map((p) => (
              <Link
                key={p.id}
                to={p.patientId ? `/prontuario/${p.patientId}` : "#"}
                className="block rounded-xl border border-[#E2EBE5] p-3 transition-colors hover:border-[#007D5C]/30 hover:bg-[#E8F6EE]/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-medium text-[#007D5C]">{p.time}</span>
                  <Badge status={p.status.toLowerCase() as "scheduled"} />
                </div>
                <p className="mt-1 truncate text-sm font-medium text-[#1B2E26]">
                  {p.patient?.name ?? "-"}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="m-4 rounded-xl p-3.5" style={{ background: MINT }}>
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#007D5C]">
            <Lightbulb className="h-3.5 w-3.5" />
            Dica ClinMax
          </p>
          <p className="mt-1.5 text-[12px] leading-5 text-[#3D5A4C]">
            Mantenha sua agenda atualizada para oferecer a melhor experiência aos seus pacientes.
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-auto p-5 lg:p-7">
        <div
          className="flex items-center justify-between gap-6 rounded-2xl px-6 py-5"
          style={{ background: MINT }}
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <Activity className="h-6 w-6 text-[#007D5C]" />
            </div>
            <div>
              <p className="text-[17px] font-semibold text-[#1B2E26]">Bem-vindo ao ClinMax! 👋</p>
              <p className="mt-0.5 text-[13px] text-[#4A6356]">
                Aqui você acompanha em tempo real o desempenho da sua clínica.
              </p>
            </div>
          </div>
          <WelcomeIllustration />
        </div>

        <div className="mt-4">
          <Button
            variant="secondary"
            className="h-9 gap-2 rounded-lg border-[#D7E3DB] bg-white text-[#1B2E26] shadow-sm"
            onClick={load}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Atualizar dados
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading && !metrics
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[132px] animate-pulse rounded-2xl bg-white shadow-sm" />
              ))
            : kpis.map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl border border-[#E8EEEA] bg-white p-5 shadow-[0_4px_16px_rgba(16,40,28,0.05)]"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-[13px] text-[#6B7C73]">{m.label}</p>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F6EE] text-[#007D5C]">
                      <m.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-2 text-[32px] font-bold leading-none tracking-tight text-[#1B2E26]">
                    {m.value}
                  </p>
                  <Trend value={m.change} invert={m.invert} />
                </div>
              ))}
        </div>

        {metrics && (
          <>
            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-[#E8EEEA] bg-white p-5 shadow-[0_4px_16px_rgba(16,40,28,0.05)]">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#1B2E26]">
                  <BarChart3 className="h-4 w-4 text-[#007D5C]" />
                  Pacientes novos x recorrentes (hoje)
                </h3>
                <div className="mt-4 flex flex-wrap items-center gap-8">
                  <Donut novos={novos} recorrentes={recorrentes} />
                  <div className="min-w-[180px] space-y-4">
                    <div>
                      <p className="text-[28px] font-bold leading-none text-[#1B2E26]">{novos}</p>
                      <p className="mt-1 text-[13px] font-medium text-[#007D5C]">
                        Novos ({((novos / mixTotal) * 100).toFixed(1).replace(".", ",")}%)
                      </p>
                      <Trend value={metrics.newVsReturning.newChange ?? 0} />
                    </div>
                    <div>
                      <p className="text-[28px] font-bold leading-none text-[#1B2E26]">{recorrentes}</p>
                      <p className="mt-1 text-[13px] font-medium text-[#0D9488]">
                        Recorrentes ({((recorrentes / mixTotal) * 100).toFixed(1).replace(".", ",")}%)
                      </p>
                      <Trend value={metrics.newVsReturning.returningChange ?? 0} />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#E8EEEA] bg-white p-5 shadow-[0_4px_16px_rgba(16,40,28,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#1B2E26]">
                    <Stethoscope className="h-4 w-4 text-[#007D5C]" />
                    Pacientes por convênio (hoje)
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[12px] text-[#6B7C73]">
                    Ver todos <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="mt-5 space-y-3.5">
                  {(metrics.byInsurance.length ? metrics.byInsurance : [{ label: "Sem dados hoje", count: 0 }]).map(
                    (item) => {
                      const pct = item.count === 0 ? 0 : (item.count / insuranceTotal) * 100
                      return (
                        <div key={item.label}>
                          <div className="mb-1 flex items-center justify-between text-[13px]">
                            <span className="text-[#1B2E26]">{item.label}</span>
                            <span className="tabular-nums text-[#6B7C73]">
                              {item.count}{" "}
                              <span className="text-[#9AA89F]">({pct.toFixed(1).replace(".", ",")}%)</span>
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#EEF4F0]">
                            <div
                              className="h-full rounded-full bg-[#2ECC71]"
                              style={{ width: `${Math.max(pct, item.count ? 4 : 0)}%` }}
                            />
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
                <Link
                  to="/gestao/relatorios"
                  className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-[#007D5C] hover:underline"
                >
                  Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </section>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-[#E8EEEA] bg-white p-5 shadow-[0_4px_16px_rgba(16,40,28,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#1B2E26]">
                    <Stethoscope className="h-4 w-4 text-[#007D5C]" />
                    Procedimentos (hoje)
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[12px] text-[#6B7C73]">
                    Ver todos <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {(metrics.procedures.length
                    ? metrics.procedures
                    : [{ label: "Nenhum procedimento hoje", count: 0 }]
                  ).map((p) => {
                    const pct = p.count === 0 ? 0 : (p.count / procedureTotal) * 100
                    return (
                      <div key={p.label} className="grid grid-cols-[1fr_auto_88px] items-center gap-3">
                        <span className="truncate text-[13px] text-[#1B2E26]">{p.label}</span>
                        <span className="tabular-nums text-[13px] text-[#6B7C73]">
                          {p.count}{" "}
                          <span className="text-[#9AA89F]">({Math.round(pct)}%)</span>
                        </span>
                        <div className="h-2 overflow-hidden rounded-full bg-[#EEF4F0]">
                          <div
                            className="h-full rounded-full bg-[#2ECC71]"
                            style={{ width: `${Math.max(pct, p.count ? 6 : 0)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Link
                  to="/gestao/relatorios-atendimento"
                  className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-[#007D5C] hover:underline"
                >
                  Ver relatório completo <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </section>

              <section className="rounded-2xl border border-[#E8EEEA] bg-white p-5 shadow-[0_4px_16px_rgba(16,40,28,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#1B2E26]">
                    <CalendarDays className="h-4 w-4 text-[#007D5C]" />
                    Resumo do período
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[#E2EBE5] px-2.5 py-1 text-[12px] text-[#4A6356]">
                    Esta semana <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6">
                  <div>
                    <p className="text-[12px] text-[#6B7C73]">Total de atendimentos</p>
                    <p className="mt-1 text-[26px] font-bold leading-none text-[#1B2E26]">
                      {metrics.periodSummary?.total ?? 0}
                    </p>
                    <Trend
                      value={metrics.periodSummary?.vsPrevious.total ?? 0}
                      suffix="vs semana anterior"
                    />
                  </div>
                  <div>
                    <p className="text-[12px] text-[#6B7C73]">Taxa de confirmação</p>
                    <p className="mt-1 text-[26px] font-bold leading-none text-[#1B2E26]">
                      {metrics.periodSummary?.confirmationRate ?? 0}%
                    </p>
                    <Trend
                      value={metrics.periodSummary?.vsPrevious.confirmationRatePp ?? 0}
                      suffix="vs semana anterior"
                      format="pp"
                    />
                  </div>
                  <div>
                    <p className="text-[12px] text-[#6B7C73]">Faltas</p>
                    <p className="mt-1 text-[26px] font-bold leading-none text-[#1B2E26]">
                      {metrics.periodSummary?.noShow ?? 0}
                    </p>
                    <Trend
                      value={metrics.periodSummary?.vsPrevious.noShow ?? 0}
                      suffix="vs semana anterior"
                      invert
                      format="count"
                    />
                  </div>
                  <div>
                    <p className="text-[12px] text-[#6B7C73]">Receita recebida</p>
                    <p className="mt-1 text-[22px] font-bold leading-none text-[#1B2E26]">
                      {formatMoney(metrics.periodSummary?.revenue ?? 0)}
                    </p>
                    <Trend
                      value={metrics.periodSummary?.vsPrevious.revenue ?? 0}
                      suffix="vs semana anterior"
                    />
                  </div>
                </div>
                <Link
                  to="/gestao/financas"
                  className="mt-6 inline-flex items-center gap-1 text-[13px] font-medium text-[#007D5C] hover:underline"
                >
                  Ver relatório financeiro <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
