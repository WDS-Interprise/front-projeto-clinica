import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import DatePicker from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/context/ToastContext"
import type { VacinaProduto } from "@/types/vacina"
import type { VaccineFormValues } from "@/types/prescription"

const empty: VaccineFormValues = {
  name: "",
  displayName: "",
  route: "",
  dose: "",
  quantity: "",
  instructions: "",
  observations: "",
  recommendedDate: "",
  boosterRequired: false,
  boosterInterval: "",
  batch: "",
  manufacturer: "",
  rxcuis: [],
}

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (values: VaccineFormValues) => void
  initialVaccine?: VacinaProduto | null
}

function vaccineToForm(v: VacinaProduto): VaccineFormValues {
  const defaultDose = v.formasDosagens[0] ?? ""
  return {
    name: v.nome,
    displayName: v.displayName,
    route: v.via,
    dose: defaultDose,
    quantity: "1 dose",
    instructions: "",
    observations: "",
    recommendedDate: "",
    boosterRequired: false,
    boosterInterval: "",
    batch: "",
    manufacturer: "",
    rxcuis: v.rxcuis,
  }
}

export function VaccineFormModal({ open, onClose, onSubmit, initialVaccine }: Props) {
  const { toast } = useToast()
  const [form, setForm] = useState<VaccineFormValues>(empty)

  useEffect(() => {
    if (!open) return
    if (initialVaccine) {
      setForm(vaccineToForm(initialVaccine))
    } else {
      setForm(empty)
    }
  }, [open, initialVaccine])

  const set = (key: keyof VaccineFormValues, value: string | boolean | string[]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSubmit = () => {
    if (!form.displayName.trim() && !form.name.trim()) {
      toast("Selecione uma vacina.", "error")
      return
    }
    if (!form.instructions.trim()) {
      toast("Informe a orientação de uso/aplicação.", "error")
      return
    }
    if (!form.dose.trim() && !form.instructions.trim()) {
      toast("Informe a dose ou orientação de aplicação.", "error")
      return
    }
    onSubmit(form)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurar vacina"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Adicionar à receita</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input label="Vacina" value={form.displayName || form.name} readOnly />
        {form.route && (
          <Input label="Via de administração" value={form.route} readOnly />
        )}
        {initialVaccine && initialVaccine.formasDosagens.length > 0 && (
          <div className="text-xs text-text-secondary rounded-lg bg-surface-alt px-3 py-2 space-y-1">
            <p className="font-medium text-text">Formas disponíveis:</p>
            {initialVaccine.formasDosagens.slice(0, 5).map((f) => (
              <p key={f}>· {f}</p>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Dose"
            value={form.dose}
            onChange={(e) => set("dose", e.target.value)}
            placeholder="0,5 mL"
          />
          <Input
            label="Quantidade"
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            placeholder="1 dose"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text">Orientação de aplicação *</label>
          <textarea
            value={form.instructions}
            onChange={(e) => set("instructions", e.target.value)}
            rows={3}
            placeholder="Aplicar 1 dose conforme orientação médica."
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm resize-y focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-surface text-text"
          />
        </div>
        <Input
          label="Observação (opcional)"
          value={form.observations}
          onChange={(e) => set("observations", e.target.value)}
          placeholder="Informar histórico de alergias..."
        />
        <DatePicker
          label="Data recomendada (opcional)"
          value={form.recommendedDate}
          onChange={(recommendedDate) => set("recommendedDate", recommendedDate)}
        />
        <Switch
          checked={form.boosterRequired}
          onChange={(v) => set("boosterRequired", v)}
          label="Reforço necessário"
        />
        {form.boosterRequired && (
          <Input
            label="Intervalo para reforço"
            value={form.boosterInterval}
            onChange={(e) => set("boosterInterval", e.target.value)}
            placeholder="Anual, 6 meses..."
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Lote (opcional)"
            value={form.batch ?? ""}
            onChange={(e) => set("batch", e.target.value)}
          />
          <Input
            label="Fabricante (opcional)"
            value={form.manufacturer ?? ""}
            onChange={(e) => set("manufacturer", e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
