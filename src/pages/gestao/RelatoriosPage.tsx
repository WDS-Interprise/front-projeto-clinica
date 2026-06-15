import { useEffect, useState } from "react"
import { format } from "date-fns"
import { GestaoPageShell } from "@/components/gestao/GestaoPageShell"
import { Button } from "@/components/ui/button"
import RelatoriosAtendimentoPage from "@/pages/gestao/RelatoriosAtendimentoPage"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

const tabs = [
  { id: "atendimento", label: "Atendimentos" },
  { id: "faltas", label: "Faltas" },
  { id: "cid", label: "Pacientes por CID" },
  { id: "aniversario", label: "Aniversariantes" },
  { id: "repasse", label: "Repasse profissional" },
  { id: "receitas", label: "Análise receitas" },
  { id: "despesas", label: "Análise despesas" },
] as const

type TabId = (typeof tabs)[number]["id"]

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function RelatoriosPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<TabId>("atendimento")
  const [dateFrom, setDateFrom] = useState(() => format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"))
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"))
  const [loading, setLoading] = useState(false)
  const [noShows, setNoShows] = useState<Awaited<ReturnType<typeof api.reports.noShows>> | null>(null)
  const [cidData, setCidData] = useState<Awaited<ReturnType<typeof api.reports.cid>> | null>(null)
  const [birthdays, setBirthdays] = useState<Awaited<ReturnType<typeof api.reports.birthdays>> | null>(null)
  const [repasse, setRepasse] = useState<Awaited<ReturnType<typeof api.reports.repasse>> | null>(null)
  const [analysis, setAnalysis] = useState<Awaited<ReturnType<typeof api.finance.analysis>> | null>(null)

  const load = () => {
    if (tab === "atendimento") return
    setLoading(true)
    const p = { dateFrom, dateTo }
    const req =
      tab === "faltas" ? api.reports.noShows(p) :
      tab === "cid" ? api.reports.cid(p) :
      tab === "aniversario" ? api.reports.birthdays(new Date().getMonth() + 1) :
      tab === "repasse" ? api.reports.repasse(p) :
      tab === "receitas" ? api.finance.analysis({ type: "INCOME", ...p }) :
      api.finance.analysis({ type: "EXPENSE", ...p })

    req
      .then((result) => {
        setNoShows(tab === "faltas" ? result as typeof noShows : null)
        setCidData(tab === "cid" ? result as typeof cidData : null)
        setBirthdays(tab === "aniversario" ? result as typeof birthdays : null)
        setRepasse(tab === "repasse" ? result as typeof repasse : null)
        setAnalysis(tab === "receitas" || tab === "despesas" ? result as typeof analysis : null)
      })
      .catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao gerar relatório"), "error"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tab !== "atendimento") load()
  }, [tab, dateFrom, dateTo])

  if (tab === "atendimento") {
    return (
      <GestaoPageShell title="Relatórios" description="Indicadores operacionais e financeiros da clínica.">
        <div className="flex flex-wrap gap-2 mb-4">
          {tabs.map((t) => (
            <Button key={t.id} type="button" variant={tab === t.id ? "primary" : "outline"} size="sm" onClick={() => setTab(t.id)}>
              {t.label}
            </Button>
          ))}
        </div>
        <RelatoriosAtendimentoPage embedded />
      </GestaoPageShell>
    )
  }

  return (
    <GestaoPageShell title="Relatórios" description="Indicadores operacionais e financeiros da clínica.">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t.id} type="button" variant={tab === t.id ? "primary" : "outline"} size="sm" onClick={() => setTab(t.id)}>
            {t.label}
          </Button>
        ))}
      </div>

      {tab !== "aniversario" && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-text-secondary mb-1">De</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm" />
          </label>
          <label className="text-sm">
            <span className="block text-text-secondary mb-1">Até</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm" />
          </label>
          <Button type="button" variant="outline" onClick={load} disabled={loading}>Gerar</Button>
        </div>
      )}

      {loading && <p className="text-sm text-text-secondary">Carregando...</p>}

      {tab === "faltas" && noShows && (
        <ReportTable
          headers={["Data", "Paciente", "Profissional"]}
          rows={noShows.rows.map((r) => [
            `${format(new Date(r.date), "dd/MM/yyyy")} ${r.startTime}`,
            r.patient?.name ?? "—",
            r.doctor.name,
          ])}
        />
      )}

      {tab === "cid" && cidData && (
        <div className="space-y-4">
          <ul className="space-y-2">
            {cidData.byCid.map((c) => (
              <li key={c.code} className="flex justify-between text-sm border-b border-border py-2">
                <span>{c.code} — {c.description}</span>
                <span className="font-medium">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "aniversario" && birthdays && (
        <ReportTable
          headers={["Dia", "Paciente", "Telefone"]}
          rows={birthdays.rows.map((r) => [String(r.day), r.name, r.phone])}
        />
      )}

      {tab === "repasse" && repasse && (
        <ReportTable
          headers={["Profissional", "Receitas", "Lançamentos"]}
          rows={repasse.rows.map((r) => [r.name, formatCurrency(r.total), String(r.count)])}
        />
      )}

      {(tab === "receitas" || tab === "despesas") && analysis && (
        <div className="space-y-4">
          <p className="text-lg font-semibold">Total: {formatCurrency(analysis.total)}</p>
          <ul className="space-y-2">
            {analysis.groups.map((g) => (
              <li key={g.label} className="flex justify-between text-sm border-b border-border py-2">
                <span>{g.label}</span>
                <span className="font-medium">{formatCurrency(g.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </GestaoPageShell>
  )
}

function ReportTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-alt/80 text-text-secondary">
          <tr>{headers.map((h) => <th key={h} className="text-left p-3">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} className="p-8 text-center text-text-secondary">Nenhum registro.</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {row.map((cell, j) => <td key={j} className="p-3">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
