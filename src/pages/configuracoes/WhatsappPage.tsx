import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { MessageCircle, Plus, QrCode, Smartphone, Trash2, Unplug } from "lucide-react"

import SettingsSidebar from "@/components/layout/SettingsSidebar"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { Modal } from "@/components/ui/modal"

import { api, type WhatsappConnection } from "@/services/api"

import { useToast } from "@/context/ToastContext"

import { toastMessageFromApiError } from "@/lib/api-errors"

import { cn } from "@/lib/utils"
import WhatsappTemplatesSection from "@/pages/configuracoes/WhatsappTemplatesSection"
import WhatsappRemindersSection from "@/pages/configuracoes/WhatsappRemindersSection"



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



type ConnectModal = "qr" | "pairing" | null



function statusBadgeClass(status: string) {

  if (status === "CONNECTED") return "bg-green-500/15 text-green-700 dark:text-green-300"

  if (status === "ERROR") return "bg-danger/15 text-danger"

  if (status === "DISCONNECTED" || status === "LOGGED_OUT")

    return "bg-surface-alt text-text-secondary"

  return "bg-primary/10 text-primary"

}



type SettingsTab = "connections" | "templates" | "reminders"

const TAB_FROM_QUERY: Record<string, SettingsTab> = {
  connections: "connections",
  templates: "templates",
  reminders: "reminders",
}

