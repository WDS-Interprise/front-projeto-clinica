import { useEffect, useState } from "react"
import { Copy, Loader2, Mail, RefreshCw, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/services/api"

const roleOptions = [
  { value: "DOCTOR", label: "Médico(a)" },
  { value: "RECEPTION", label: "Recepcionista" },
  { value: "ADMIN", label: "Administrador(a)" },
] as const

export default function ConvitesConfigPage() {
  const { toast } = useToast()
  const { clinicId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
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
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<(typeof roleOptions)[number]["value"]>("DOCTOR")

  const load = async () => {
    if (!clinicId) return
    setLoading(true)
    try {
      const data = await api.invites.list(clinicId)
      setInviteCode(data.inviteCode)
      setInvites(data.invites)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao carregar convites", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
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
      toast(
        result.emailDelivered
          ? "Convite enviado por e-mail!"
          : "Convite criado. Configure SMTP para envio automático — link no console do backend."
      )
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
      <SettingsLayout className="max-w-3xl">
        <p className="text-text-secondary">Carregando...</p>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout className="max-w-3xl">
      <SettingsPageHeader
        icon={<UserPlus className="w-7 h-7 text-primary" />}
        title="Convites da clínica"
        description="Convide profissionais por e-mail ou compartilhe o código da clínica."
      />

      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-text">Código da clínica</h2>
          <p className="text-sm text-text-secondary mt-1">
            O profissional pode digitar este código ao concluir o cadastro para entrar na sua clínica.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-border bg-surface-alt px-4 py-3 font-mono text-xl font-bold tracking-[0.25em] text-primary">
            {inviteCode || "—"}
          </div>
          <Button variant="secondary" className="gap-2" onClick={copyCode} disabled={!inviteCode}>
            <Copy className="w-4 h-4" />
            Copiar código
          </Button>
          <Button variant="ghost" className="gap-2" onClick={handleRegenerate}>
            <RefreshCw className="w-4 h-4" />
            Gerar novo código
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-text">Convidar por e-mail</h2>
          <p className="text-sm text-text-secondary mt-1">
            Enviaremos um link de aceite para a caixa de entrada do convidado.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Input
            label="E-mail do convidado"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="medico@email.com"
          />
          <div>
            <label className="block text-sm font-medium text-text mb-1">Papel</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm sm:min-w-[160px]"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button className="gap-2" onClick={handleSend} disabled={sending || !email.trim()}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Enviar convite
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-text">Convites enviados</h2>
        </div>
        {invites.length === 0 ? (
          <p className="px-6 py-8 text-sm text-text-secondary">Nenhum convite enviado ainda.</p>
        ) : (
          <div className="divide-y divide-border">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div>
                  <p className="font-medium text-text">{invite.email}</p>
                  <p className="text-sm text-text-secondary">
                    {invite.roleLabel} · {invite.status} · expira{" "}
                    {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {invite.status === "PENDING" && (
                  <Button variant="ghost" size="sm" onClick={() => handleRevoke(invite.id)}>
                    Cancelar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsLayout>
  )
}
