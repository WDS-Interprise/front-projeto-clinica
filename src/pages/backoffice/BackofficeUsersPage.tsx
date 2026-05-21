import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { backofficeApi, type BackofficeClinic, type BackofficeUser } from "@/services/backoffice-api"
import { Button } from "@/components/ui/button"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useConfirm } from "@/hooks/useConfirm"

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  DOCTOR: "Médico",
  RECEPTION: "Recepção",
}

export default function BackofficeUsersPage() {
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [users, setUsers] = useState<BackofficeUser[]>([])
  const [clinics, setClinics] = useState<BackofficeClinic[]>([])
  const [role, setRole] = useState("")
  const [clinicId, setClinicId] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    backofficeApi.users
      .list({ role: role || undefined, clinicId: clinicId || undefined, search: search || undefined })
      .then(setUsers)
      .catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao carregar usuários"), "error"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    backofficeApi.clinics
      .list()
      .then(setClinics)
      .catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao carregar clínicas"), "error"))
  }, [toast])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [role, clinicId, search])

  const handleDelete = async (u: BackofficeUser) => {
    const ok = await confirm({
      title: "Excluir usuário",
      message: `Excluir o usuário "${u.name}"? Ele será desativado e não poderá mais entrar no sistema.`,
      confirmLabel: "Excluir",
      variant: "danger",
    })
    if (!ok) return
    try {
      await backofficeApi.users.remove(u.id)
      setUsers((prev) => prev.filter((row) => row.id !== u.id))
      toast("Usuário excluído (desativado) com sucesso.")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao excluir"), "error")
    }
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Usuários</h1>
          <p className="text-sm text-text-secondary mt-1">Gestão global de acessos e vínculos com clínicas</p>
        </div>
        <Link to="/backoffice/usuarios/novo">
          <Button className="gap-2 bg-amber-600 hover:bg-amber-500 text-text border-0">
            <Plus className="w-4 h-4" />
            Novo usuário
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            placeholder="Buscar nome ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface border border-border text-sm text-text"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 rounded-lg bg-surface border border-border px-3 text-sm text-text"
        >
          <option value="">Todos perfis</option>
          <option value="ADMIN">Admin</option>
          <option value="DOCTOR">Médico</option>
          <option value="RECEPTION">Recepção</option>
        </select>
        <select
          value={clinicId}
          onChange={(e) => setClinicId(e.target.value)}
          className="h-10 rounded-lg bg-surface border border-border px-3 text-sm text-text min-w-[180px]"
        >
          <option value="">Todas clínicas</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">E-mail</th>
              <th className="text-left p-3">Perfil</th>
              <th className="text-left p-3">Clínicas</th>
              <th className="text-left p-3">Dono plataforma</th>
              <th className="text-left p-3">Ativo</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-secondary">
                  Carregando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-secondary">
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-border text-text-secondary">
                  <td className="p-3 font-medium text-text">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{roleLabels[u.role] ?? u.role}</td>
                  <td className="p-3 text-xs">
                    {u.clinics.map((c) => c.name).join(", ") || "—"}
                  </td>
                  <td className="p-3">{u.isAccountAdmin ? "Sim" : "Não"}</td>
                  <td className="p-3">{u.active ? "Sim" : "Não"}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/backoffice/usuarios/${u.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-amber-400 hover:bg-amber-500/10"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-red-400 hover:bg-red-950/50"
                        title="Excluir"
                        onClick={() => handleDelete(u)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    <ConfirmDialog />
    </>
  )
}