export default function WhatsappPage() {

  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const tabFromUrl = searchParams.get("tab")
  const initialTab = TAB_FROM_QUERY[tabFromUrl ?? ""] ?? "connections"
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(initialTab)

  useEffect(() => {
    const next = TAB_FROM_QUERY[searchParams.get("tab") ?? ""]
    if (next) setSettingsTab(next)
  }, [searchParams])

  const [connections, setConnections] = useState<WhatsappConnection[]>([])

  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState("")

  const [method, setMethod] = useState<"QR" | "PAIRING">("QR")

  const [phone, setPhone] = useState("")

  const [activeId, setActiveId] = useState<string | null>(null)

  const [activeConn, setActiveConn] = useState<WhatsappConnection | null>(null)

  const [connectModal, setConnectModal] = useState<ConnectModal>(null)

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



  const refreshActive = useCallback(

    async (id: string) => {

      try {

        const s = await api.whatsapp.getStatus(id)

        setActiveConn(s)

        setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, ...s } : c)))

        if (s.status === "CONNECTED") {

          toast("WhatsApp conectado com sucesso!")

          setConnectModal(null)

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

    if (!activeId || !connectModal) {

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

  }, [activeId, connectModal, refreshActive])



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

      setShowForm(false)

      setName("")

      setActiveId(created.id)

      setConnectModal(method === "QR" ? "qr" : "pairing")

      if (method === "QR") {

        const s = await api.whatsapp.startQr(created.id)

        setActiveConn(s)

      } else {

        const s = await api.whatsapp.startPairing(created.id, phone)

        setActiveConn(s)

      }

      await loadList()

      if (method === "QR") {

        void refreshActive(created.id)

      }

    } catch (e: unknown) {

      setConnectModal(null)

      toast(toastMessageFromApiError(e, "Erro ao criar conexão"), "error")

    } finally {

      setSubmitting(false)

    }

  }



  const handleReconnectQr = async (id: string) => {

    setSubmitting(true)

    setActiveId(id)

    setConnectModal("qr")

    try {

      const s = await api.whatsapp.startQr(id)

      setActiveConn(s)

      void refreshActive(id)

    } catch (e: unknown) {

      setConnectModal(null)

      toast(toastMessageFromApiError(e, "Erro ao gerar QR"), "error")

    } finally {

      setSubmitting(false)

    }

  }



  const closeConnectModal = () => {

    setConnectModal(null)

  }



  const handleDisconnect = async (id: string) => {

    try {

      await api.whatsapp.disconnect(id)

      if (activeId === id) {

        setActiveConn(null)

        setConnectModal(null)

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

        setActiveId(null)

        setActiveConn(null)

        setConnectModal(null)

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

        setActiveId(null)

        setActiveConn(null)

        setConnectModal(null)

      }

      await loadList()

      toast("Conexão removida")

    } catch (e: unknown) {

      toast(toastMessageFromApiError(e, "Erro ao remover"), "error")

    }

  }



  const qrReady =

    activeConn?.qrCode &&

    activeConn.status &&

    POLL_STATUSES.has(activeConn.status)



  const pairingReady = Boolean(activeConn?.pairingCode)



  return (

    <div className="flex min-h-[calc(100vh-4rem)] p-6 lg:p-8 gap-8">

      <SettingsSidebar />

      <div className="flex-1 space-y-6 max-w-4xl">

        <div className="flex items-start justify-between gap-4">

          <div>

            <h1 className="text-2xl font-bold text-text flex items-center gap-2">

              <MessageCircle className="w-7 h-7 text-primary" />

              WhatsApp (Baileys)

            </h1>

            <p className="text-sm text-text-secondary mt-1">

              Conecte números da clínica por QR Code ou código de pareamento. Cada conexão é

              independente e vinculada ao seu usuário.

            </p>

          </div>

          {settingsTab === "connections" && (
            <Button className="gap-2" onClick={() => setShowForm((v) => !v)}>
              <Plus className="w-4 h-4" />
              Nova conexão
            </Button>
          )}
        </div>

        <div className="flex gap-2 border-b border-border pb-2">
          {(
            [
              ["connections", "Conexões"],
              ["templates", "Templates"],
              ["reminders", "Lembretes"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSettingsTab(id)}
              className={cn(
                "px-4 py-2 text-sm rounded-lg transition-colors",
                settingsTab === id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-text-secondary hover:bg-surface-alt"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {settingsTab === "templates" && <WhatsappTemplatesSection />}
        {settingsTab === "reminders" && <WhatsappRemindersSection />}

        {settingsTab === "connections" && (
          <>
        {showForm && (

          <div className="bg-surface border border-border rounded-xl p-6 space-y-4">

            <h2 className="font-semibold text-text">Nova conexão WhatsApp</h2>

            <Input

              label="Nome da conexão"

              placeholder="Ex.: WhatsApp Recepção"

              value={name}

              onChange={(e) => setName(e.target.value)}

            />

            <div className="flex flex-wrap gap-3">

              <button

                type="button"

                onClick={() => setMethod("QR")}

                className={cn(

                  "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors",

                  method === "QR"

                    ? "border-primary bg-primary/10 text-primary"

                    : "border-border text-text-secondary hover:bg-surface-alt"

                )}

              >

                <QrCode className="w-4 h-4" />

                QR Code

              </button>

              <button

                type="button"

                onClick={() => setMethod("PAIRING")}

                className={cn(

                  "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors",

                  method === "PAIRING"

                    ? "border-primary bg-primary/10 text-primary"

                    : "border-border text-text-secondary hover:bg-surface-alt"

                )}

              >

                <Smartphone className="w-4 h-4" />

                Código por número

              </button>

            </div>

            {method === "PAIRING" && (

              <Input

                label="Número do WhatsApp (DDI + DDD + número)"

                placeholder="5562999999999"

                value={phone}

                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}

              />

            )}

            <div className="flex gap-2">

              <Button onClick={handleCreate} disabled={submitting}>

                {submitting ? "Conectando..." : "Conectar"}

              </Button>

              <Button variant="secondary" onClick={() => setShowForm(false)}>

                Cancelar

              </Button>

            </div>

          </div>

        )}



        <Modal

          open={connectModal === "qr"}

          onClose={closeConnectModal}

          title={activeConn?.name ? `QR Code — ${activeConn.name}` : "Conectar com QR Code"}

          size="md"

          footer={

            <Button variant="secondary" onClick={closeConnectModal}>

              Fechar

            </Button>

          }

        >

          <div className="space-y-4">

            {activeConn?.lastError && (

              <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">

                {activeConn.lastError}

              </p>

            )}

            <p className="text-sm text-text-secondary text-center">

              Abra o WhatsApp → Aparelhos conectados → Conectar aparelho → Escanear QR Code

            </p>

            {qrReady ? (

              <img

                src={activeConn!.qrCode!}

                alt="QR Code WhatsApp"

                className="mx-auto w-[280px] h-[280px] rounded-lg border border-border bg-white p-2"

              />

            ) : (

              <p className="text-center text-sm text-text-secondary py-8">

                Gerando QR Code…

              </p>

            )}

            {activeConn && (

              <p className="text-xs text-center text-text-secondary">

                Status: {STATUS_LABEL[activeConn.status] ?? activeConn.status}

              </p>

            )}

          </div>

        </Modal>



        <Modal

          open={connectModal === "pairing"}

          onClose={closeConnectModal}

          title={activeConn?.name ? `Código — ${activeConn.name}` : "Conectar por número"}

          size="md"

          footer={

            <Button variant="secondary" onClick={closeConnectModal}>

              Fechar

            </Button>

          }

        >

          <div className="space-y-4">

            {activeConn?.lastError && (

              <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">

                {activeConn.lastError}

              </p>

            )}

            <p className="text-sm text-text-secondary text-center">

              No celular: WhatsApp → Aparelhos conectados → Conectar com número de telefone →

              digite o código de 8 caracteres:

            </p>

            {pairingReady ? (

              <p className="text-center text-4xl font-mono font-bold tracking-[0.35em] text-primary py-4">

                {activeConn!.pairingCode}

              </p>

            ) : (

              <p className="text-center text-sm text-text-secondary py-8">

                Gerando código…

              </p>

            )}

            {activeConn?.phoneNumber && (

              <p className="text-xs text-center text-text-secondary">

                Número informado: {activeConn.phoneNumber}

              </p>

            )}

          </div>

        </Modal>



        <div className="bg-surface border border-border rounded-xl overflow-hidden">

          <table className="w-full text-sm">

            <thead className="bg-surface-alt/80 text-text-secondary">

              <tr>

                <th className="text-left p-3">Nome</th>

                <th className="text-left p-3">Número</th>

                <th className="text-left p-3">Status</th>

                <th className="p-3" />

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td colSpan={4} className="p-8 text-center text-text-secondary">

                    Carregando...

                  </td>

                </tr>

              ) : connections.length === 0 ? (

                <tr>

                  <td colSpan={4} className="p-8 text-center text-text-secondary">

                    Nenhuma conexão. Clique em &quot;Nova conexão&quot; para começar.

                  </td>

                </tr>

              ) : (

                connections.map((c) => (

                  <tr key={c.id} className="border-t border-border">

                    <td className="p-3 font-medium text-text">{c.name}</td>

                    <td className="p-3 text-text-secondary">{c.phoneNumber ?? "—"}</td>

                    <td className="p-3">

                      <span

                        className={cn(

                          "text-xs font-medium px-2 py-0.5 rounded-full",

                          statusBadgeClass(c.status)

                        )}

                      >

                        {STATUS_LABEL[c.status] ?? c.status}

                      </span>

                    </td>

                    <td className="p-3">

                      <div className="flex justify-end gap-1 flex-wrap">

                        {c.status !== "CONNECTED" && (

                          <Button

                            size="sm"

                            variant="secondary"

                            className="text-xs h-8"

                            onClick={() => handleReconnectQr(c.id)}

                            disabled={submitting}

                          >

                            QR

                          </Button>

                        )}

                        {c.status === "CONNECTED" && (

                          <button

                            type="button"

                            title="Desconectar"

                            className="p-2 rounded-lg text-text-secondary hover:bg-surface-alt"

                            onClick={() => handleDisconnect(c.id)}

                          >

                            <Unplug className="w-4 h-4" />

                          </button>

                        )}

                        <button

                          type="button"

                          title="Encerrar sessão"

                          className="p-2 rounded-lg text-text-secondary hover:text-warning hover:bg-surface-alt"

                          onClick={() => handleLogout(c.id)}

                        >

                          Sair

                        </button>

                        <button

                          type="button"

                          title="Remover"

                          className="p-2 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10"

                          onClick={() => handleRemove(c.id)}

                        >

                          <Trash2 className="w-4 h-4" />

                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>



        <p className="text-xs text-text-secondary">

          Integração via Baileys (WhatsApp Web). Credenciais da sessão ficam no banco de dados,

          vinculadas à conexão e ao usuário que conectou.

        </p>
          </>
        )}

      </div>

    </div>

  )

}


