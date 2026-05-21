import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import SettingsSidebar from "@/components/layout/SettingsSidebar"
import { useToast } from "@/context/ToastContext"
import { api } from "@/services/api"
import { toastMessageFromApiError } from "@/lib/api-errors"

export default function UsuarioFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id && id !== "novo")
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([])
  const [linkedDoctorIds, setLinkedDoctorIds] = useState<string[]>([])
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    isClinicAdmin: false,
    active: true,
    gender: "F" as "M" | "F" | "O",
    phone: "",
  })

  useEffect(() => {
    api.doctors.list().then((list) => setDoctors(list.map((d: any) => ({ id: d.id, name: d.name }))))
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    api.users.getById(id).then((u) => {
      setForm({
        name: u.name,
        email: u.email,
        password: "",
        confirmPassword: "",
        isClinicAdmin: u.clinics?.[0]?.isClinicAdmin ?? u.isClinicAdmin ?? false,
        active: u.active ?? true,
        gender: u.gender ?? "F",
        phone: u.phone ?? "",
      })
      setLinkedDoctorIds(u.linkedDoctors?.map((d: any) => d.id) ?? [])
    })
  }, [id, isEdit])

  const toggleDoctor = (doctorId: string) => {
    setLinkedDoctorIds((prev) =>
      prev.includes(doctorId) ? prev.filter((x) => x !== doctorId) : [...prev, doctorId]
    )
  }

  const handleSave = async () => {
    if (!isEdit && form.password !== form.confirmPassword) {
      toast("Senhas não conferem", "error")
      return
    }
    setLoading(true)
    try {
      if (isEdit && id) {
        await api.users.update(id, {
          name: form.name,
          email: form.email,
          active: form.active,
          gender: form.gender,
          phone: form.phone,
          isClinicAdmin: form.isClinicAdmin,
          ...(form.password ? { password: form.password } : {}),
        })
        await api.users.setLinkedDoctors(id, linkedDoctorIds)
      } else {
        await api.users.create({
          role: "RECEPTION",
          name: form.name,
          email: form.email,
          password: form.password,
          gender: form.gender,
          phone: form.phone,
          isClinicAdmin: form.isClinicAdmin,
          linkedDoctorIds,
        })
      }
      toast("Usuário salvo com sucesso!")
      navigate("/configuracoes/usuarios")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao salvar"), "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] p-6 lg:p-8 gap-8">
      <SettingsSidebar />
      <div className="flex-1 max-w-2xl space-y-8">
        <h1 className="text-2xl font-bold text-text">Recepcionista</h1>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase">Dados do usuário</h2>
          <Input label="Tipo de usuário" value="Recepcionista" readOnly />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {isEdit && (
            <Switch checked={form.active} label="Usuário ativo" onChange={(v) => setForm({ ...form, active: v })} />
          )}
        </section>

        {!isEdit && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase">Definir senha</h2>
            <Input label="Senha" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Input label="Confirmar senha" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
            <p className="text-xs text-text-secondary">
              Ao menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.
            </p>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase">Clínica</h2>
          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
            <div>
              <p className="font-medium text-text">ClinicHub Clínica Geral</p>
              <p className="text-xs text-text-secondary">Administrador da clínica</p>
            </div>
            <Switch checked={form.isClinicAdmin} onChange={(v) => setForm({ ...form, isClinicAdmin: v })} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase">Profissionais que atende</h2>
          {doctors.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-border">
              <p className="font-medium text-text">{doc.name}</p>
              <Switch
                checked={linkedDoctorIds.includes(doc.id)}
                onChange={() => toggleDoctor(doc.id)}
              />
            </div>
          ))}
        </section>

        <Button size="lg" onClick={handleSave} disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  )
}
