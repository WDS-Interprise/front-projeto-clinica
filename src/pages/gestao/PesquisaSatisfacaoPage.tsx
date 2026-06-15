import { useEffect, useState } from "react"
import { Plus, Star } from "lucide-react"
import { GestaoPageShell } from "@/components/gestao/GestaoPageShell"
import { Button } from "@/components/ui/button"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useAuth } from "@/context/AuthContext"

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  SENT: "Enviada",
  ANSWERED: "Respondida",
  EXPIRED: "Expirada",
}

export default function PesquisaSatisfacaoPage() {
  const { toast } = useToast()
  const { hasPermission } = useAuth()
  const canManage = hasPermission("finance:manage")
  const [surveys, setSurveys] = useState<Array<{ id: string; rating: number | null; comment: string | null; sendStatus: string; patient: { name: string; phone: string } | null; createdAt: string }>>([])
  const [summary, setSummary] = useState<{ total: number; average: number; distribution: Array<{ rating: number; count: number }> } | null>(null)

  const load = () => {
    Promise.all([api.satisfaction.list(), api.satisfaction.summary()])
      .then(([list, sum]) => { setSurveys(list); setSummary(sum) })
      .catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao carregar pesquisas"), "error"))
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    try {
      await api.satisfaction.create()
      toast("Pesquisa criada!")
      load()
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao criar pesquisa"), "error")
    }
  }

  const send = async (id: string) => {
    try {
      await api.satisfaction.markSent(id)
      toast("Marcada como enviada")
      load()
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao enviar"), "error")
    }
  }

  const answer = async (id: string, rating: number) => {
    try {
      await api.satisfaction.submitAnswer(id, { rating })
      toast("Resposta registrada!")
      load()
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao registrar resposta"), "error")
    }
  }

  return (
    <GestaoPageShell title="Pesquisa de satisfação" description="Envios, respostas e média de avaliações.">
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-text-secondary">Média geral</p>
            <p className="text-2xl font-bold flex items-center gap-1">{summary.average} <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /></p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-text-secondary">Respostas</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-text-secondary mb-2">Distribuição</p>
            {summary.distribution.map((d) => (
              <div key={d.rating} className="flex justify-between text-xs">
                <span>{d.rating}★</span><span>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {canManage && (
        <Button type="button" onClick={create}>
          <Plus className="w-4 h-4 mr-1" /> Nova pesquisa
        </Button>
      )}

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Paciente</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Nota</th>
              <th className="text-left p-3">Comentário</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {!surveys.length && <tr><td colSpan={5} className="p-8 text-center text-text-secondary">Nenhuma pesquisa.</td></tr>}
            {surveys.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-3">{s.patient?.name ?? "—"}</td>
                <td className="p-3">{statusLabels[s.sendStatus] ?? s.sendStatus}</td>
                <td className="p-3">{s.rating ? `${s.rating}★` : "—"}</td>
                <td className="p-3 text-text-secondary">{s.comment ?? "—"}</td>
                <td className="p-3 text-right space-x-1">
                  {canManage && s.sendStatus === "PENDING" && (
                    <Button type="button" size="sm" variant="outline" onClick={() => send(s.id)}>Enviar</Button>
                  )}
                  {s.sendStatus === "SENT" && !s.rating && (
                    <>
                      {[5, 4, 3].map((n) => (
                        <Button key={n} type="button" size="sm" variant="outline" onClick={() => answer(s.id, n)}>{n}★</Button>
                      ))}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GestaoPageShell>
  )
}
