import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { api, type WhatsappTemplate } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import type { Appointment } from "@/types"

type Props = {
  open: boolean
  onClose: () => void
  appointment: Appointment
  onSent?: () => void
}

export default function WhatsappSendDrawer({ open, onClose, appointment, onSent }: Props) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([])
  const [templateId, setTemplateId] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)

  const phone =
    appointment.patient?.whatsapp?.replace(/\D/g, "") ||
    appointment.patient?.phone?.replace(/\D/g, "") ||
    ""

  useEffect(() => {
    if (!open) return
    api.whatsapp
      .listTemplates()
      .then((list) => {
        setTemplates(list)
        const reminder = list.find((t) => t.category === "APPOINTMENT_REMINDER") ?? list[0]
        if (reminder) {
          setTemplateId(reminder.id)
          setBody(reminder.body)
        }
      })
      .catch((e: unknown) =>
        toast(toastMessageFromApiError(e, "Erro ao carregar templates"), "error")
      )
  }, [open, toast])

  const handleTemplateChange = (id: string) => {
    setTemplateId(id)
    const tpl = templates.find((t) => t.id === id)
    if (tpl) setBody(tpl.body)
  }

  const handleSend = async () => {
    if (!appointment.id) return
    setSending(true)
    try {
      await api.appointments.reminder(appointment.id, {
        templateId: templateId || undefined,
        body: body.trim() || undefined,
      })
      toast("Mensagem enviada pelo WhatsApp")
      onSent?.()
      onClose()
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao enviar"), "error")
    } finally {
      setSending(false)
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Enviar WhatsApp" width="md" layer="stack">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-text">{appointment.patient?.name}</p>
          <p className="text-xs text-text-secondary">
            {phone ? `+${phone}` : "Sem telefone cadastrado"}
          </p>
        </div>

        {!phone && (
          <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            Cadastre o WhatsApp ou telefone do paciente.
          </p>
        )}

        <div>
          <label className="text-xs font-medium text-text-secondary">Template</label>
          <select
            className="mt-1 w-full h-10 rounded-lg border border-border px-3 text-sm bg-surface text-text"
            value={templateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            disabled={!phone}
          >
            <option value="">Selecione</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary">Mensagem</label>
          <textarea
            className="mt-1 w-full min-h-[120px] rounded-lg border border-border px-3 py-2 text-sm bg-surface text-text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!phone}
          />
          <p className="text-[10px] text-text-secondary mt-1">
            Variáveis: {"{{nome}}"}, {"{{data}}"}, {"{{hora}}"}, {"{{medico}}"}, {"{{clinica}}"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" disabled={!phone || sending || !body.trim()} onClick={handleSend}>
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-1 pt-1">
          <Link
            to="/configuracoes/whatsapp?tab=templates"
            className="text-xs text-primary hover:underline"
            onClick={onClose}
          >
            Editar templates de mensagem
          </Link>
          {appointment.patientId && (
            <Link
              to={`/mensagens?patientId=${appointment.patientId}`}
              className="text-xs text-text-secondary hover:text-primary hover:underline"
              onClick={onClose}
            >
              Abrir conversa completa
            </Link>
          )}
        </div>
      </div>
    </Drawer>
  )
}
