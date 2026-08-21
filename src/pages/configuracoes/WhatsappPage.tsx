import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Hash,
  Link2,
  Loader2,
  MessageCircle,
  Plus,
  QrCode,
  ShieldCheck,
  Trash2,
  Unplug,
} from "lucide-react"

import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import { WhatsappQrScanAnimation } from "@/components/whatsapp/WhatsappQrScanAnimation"
import { Modal } from "@/components/ui/modal"
import { api, type WhatsappConnection } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<string, string> = {
  CREATED: "Criada",
  WAITING_QR: "Aguardando QR",
  QR_GENERATED: "Escaneie o QR",
  WAITING_PAIRING: "Digite o código no celular",
  CONNECTING: "Conectando (aguarde após escanear o QR)",
  CONNECTED: "Conectado",
  DISCONNECTED: "Desconectado",
  LOGGED_OUT: "Sessão encerrada",
  ERROR: "Erro",
}

const POLL_STATUSES = new Set([
  "CREATED",
  "WAITING_QR",
  "QR_GENERATED",
  "WAITING_PAIRING",
  "CONNECTING",
])

type ConnectionPhase = "setup" | "active"

const card = "rounded-[14px] border border-[#E4EBE6] bg-white overflow-hidden"
const blueBtn =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 text-[13px] font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-50"
const greenBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#006B4D] px-5 text-[13px] font-semibold text-white hover:bg-[#005A41] disabled:opacity-50"
const outlineBtn =
  "inline-flex h-10 items-center justify-center rounded-lg border border-[#D5DED8] bg-white px-5 text-[13px] font-medium text-[#1B2E26] hover:bg-[#F4F7F5] disabled:opacity-50"
const methodBtn = (active: boolean) =>
  cn(
    "flex h-11 items-center justify-center gap-2 rounded-lg border text-[13px] font-medium transition-colors",
    active
      ? "border-[#006B4D] bg-[#E8F6EE] text-[#006B4D]"
      : "border-[#D5DED8] bg-white text-[#6B7C74] hover:bg-[#F4F7F5]"
  )
const fieldLabel = "mb-1.5 block text-[13px] font-medium text-[#12261E]"
const fieldInput =
  "h-10 w-full rounded-lg border border-[#D5DED8] bg-white px-3 text-sm text-[#12261E] outline-none placeholder:text-[#8A9A90] focus:border-[#006B4D]"

function statusBadgeClass(status: string) {
  if (status === "CONNECTED") return "bg-[#E8F6EE] text-[#006B4D]"
  if (status === "ERROR") return "bg-red-50 text-red-600"
  if (status === "DISCONNECTED" || status === "LOGGED_OUT") return "bg-[#F4F7F5] text-[#6B7C74]"
  return "bg-[#EFF6FF] text-[#2563EB]"
}

function WhatsappConnectIllustration() {
  return (
    <div className="relative mx-auto h-[130px] w-[160px]">
      <div className="absolute left-0 top-2 flex h-[118px] w-[68px] flex-col items-center rounded-[16px] border-2 border-[#C5D0CA] bg-white px-2 pt-3">
        <div className="mb-2 h-1.5 w-8 rounded-full bg-[#C5D0CA]" />
        <div className="grid grid-cols-4 gap-0.5 rounded-md border border-[#D5DED8] bg-[#F4F7F5] p-1.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className={cn("h-2 w-2 rounded-[1px]", i % 3 === 0 ? "bg-[#12261E]" : "bg-[#E4EBE6]")}
            />
          ))}
        </div>
      </div>
      <div className="absolute right-6 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-[#D5DED8] bg-white shadow-sm">
        <Link2 className="h-4 w-4 text-[#2563EB]" strokeWidth={1.75} />
      </div>
      <div className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full border border-[#D5DED8] bg-white shadow-sm">
        <MessageCircle className="h-5 w-5 text-[#006B4D]" strokeWidth={1.75} />
      </div>
    </div>
  )
}

function WhatsappConnectionsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14">
      <div className="relative mb-5 h-[130px] w-[160px]">
        <div className="absolute left-0 top-2 flex h-[118px] w-[68px] flex-col items-center rounded-[16px] border-2 border-[#C5D0CA] bg-[#F4F7F5] px-2 pt-3">
          <div className="mb-2 h-1.5 w-8 rounded-full bg-[#C5D0CA]" />
          <div className="grid grid-cols-4 gap-0.5 rounded-md border border-[#D5DED8] bg-white p-1.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className={cn("h-2 w-2 rounded-[1px]", i % 3 === 0 ? "bg-[#12261E]" : "bg-[#E4EBE6]")}
              />
            ))}
          </div>
        </div>
        <div className="absolute right-6 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-[#D5DED8] bg-white shadow-sm">
          <Link2 className="h-4 w-4 text-[#6B7C74]" strokeWidth={1.75} />
        </div>
        <div className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full border border-[#D5DED8] bg-white shadow-sm">
          <MessageCircle className="h-5 w-5 text-[#6B7C74]" strokeWidth={1.75} />
        </div>
      </div>
      <p className="max-w-sm text-center text-[14px] leading-relaxed text-[#6B7C74]">
        Nenhuma conexão. Clique em &apos;Nova conexão&apos; para começar.
      </p>
    </div>
  )
}

