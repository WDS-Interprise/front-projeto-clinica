import { useState } from "react"
import { History } from "lucide-react"
import { Stepper } from "@/components/ui/stepper"
import { Tabs } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { MedicationSearchPanel } from "@/components/prescricoes/MedicationSearchPanel"
import { MedicationFormModal } from "@/components/prescricoes/MedicationFormModal"
import { ExamSearchPanel } from "@/components/prescricoes/ExamSearchPanel"
import { VaccineSearchPanel } from "@/components/prescricoes/VaccineSearchPanel"
import { VaccineFormModal } from "@/components/prescricoes/VaccineFormModal"
import { PrescriptionHistoryModal } from "@/components/prescricoes/PrescriptionHistoryModal"
import { useToast } from "@/context/ToastContext"
import type { MedicamentoProduto, MedicamentoSubstancia } from "@/types/medicamento"
import type { VacinaProduto } from "@/types/vacina"
import type { Prescription, PrescriptionItemType } from "@/types/prescription"
import type { ExamFormValues, MedicationFormValues, VaccineFormValues } from "@/types/prescription"

const tabList = [
  { id: "MEDICATION", label: "Medicamentos" },
  { id: "EXAM", label: "Exames" },
  { id: "VACCINE", label: "Vacinas" },
  { id: "FREE_TEXT", label: "Texto livre" },
]

function formatItemDetail(item: Prescription["items"][0]) {
  const lines: string[] = []
  if (item.instructions) lines.push(item.instructions)
  if (item.dosage) lines.push(`Dose: ${item.dosage}`)
  if (item.quantity) lines.push(`Quantidade: ${item.quantity}`)
  if (item.duration) lines.push(`Duração: ${item.duration}`)
  if (item.continuousUse) lines.push("Uso contínuo")
  return lines
}

type Props = {
  prescription: Prescription
  saving: boolean
  recentPrescriptions?: Prescription[]
  onAddItem: (
    type: PrescriptionItemType,
    payload:
      | MedicationFormValues
      | ExamFormValues
      | VaccineFormValues
      | { name: string; instructions?: string }
  ) => void
  onRemoveItem: (itemId: string) => void
  onRenewFromHistory: (prescriptionId: string) => void
  onBack: () => void
  onAdvance: () => void
}

