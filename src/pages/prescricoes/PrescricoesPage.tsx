import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Search, Plus, History } from "lucide-react"
import { Stepper } from "@/components/ui/stepper"
import { Tabs } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { api } from "@/services/api"
import { isResolvableEntityId } from "@/lib/route-ids"

const tabList = [
  { id: "meds", label: "Medicamentos" },
  { id: "exams", label: "Exames" },
  { id: "vaccines", label: "Vacinas" },
  { id: "free", label: "Texto livre" },
]

export default function PrescricoesPage() {
  const { atendimentoId } = useParams()
  const [step, setStep] = useState(0)
  const [tab, setTab] = useState("meds")
  const [items, setItems] = useState<string[]>([])
  const [patientName, setPatientName] = useState("")

  useEffect(() => {
    if (!isResolvableEntityId(atendimentoId)) return
    api.appointments
      .getById(atendimentoId)
      .then((apt) => setPatientName(apt.patient?.name ?? ""))
      .catch(() => {
        api.patients.getById(atendimentoId).then((p) => setPatientName(p.name)).catch(() => {})
      })
  }, [atendimentoId])

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text">Prescrição</h1>
        <p className="text-sm text-text-secondary mt-1">
          {patientName || "Carregando..."} · Atendimento {atendimentoId}
        </p>
      </div>

      <Stepper steps={["Prescrever", "Revisar", "Finalizar"]} current={step} />
      <Tabs tabs={tabList} active={tab} onChange={setTab} />

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Digite para buscar..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border text-sm"
          />
        </div>
        <Button variant="secondary" className="gap-2">
          <History className="w-4 h-4" />
          Histórico
        </Button>
        <Button
          className="gap-2"
          onClick={() => setItems((i) => [...i, `Item (${tab}) ${i.length + 1}`])}
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      <div className="bg-surface rounded-xl border border-border min-h-[280px]">
        {items.length === 0 ? (
          <EmptyState
            title="Nenhum item adicionado"
            description="Busque um medicamento, exame ou vacina para montar a prescrição."
            actionLabel="Adicionar texto livre"
            onAction={() => setItems(["Texto livre — orientações ao paciente"])}
          />
        ) : (
          <ul className="divide-y divide-border p-4">
            {items.map((item, i) => (
              <li key={i} className="py-3 text-sm text-text flex justify-between">
                {item}
                <button
                  type="button"
                  className="text-danger text-xs"
                  onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Voltar
        </Button>
        <Button onClick={() => setStep((s) => Math.min(2, s + 1))}>
          {step === 2 ? "Finalizar prescrição" : "Avançar"}
        </Button>
      </div>
    </div>
  )
}
