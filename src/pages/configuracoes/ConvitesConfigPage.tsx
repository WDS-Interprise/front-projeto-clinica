import { useEffect, useMemo, useState } from "react"
import {
  Clock3,
  Copy,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/services/api"
import { cn } from "@/lib/utils"

const roleOptions = [
  { value: "DOCTOR", label: "Profissional de saúde" },
  { value: "RECEPTION", label: "Recepcionista" },
  { value: "ADMIN", label: "Administrador(a)" },
  { value: "FINANCE", label: "Financeiro" },
  { value: "CONSULTANT", label: "Consultor(a)" },
] as const

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  REVOKED: "Cancelado",
  EXPIRED: "Expirado",
}

const card = "rounded-[14px] border border-[#E4EBE6] bg-white p-5"
const outlineBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D5DED8] bg-white px-3.5 text-[13px] font-medium text-[#1B2E26] hover:bg-[#F4F7F5] disabled:opacity-40"
const greenBtn =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#006B4D] px-4 text-[13px] font-semibold text-white hover:bg-[#005A41] disabled:opacity-50"
const selectClass =
  "h-10 w-full rounded-lg border border-[#D5DED8] bg-white px-3 text-sm text-[#12261E] outline-none focus:border-[#006B4D]"

function formatInviteCode(code: string) {
  return code.replace(/\s/g, "").split("").join(" ")
}

function SectionTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-2 flex items-center gap-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#006B4D] text-[12px] font-bold text-white">
        {n}
      </span>
      <h2 className="text-[16px] font-semibold text-[#12261E]">{title}</h2>
    </div>
  )
}

