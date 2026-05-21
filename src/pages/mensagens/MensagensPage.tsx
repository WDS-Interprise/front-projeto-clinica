import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { MessageCircle, Send } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { api, type WhatsappChat, type WhatsappMessage, type WhatsappTemplate } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { cn } from "@/lib/utils"
import { renderMessageTemplate } from "@/lib/render-template"

export default function MensagensPage() {
  const { toast } = useToast()
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
  const bottomRef = useRef<HTMLDivElement>(null)

  const selected = chats.find((c) => c.id === selectedId)

  const loadChats = useCallback(() => {
    return api.whatsapp
      .listChats(patientFilter ? { patientId: patientFilter } : undefined)
      .then((list) => {
        setChats(list)
        if (!selectedId && list.length > 0) setSelectedId(list[0].id)
      })
      .catch((e: unknown) =>
        toast(toastMessageFromApiError(e, "Erro ao carregar conversas"), "error")
      )
  }, [patientFilter, selectedId, toast])

  useEffect(() => {
    Promise.all([
      api.whatsapp.getSettings().then((s) => {
        const conn =
          s.defaultConnectionId ??
          s.connections.find((c) => c.status === "CONNECTED")?.id ??
          null
        setConnectionId(conn)
      }),
      api.whatsapp.listTemplates().then(setTemplates),
      loadChats(),
    ]).finally(() => setLoading(false))
  }, [loadChats])

  useEffect(() => {
    const t = setInterval(() => void loadChats(), 5000)
    return () => clearInterval(t)
  }, [loadChats])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }
    api.whatsapp
      .getChatMessages(selectedId)
      .then((r) => setMessages(r.messages))
      .catch((e: unknown) =>
        toast(toastMessageFromApiError(e, "Erro ao carregar mensagens"), "error")
      )
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

  const handleSend = async () => {
    if (!selected || !connectionId || !text.trim()) return
    setSending(true)
    try {
      await api.whatsapp.sendMessage(connectionId, {
        to: selected.phoneDigits,
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

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-text flex items-center gap-2 mb-6">
        <MessageCircle className="w-7 h-7 text-primary" />
        Mensagens WhatsApp
      </h1>

      {!connectionId && !loading && (
        <p className="text-sm text-warning bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 mb-4">
          Nenhum WhatsApp conectado. Conecte em Configurações → WhatsApp.
        </p>
      )}

      <div className="flex border border-border rounded-xl overflow-hidden bg-surface min-h-[520px]">
        <aside className="w-full sm:w-72 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border text-xs font-medium text-text-secondary">
            Conversas
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-text-secondary">Carregando...</p>
            ) : chats.length === 0 ? (
              <p className="p-4 text-sm text-text-secondary">Nenhuma conversa ainda.</p>
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
              <div className="p-4 border-b border-border">
                <p className="font-semibold text-text">
                  {selected.patient?.name ?? selected.phoneDigits}
                </p>
                <p className="text-xs text-text-secondary">{selected.phoneDigits}</p>
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
            <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
              Selecione uma conversa
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
