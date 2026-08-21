import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Building2,
  Users,
  UserPlus,
  CalendarDays,
  MessageCircle,
  ClipboardList,
  RefreshCw,
  ChevronRight,
} from "lucide-react"
import { backofficeApi, type BackofficeMetrics } from "@/services/backoffice-api"
import { cn } from "@/lib/utils"

function formatBrl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

function trendDelta(values: number[]) {
  if (values.length < 2) return null
  const prev = values[values.length - 2] ?? 0
  const curr = values[values.length - 1] ?? 0
  if (prev === 0) {
    if (curr === 0) return null
    return { text: `+${curr}`, up: true }
  }
  const pct = ((curr - prev) / prev) * 100
  return { text: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, up: pct >= 0 }
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1)
  const w = 80
  const h = 28
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w
      const y = h - (v / max) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  )
}

function AreaTrendChart({ data, color }: { data: Array<{ month: string; value: number }>; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const w = 520
  const h = 160
  const pad = 24
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2)
    const y = h - pad - (d.value / max) * (h - pad * 2)
    return { x, y, ...d }
  })
  const line = points.map((p) => `${p.x},${p.y}`).join(" ")
  const area = `${points[0]?.x ?? pad},${h - pad} ${line} ${points[points.length - 1]?.x ?? w - pad},${h - pad}`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[180px]">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad}
          x2={w - pad}
          y1={h - pad - t * (h - pad * 2)}
          y2={h - pad - t * (h - pad * 2)}
          stroke="#E4EBE6"
          strokeWidth="1"
        />
      ))}
      <polygon points={area} fill="url(#trendFill)" />
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={line} />
      {points.map((p) => (
        <g key={p.month}>
          <circle cx={p.x} cy={p.y} r="4" fill={color} />
          <text x={p.x} y={h - 6} textAnchor="middle" className="fill-[#8A9A90] text-[11px]">
            {p.month}
          </text>
        </g>
      ))}
    </svg>
  )
}

