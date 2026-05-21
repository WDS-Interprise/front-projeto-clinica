import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { api } from "@/services/api"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useToast } from "@/context/ToastContext"
import { differenceInYears } from "date-fns"

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export default function PatientFormModal({ open, onClose, onSaved }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    gender: "M" as "M" | "F" | "O",
    phone: "",
    phoneHome: "",
    whatsapp: "",
    email: "",
    address: "",
    insurancePlan: "Particular",
    insuranceCard: "",
    notes: "",
    active: true,
  })

  const age =
    form.birthDate && !isNaN(Date.parse(form.birthDate))
      ? differenceInYears(new Date(), new Date(form.birthDate))
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.patients.create(form)
      toast("Paciente cadastrado com sucesso!")
      onSaved()
      onClose()
      setForm({
        name: "",
        cpf: "",
        birthDate: "",
        gender: "M",
        phone: "",
        phoneHome: "",
        whatsapp: "",
        email: "",
        address: "",
        insurancePlan: "Particular",
        insuranceCard: "",
        notes: "",
        active: true,
      })
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao salvar paciente"), "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar paciente" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome completo"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="CPF"
            value={form.cpf}
            onChange={(e) => setForm({ ...form, cpf: e.target.value })}
            required
          />
          <Input
            label="Data de nascimento"
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
            required
          />
        </div>
        {age !== null && (
          <p className="text-xs text-text-secondary">Idade: {age} anos</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium text-text">Sexo</span>
            <select
              className="mt-1 w-full h-10 rounded-lg border border-border px-3 text-sm"
              value={form.gender}
              onChange={(e) =>
                setForm({ ...form, gender: e.target.value as "M" | "F" | "O" })
              }
            >
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </label>
          <Input
            label="Telefone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="WhatsApp"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />
          <Input
            label="Telefone residencial"
            value={form.phoneHome}
            onChange={(e) => setForm({ ...form, phoneHome: e.target.value })}
          />
        </div>
        <Input
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Endereço"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Convênio"
            value={form.insurancePlan}
            onChange={(e) => setForm({ ...form, insurancePlan: e.target.value })}
          />
          <Input
            label="Número da carteirinha"
            value={form.insuranceCard}
            onChange={(e) => setForm({ ...form, insuranceCard: e.target.value })}
          />
        </div>
        <Input
          label="Observações"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <Switch
          checked={form.active}
          label="Paciente ativo"
          onChange={(v) => setForm({ ...form, active: v })}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