export function PrescricaoStepPrescrever({
  prescription,
  saving,
  recentPrescriptions = [],
  onAddItem,
  onRemoveItem,
  onRenewFromHistory,
  onBack,
  onAdvance,
}: Props) {
  const { toast } = useToast()
  const [tab, setTab] = useState<PrescriptionItemType>("MEDICATION")
  const [freeText, setFreeText] = useState("")
  const [quickName, setQuickName] = useState("")
  const [medModalOpen, setMedModalOpen] = useState(false)
  const [vaccineModalOpen, setVaccineModalOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<MedicamentoProduto | null>(null)
  const [selectedSubstance, setSelectedSubstance] = useState<string | undefined>()
  const [selectedVaccine, setSelectedVaccine] = useState<VacinaProduto | null>(null)

  const allItems = prescription.items

  const handleSelectProduct = (product: MedicamentoProduto) => {
    setSelectedProduct(product)
    setSelectedSubstance(undefined)
    setMedModalOpen(true)
  }

  const handleSelectSubstance = (substance: MedicamentoSubstancia) => {
    setSelectedProduct(null)
    setSelectedSubstance(substance.name)
    setMedModalOpen(true)
  }

  const handleSelectVaccine = (vaccine: VacinaProduto) => {
    setSelectedVaccine(vaccine)
    setVaccineModalOpen(true)
  }

  const handleAddFreeText = () => {
    setTab("FREE_TEXT")
    setFreeText("")
  }

  const handleAddNonMed = () => {
    if (tab === "FREE_TEXT") {
      const text = freeText.trim()
      if (!text) {
        toast("Informe o texto livre.", "error")
        return
      }
      onAddItem(tab, { name: "Texto livre", instructions: text })
      setFreeText("")
      return
    }
    const name = quickName.trim()
    if (!name) {
      toast("Informe o nome do item.", "error")
      return
    }
    onAddItem(tab, { name })
    setQuickName("")
  }

  const handleAdvance = () => {
    if (prescription.items.length === 0) {
      toast("Adicione pelo menos um item à receita.", "error")
      return
    }
    const medsWithoutInstructions = prescription.items.filter(
      (i) => i.type === "MEDICATION" && !i.instructions?.trim()
    )
    if (medsWithoutInstructions.length > 0) {
      toast("Informe a orientação de uso de todos os medicamentos.", "error")
      return
    }
    const vaccinesInvalid = prescription.items.filter(
      (i) =>
        i.type === "VACCINE" &&
        (!i.instructions?.trim() || (!i.dosage?.trim() && !i.instructions?.trim()))
    )
    if (vaccinesInvalid.length > 0) {
      toast("Informe a orientação de uso/aplicação de todas as vacinas.", "error")
      return
    }
    onAdvance()
  }

  return (
    <div className="space-y-6">
      <Stepper steps={["Prescrever", "Assinar e compartilhar", "Finalizada"]} current={0} />

      <Tabs tabs={tabList} active={tab} onChange={(id) => setTab(id as PrescriptionItemType)} />

      {tab === "MEDICATION" ? (
        <div className="space-y-3">
          <MedicationSearchPanel
            onSelectProduct={handleSelectProduct}
            onSelectSubstance={handleSelectSubstance}
            onAddFreeText={handleAddFreeText}
          />
          <div className="flex justify-end">
            <Button variant="secondary" className="gap-2" onClick={() => setHistoryOpen(true)}>
              <History className="w-4 h-4" />
              Histórico
            </Button>
          </div>
        </div>
      ) : tab === "EXAM" ? (
        <ExamSearchPanel onAddExam={(v) => onAddItem("EXAM", v)} saving={saving} />
      ) : tab === "VACCINE" ? (
        <VaccineSearchPanel
          onSelectVaccine={handleSelectVaccine}
          onAddFreeText={handleAddFreeText}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Input
            className="flex-1 min-w-[240px]"
            value={tab === "FREE_TEXT" ? freeText : quickName}
            onChange={(e) =>
              tab === "FREE_TEXT" ? setFreeText(e.target.value) : setQuickName(e.target.value)
            }
            placeholder={tab === "FREE_TEXT" ? "Orientações ao paciente..." : "Nome do item..."}
          />
          <Button className="gap-2" onClick={handleAddNonMed} disabled={saving}>
            Adicionar
          </Button>
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-text mb-3">Itens da receita</h3>
        <div className="bg-surface rounded-xl border border-border min-h-[200px]">
          {allItems.length === 0 ? (
            <EmptyState
              title="Nenhum item adicionado"
              description="Busque um medicamento, exame ou vacina para montar a prescrição."
            />
          ) : (
            <ul className="divide-y divide-border p-4">
              {allItems.map((item, index) => {
                const details = formatItemDetail(item)
                return (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text">
                          {index + 1}. {item.name}
                        </p>
                        {item.presentation && (
                          <p className="text-xs text-text-secondary mt-0.5">{item.presentation}</p>
                        )}
                        {details.map((line) => (
                          <p key={line} className="text-xs text-text-secondary mt-1">
                            {line}
                          </p>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="text-danger text-xs shrink-0 h-fit hover:underline"
                        disabled={saving}
                        onClick={() => onRemoveItem(item.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <MedicationFormModal
        open={medModalOpen}
        onClose={() => {
          setMedModalOpen(false)
          setSelectedProduct(null)
          setSelectedSubstance(undefined)
        }}
        initialProduct={selectedProduct}
        initialSubstanceName={selectedSubstance}
        onSubmit={(v) => onAddItem("MEDICATION", v)}
      />

      <VaccineFormModal
        open={vaccineModalOpen}
        onClose={() => {
          setVaccineModalOpen(false)
          setSelectedVaccine(null)
        }}
        initialVaccine={selectedVaccine}
        onSubmit={(v) => onAddItem("VACCINE", v)}
      />

      <PrescriptionHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        prescriptions={recentPrescriptions}
        onRenew={onRenewFromHistory}
      />

      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="secondary" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={handleAdvance} disabled={saving}>
          Avançar
        </Button>
      </div>
    </div>
  )
}
