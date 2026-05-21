import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SettingsSidebar from "@/components/layout/SettingsSidebar"
import ThemeAppearanceCard from "@/components/settings/ThemeAppearanceCard"
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
    const loadId = clinicId
    if (!loadId) {
      api.clinics.list().then((list) => {
        if (list[0]) setForm({ id: list[0].id, name: list[0].name, phone: list[0].phone ?? "", email: list[0].email ?? "", active: list[0].active })
      }).finally(() => setLoading(false))
      return
    }
    api.clinics.getById(loadId).then((c) => {
      setForm({ id: c.id, name: c.name, phone: c.phone ?? "", email: c.email ?? "", active: c.active })
    }).catch(() => {}).finally(() => setLoading(false))
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
      toast("Configurações salvas!")
    } catch (err: any) {
      toast(err.message || "Erro ao salvar", "error")
    }
  }

  if (loading) {
    return <p className="p-8 text-text-secondary">Carregando...</p>
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] p-6 lg:p-8 gap-8">
      <SettingsSidebar />
      <div className="flex-1 max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-text">Configurações da clínica</h1>

        <ThemeAppearanceCard />

        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <Input label="Nome da clínica" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} readOnly={!canManage} />
          <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} readOnly={!canManage} />
          <Input label="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} readOnly={!canManage} />
          {canManage ? (
            <Button onClick={handleSave}>Salvar alterações</Button>
          ) : (
            <p className="text-sm text-text-secondary">Visualização apenas. Alterações requerem perfil administrador.</p>
          )}
        </div>
      </div>
    </div>
  )
}
