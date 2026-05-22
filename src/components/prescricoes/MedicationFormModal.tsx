import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/context/ToastContext"
import type { MedicamentoProduto } from "@/types/medicamento"
import type { MedicationFormValues } from "@/types/prescription"

const empty: MedicationFormValues = {
  name: "",
  presentation: "",
  dosage: "",
  frequency: "",
  duration: "",
  quantity: "",
  instructions: "",
  continuousUse: false,
  activeIngredient: "",
  laboratory: "",
  observations: "",
}

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (values: MedicationFormValues) => void
  initialProduct?: MedicamentoProduto | null
  initialSubstanceName?: string
}

function productToForm(product: MedicamentoProduto): MedicationFormValues {
  return {
    name: product.name,
    presentation: product.presentation ?? product.pharmaceuticalForm ?? "",
    dosage: product.activeIngredient ?? "",
    frequency: "",
    duration: "",
    quantity: product.packageQuantity ?? "",
    instructions: "",
    continuousUse: false,
    activeIngredient: product.activeIngredient ?? "",
    laboratory: product.laboratory ?? "",
  }
}

export function MedicationFormModal({
  open,
  onClose,
  onSubmit,
  initialProduct,
  initialSubstanceName,
}: Props) {
  const { toast } = useToast()
  const [form, setForm] = useState<MedicationFormValues>(empty)

  useEffect(() => {
    if (!open) return
    if (initialProduct) {
      setForm(productToForm(initialProduct))
    } else if (initialSubstanceName) {
      setForm({
        ...empty,
        name: initialSubstanceName,
        dosage: initialSubstanceName,
        activeIngredient: initialSubstanceName,
      })
    } else {
      setForm(empty)
    }
  }, [open, initialProduct, initialSubstanceName])

  const set = (key: keyof MedicationFormValues, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast("Selecione um medicamento ou informe o nome.", "error")
      return
    }
    if (!form.instructions.trim()) {
      toast("Informe a orientação de uso do medicamento.", "error")
      return
    }
    onSubmit(form)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurar medicamento"
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
        <Input
          label="Medicamento"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          readOnly={Boolean(initialProduct)}
        />
        {(form.activeIngredient || form.laboratory) && (
          <div className="text-xs text-text-secondary space-y-0.5 rounded-lg bg-surface-alt px-3 py-2">
            {form.activeIngredient && <p>Princípio ativo: {form.activeIngredient}</p>}
            {form.laboratory && <p>Laboratório: {form.laboratory}</p>}
          </div>
        )}
        <Input
          label="Apresentação / forma"
          value={form.presentation}
          onChange={(e) => set("presentation", e.target.value)}
          placeholder="Comprimido, xarope..."
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Dose" value={form.dosage} onChange={(e) => set("dosage", e.target.value)} />
          <Input
            label="Frequência"
            value={form.frequency}
            onChange={(e) => set("frequency", e.target.value)}
            placeholder="6/6 horas"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Duração" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
          <Input
            label="Quantidade"
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            placeholder="1 caixa"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text">Orientação de uso *</label>
          <textarea
            value={form.instructions}
            onChange={(e) => set("instructions", e.target.value)}
            rows={3}
            placeholder="Tomar 1 comprimido de 6/6 horas, se dor ou febre."
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm resize-y focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
          />
        </div>
        <Input
          label="Observações (opcional)"
          value={form.observations ?? ""}
          onChange={(e) => set("observations", e.target.value)}
          placeholder="Tomar após alimentação..."
        />
        <Switch
          checked={form.continuousUse}
          onChange={(v) => set("continuousUse", v)}
          label="Uso contínuo"
        />
      </div>
    </Modal>
  )
}
