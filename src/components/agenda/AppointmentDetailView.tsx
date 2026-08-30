import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Trash2, Calendar, Clock, Stethoscope, Building2, ChevronLeft, CheckCircle, Copy } from "lucide-react"
import { api, type ClinmaxPayCharge } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useAuth } from "@/context/AuthContext"
import { useConfirm } from "@/hooks/useConfirm"
import type { Appointment } from "@/types"
import { Button } from "@/components/ui/button"

const statusOptions = [
  { value: "SCHEDULED", label: "Agendado" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "IN_PROGRESS", label: "Em atendimento", clinical: true },
  { value: "COMPLETED", label: "Atendido", clinical: true },
  { value: "NO_SHOW", label: "Faltou" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "RESCHEDULED", label: "Remarcado" },
] as const

interface Props {
  appointmentId: string
  onBack: () => void
  onUpdated: () => void
  onEdit?: () => void
}

export default function AppointmentDetailView({ appointmentId, onBack, onUpdated, onEdit }: Props) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const { hasPermission } = useAuth()
  const canStartClinical = hasPermission("records:write")
  const canOpenRecord = hasPermission("records:view")
  const canManageAgenda = hasPermission("agenda:manage")
  const canCharge = hasPermission("finance:operational") || hasPermission("finance:manage")
  const [apt, setApt] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(false)
  const [pay, setPay] = useState<ClinmaxPayCharge | null>(null)
  const [chargeBusy, setChargeBusy] = useState(false)

  const reload = (id: string) =>
    Promise.all([
      api.appointments.getById(id),
      api.appointments.getPay(id).catch(() => ({ pay: null })),
    ]).then(([data, payRes]) => {
      setApt(data)
      setPay(payRes.pay)
    })

  useEffect(() => {
    if (!appointmentId) return
    setLoading(true)
    reload(appointmentId)
      .catch((err: unknown) => {
        toast(toastMessageFromApiError(err, "Erro ao carregar agendamento"), "error")
      })
      .finally(() => setLoading(false))
  }, [appointmentId])

  const initials = apt?.patient?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2) ?? "-"

  const aptDate = apt?.date ? new Date(apt.date) : new Date()

  return (
    <div className="flex flex-col">
      <div className="flex-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[13px] font-medium text-[#2563EB] mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar para a agenda
        </button>

        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-[24px] leading-[32px] font-bold text-[#0F172A]">Detalhes do agendamento</h2>
            <p className="text-[13px] leading-[18px] text-[#64748B] mt-1">Visualize e gerencie as informações do agendamento.</p>
          </div>
          <span className="inline-flex items-center h-[26px] px-3 rounded-full border border-[#93C5FD] bg-[#EFF6FF] text-[12px] font-medium text-[#2563EB]">
            {apt ? statusOptions.find((s) => s.value === apt.status)?.label || "Agendado" : "..."}
          </span>
        </div>

        {!apt || loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-[#64748B]">Carregando...</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#E2E8F0] flex items-center justify-center text-base font-bold text-[#64748B]">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0EA5E9] uppercase tracking-wide">{apt.patient?.name}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{apt.patient?.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-0 mt-5 pt-4 border-t border-[#E2E8F0]">
                <div className="px-4">
                  <div className="flex items-center gap-2 text-[#334155] mb-1">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-medium text-[#64748B] mb-1">Data</div>
                  <div className="text-xs font-medium text-[#334155] capitalize">
                    {format(aptDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                </div>
                <div className="px-4 border-l border-[#E2E8F0]">
                  <div className="flex items-center gap-2 text-[#334155] mb-1">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-medium text-[#64748B] mb-1">Horário</div>
                  <div className="text-xs font-medium text-[#334155]">
                    {apt.startTime ?? apt.time} às {apt.endTime}
                  </div>
                </div>
                <div className="px-4 border-l border-[#E2E8F0]">
                  <div className="flex items-center gap-2 text-[#334155] mb-1">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-medium text-[#64748B] mb-1">Tipo</div>
                  <div className="text-xs font-medium text-[#334155]">Consulta</div>
                </div>
                <div className="px-4 border-l border-[#E2E8F0]">
                  <div className="flex items-center gap-2 text-[#334155] mb-1">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-medium text-[#64748B] mb-1">Convênio</div>
                  <div className="text-xs font-medium text-[#334155]">{apt.insurancePlan ?? "Particular"}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 min-h-[290px]">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Informações do agendamento</h3>

                <div className="mb-3.5">
                  <div className="text-[10px] font-medium text-[#64748B] mb-1.5 uppercase tracking-wide">Status</div>
                  <select
                    className="w-full h-10 border border-[#DCE3EC] rounded-lg px-3 bg-white text-sm text-[#334155] focus:outline-none focus:border-[#38BDF8] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.10)]"
                    value={apt.status}
                    onChange={() => void 0}
                    disabled={!canManageAgenda}
                  >
                    {statusOptions
                      .filter((s) => !("clinical" in s && s.clinical) || canStartClinical)
                      .map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="mt-3.5">
                  <div className="text-[10px] text-[#64748B] mb-1 uppercase tracking-wide">Convênio</div>
                  <div className="text-xs font-medium text-[#334155]">{apt.insurancePlan ?? "Particular"}</div>
                </div>

                <div className="mt-3.5">
                  <div className="text-[10px] text-[#64748B] mb-1 uppercase tracking-wide">Profissional</div>
                  <div className="text-xs font-medium text-[#334155]">{apt.doctor.name}</div>
                </div>

                <div className="mt-3.5">
                  <div className="text-[10px] text-[#64748B] mb-1 uppercase tracking-wide">Local de atendimento</div>
                  <div className="text-xs font-medium text-[#334155]">Clínica Principal - Unidade Centro</div>
                </div>

                <div className="mt-3.5">
                  <div className="text-[10px] text-[#64748B] mb-1 uppercase tracking-wide">Observações</div>
                  <div className="w-full min-h-[78px] p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#64748B]">
                    {apt.notes || "Nenhuma observação informada."}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 min-h-[290px]">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-5">Histórico do agendamento</h3>

                <div className="space-y-1.5">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#0EA5E9] shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#334155]">Agendamento criado</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{format(new Date(apt.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">por Administrador</p>
                    </div>
                  </div>
                  <div className="ml-4 w-px h-9 border-l border-dashed border-[#CBD5E1]" />
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#10B981] shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#334155]">Agendamento confirmado</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{format(new Date(apt.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">por Administrador</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {apt.type !== "BLOCK" && (
              <div className="mt-4 bg-white border border-[#E2E8F0] rounded-[12px] p-4">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Cobrança da consulta</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
                  <div>
                    <div className="text-[#64748B] mb-1">Valor</div>
                    <div className="font-medium text-[#334155]">
                      {(apt.totalAmount ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#64748B] mb-1">Status</div>
                    <div className="font-medium text-[#334155]">
                      {apt.billingStatus === "RECEIVED"
                        ? "Recebido"
                        : apt.billingStatus === "CHARGED"
                          ? "Aguardando pagamento"
                          : pay?.status === "REFUNDED"
                            ? "Estornado"
                            : pay?.status === "CONFIRMED"
                              ? "Pagamento confirmado"
                              : pay?.status === "RECEIVED"
                                ? "Pagamento confirmado"
                                : "Pendente"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#64748B] mb-1">Forma</div>
                    <div className="font-medium text-[#334155]">
                      {pay?.pixPayload ? "Pix ClinMax Pay" : apt.billingStatus === "RECEIVED" ? "Manual" : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#64748B] mb-1">Repasse</div>
                    <div className="font-medium text-[#334155]">{pay?.payoutStatus ?? "-"}</div>
                  </div>
                </div>
                {pay?.pixEncodedImage && pay.status !== "RECEIVED" && pay.status !== "REFUNDED" && (
                  <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start">
                    <img
                      src={`data:image/png;base64,${pay.pixEncodedImage}`}
                      alt="QR Code Pix"
                      className="w-40 h-40 border border-[#E2E8F0] rounded-lg"
                    />
                    {pay.pixPayload && (
                      <div className="flex-1">
                        <div className="text-[11px] text-[#64748B] mb-1">Pix copia e cola</div>
                        <p className="text-xs break-all bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2">{pay.pixPayload}</p>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            void navigator.clipboard.writeText(pay.pixPayload || "")
                            toast("Pix copiado.")
                          }}
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copiar Pix
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {canCharge && apt.billingStatus !== "RECEIVED" && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={chargeBusy}
                      onClick={() => {
                        setChargeBusy(true)
                        api.appointments
                          .charge(appointmentId)
                          .then((res) => {
                            setPay(res.pay)
                            toast(res.mode === "pix" ? "Cobrança Pix gerada." : "Consulta marcada como cobrada.")
                            return reload(appointmentId)
                          })
                          .catch((err: unknown) => {
                            toast(toastMessageFromApiError(err, "Erro ao cobrar consulta"), "error")
                          })
                          .finally(() => setChargeBusy(false))
                      }}
                    >
                      Cobrar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={chargeBusy}
                      onClick={() => {
                        setChargeBusy(true)
                        api.appointments
                          .receipt(appointmentId)
                          .then(() => {
                            toast("Consulta recebida e lançada no financeiro.")
                            return reload(appointmentId)
                          })
                          .catch((err: unknown) => {
                            toast(toastMessageFromApiError(err, "Erro ao receber consulta"), "error")
                          })
                          .finally(() => setChargeBusy(false))
                      }}
                    >
                      Receber manualmente
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 h-[66px] bg-white border border-[#E2E8F0] rounded-[10px] px-3.5 py-3 flex items-center justify-between">
              <button
                className="h-9 px-3 flex items-center gap-2 bg-transparent border-none text-xs font-medium text-[#EF4444] rounded-lg hover:bg-[#FEF2F2]"
                onClick={() => {
                  confirm({
                    title: "Cancelar agendamento",
                    message: "Deseja realmente cancelar este agendamento?",
                    confirmLabel: "Sim, cancelar",
                    cancelLabel: "Não, manter",
                    variant: "danger",
                  })
                    .then(async (confirmed) => {
                      if (!confirmed) return
                      try {
                        await api.appointments.update(appointmentId, { status: "CANCELLED" })
                        toast("Agendamento cancelado.")
                        onUpdated()
                        onBack()
                      } catch (err) {
                        toast(toastMessageFromApiError(err, "Erro ao cancelar agendamento"), "error")
                      }
                    })
                }}
              >
                <Trash2 className="w-4 h-4" /> Cancelar agendamento
              </button>
              <div className="flex items-center gap-2.5">
                {canManageAgenda && (
                  <button
                    type="button"
                    className="h-9 px-4 bg-white border border-[#DCE3EC] rounded-lg text-xs font-medium text-[#334155] shadow-sm hover:bg-[#F8FAFC] hover:border-[#CBD5E1]"
                    onClick={() => onEdit?.()}
                  >
                    Editar agendamento
                  </button>
                )}
                {canOpenRecord && (
                  <button
                    className="h-9 px-4 bg-white border border-[#DCE3EC] rounded-lg text-xs font-medium text-[#334155] shadow-sm hover:bg-[#F8FAFC] hover:border-[#CBD5E1]"
                    onClick={() => navigate(`/prontuario/${apt.patientId}`)}
                  >
                    Abrir prontuário
                  </button>
                )}
                {canStartClinical && (
                  <button
                    className="h-9 px-4 bg-[#0EA5E9] border border-[#0EA5E9] rounded-lg text-xs font-semibold text-white shadow-[0_2px_4px_rgba(14,165,233,0.18)] hover:bg-[#0284C7] hover:border-[#0284C7]"
                    onClick={() => navigate(`/atendimento/${apt.id}`)}
                  >
                    {apt.status === "IN_PROGRESS" ? "Continuar atendimento" : "Iniciar atendimento"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <ConfirmDialog />
    </div>
  )
}
