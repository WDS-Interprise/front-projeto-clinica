import { useEffect, useState } from "react"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/services/api"

export default function ClinicasPage() {
  const { toast } = useToast()
  const { hasPermission, clinicId } = useAuth()
  const canManage = hasPermission("clinics:manage")
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    active: true,
  })

  useEffect(() => {
    const applyClinic = (c: {
      id: string
      name: string
      phone?: string | null
      email?: string | null
      active: boolean
    }) => {
      setForm({
        id: c.id,
        name: c.name,
        phone: c.phone ?? "",
        email: c.email ?? "",
        active: c.active,
      })
    }

    const loadId = clinicId
    if (!loadId) {
      api.clinics
        .list()
        .then((list) => {
          if (list[0]) applyClinic(list[0])
        })
        .finally(() => setLoading(false))
      return
    }
    api.clinics
      .getById(loadId)
      .then(applyClinic)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [clinicId])

  const handleSave = async () => {
    if (!canManage || !form.id) {
      toast("Sem permissão para alterar clínica", "error")
      return
    }
    try {
      await api.clinics.update(form.id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        active: form.active,
      })
      localStorage.setItem("clinicName", form.name)
      toast("Dados da clínica salvos!")
    } catch (err: any) {
      toast(err.message || "Erro ao salvar", "error")
    }
  }

  if (loading) {
    return (
      <SettingsLayout className="max-w-2xl">
        <p className="text-text-secondary">Carregando...</p>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout className="max-w-2xl">
      <SettingsPageHeader
        icon={<Building2 className="w-7 h-7 text-primary" />}
        title="Dados da clínica"
        description="Informações institucionais exibidas em documentos, comunicações e identificação da clínica."
      />

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <Input
          label="Nome da clínica"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          readOnly={!canManage}
        />
        <Input
          label="Telefone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          readOnly={!canManage}
        />
        <Input
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          readOnly={!canManage}
        />
      </div>

      {canManage ? (
        <Button onClick={handleSave}>Salvar alterações</Button>
      ) : (
        <p className="text-sm text-text-secondary">
          Visualização apenas. Alterações requerem perfil administrador.
        </p>
      )}
    </SettingsLayout>
  )
}
