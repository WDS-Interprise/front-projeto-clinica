import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  Clock3,
  Headphones,
  Pencil,
  Plus,
  Power,
  Shield,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import UserAvatar from "@/components/user/UserAvatar"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  doctorProfile?: { specialty: string; crm: string; available: boolean }
}

type JoinRequestRow = {
  id: string
  requestedRole: string | null
  roleLabel: string
  user: { id: string; name: string; email: string }
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  DOCTOR: "Profissional de saúde",
  RECEPTION: "Recepcionista",
  FINANCE: "Financeiro",
  CONSULTANT: "Consultor",
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-[#E8F1FF] text-[#2B6CB0]",
  DOCTOR: "bg-[#E8F6EE] text-[#006B4D]",
  RECEPTION: "bg-[#F3E8FF] text-[#6B46C1]",
  FINANCE: "bg-[#FFF6E5] text-[#C98900]",
  CONSULTANT: "bg-[#EEF2F6] text-[#4A6270]",
}

const card = "rounded-[14px] border border-[#E4EBE6] bg-white"
const greenBtn =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#006B4D] px-3.5 text-[13px] font-semibold text-white hover:bg-[#005A41]"
const outlineBtn =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#006B4D] bg-white px-3.5 text-[13px] font-semibold text-[#006B4D] hover:bg-[#F4F7F5]"

export default function UsuariosPage() {
  const { clinicId } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserRow[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequestRow[]>([])

  const load = async () => {
    try {
      const list = await api.users.list()
      setUsers(list)
    } catch (err: unknown) {
      setUsers([])
      toast(toastMessageFromApiError(err, "Erro ao carregar usuários"), "error")
    }
    if (!clinicId) return
    try {
      const data = await api.invites.list(clinicId)
      setJoinRequests(data.joinRequests ?? [])
    } catch {
      setJoinRequests([])
    }
  }

  useEffect(() => {
    void load()
  }, [clinicId])

  const stats = useMemo(() => {
    const active = users.filter((u) => u.active)
    return {
      active: active.length,
      doctors: active.filter((u) => u.role === "DOCTOR").length,
      reception: active.filter((u) => u.role === "RECEPTION").length,
      admins: active.filter((u) => u.role === "ADMIN").length,
    }
  }, [users])

  const toggleActive = async (user: UserRow) => {
    try {
      await api.users.update(user.id, { active: !user.active })
      toast(user.active ? "Usuário desativado" : "Usuário ativado")
      await load()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao atualizar usuário"), "error")
    }
  }

  return (
    <SettingsLayout className="flex flex-col gap-4 pb-6">
      <SettingsPageHeader
        title="Usuários da clínica"
        description="Gerencie funcionários, acessos e perfis da equipe da clínica."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-[#E8F6EE] text-[#006B4D]"
          label="Equipe ativa"
          value={stats.active}
        />
        <StatCard
          icon={<Stethoscope className="h-5 w-5" />}
          iconClass="bg-[#E8F1FF] text-[#2B6CB0]"
          label="Profissionais de saúde"
          value={stats.doctors}
        />
        <StatCard
          icon={<Headphones className="h-5 w-5" />}
          iconClass="bg-[#F3E8FF] text-[#6B46C1]"
          label="Recepção"
          value={stats.reception}
        />
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          iconClass="bg-[#FFF6E5] text-[#C98900]"
          label="Administradores"
          value={stats.admins}
        />
      </div>

      <section className={cn(card, "w-full min-w-0")}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4EBE6] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-[#12261E]">Equipe com acesso</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/configuracoes/usuarios/profissional/novo" className={greenBtn}>
              <Plus className="h-4 w-4" />
              Adicionar profissional
            </Link>
            <Link to="/configuracoes/usuarios/novo" className={outlineBtn}>
              <Plus className="h-4 w-4" />
              Adicionar recepcionista
            </Link>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[26%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead className="bg-[#F7FAF8] text-left text-[12px] font-semibold uppercase tracking-wide text-[#6B7C74]">
              <tr>
                <th className="px-6 py-3.5">Nome</th>
                <th className="px-6 py-3.5">E-mail</th>
                <th className="px-6 py-3.5">Cargo</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#6B7C74]">
                    Nenhum usuário com acesso ainda.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-[#E4EBE6]">
                    <td className="px-6 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar name={user.name} size="sm" />
                        <span className="truncate font-medium text-[#12261E]">{user.name}</span>
                      </div>
                    </td>
                    <td className="truncate px-6 py-4 text-[#6B7C74]">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium",
                          ROLE_BADGE[user.role] ?? "bg-[#EEF2F6] text-[#4A6270]"
                        )}
                      >
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-[#12261E]">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            user.active ? "bg-[#22A06B]" : "bg-[#C4CDC7]"
                          )}
                        />
                        {user.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-4 whitespace-nowrap">
                        <Link
                          to={`/configuracoes/usuarios/${user.id}`}
                          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#006B4D] hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => void toggleActive(user)}
                          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#6B7C74] hover:text-[#12261E]"
                        >
                          <Power className="h-3.5 w-3.5" />
                          {user.active ? "Desativar" : "Ativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={cn(card, "p-5")}>
        <div className="mb-2 flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-[#C98900]" />
          <h2 className="text-[16px] font-semibold text-[#12261E]">Aguardando aprovação</h2>
        </div>
        {joinRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-[#C5D4CB] bg-[#F4F7F5] text-[#6B7C74]">
              <UserRound className="h-7 w-7" />
            </span>
            <p className="max-w-md text-sm text-[#6B7C74]">
              Nenhuma solicitação pendente. Todas as solicitações de acesso foram analisadas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4EBE6] rounded-xl border border-[#E4EBE6]">
            {joinRequests.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium text-[#12261E]">{row.user.name}</p>
                  <p className="text-sm text-[#6B7C74]">
                    {row.user.email}
                    {row.requestedRole ? ` · ${row.roleLabel}` : ""}
                  </p>
                </div>
                <Link
                  to="/configuracoes/convites"
                  className="text-sm font-medium text-[#006B4D] hover:underline"
                >
                  Revisar em Convites
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </SettingsLayout>
  )
}

function StatCard({
  icon,
  iconClass,
  label,
  value,
}: {
  icon: ReactNode
  iconClass: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-[#E4EBE6] bg-white p-4">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconClass)}>
        {icon}
      </span>
      <div>
        <p className="text-[15px] font-semibold text-[#12261E]">
          {label} ({value})
        </p>
      </div>
    </div>
  )
}
