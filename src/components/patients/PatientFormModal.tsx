import { useMemo, useState } from "react"
import { Check, X } from "lucide-react"
import { differenceInYears } from "date-fns"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import DatePicker from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { api } from "@/services/api"
import { toastMessageFromApiError, fieldsFromApiError } from "@/lib/api-errors"
import { useToast } from "@/context/ToastContext"
import {
  cpfDigits,
  formatCPFInput,
  maskPhoneInput,
  phoneDigits,
  sanitizePersonName,
  validateBirthDate,
  validateCPF,
  validateEmailOptional,
  validateName,
  validatePhone,
  validatePhoneOptional,
} from "@/lib/form-validation"
import { cn } from "@/lib/utils"

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

function FieldHint({ ok, message }: { ok: boolean; message: string }) {
  return (
    <p className={cn("mt-1 flex items-center gap-1 text-xs", ok ? "text-emerald-600" : "text-danger")}>
      {ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
      {message}
    </p>
  )
}

const emptyForm = {
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
}

export default function PatientFormModal({ open, onClose, onSaved }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const nameVal = useMemo(() => validateName(form.name), [form.name])
  const cpfVal = useMemo(() => validateCPF(form.cpf), [form.cpf])
  const emailVal = useMemo(() => validateEmailOptional(form.email), [form.email])
  const phoneVal = useMemo(() => validatePhone(form.phone), [form.phone])
  const whatsappVal = useMemo(() => validatePhoneOptional(form.whatsapp), [form.whatsapp])
  const phoneHomeVal = useMemo(() => validatePhoneOptional(form.phoneHome), [form.phoneHome])
  const birthVal = useMemo(() => validateBirthDate(form.birthDate), [form.birthDate])

  const allOk =
    nameVal.ok &&
    cpfVal.ok &&
    emailVal.ok &&
    phoneVal.ok &&
    whatsappVal.ok &&
    phoneHomeVal.ok &&
    birthVal.ok

  const age =
    form.birthDate && birthVal.ok
      ? differenceInYears(new Date(), new Date(form.birthDate))
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allOk) return

    setLoading(true)
    setFieldErrors({})
    try {
      await api.patients.create({
        ...form,
        name: form.name.trim(),
        cpf: cpfDigits(form.cpf),
        phone: phoneDigits(form.phone),
        whatsapp: form.whatsapp ? phoneDigits(form.whatsapp) : "",
        phoneHome: form.phoneHome ? phoneDigits(form.phoneHome) : "",
        email: form.email.trim(),
      })
      toast("Paciente cadastrado com sucesso!")
      onSaved()
      onClose()
      setForm(emptyForm)
    } catch (err: unknown) {
      setFieldErrors(fieldsFromApiError(err))
      toast(toastMessageFromApiError(err, "Erro ao salvar paciente"), "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar paciente" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Nome completo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: sanitizePersonName(e.target.value) })}
            required
          />
          {form.name.length > 0 && !nameVal.ok && <FieldHint ok={false} message={nameVal.msg} />}
          {fieldErrors.name && <FieldHint ok={false} message={fieldErrors.name} />}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="CPF"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: formatCPFInput(e.target.value) })}
              placeholder="000.000.000-00"
              required
              maxLength={14}
            />
            {form.cpf.length > 0 && !cpfVal.ok && <FieldHint ok={false} message={cpfVal.msg} />}
            {fieldErrors.cpf && <FieldHint ok={false} message={fieldErrors.cpf} />}
          </div>
          <div>
            <DatePicker
              label="Data de nascimento"
              value={form.birthDate}
              onChange={(birthDate) => setForm({ ...form, birthDate })}
            />
            {form.birthDate && !birthVal.ok && <FieldHint ok={false} message={birthVal.msg} />}
          </div>
        </div>

        {age !== null && (
          <p className="text-xs text-text-secondary">Idade: {age} anos</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium text-text">Sexo</span>
            <select
              className="mt-1 w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text"
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
          <div>
            <Input
              label="Telefone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: maskPhoneInput(e.target.value) })}
              placeholder="(11) 99999-9999"
              required
            />
            {form.phone.length > 0 && !phoneVal.ok && <FieldHint ok={false} message={phoneVal.msg} />}
            {fieldErrors.phone && <FieldHint ok={false} message={fieldErrors.phone} />}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="WhatsApp"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: maskPhoneInput(e.target.value) })}
              placeholder="(11) 99999-9999"
            />
            {form.whatsapp.length > 0 && !whatsappVal.ok && (
              <FieldHint ok={false} message={whatsappVal.msg} />
            )}
          </div>
          <div>
            <Input
              label="Telefone residencial"
              value={form.phoneHome}
              onChange={(e) => setForm({ ...form, phoneHome: maskPhoneInput(e.target.value) })}
              placeholder="(11) 3333-3333"
            />
            {form.phoneHome.length > 0 && !phoneHomeVal.ok && (
              <FieldHint ok={false} message={phoneHomeVal.msg} />
            )}
          </div>
        </div>

        <div>
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value.replace(/\s/g, "") })}
            placeholder="exemplo@email.com"
          />
          {form.email.length > 0 && !emailVal.ok && <FieldHint ok={false} message={emailVal.msg} />}
          {fieldErrors.email && <FieldHint ok={false} message={fieldErrors.email} />}
        </div>

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
          <Button type="submit" disabled={loading || !allOk}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
