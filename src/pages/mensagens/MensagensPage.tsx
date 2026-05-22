import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { MessageCircle, Send, Smartphone, Bot, UserRound, Plus } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { api, type WhatsappChat, type WhatsappMessage, type WhatsappTemplate } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { cn } from "@/lib/utils"
import { renderMessageTemplate } from "@/lib/render-template"
import NewWhatsappChatModal from "@/components/whatsapp/NewWhatsappChatModal"

function resolveConnectedId(
  connections: { id: string; status: string }[],
  defaultConnectionId?: string | null
) {
  if (defaultConnectionId) {
    const preferred = connections.find(
      (c) => c.id === defaultConnectionId && c.status === "CONNECTED"
    )
    if (preferred) return preferred.id
  }
  return connections.find((c) => c.status === "CONNECTED")?.id ?? null
}

export default function MensagensPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const patientFilter = searchParams.get("patientId") ?? undefined

  const [chats, setChats] = useState<WhatsappChat[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<WhatsappMessage[]>([])
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([])
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [togglingAi, setTogglingAi] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selected = chats.find((c) => c.id === selectedId)

  const loadChats = useCallback(() => {
    if (!connectionId) return Promise.resolve()
    return api.whatsapp
      .listChats(patientFilter ? { patientId: patientFilter } : undefined)
      .then((list) => {
        setChats(list)
        if (!selectedId && list.length > 0) setSelectedId(list[0].id)
      })
      .catch((e: unknown) =>
        toast(toastMessageFromApiError(e, "Erro ao carregar conversas"), "error")
      )
  }, [connectionId, patientFilter, selectedId, toast])

  useEffect(() => {
    Promise.all([
      api.whatsapp.getSettings().then((s) => {
        setConnectionId(resolveConnectedId(s.connections, s.defaultConnectionId))
      }),
      api.whatsapp.listTemplates().then(setTemplates),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!connectionId) {
      setChats([])
      setSelectedId(null)
      return
    }
    void loadChats()
  }, [connectionId, loadChats])

  useEffect(() => {
    if (!connectionId) return
    const t = setInterval(() => void loadChats(), 5000)
    return () => clearInterval(t)
  }, [connectionId, loadChats])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }
    const loadMessages = () =>
      api.whatsapp
        .getChatMessages(selectedId)
        .then((r) => {
          setMessages(r.messages)
          setChats((prev) =>
            prev.map((c) => (c.id === r.chat.id ? { ...c, aiPaused: r.chat.aiPaused } : c))
          )
        })
        .catch((e: unknown) =>
          toast(toastMessageFromApiError(e, "Erro ao carregar mensagens"), "error")
        )
    void loadMessages()
    const t = setInterval(loadMessages, 5000)
    return () => clearInterval(t)
  }, [selectedId, toast])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const applyTemplate = (id: string) => {
    const tpl = templates.find((t) => t.id === id)
    if (tpl) {
      setText(
        renderMessageTemplate(tpl.body, {
          nome: selected?.patient?.name ?? "",
          clinica: "ClinMax",
        })
      )
    }
    setTemplateId(id)
  }

  const handleToggleAi = async () => {
    if (!selected) return
    setTogglingAi(true)
    try {
      const updated = await api.whatsapp.setChatAiPaused(selected.id, !selected.aiPaused)
      setChats((prev) => prev.map((c) => (c.id === updated.id ? { ...c, aiPaused: updated.aiPaused } : c)))
      toast(updated.aiPaused ? "Assistente IA pausado nesta conversa" : "Assistente IA reativado")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao atualizar assistente"), "error")
    } finally {
      setTogglingAi(false)
    }
  }

  const handleSend = async () => {
    if (!selected || !connectionId || !text.trim()) return
    setSending(true)
    try {
      await api.whatsapp.sendMessage(connectionId, {
        to: selected.phoneDigits,
        remoteJid: selected.remoteJid,
        message: text.trim(),
        patientId: selected.patientId ?? undefined,
        templateId: templateId || undefined,
      })
      setText("")
      setTemplateId("")
      const r = await api.whatsapp.getChatMessages(selected.id)
      setMessages(r.messages)
      await loadChats()
      toast("Mensagem enviada")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao enviar"), "error")
    } finally {
      setSending(false)
    }
  }

  const handleChatCreated = (chat: WhatsappChat) => {
    setChats((prev) => {
      const exists = prev.some((c) => c.id === chat.id)
      if (exists) return prev.map((c) => (c.id === chat.id ? { ...c, ...chat } : c))
      return [chat, ...prev]
    })
    setSelectedId(chat.id)
  }

  return (
    <div className="flex h-full max-w-6xl flex-col overflow-hidden p-4 lg:p-6 mx-auto w-full">
      <h1 className="shrink-0 text-xl font-bold text-text flex items-center gap-2 mb-4">
        <MessageCircle className="w-6 h-6 text-primary" />
        Mensagens WhatsApp
      </h1>

      <div className="min-h-0 flex-1">
      {loading ? (
        <div className="rounded-xl border border-border bg-surface h-full flex items-center justify-center">
          <p className="text-sm text-text-secondary">Carregando...</p>
        </div>
      ) : !connectionId ? (
        <div className="rounded-xl border border-border bg-surface h-full">
          <EmptyState
            icon={<Smartphone className="w-12 h-12" />}
            title="WhatsApp não conectado"
            description="Para enviar e receber mensagens, conecte um número da clínica nas configurações do WhatsApp."
            actionLabel="Conectar WhatsApp"
            onAction={() => navigate("/configuracoes/whatsapp")}
          />
        </div>
      ) : (
        <div className="flex h-full border border-border rounded-xl overflow-hidden bg-surface">
          <aside className="w-full sm:w-72 border-r border-border flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-text-secondary">Conversas</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setNewChatOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Nova
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <EmptyState
                  title="Nenhuma conversa ainda"
                  description="Inicie uma conversa com um paciente ou número de telefone."
                  actionLabel="Nova conversa"
                  onAction={() => setNewChatOpen(true)}
                />
              ) : (
                chats.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 border-b border-border/60 hover:bg-surface-alt transition-colors",
                      selectedId === c.id && "bg-primary/10"
                    )}
                  >
                    <p className="font-medium text-sm text-text truncate">
                      {c.patient?.name ?? c.phoneDigits}
                    </p>
                    <p className="text-xs text-text-secondary truncate">{c.lastMessage ?? "—"}</p>
                    {c.unreadCount > 0 && (
                      <span className="inline-block mt-1 text-[10px] bg-primary text-white px-1.5 rounded-full">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="flex-1 flex flex-col min-w-0">
            {selected ? (
              <>
                <div className="p-4 border-b border-border flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text">
                      {selected.patient?.name ?? selected.phoneDigits}
                    </p>
                    <p className="text-xs text-text-secondary">{selected.phoneDigits}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={togglingAi}
                    onClick={handleToggleAi}
                    className="shrink-0 gap-1.5"
                  >
                    {selected.aiPaused ? (
                      <>
                        <Bot className="w-3.5 h-3.5" />
                        Reativar IA
                      </>
                    ) : (
                      <>
                        <UserRound className="w-3.5 h-3.5" />
                        Assumir conversa
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface-alt/30">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                        m.fromMe
                          ? "ml-auto bg-primary text-white"
                          : "bg-surface border border-border text-text"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p
                        className={cn(
                          "text-[10px] mt-1",
                          m.fromMe ? "text-white/70" : "text-text-secondary"
                        )}
                      >
                        {format(new Date(m.sentAt), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="p-4 border-t border-border space-y-2">
                  {templates.length > 0 && (
                    <select
                      className="w-full h-9 rounded-lg border border-border px-2 text-sm bg-surface text-text"
                      value={templateId}
                      onChange={(e) => applyTemplate(e.target.value)}
                    >
                      <option value="">Template (opcional)</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      className="flex-1 min-h-[72px] rounded-lg border border-border px-3 py-2 text-sm bg-surface text-text resize-none"
                      placeholder="Digite a mensagem..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                    <Button
                      className="shrink-0 self-end"
                      disabled={sending || !connectionId || !text.trim()}
                      onClick={handleSend}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  title="Selecione uma conversa"
                  description="Escolha um contato na lista ao lado para ver as mensagens."
                />
              </div>
            )}
          </section>
        </div>
      )}
      </div>

      <NewWhatsappChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onCreated={handleChatCreated}
      />
    </div>
  )
}
