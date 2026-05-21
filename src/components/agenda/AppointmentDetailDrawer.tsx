import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Trash2, MessageCircle, DollarSign, Loader2 } from "lucide-react"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useAuth } from "@/context/AuthContext"
import { useConfirm } from "@/hooks/useConfirm"
import WhatsappSendDrawer from "@/components/whatsapp/WhatsappSendDrawer"
import type { Appointment } from "@/types"

const statusOptions = [
  { value: "SCHEDULED", label: "Agendado" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "IN_PROGRESS", label: "Em atendimento" },
  { value: "COMPLETED", label: "Atendido" },
  { value: "NO_SHOW", label: "Faltou" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "RESCHEDULED", label: "Remarcado" },
] as const

interface Props {
  appointmentId: string | null
  onClose: () => void
  onUpdated: () => void
}

export default function AppointmentDetailDrawer({ appointmentId, onClose, onUpdated }: Props) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const { hasPermission } = useAuth()
  const canStartClinical = hasPermission("records:write")
  const [apt, setApt] = useState<Appointment | null>(null)
  const [chargeValue, setChargeValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [whatsappOpen, setWhatsappOpen] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const reminderInFlight = useRef(false)

  const load = () => {
    if (!appointmentId) return
    api.appointments.getById(appointmentId).then((data) => {
      setApt(data)
      setChargeValue(String(data.totalAmount ?? 0))
    })
  }

  useEffect(() => {
    load()
  }, [appointmentId])

  if (!appointmentId) return null

  const initials = apt?.patient?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2) ?? "—"

  const handleStatus = async (status: Appointment["status"]) => {
    if (!apt) return
    setLoading(true)
    try {
      await api.appointments.update(apt.id, { status })
      toast("Status atualizado")
      load()
      onUpdated()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Erro", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleCharge = async () => {
    if (!apt) return
    try {
      await api.appointments.charge(apt.id, Number(chargeValue))
      toast("Cobrança gerada")
      load()
      onUpdated()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Erro", "error")
    }
  }

  const handleReceipt = async () => {
    if (!apt) return
    try {
      await api.appointments.receipt(apt.id)
      toast("Recebimento lançado")
      load()
      onUpdated()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Erro", "error")
    }
  }

  const patientWhatsappPhone = () => {
    const w = apt?.patient?.whatsapp?.replace(/\D/g, "")
    const p = apt?.patient?.phone?.replace(/\D/g, "")
    return w || p || ""
  }

  const handleReminder = async () => {
    if (!apt || reminderInFlight.current) return
    if (!patientWhatsappPhone()) {
      toast("Cadastre o WhatsApp ou telefone do paciente", "error")
      return
    }
    reminderInFlight.current = true
    setSendingReminder(true)
    try {
      await api.appointments.reminder(apt.id)
      toast("Lembrete enviado no WhatsApp do paciente!")
      load()
      onUpdated()
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao enviar lembrete"), "error")
    } finally {
      setSendingReminder(false)
      reminderInFlight.current = false
    }
  }

  const handleDelete = async () => {
    if (!apt) return
    const ok = await confirm({
      title: "Excluir agendamento",
      message: "Excluir este agendamento?",
      confirmLabel: "Excluir",
      variant: "danger",
    })
    if (!ok) return
    try {
      await api.appointments.remove(apt.id)
      toast("Agendamento removido")
      onUpdated()
      onClose()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Erro", "error")
    }
  }

  const aptDate = apt?.date ? new Date(apt.date) : new Date()

  return (
    <>
    <Drawer
      open={!!appointmentId}
      onClose={onClose}
      title="Detalhes do agendamento"
      width="lg"
      footer={
        apt && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 rounded-lg border border-border text-text-secondary hover:text-danger"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <Button variant="secondary" className="flex-1 gap-2" onClick={handleReceipt}>
                <DollarSign className="w-4 h-4" />
                Lançar recebimento
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Editar agendamento
              </Button>
              {apt.patientId && canStartClinical && (
                <Button
                  className="flex-1"
                  onClick={() => {
                    api.appointments.update(apt.id, { status: "IN_PROGRESS" }).then(() => {
                      navigate(`/atendimento/${apt.id}`)
                    })
                  }}
                >
                  Iniciar atendimento
                </Button>
              )}
            </div>
          </div>
        )
      }
    >
      {!apt ? (
        <p className="text-sm text-text-secondary">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {apt.type === "BLOCK" ? (
            <p className="text-sm font-medium text-text">Horário bloqueado</p>
          ) : (
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-full bg-border flex items-center justify-center text-lg font-bold text-text-secondary">
                {initials}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-primary">{apt.patient?.name}</p>
                <p className="text-sm text-text-secondary">
                  {apt.patient?.whatsapp || apt.patient?.phone || "Sem telefone"}
                </p>
                <div className="mt-2 flex flex-col items-start gap-1">
                  <button
                    type="button"
                    onClick={handleReminder}
                    disabled={sendingReminder || !patientWhatsappPhone()}
                    className="text-xs font-medium text-success flex items-center gap-1 hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {sendingReminder ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                    {sendingReminder ? "Enviando..." : "ENVIAR LEMBRETE DE CONSULTA"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsappOpen(true)}
                    className="text-[10px] text-text-secondary hover:text-primary hover:underline"
                  >
                    Editar mensagem antes de enviar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate("/configuracoes/whatsapp?tab=templates")
                    }}
                    className="text-[10px] text-text-secondary hover:text-primary hover:underline"
                  >
                    Gerenciar templates
                  </button>
                </div>
                {apt.reminderSentAt && (
                  <p className="text-[10px] text-text-secondary mt-1">
                    Lembrete enviado em{" "}
                    {format(new Date(apt.reminderSentAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="text-sm text-text">
            {format(aptDate, "EEEE, d 'de' MMMM", { locale: ptBR })} — {apt.startTime ?? apt.time} às{" "}
            {apt.endTime}
          </p>

          <div>
            <label className="text-xs font-medium text-text-secondary">Status</label>
            <select
              className="mt-1 w-full h-10 rounded-lg border border-border px-3 text-sm"
              value={apt.status}
              disabled={loading}
              onChange={(e) => handleStatus(e.target.value as Appointment["status"])}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm">
            <span className="text-text-secondary">Convênio:</span>{" "}
            <strong>{apt.insurancePlan ?? "Particular"}</strong>
          </p>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase">Cobrar agendamento</p>
            <div className="flex gap-2 items-center">
              <span className="text-sm">Valor</span>
              <input
                type="number"
                className="flex-1 h-10 rounded-lg border border-border px-3 text-sm"
                value={chargeValue}
                onChange={(e) => setChargeValue(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleCharge}
              className="text-sm text-primary font-medium flex items-center gap-1"
            >
              <DollarSign className="w-4 h-4" /> Gerar cobrança
            </button>
            <p className="text-xs text-text-secondary">
              Status cobrança: {apt.billingStatus ?? "PENDING"}
            </p>
          </div>

          {apt.procedures && apt.procedures.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border">
                  <th className="py-2">Procedimento</th>
                  <th className="py-2">Quant.</th>
                  <th className="py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {apt.procedures.map((line) => (
                  <tr key={line.id ?? line.procedureId} className="border-b border-border">
                    <td className="py-2">{line.name}</td>
                    <td className="py-2">{line.quantity}</td>
                    <td className="py-2 text-right">
                      R$ {(line.subtotal ?? line.quantity * line.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} className="py-2 font-semibold">
                    Total
                  </td>
                  <td className="py-2 text-right font-bold text-primary">
                    R$ {(apt.totalAmount ?? 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          <Badge status={apt.status.toLowerCase() as "scheduled"} />
        </div>
      )}
    </Drawer>
    {apt && (
      <WhatsappSendDrawer
        open={whatsappOpen}
        onClose={() => setWhatsappOpen(false)}
        appointment={apt}
        onSent={load}
      />
    )}
    <ConfirmDialog />
    </>
  )
}