export default function ConvitesConfigPage() {
  const { toast } = useToast()
  const { clinicId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [inviteCodeRole, setInviteCodeRole] = useState<"" | (typeof roleOptions)[number]["value"]>("")
  const [savingCodeRole, setSavingCodeRole] = useState(false)
  const [assignRoles, setAssignRoles] = useState<Record<string, (typeof roleOptions)[number]["value"]>>({})
  const [invites, setInvites] = useState<
    Array<{
      id: string
      email: string
      role: string
      roleLabel: string
      status: string
      expiresAt: string
      createdAt: string
    }>
  >([])
  const [joinRequests, setJoinRequests] = useState<
    Array<{
      id: string
      requestedRole: string | null
      roleLabel: string
      createdAt: string
      user: { id: string; name: string; email: string }
    }>
  >([])
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<(typeof roleOptions)[number]["value"]>("DOCTOR")

  const sentLast30 = useMemo(() => {
    const from = Date.now() - 30 * 24 * 60 * 60 * 1000
    return invites.filter((i) => new Date(i.createdAt).getTime() >= from).length
  }, [invites])

  const load = async () => {
    if (!clinicId) return
    setLoading(true)
    try {
      const data = await api.invites.list(clinicId)
      setInviteCode(data.inviteCode)
      setInviteCodeRole(data.inviteCodeRole ?? "")
      setInvites(data.invites)
      setJoinRequests(data.joinRequests ?? [])
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao carregar convites", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [clinicId])

  const copyCode = async () => {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    toast("Código copiado!")
  }

  const handleSend = async () => {
    if (!clinicId || !email.trim()) return
    setSending(true)
    try {
      const result = await api.invites.create(clinicId, { email: email.trim(), role })
      setEmail("")
      if (result.emailDelivered) {
        toast("Convite enviado por e-mail!")
      } else if (result.emailError) {
        toast(
          `Convite criado, mas o e-mail não foi enviado: ${result.emailError}`,
          "error"
        )
      } else {
        toast(
          "Convite criado. Configure SMTP no servidor para envio automático.",
          "error"
        )
      }
      await load()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao enviar convite", "error")
    } finally {
      setSending(false)
    }
  }

  const handleRevoke = async (inviteId: string) => {
    if (!clinicId) return
    try {
      await api.invites.revoke(clinicId, inviteId)
      toast("Convite cancelado")
      await load()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao cancelar convite", "error")
    }
  }

  const handleSaveCodeRole = async (next: "" | (typeof roleOptions)[number]["value"]) => {
    if (!clinicId) return
    setInviteCodeRole(next)
    setSavingCodeRole(true)
    try {
      await api.invites.setInviteCodeRole(clinicId, next || null)
      toast(next ? "Cargo vinculado ao código" : "Código sem cargo: você define na aprovação")
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao salvar cargo do código", "error")
      await load()
    } finally {
      setSavingCodeRole(false)
    }
  }

  const handleRegenerate = async () => {
    if (!clinicId) return
    try {
      const result = await api.invites.regenerateCode(clinicId)
      setInviteCode(result.inviteCode)
      toast("Novo código gerado")
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao gerar código", "error")
    }
  }

  if (loading) {
    return (
      <SettingsLayout>
        <p className="text-[#6B7C74]">Carregando...</p>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout className="flex flex-col gap-4 pb-6">
      <SettingsPageHeader
        icon={<UserPlus className="h-7 w-7 text-[#006B4D]" />}
        title="Convites da clínica"
        description="Convide profissionais por e-mail ou compartilhe o código da clínica."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-[14px] border border-[#E4EBE6] bg-white p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F6EE] text-[#006B4D]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-[#12261E]">Código ativo ({inviteCode ? 1 : 0})</p>
            <p className="text-[12px] text-[#6B7C74]">Código da clínica ativo</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-[14px] border border-[#E4EBE6] bg-white p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF6E5] text-[#C98900]">
            <Clock3 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-[#12261E]">
              Solicitações pendentes ({joinRequests.length})
            </p>
            <p className="text-[12px] text-[#6B7C74]">Aguardando aprovação</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-[14px] border border-[#E4EBE6] bg-white p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F1FF] text-[#2B6CB0]">
            <Send className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-[#12261E]">Convites enviados ({sentLast30})</p>
            <p className="text-[12px] text-[#6B7C74]">Últimos 30 dias</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={card}>
          <SectionTitle n={1} title="Código da clínica" />
          <p className="mb-4 text-[13px] leading-relaxed text-[#6B7C74]">
            Sem cargo no código: quem entra só pede acesso e você define o cargo na aprovação. Com cargo no
            código: a pessoa não escolhe nada, o pedido já vem com aquele papel (ainda precisa da sua
            aprovação).
          </p>
          <div className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-[#E8F6EE] px-4 py-5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#006B4D]" />
            <p className="font-mono text-[22px] font-bold tracking-[0.28em] text-[#006B4D]">
              {inviteCode ? formatInviteCode(inviteCode) : "-"}
            </p>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button type="button" className={outlineBtn} onClick={() => void copyCode()} disabled={!inviteCode}>
              <Copy className="h-4 w-4" />
              Copiar código
            </button>
            <button type="button" className={outlineBtn} onClick={() => void handleRegenerate()}>
              <RefreshCw className="h-4 w-4" />
              Gerar novo código
            </button>
          </div>
          <label className="mb-1 block text-sm font-medium text-[#12261E]">Cargo deste código</label>
          <select
            value={inviteCodeRole}
            disabled={savingCodeRole}
            onChange={(e) => void handleSaveCodeRole(e.target.value as typeof inviteCodeRole)}
            className={selectClass}
          >
            <option value="">Sem cargo (admin define na aprovação)</option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </section>

        <section className={card}>
          <SectionTitle n={2} title="Convidar por e-mail" />
          <p className="mb-4 text-[13px] leading-relaxed text-[#6B7C74]">
            Enviaremos um link de aceite para a caixa de entrada do convidado.
          </p>
          <div className="space-y-3">
            <Input
              label="E-mail do convidado"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="medico@email.com"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-[#12261E]">Papel</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className={selectClass}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={greenBtn}
              onClick={() => void handleSend()}
              disabled={sending || !email.trim()}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Enviar convite
            </button>
          </div>
        </section>
      </div>

      <section className={card}>
        <SectionTitle n={3} title="Solicitações de entrada" />
        <p className="mb-4 text-[13px] text-[#6B7C74]">
          Pedidos feitos com o código da clínica. Se o código não tinha cargo, escolha o papel e aprove.
        </p>
        {joinRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F6EE] text-[#006B4D]">
              <UserRound className="h-7 w-7" />
            </span>
            <p className="text-sm text-[#6B7C74]">Nenhuma solicitação pendente.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4EBE6] rounded-xl border border-[#E4EBE6]">
            {joinRequests.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium text-[#12261E]">{row.user.name}</p>
                  <p className="text-sm text-[#6B7C74]">
                    {row.user.email}
                    {row.requestedRole ? ` · cargo do código: ${row.roleLabel}` : " · sem cargo no código"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!row.requestedRole ? (
                    <select
                      value={assignRoles[row.id] ?? "RECEPTION"}
                      onChange={(e) =>
                        setAssignRoles((current) => ({
                          ...current,
                          [row.id]: e.target.value as (typeof roleOptions)[number]["value"],
                        }))
                      }
                      className={cn(selectClass, "w-auto")}
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <button
                    type="button"
                    className={outlineBtn}
                    onClick={async () => {
                      if (!clinicId) return
                      try {
                        await api.invites.rejectJoinRequest(clinicId, row.id)
                        toast("Solicitação recusada")
                        await load()
                      } catch (err: unknown) {
                        toast(err instanceof Error ? err.message : "Erro ao recusar", "error")
                      }
                    }}
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    className={cn(greenBtn, "w-auto px-4")}
                    onClick={async () => {
                      if (!clinicId) return
                      try {
                        await api.invites.approveJoinRequest(
                          clinicId,
                          row.id,
                          row.requestedRole ? undefined : { role: assignRoles[row.id] ?? "RECEPTION" }
                        )
                        toast("Acesso aprovado")
                        await load()
                      } catch (err: unknown) {
                        toast(err instanceof Error ? err.message : "Erro ao aprovar", "error")
                      }
                    }}
                  >
                    Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={card}>
        <SectionTitle n={4} title="Convites enviados" />
        <p className="mb-4 text-[13px] text-[#6B7C74]">Acompanhe os convites enviados por e-mail.</p>
        <div className="overflow-hidden rounded-xl border border-[#E4EBE6]">
          <table className="w-full text-sm">
            <thead className="bg-[#F7FAF8] text-left text-[12px] font-semibold uppercase tracking-wide text-[#6B7C74]">
              <tr>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F1FF] text-[#2B6CB0]">
                        <Send className="h-7 w-7" />
                      </span>
                      <p className="text-sm text-[#6B7C74]">Nenhum convite enviado ainda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr key={invite.id} className="border-t border-[#E4EBE6]">
                    <td className="px-4 py-3 font-medium text-[#12261E]">{invite.email}</td>
                    <td className="px-4 py-3 text-[#6B7C74]">{invite.roleLabel}</td>
                    <td className="px-4 py-3 text-[#6B7C74]">{STATUS_LABEL[invite.status] ?? invite.status}</td>
                    <td className="px-4 py-3 text-[#6B7C74]">
                      {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {invite.status === "PENDING" ? (
                        <button type="button" className={outlineBtn} onClick={() => void handleRevoke(invite.id)}>
                          Cancelar
                        </button>
                      ) : (
                        <span className="text-[#8A9A90]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </SettingsLayout>
  )
}
