import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import SettingsSidebar from "@/components/layout/SettingsSidebar"
import { api } from "@/services/api"

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  doctorProfile?: { specialty: string; crm: string; available: boolean }
}

export default function UsuariosPage() {
  const [doctors, setDoctors] = useState<UserRow[]>([])
  const [receptionists, setReceptionists] = useState<UserRow[]>([])

  const load = () => {
    api.users.list("DOCTOR").then(setDoctors).catch(() => setDoctors([]))
    api.users.list("RECEPTION").then(setReceptionists).catch(() => setReceptionists([]))
  }

  useEffect(() => {
    load()
  }, [])

  const toggleActive = async (user: UserRow) => {
    await api.users.update(user.id, { active: !user.active })
    load()
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] p-6 lg:p-8 gap-8">
      <SettingsSidebar />
      <div className="flex-1 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-text">Profissionais de saúde</h1>
            <Link to="/configuracoes/usuarios/profissional/novo">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar profissional
              </Button>
            </Link>
          </div>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-alt border-b border-border">
                <tr className="text-text-secondary">
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium">E-mail</th>
                  <th className="text-left p-3 font-medium">Especialidade</th>
                  <th className="text-left p-3 font-medium">Ativo</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc.id} className="border-b border-border hover:bg-surface-alt">
                    <td className="p-3 font-medium text-text">{doc.name}</td>
                    <td className="p-3 text-text-secondary">{doc.email}</td>
                    <td className="p-3">{doc.doctorProfile?.specialty ?? "—"}</td>
                    <td className="p-3">{doc.active ? "Sim" : "Não"}</td>
                    <td className="p-3">
                      <button type="button" className="p-1 hover:bg-surface-alt rounded" title="Ativar/desativar" onClick={() => toggleActive(doc)}>
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text">Recepcionistas</h2>
            <Link to="/configuracoes/usuarios/novo">
              <Button variant="secondary" className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar recepcionista
              </Button>
            </Link>
          </div>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-alt border-b border-border">
                <tr className="text-text-secondary">
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium">E-mail</th>
                  <th className="text-left p-3 font-medium">Ativo</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {receptionists.map((r) => (
                  <tr key={r.id} className="border-b border-border hover:bg-surface-alt">
                    <td className="p-3 font-medium text-text">
                      <Link to={`/configuracoes/usuarios/${r.id}`} className="hover:text-primary">
                        {r.name}
                      </Link>
                    </td>
                    <td className="p-3 text-text-secondary">{r.email}</td>
                    <td className="p-3">{r.active ? "Sim" : "Não"}</td>
                    <td className="p-3">
                      <button type="button" className="p-1 hover:bg-surface-alt rounded" onClick={() => toggleActive(r)}>
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
