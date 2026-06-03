import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  Bot,
  MessageCircle,
  Plus,
  Search,
  Send,
  Smartphone,
  UserRound,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { api, type WhatsappChat, type WhatsappMessage, type WhatsappTemplate } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { cn } from "@/lib/utils"
import { renderMessageTemplate } from "@/lib/render-template"
import { whatsappChatDisplayName } from "@/lib/whatsapp-display"
import NewWhatsappChatModal from "@/components/whatsapp/NewWhatsappChatModal"
import WhatsappChatAvatar from "@/components/whatsapp/WhatsappChatAvatar"
import WhatsappChatListItem from "@/components/whatsapp/WhatsappChatListItem"
import WhatsappTypingBubble from "@/components/whatsapp/WhatsappTypingBubble"

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
  const [search, setSearch] = useState("")
  const [staffTyping, setStaffTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const composingPingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const staffComposingRef = useRef(false)

  const selected = chats.find((c) => c.id === selectedId)
  const aiComposing = selected?.aiComposing && !selected?.aiPaused
  const contactComposing = selected?.contactComposing ?? false
  const clinicComposing = Boolean(aiComposing || staffTyping)
  const anyComposing = contactComposing || clinicComposing

  const loadChats = useCallback(() => {
    if (!connectionId) return Promise.resolve()
    return api.whatsapp
      .listChats(patientFilter ? { patientId: patientFilter } : undefined)
      .then((list) => {
        setChats(list)
        setSelectedId((prev) => {
          if (prev && list.some((c) => c.id === prev)) return prev
          return list.length > 0 ? list[0].id : null
        })
      })
      .catch((e: unknown) =>
        toast(toastMessageFromApiError(e, "Erro ao carregar conversas"), "error")
      )
  }, [connectionId, patientFilter, toast])

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
    const ms = anyComposing ? 1500 : 5000
    const t = setInterval(() => void loadChats(), ms)
    return () => clearInterval(t)
  }, [connectionId, loadChats, anyComposing])

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
            prev.map((c) =>
              c.id === r.chat.id
                ? {
                    ...c,
                    aiPaused: r.chat.aiPaused,
                    aiComposing: r.chat.aiComposing ?? false,
                    contactComposing: r.chat.contactComposing ?? false,
                  }
                : c
            )
          )
        })
        .catch((e: unknown) =>
          toast(toastMessageFromApiError(e, "Erro ao carregar mensagens"), "error")
        )
    void loadMessages()
    const ms = anyComposing ? 1500 : 5000
    const t = setInterval(loadMessages, ms)
    return () => clearInterval(t)
  }, [selectedId, toast, anyComposing])

  const pingStaffComposing = useCallback(
    (active: boolean) => {
      if (!selectedId) return
      if (staffComposingRef.current === active) return
      staffComposingRef.current = active
      void api.whatsapp.setComposing(selectedId, active).catch(() => undefined)
    },
    [selectedId]
  )

  useEffect(() => {
    return () => {
      if (composingPingRef.current) clearTimeout(composingPingRef.current)
      if (selectedId && staffComposingRef.current) {
        void api.whatsapp.setComposing(selectedId, false).catch(() => undefined)
      }
    }
  }, [selectedId])

  const handleTextChange = (value: string) => {
    setText(value)
    const typing = value.trim().length > 0
    setStaffTyping(typing)
    if (!selectedId || selected?.aiPaused) return
    if (composingPingRef.current) clearTimeout(composingPingRef.current)
    if (typing) {
      pingStaffComposing(true)
      composingPingRef.current = setTimeout(() => pingStaffComposing(true), 4000)
    } else {
      pingStaffComposing(false)
    }
  }

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
      setStaffTyping(false)
      pingStaffComposing(false)
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

  const filteredChats = chats.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const name = whatsappChatDisplayName(c).toLowerCase()
    return name.includes(q) || c.phoneDigits.includes(q) || (c.lastMessage ?? "").toLowerCase().includes(q)
  })

  const selectedName = selected ? whatsappChatDisplayName(selected) : ""

  return (
    <div className="wa-messenger flex h-full flex-col overflow-hidden bg-[#f0f2f5]">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col p-2 sm:p-4">
        {loading ? (
          <div className="flex flex-1 items-center justify-center rounded-lg bg-white shadow-sm">
            <p className="text-sm text-[#667781]">Carregando conversas...</p>
          </div>
        ) : !connectionId ? (
          <div className="flex flex-1 items-center justify-center rounded-lg bg-white shadow-sm">
            <EmptyState
              icon={<Smartphone className="h-12 w-12 text-[#008069]" />}
              title="WhatsApp não conectado"
              description="Para enviar e receber mensagens, conecte um número da clínica nas configurações do WhatsApp."
              actionLabel="Conectar WhatsApp"
              onAction={() => navigate("/configuracoes/whatsapp")}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg shadow-[0_1px_3px_rgba(11,20,26,0.08)]">
            {/* Lista de conversas */}
            <aside
              className={cn(
                "flex w-full flex-col border-r border-[#e9edef] bg-white md:w-[min(100%,420px)] md:max-w-[420px]",
                selectedId ? "hidden md:flex" : "flex"
              )}
            >
              <header className="shrink-0 bg-[#f0f2f5] px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <h1 className="flex items-center gap-2 text-lg font-semibold text-[#111b21]">
                    <MessageCircle className="h-5 w-5 text-[#008069]" />
                    Conversas
                  </h1>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 gap-1 bg-[#008069] px-3 text-xs text-white hover:bg-[#006d5b]"
                    onClick={() => setNewChatOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nova
                  </Button>
                </div>
                <div className="relative mt-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8696a0]" />
                  <input
                    type="search"
                    placeholder="Pesquisar conversa"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-full rounded-lg border-0 bg-white py-2 pl-9 pr-3 text-sm text-[#111b21] placeholder:text-[#8696a0] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008069]/30"
                  />
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {filteredChats.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title={search ? "Nenhum resultado" : "Nenhuma conversa ainda"}
                      description={
                        search
                          ? "Tente outro nome ou número."
                          : "Inicie uma conversa com um paciente ou número de telefone."
                      }
                      actionLabel={search ? undefined : "Nova conversa"}
                      onAction={search ? undefined : () => setNewChatOpen(true)}
                    />
                  </div>
                ) : (
                  filteredChats.map((c) => (
                    <WhatsappChatListItem
                      key={c.id}
                      chat={c}
                      selected={selectedId === c.id}
                      onSelect={() => setSelectedId(c.id)}
                    />
                  ))
                )}
              </div>
            </aside>

            {/* Painel da conversa */}
            <section
              className={cn(
                "flex min-w-0 flex-1 flex-col bg-[#efeae2]",
                !selectedId && "hidden md:flex"
              )}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9dbd5' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            >
              {selected ? (
                <>
                  <header className="flex shrink-0 items-center gap-3 border-b border-[#e9edef] bg-[#f0f2f5] px-3 py-2 sm:px-4">
                    <button
                      type="button"
                      className="md:hidden rounded-full p-2 text-[#54656f] hover:bg-[#e9edef]"
                      onClick={() => setSelectedId(null)}
                      aria-label="Voltar para conversas"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <WhatsappChatAvatar chatId={selected.id} name={selectedName} size="sm" eager />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-medium text-[#111b21]">{selectedName}</p>
                      <p className="truncate text-xs text-[#667781]">
                        {contactComposing ? (
                          <span className="text-[#008069]">{selectedName} está digitando…</span>
                        ) : clinicComposing ? (
                          <span className="text-[#008069]">
                            {aiComposing ? "Assistente digitando…" : "Você está digitando…"}
                          </span>
                        ) : (
                          selected.phoneDigits
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={togglingAi}
                      onClick={handleToggleAi}
                      className="shrink-0 gap-1.5 border-[#e9edef] bg-white text-[#111b21] hover:bg-[#f5f6f6]"
                    >
                      {selected.aiPaused ? (
                        <>
                          <Bot className="h-3.5 w-3.5 text-[#008069]" />
                          <span className="hidden sm:inline">Reativar IA</span>
                        </>
                      ) : (
                        <>
                          <UserRound className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Assumir</span>
                        </>
                      )}
                    </Button>
                  </header>

                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-6">
                    {contactComposing && (
                      <WhatsappTypingBubble side="left" label="digitando" />
                    )}
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[min(85%,520px)] rounded-lg px-3 py-2 text-[14.2px] leading-[19px] shadow-sm",
                            m.fromMe
                              ? "rounded-tr-none bg-[#d9fdd3] text-[#111b21]"
                              : "rounded-tl-none bg-white text-[#111b21]"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p
                            className={cn(
                              "mt-1 text-right text-[11px]",
                              m.fromMe ? "text-[#667781]" : "text-[#8696a0]"
                            )}
                          >
                            {format(new Date(m.sentAt), "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {clinicComposing && (
                      <WhatsappTypingBubble
                        side="right"
                        label={aiComposing ? "assistente" : undefined}
                      />
                    )}
                    <div ref={bottomRef} />
                  </div>

                  <footer className="shrink-0 border-t border-[#e9edef] bg-[#f0f2f5] p-3 sm:p-4">
                    {templates.length > 0 && (
                      <select
                        className="mb-2 h-9 w-full rounded-lg border border-[#e9edef] bg-white px-2 text-sm text-[#111b21] focus:outline-none focus:ring-2 focus:ring-[#008069]/30"
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
                    <div className="flex items-end gap-2">
                      <textarea
                        className="max-h-32 min-h-[44px] flex-1 resize-none rounded-lg border-0 bg-white px-4 py-3 text-sm text-[#111b21] shadow-sm placeholder:text-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#008069]/30"
                        placeholder="Digite uma mensagem"
                        rows={1}
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        onBlur={() => {
                          setStaffTyping(false)
                          pingStaffComposing(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            void handleSend()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        disabled={sending || !connectionId || !text.trim()}
                        onClick={handleSend}
                        className="h-11 w-11 shrink-0 rounded-full bg-[#008069] p-0 text-white hover:bg-[#006d5b] disabled:opacity-50"
                        aria-label="Enviar mensagem"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </footer>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] p-8 text-center">
                  <div className="mb-4 rounded-full bg-[#e9edef] p-6">
                    <MessageCircle className="h-16 w-16 text-[#8696a0]" strokeWidth={1.25} />
                  </div>
                  <h2 className="text-xl font-light text-[#41525d]">Mensagens WhatsApp</h2>
                  <p className="mt-2 max-w-sm text-sm text-[#667781]">
                    Selecione uma conversa na lista ao lado para visualizar e responder mensagens.
                  </p>
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