export default function WhatsappPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "reminders" || tab === "templates") {
      navigate(
        tab === "reminders"
          ? "/configuracoes/inteligencia-artificial"
          : "/configuracoes/whatsapp",
        { replace: true }
      )
    }
  }, [searchParams, navigate])

  const [connections, setConnections] = useState<WhatsappConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [connectionPhase, setConnectionPhase] = useState<ConnectionPhase>("setup")
  const [name, setName] = useState("")
  const [method, setMethod] = useState<"QR" | "PAIRING">("QR")
  const [phone, setPhone] = useState("")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeConn, setActiveConn] = useState<WhatsappConnection | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadList = useCallback(() => {
    return api.whatsapp
      .listConnections()
      .then(setConnections)
      .catch((e: unknown) =>
        toast(toastMessageFromApiError(e, "Erro ao carregar conexões"), "error")
      )
  }, [toast])

  useEffect(() => {
    loadList().finally(() => setLoading(false))
  }, [loadList])

  const resetCreateForm = () => {
    setName("")
    setMethod("QR")
    setPhone("")
    setActiveId(null)
    setActiveConn(null)
    setConnectionPhase("setup")
  }

  const closeConnectionModal = () => {
    setShowConnectionModal(false)
    resetCreateForm()
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }

  const refreshActive = useCallback(
    async (id: string) => {
      try {
        const s = await api.whatsapp.getStatus(id)
        setActiveConn(s)
        setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, ...s } : c)))
        if (s.status === "CONNECTED") {
          toast("WhatsApp conectado com sucesso!")
          closeConnectionModal()
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
        }
        return s
      } catch (e: unknown) {
        toast(toastMessageFromApiError(e, "Erro ao atualizar status"), "error")
        return null
      }
    },
    [toast]
  )

  useEffect(() => {
    if (!activeId || connectionPhase !== "active" || !showConnectionModal) {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
      return
    }
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      void refreshActive(activeId)
    }, 2500)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [activeId, connectionPhase, showConnectionModal, refreshActive])

  const openCreateModal = () => {
    resetCreateForm()
    setShowConnectionModal(true)
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast("Informe um nome para a conexão", "error")
      return
    }
    if (method === "PAIRING" && phone.replace(/\D/g, "").length < 10) {
      toast("Informe o número com DDD (somente dígitos)", "error")
      return
    }
    setSubmitting(true)
    try {
      const created = await api.whatsapp.createConnection({
        name: name.trim(),
        connectionType: method,
      })
      setActiveId(created.id)
      setConnectionPhase("active")
      if (method === "QR") {
        const s = await api.whatsapp.startQr(created.id)
        setActiveConn(s)
        void refreshActive(created.id)
      } else {
        const s = await api.whatsapp.startPairing(created.id, phone)
        setActiveConn(s)
        void refreshActive(created.id)
      }
      await loadList()
    } catch (e: unknown) {
      setConnectionPhase("setup")
      toast(toastMessageFromApiError(e, "Erro ao criar conexão"), "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReconnectQr = async (id: string) => {
    const conn = connections.find((c) => c.id === id)
    setSubmitting(true)
    setActiveId(id)
    setMethod("QR")
    setName(conn?.name ?? "")
    setConnectionPhase("active")
    setShowConnectionModal(true)
    try {
      const s = await api.whatsapp.startQr(id)
      setActiveConn(s)
      void refreshActive(id)
    } catch (e: unknown) {
      closeConnectionModal()
      toast(toastMessageFromApiError(e, "Erro ao gerar QR"), "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDisconnect = async (id: string) => {
    try {
      await api.whatsapp.disconnect(id)
      if (activeId === id) {
        setActiveConn(null)
        closeConnectionModal()
      }
      await loadList()
      toast("Conexão desconectada")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao desconectar"), "error")
    }
  }

  const handleLogout = async (id: string) => {
    try {
      await api.whatsapp.logout(id)
      if (activeId === id) {
        closeConnectionModal()
      }
      await loadList()
      toast("Sessão encerrada. Será necessário parear novamente.")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao encerrar sessão"), "error")
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await api.whatsapp.remove(id)
      if (activeId === id) {
        closeConnectionModal()
      }
      await loadList()
      toast("Conexão removida")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao remover"), "error")
    }
  }

  const qrReady =
    activeConn?.qrCode && activeConn.status && POLL_STATUSES.has(activeConn.status)

  const pairingReady = Boolean(activeConn?.pairingCode)

  return (
    <SettingsLayout className="flex flex-col gap-0 pb-6">
      <SettingsPageHeader
        icon={<MessageCircle className="h-7 w-7 text-[#006B4D]" strokeWidth={1.75} />}
        title="WhatsApp (Baileys)"
        description="Conecte números da clínica por QR Code ou código de pareamento. Cada conexão é independente e vinculada ao seu usuário."
        action={
          <button type="button" className={blueBtn} onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Nova conexão
          </button>
        }
      />

      <div className="flex flex-col gap-4">
          <div className={card}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E4EBE6] text-[13px] font-medium text-[#6B7C74]">
                  <th className="px-5 py-3 text-left">Nome</th>
                  <th className="px-5 py-3 text-left">Número</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-[14px] text-[#6B7C74]">
                      Carregando...
                    </td>
                  </tr>
                ) : connections.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <WhatsappConnectionsEmpty />
                    </td>
                  </tr>
                ) : (
                  connections.map((c) => (
                    <tr key={c.id} className="border-t border-[#E4EBE6] first:border-t-0">
                      <td className="px-5 py-3.5 font-medium text-[#12261E]">{c.name}</td>
                      <td className="px-5 py-3.5 text-[#6B7C74]">{c.phoneNumber ?? "-"}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium",
                            statusBadgeClass(c.status)
                          )}
                        >
                          {STATUS_LABEL[c.status] ?? c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1 flex-wrap">
                          {c.status !== "CONNECTED" && (
                            <button
                              type="button"
                              className="inline-flex h-8 items-center rounded-lg border border-[#D5DED8] bg-white px-2.5 text-[12px] font-medium text-[#1B2E26] hover:bg-[#F4F7F5] disabled:opacity-40"
                              onClick={() => handleReconnectQr(c.id)}
                              disabled={submitting}
                            >
                              QR
                            </button>
                          )}
                          {c.status === "CONNECTED" && (
                            <button
                              type="button"
                              title="Desconectar"
                              className="rounded-lg p-2 text-[#6B7C74] hover:bg-[#F4F7F5]"
                              onClick={() => handleDisconnect(c.id)}
                            >
                              <Unplug className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Encerrar sessão"
                            className="rounded-lg px-2 py-1.5 text-[12px] font-medium text-[#6B7C74] hover:bg-[#F4F7F5]"
                            onClick={() => handleLogout(c.id)}
                          >
                            Sair
                          </button>
                          <button
                            type="button"
                            title="Remover"
                            className="rounded-lg p-2 text-[#6B7C74] hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleRemove(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-[#006B4D]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span>
              Integração via Baileys (WhatsApp Web). Credenciais da sessão ficam no banco de
              dados, vinculadas à conexão e ao usuário que conectou.
            </span>
          </p>
        </div>

      <Modal
        open={showConnectionModal}
        onClose={closeConnectionModal}
        title="Nova conexão WhatsApp"
        size="md"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <button type="button" className={outlineBtn} onClick={closeConnectionModal}>
              Cancelar
            </button>
            {connectionPhase === "setup" ? (
              <button
                type="button"
                className={greenBtn}
                onClick={handleCreate}
                disabled={submitting}
              >
                {submitting ? "Conectando..." : "Conectar"}
              </button>
            ) : (
              <span className="text-[12px] text-[#6B7C74]">
                {activeConn
                  ? `Status: ${STATUS_LABEL[activeConn.status] ?? activeConn.status}`
                  : "Aguardando..."}
              </span>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {connectionPhase === "setup" && (
            <>
              <div>
                <label className={fieldLabel}>Nome da conexão</label>
                <input
                  className={fieldInput}
                  placeholder="Ex.: WhatsApp Recepção"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod("QR")}
                  className={methodBtn(method === "QR")}
                >
                  <QrCode className="h-4 w-4" />
                  QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("PAIRING")}
                  className={methodBtn(method === "PAIRING")}
                >
                  <Hash className="h-4 w-4" />
                  Código por número
                </button>
              </div>

              {method === "PAIRING" && (
                <div>
                  <label className={fieldLabel}>Número do WhatsApp (DDI + DDD + número)</label>
                  <input
                    className={fieldInput}
                    placeholder="5562999999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              )}
            </>
          )}

          {activeConn?.lastError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {activeConn.lastError}
            </p>
          )}

          <div
            className={cn(
              "rounded-xl border border-[#E4EBE6] px-5 py-8",
              method === "QR" ? "bg-white" : "bg-[#F4F7F5]/50"
            )}
          >
            {connectionPhase === "active" && method === "QR" && qrReady ? (
              <img
                src={activeConn!.qrCode!}
                alt="QR Code WhatsApp"
                className="mx-auto h-[220px] w-[220px] rounded-lg border border-[#E4EBE6] bg-white p-2"
              />
            ) : method === "QR" ? (
              <div className="flex flex-col items-center justify-center">
                <WhatsappQrScanAnimation />
                {connectionPhase === "active" && !qrReady && (
                  <p className="mt-1 text-[13px] text-[#6B7C74]">Gerando QR Code…</p>
                )}
              </div>
            ) : connectionPhase === "active" && method === "PAIRING" ? (
              pairingReady ? (
                <p className="py-2 text-center font-mono text-[32px] font-bold tracking-[0.35em] text-[#006B4D]">
                  {activeConn!.pairingCode}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-[#006B4D]" />
                  <p className="mt-3 text-[13px] text-[#6B7C74]">Gerando código…</p>
                </div>
              )
            ) : (
              <WhatsappConnectIllustration />
            )}

            <h3 className="mt-6 text-center text-[15px] font-semibold text-[#12261E]">
              {method === "QR"
                ? "Escaneie o QR Code com o WhatsApp"
                : "Digite o código no WhatsApp"}
            </h3>
            <p className="mt-2 text-center text-[13px] leading-relaxed text-[#6B7C74]">
              {method === "QR" ? (
                <>
                  Abra o WhatsApp no seu celular, vá em Configurações &gt; Aparelhos conectados
                  &gt; Conectar um aparelho e escaneie o QR Code acima.
                </>
              ) : connectionPhase === "active" && pairingReady ? (
                <>
                  No celular: WhatsApp &gt; Aparelhos conectados &gt; Conectar com número de
                  telefone. Digite o código de 8 caracteres acima.
                </>
              ) : (
                <>
                  Informe o número com DDD, clique em Conectar e use o código de 8 caracteres no
                  WhatsApp do celular.
                </>
              )}
            </p>
          </div>
        </div>
      </Modal>
    </SettingsLayout>
  )
}
