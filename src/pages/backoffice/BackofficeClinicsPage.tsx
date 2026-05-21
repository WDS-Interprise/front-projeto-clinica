import { useEffect, useState } from "react"
import { Plus, Building2 } from "lucide-react"
import { backofficeApi, type BackofficeClinic } from "@/services/backoffice-api"
import { Button } from "@/components/ui/button"

export default function BackofficeClinicsPage() {
  const [clinics, setClinics] = useState<BackofficeClinic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", email: "", active: true })

  const load = () => {
    setLoading(true)
    backofficeApi.clinics
      .list()
      .then(setClinics)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    try {
      await backofficeApi.clinics.create({
        name: form.name.trim(),
        phone: form.phone || undefined,
        email: form.email || undefined,
        active: form.active,
      })
      setShowForm(false)
      setForm({ name: "", phone: "", email: "", active: true })
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao criar")
    }
  }

  const toggleActive = async (c: BackofficeClinic) => {
    await backofficeApi.clinics.update(c.id, { active: !c.active })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Clínicas</h1>
          <p className="text-sm text-text-secondary mt-1">
            Cadastro e gestão de todas as clínicas da plataforma
          </p>
        </div>
        <Button
          className="gap-2 bg-amber-600 hover:bg-amber-500 text-text border-0"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="w-4 h-4" />
          Nova clínica
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 px-4 py-3 rounded-lg">
          {error}
        </p>
      )}

      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-3 max-w-lg">
          <input
            placeholder="Nome da clínica"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full h-10 rounded-lg bg-surface-alt border border-border px-3 text-sm text-text"
          />
          <input
            placeholder="Telefone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full h-10 rounded-lg bg-surface-alt border border-border px-3 text-sm text-text"
          />
          <input
            placeholder="E-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full h-10 rounded-lg bg-surface-alt border border-border px-3 text-sm text-text"
          />
          <Button className="bg-amber-600 hover:bg-amber-500" onClick={handleCreate}>
            Salvar clínica
          </Button>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Clínica</th>
              <th className="text-left p-3">Usuários</th>
              <th className="text-left p-3">Pacientes</th>
              <th className="text-left p-3">Consultas</th>
              <th className="text-left p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-secondary">
                  Carregando...
                </td>
              </tr>
            ) : (
              clinics.map((c) => (
                <tr key={c.id} className="border-t border-border text-text-secondary">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-medium text-text">{c.name}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{c.email || "—"}</p>
                  </td>
                  <td className="p-3">{c._count.users}</td>
                  <td className="p-3">{c._count.patients}</td>
                  <td className="p-3">{c._count.appointments}</td>
                  <td className="p-3">{c.active ? "Ativa" : "Inativa"}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      className="text-xs text-amber-400 hover:underline"
                      onClick={() => toggleActive(c)}
                    >
                      {c.active ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
