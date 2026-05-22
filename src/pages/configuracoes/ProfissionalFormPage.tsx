import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import SettingsLayout from "@/components/layout/SettingsLayout"
import { useToast } from "@/context/ToastContext"
import { api } from "@/services/api"
import { toastMessageFromApiError } from "@/lib/api-errors"

export default function ProfissionalFormPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    crm: "",
    specialty: "Clínica Geral",
    professionalType: "Médico",
    password: "",
    confirmPassword: "",
    hasOwnAgenda: true,
    isClinicAdmin: false,
    gender: "M" as "M" | "F" | "O",
  })

  const handleSave = async () => {
    if (form.password !== form.confirmPassword) {
      toast("Senhas não conferem", "error")
      return
    }
    setLoading(true)
    try {
      await api.users.create({
        role: "DOCTOR",
        name: form.name,
        email: form.email,
        phone: form.phone,
        cpf: form.cpf || undefined,
        crm: form.crm,
        specialty: form.specialty,
        professionalType: form.professionalType,
        password: form.password,
        hasOwnAgenda: form.hasOwnAgenda,
        isClinicAdmin: form.isClinicAdmin,
        gender: form.gender,
      })
      toast("Profissional cadastrado com sucesso!")
      navigate("/configuracoes/usuarios")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao salvar"), "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsLayout className="max-w-2xl space-y-8">
        <h1 className="text-2xl font-bold text-text">Profissional de saúde</h1>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase">Dados</h2>
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="CPF" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
          <Input label="CRM / Registro" value={form.crm} onChange={(e) => setForm({ ...form, crm: e.target.value })} />
          <Input label="Especialidade" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
          <Switch checked={form.hasOwnAgenda} label="Agenda própria" onChange={(v) => setForm({ ...form, hasOwnAgenda: v })} />
          <Switch checked={form.isClinicAdmin} label="Administrador da clínica" onChange={(v) => setForm({ ...form, isClinicAdmin: v })} />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase">Senha de acesso</h2>
          <Input label="Senha" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input label="Confirmar senha" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          <p className="text-xs text-text-secondary">
            Ao menos 8 caracteres, maiúscula, minúscula, número e caractere especial.
          </p>
        </section>

        <Button size="lg" onClick={handleSave} disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
    </SettingsLayout>
  )
}