function DonutChart({
  segments,
  centerLabel,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  centerLabel: string
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  let acc = 0
  const r = 54
  const cx = 70
  const cy = 70
  const paths = segments.map((seg) => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2
    acc += seg.value
    const end = (acc / total) * Math.PI * 2 - Math.PI / 2
    const x1 = cx + r * Math.cos(start)
    const y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy + r * Math.sin(end)
    const large = end - start > Math.PI ? 1 : 0
    return {
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      ...seg,
    }
  })

  return (
    <div className="flex items-center gap-4">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {paths.map((p) => (
          <path key={p.label} d={p.d} fill={p.color} />
        ))}
        <circle cx={cx} cy={cy} r="34" fill="white" />
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-[#12261E] text-[13px] font-bold">
          {centerLabel}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-[#8A9A90] text-[10px]">
          total
        </text>
      </svg>
      <div className="space-y-2 text-sm">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-[#5B6B63]">{s.label}</span>
            <span className="font-semibold text-[#12261E]">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const statusClass: Record<string, string> = {
  Ativa: "bg-[#E8F6EE] text-[#006B4D]",
  Inativa: "bg-[#F4F7F5] text-[#6B7C74]",
}

const whatsappClass: Record<string, string> = {
  Conectado: "bg-[#E8F6EE] text-[#006B4D]",
  Offline: "bg-[#FFF4E5] text-[#B45309]",
}

export default function BackofficeDashboard() {
  const [metrics, setMetrics] = useState<BackofficeMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = () => {
    setLoading(true)
    setError("")
    backofficeApi
      .metrics()
      .then(setMetrics)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Erro ao carregar"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const saas = metrics?.saas
  const overview = metrics?.overview
  const user = backofficeApi.getStoredUser()
  const trends = saas?.kpiTrends

  const kpis = saas && overview && trends
    ? [
        {
          label: "Clínicas ativas",
          value: String(saas.activeClinics),
          delta: trendDelta(trends.activeClinics),
          icon: Building2,
          spark: trends.activeClinics,
          color: "#006B4D",
        },
        {
          label: "Pacientes",
          value: overview.totalPatients.toLocaleString("pt-BR"),
          delta: trendDelta(trends.patients),
          icon: Users,
          spark: trends.patients,
          color: "#006B4D",
        },
        {
          label: "Usuários",
          value: overview.totalUsers.toLocaleString("pt-BR"),
          delta: trendDelta(trends.users),
          icon: UserPlus,
          spark: trends.users,
          color: "#006B4D",
        },
        {
          label: "Consultas hoje",
          value: String(overview.appointmentsToday),
          delta: null,
          icon: CalendarDays,
          spark: [overview.appointmentsToday],
          color: "#006B4D",
        },
        {
          label: "WhatsApp conectados",
          value: String(saas.whatsappConnected),
          delta: trendDelta(trends.whatsappConnected),
          icon: MessageCircle,
          spark: trends.whatsappConnected,
          color: "#006B4D",
        },
        {
          label: "Solicitações pendentes",
          value: String(saas.pendingJoinRequests),
          delta: trendDelta(trends.joinRequests),
          icon: ClipboardList,
          spark: trends.joinRequests,
          color: "#B45309",
        },
      ]
    : []

  const distributionColors = ["#006B4D", "#34A853", "#7BC6A8", "#C5E8D8", "#94A3B8"]
  const clinicSegments =
    saas?.clinicDistribution.map((item, i) => ({
      label: item.name,
      value: Math.max(item.count, 0),
      color: distributionColors[i % distributionColors.length],
    })) ?? []

  const paymentSegments =
    saas?.paymentStatusDistribution.map((item, i) => ({
      label: item.name,
      value: Math.max(item.count, 0),
      color: distributionColors[i % distributionColors.length],
    })) ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12261E]">
            Bem-vindo ao Backoffice ClinMax, {user.name?.split(" ")[0] || "Administrador"}
          </h1>
          <p className="mt-1 text-sm text-[#6B7C74]">Dados reais da plataforma ClinMax</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E4EBE6] bg-white text-[#5B6B63] hover:bg-[#F4F7F5]"
            aria-label="Atualizar"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading && !metrics ? (
        <p className="text-sm text-[#6B7C74]">Carregando métricas...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#E4EBE6] bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-[#8A9A90]">MRR (assinaturas)</p>
              <p className="mt-1 text-xl font-bold text-[#12261E]">{formatBrl(saas?.subscriptionMrr ?? 0)}</p>
              <p className="mt-1 text-xs text-[#6B7C74]">{saas?.activeSubscriptions ?? 0} assinaturas ativas</p>
            </div>
            <div className="rounded-2xl border border-[#E4EBE6] bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-[#8A9A90]">Receita SaaS no mês</p>
              <p className="mt-1 text-xl font-bold text-[#12261E]">{formatBrl(saas?.subscriptionRevenueMonth ?? 0)}</p>
              <p className="mt-1 text-xs text-[#6B7C74]">Mensalidades das clínicas</p>
            </div>
            <div className="rounded-2xl border border-[#E4EBE6] bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-[#8A9A90]">Trials ativos</p>
              <p className="mt-1 text-xl font-bold text-[#12261E]">{saas?.trialSubscriptions ?? 0}</p>
              <p className="mt-1 text-xs text-[#6B7C74]">{saas?.pastDueSubscriptions ?? 0} em atraso</p>
            </div>
            <div className="rounded-2xl border border-[#E4EBE6] bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-[#8A9A90]">Inadimplência SaaS</p>
              <p className="mt-1 text-xl font-bold text-[#B45309]">{formatBrl(saas?.subscriptionOverdue ?? 0)}</p>
              <p className="mt-1 text-xs text-[#6B7C74]">A receber: {formatBrl(saas?.subscriptionReceivable ?? 0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7 rounded-2xl border border-[#E4EBE6] bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-[#12261E]">Receita SaaS por mês</h2>
              <p className="text-xs text-[#8A9A90] mt-0.5">Mensalidades recebidas (separado do ClinMax Pay)</p>
              <div className="mt-4">
                {saas?.subscriptionRevenueTrend?.length ? (
                  <AreaTrendChart data={saas.subscriptionRevenueTrend} color="#006B4D" />
                ) : (
                  <p className="text-sm text-[#6B7C74]">Sem cobranças pagas ainda.</p>
                )}
              </div>
            </div>
            <div className="xl:col-span-5 rounded-2xl border border-[#E4EBE6] bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-[#12261E]">Receita da plataforma</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-[#6B7C74]">Assinaturas SaaS (mês)</span>
                  <span className="font-semibold text-[#12261E]">{formatBrl(saas?.subscriptionRevenueMonth ?? 0)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[#6B7C74]">ClinMax Pay, taxas (mês)</span>
                  <span className="font-semibold text-[#12261E]">{formatBrl(saas?.platformRevenueMonth ?? 0)}</span>
                </li>
                <li className="flex justify-between border-t border-[#E4EBE6] pt-3">
                  <span className="font-medium text-[#12261E]">Total plataforma (mês)</span>
                  <span className="font-bold text-[#006B4D]">
                    {formatBrl((saas?.subscriptionRevenueMonth ?? 0) + (saas?.platformRevenueMonth ?? 0))}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {kpis.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-[#E4EBE6] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-[#8A9A90]">{kpi.label}</p>
                      <p className="mt-1 text-xl font-bold text-[#12261E]">{kpi.value}</p>
                      {kpi.delta && (
                        <p
                          className={cn(
                            "mt-1 text-xs font-semibold",
                            kpi.delta.up ? "text-[#006B4D]" : "text-[#B91C1C]"
                          )}
                        >
                          {kpi.delta.text} vs mês anterior
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg bg-[#E8F6EE] p-2">
                      <Icon className="h-4 w-4 text-[#006B4D]" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Sparkline values={kpi.spark} color={kpi.color} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-5 rounded-2xl border border-[#E4EBE6] bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-[#12261E]">Novas clínicas por mês</h2>
              <p className="text-xs text-[#8A9A90] mt-0.5">Cadastros nos últimos 6 meses</p>
              <div className="mt-4">
                {saas?.clinicsGrowthTrend && (
                  <AreaTrendChart data={saas.clinicsGrowthTrend} color="#006B4D" />
                )}
              </div>
            </div>

            <div className="xl:col-span-3 rounded-2xl border border-[#E4EBE6] bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-[#12261E]">Clínicas por porte</h2>
              <p className="text-xs text-[#8A9A90] mt-0.5">{saas?.activeClinics ?? 0} clínicas ativas</p>
              <div className="mt-4 flex justify-center">
                {clinicSegments.length > 0 ? (
                  <DonutChart segments={clinicSegments} centerLabel={String(saas?.activeClinics ?? 0)} />
                ) : (
                  <p className="text-sm text-[#6B7C74]">Sem dados de porte informados.</p>
                )}
              </div>
            </div>

            <div className="xl:col-span-4 rounded-2xl border border-[#E4EBE6] bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-[#12261E]">Atividades da plataforma</h2>
              <ul className="mt-4 space-y-4">
                {saas?.platformActivities.length ? (
                  saas.platformActivities.map((a) => (
                    <li key={`${a.text}-${a.detail}-${a.time}`} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#006B4D]" />
                      <div>
                        <p className="text-sm font-medium text-[#12261E]">{a.text}</p>
                        <p className="text-xs text-[#6B7C74]">{a.detail}</p>
                        <p className="text-[11px] text-[#8A9A90] mt-0.5">{a.time}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-[#6B7C74]">Nenhuma atividade recente registrada.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7 rounded-2xl border border-[#E4EBE6] bg-white p-5 shadow-sm overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#12261E]">Clínicas recentes</h2>
                <Link to="/backoffice/clinicas" className="text-sm font-medium text-[#006B4D] hover:underline flex items-center gap-1">
                  Ver todas <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[#8A9A90] border-b border-[#E4EBE6]">
                    <th className="pb-3 font-semibold">Clínica</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Usuários</th>
                    <th className="pb-3 font-semibold">Pacientes</th>
                    <th className="pb-3 font-semibold">Consultas</th>
                    <th className="pb-3 font-semibold">WhatsApp</th>
                    <th className="pb-3 font-semibold">Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {saas?.recentClinics.map((c) => (
                    <tr key={c.id} className="border-b border-[#F4F7F5] last:border-0">
                      <td className="py-3 font-medium text-[#12261E]">{c.name}</td>
                      <td className="py-3">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusClass[c.status] ?? statusClass.Ativa)}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 text-[#5B6B63]">{c.users}</td>
                      <td className="py-3 text-[#5B6B63]">{c.patients.toLocaleString("pt-BR")}</td>
                      <td className="py-3 text-[#5B6B63]">{c.appointments.toLocaleString("pt-BR")}</td>
                      <td className="py-3">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", whatsappClass[c.whatsapp] ?? whatsappClass.Offline)}>
                          {c.whatsapp}
                        </span>
                      </td>
                      <td className="py-3 text-[#5B6B63]">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="xl:col-span-2 rounded-2xl border border-[#E4EBE6] bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-[#12261E]">ClinMax Pay</h2>
              <p className="text-xs text-[#8A9A90] mt-0.5">
                {formatBrl(saas?.platformRevenueMonth ?? 0)} neste mês
              </p>
              <div className="mt-4">
                {paymentSegments.length > 0 ? (
                  <DonutChart
                    centerLabel={formatBrl(saas?.platformRevenueTotal ?? 0).replace("R$", "").trim()}
                    segments={paymentSegments}
                  />
                ) : (
                  <p className="text-sm text-[#6B7C74]">Nenhum pagamento registrado ainda.</p>
                )}
              </div>
            </div>

            <div className="xl:col-span-3 space-y-3">
              <h2 className="font-semibold text-[#12261E] px-1">Ações pendentes</h2>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="font-semibold text-amber-900">{saas?.pendingJoinRequests ?? 0} solicitações de acesso</p>
                <p className="text-sm text-amber-800/80 mt-1">Pedidos aguardando aprovação de clínica</p>
              </div>
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="font-semibold text-red-800">{saas?.offlineIntegrations ?? 0} clínicas sem WhatsApp</p>
                <p className="text-sm text-red-700/80 mt-1">Nenhuma conexão ativa registrada</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="font-semibold text-blue-900">{saas?.pendingInvites ?? 0} convites pendentes</p>
                <p className="text-sm text-blue-800/80 mt-1">Convites enviados aguardando aceite</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
