import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Trash2, Calendar, Clock, Stethoscope, Building2, ChevronLeft, CheckCircle } from "lucide-react"
import { Drawer } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useAuth } from "@/context/AuthContext"
import { useConfirm } from "@/hooks/useConfirm"
import WhatsappSendDrawer from "@/components/whatsapp/WhatsappSendDrawer"
import type { Appointment } from "@/types"
import type { ClinmaxPayCharge } from "@/services/api"

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
  const canOpenRecord = hasPermission("records:view")
  const canCharge = hasPermission("finance:operational") || hasPermission("finance:manage")
  const canWhatsapp = hasPermission("whatsapp:send")
  const canManageAgenda = hasPermission("agenda:manage")
  const [apt, setApt] = useState<Appointment | null>(null)
  const [chargeValue, setChargeValue] = useState("")
  const [pay, setPay] = useState<ClinmaxPayCharge | null>(null)
  const [loading, setLoading] = useState(false)
  const [whatsappOpen, setWhatsappOpen] = useState(false)
  const reminderInFlight = useRef(false)

  const load = () => {
    if (!appointmentId) return
    api.appointments
      .getById(appointmentId)
      .then((data) => {
        setApt(data)
        setChargeValue(String(data.totalAmount ?? 0))
      })
      .catch((err: unknown) => {
        toast(toastMessageFromApiError(err, "Erro ao carregar agendamento"), "error")
      })
  }

  useEffect(() => {
    load()
    if (!appointmentId || !canCharge) {
      setPay(null)
      return
    }
    api.appointments
      .getPay(appointmentId)
      .then((r) => setPay(r.pay))
      .catch(() => setPay(null))
  }, [appointmentId])

  if (!appointmentId) return null

  const initials = apt?.patient?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2) ?? "-"

  const aptDate = apt?.date ? new Date(apt.date) : new Date()

  return (
    <>
      <Drawer
        open={!!appointmentId}
        onClose={onClose}
        title=""
        width="full"
      >
        {!apt ? (
          <p className="text-sm text-[#64748B]">Carregando...</p>
        ) : (
          <div className="bg-[#F8FAFC] min-h-full">
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-[12px] font-medium text-[#2563EB] mb-[14px]"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar para a agenda
            </button>

            <div className="flex justify-between items-start mb-[18px]">
              <div>
                <h2 className="text-[24px] leading-[32px] font-bold text-[#0F172A]">Detalhes do agendamento</h2>
                <p className="text-[12px] leading-[18px] text-[#64748B] mt-1">Visualize e gerencie as informações do agendamento.</p>
              </div>
              <span className="inline-flex items-center h-[24px] px-[10px] rounded-full border border-[#93C5FD] bg-[#EFF6FF] text-[11px] font-medium text-[#2563EB]">
                {statusOptions.find((s) => s.value === apt.status)?.label || "Agendado"}
              </span>
            </div>

            {/* Resumo Paciente */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-[14px]">
                <div className="w-[48px] h-[48px] rounded-full bg-[#E2E8F0] flex items-center justify-center text-[16px] font-bold text-[#64748B]">
                  {initials}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#0EA5E9] uppercase">{apt.patient?.name}</p>
                  <p className="text-[12px] text-[#64748B] mt-[3px]">{apt.patient?.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-0 mt-[22px] pt-[18px] border-t border-[#E2E8F0]">
                <div className="px-[20px]">
                  <div className="flex items-center gap-2 text-[#334155] mb-[4px]">
                    <Calendar className="w-[20px] h-[20px]" />
                  </div>
                  <div className="text-[11px] font-medium text-[#64748B] mb-[4px]">Data</div>
                  <div className="text-[12px] font-medium text-[#334155]">{format(aptDate, "dd/MM/yyyy", { locale: ptBR })}</div>
                </div>
                <div className="px-[20px] border-l border-[#E2E8F0]">
                  <div className="flex items-center gap-2 text-[#334155] mb-[4px]">
                    <Clock className="w-[20px] h-[20px]" />
                  </div>
                  <div className="text-[11px] font-medium text-[#64748B] mb-[4px]">Horário</div>
                  <div className="text-[12px] font-medium text-[#334155]">{apt.startTime ?? apt.time} - {apt.endTime}</div>
                </div>
                <div className="px-[20px] border-l border-[#E2E8F0]">
                  <div className="flex items-center gap-2 text-[#334155] mb-[4px]">
                    <Stethoscope className="w-[20px] h-[20px]" />
                  </div>
                  <div className="text-[11px] font-medium text-[#64748B] mb-[4px]">Tipo</div>
                  <div className="text-[12px] font-medium text-[#334155]">Consulta</div>
                </div>
                <div className="px-[20px] border-l border-[#E2E8F0]">
                  <div className="flex items-center gap-2 text-[#334155] mb-[4px]">
                    <Building2 className="w-[20px] h-[20px]" />
                  </div>
                  <div className="text-[11px] font-medium text-[#64748B] mb-[4px]">Convênio</div>
                  <div className="text-[12px] font-medium text-[#334155]">{apt.insurancePlan ?? "Particular"}</div>
                </div>
              </div>
            </div>

            {/* Grid Detalhes */}
            <div className="grid grid-cols-[1fr_1fr] gap-[16px] mt-[16px]">
              <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-[18px] min-h-[290px]">
                <h3 className="text-[14px] font-semibold text-[#0F172A] mb-[16px]">Informações do agendamento</h3>
                
                <div className="mb-[14px]">
                  <div className="text-[10px] font-medium text-[#64748B] mb-[6px]">STATUS</div>
                  <select
                    className="w-full h-[40px] border border-[#DCE3EC] rounded-[7px] px-[12px] bg-white text-[12px] text-[#334155] focus:outline-none focus:border-[#38BDF8] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.10)]"
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

                <div className="mt-[14px]">
                  <div className="text-[10px] text-[#64748B] mb-[4px]">Convênio</div>
                  <div className="text-[12px] font-medium text-[#334155]">{apt.insurancePlan ?? "Particular"}</div>
                </div>
                
                <div className="mt-[14px]">
                  <div className="text-[10px] text-[#64748B] mb-[4px]">Profissional</div>
                  <div className="text-[12px] font-medium text-[#334155]">{apt.doctor.name}</div>
                </div>
                
                <div className="mt-[14px]">
                  <div className="text-[10px] text-[#64748B] mb-[4px]">Local de atendimento</div>
                  <div className="text-[12px] font-medium text-[#334155]">Clínica Principal - Unidade Centro</div>
                </div>

                <div className="mt-[14px]">
                  <div className="text-[10px] text-[#64748B] mb-[4px]">Observações</div>
                  <div className="w-full min-h-[78px] p-[10px_12px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[7px] text-[11px] text-[#64748B]">
                    {apt.notes || "Nenhuma observação informada."}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-[18px] min-h-[290px]">
                <h3 className="text-[14px] font-semibold text-[#0F172A] mb-[20px]">Histórico do agendamento</h3>
                
                <div className="space-y-[6px]">
                  <div className="flex items-start gap-4">
                    <div className="w-[30px] h-[30px] rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#0EA5E9]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-[#334155]">Agendamento criado</p>
                      <p className="text-[10px] text-[#64748B] mt-[3px]">{format(new Date(apt.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                      <p className="text-[10px] text-[#64748B] mt-[2px]">por Administrador</p>
                    </div>
                  </div>
                  <div className="ml-[14px] w-[1px] h-[36px] border-l border-dashed border-[#CBD5E1]" />
                  <div className="flex items-start gap-4">
                    <div className="w-[30px] h-[30px] rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#10B981]">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-[#334155]">Agendamento confirmado</p>
                      <p className="text-[10px] text-[#64748B] mt-[3px]">{format(new Date(apt.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                      <p className="text-[10px] text-[#64748B] mt-[2px]">por Administrador</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de Ações */}
            <div className="mt-[16px] h-[66px] bg-white border border-[#E2E8F0] rounded-[10px] p-[12px_14px] flex items-center justify-between">
              <button className="h-[36px] px-[12px] flex items-center gap-[7px] bg-transparent border-none text-[11px] font-medium text-[#EF4444] rounded-[7px] hover:bg-[#FEF2F2]">
                <Trash2 className="w-4 h-4" /> Cancelar agendamento
              </button>
              <div className="flex items-center gap-[10px]">
                {canManageAgenda && (
                  <button className="h-[36px] px-[16px] bg-white border border-[#DCE3EC] rounded-[7px] text-[11px] font-medium text-[#334155] shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]">
                    Editar agendamento
                  </button>
                )}
                {canOpenRecord && apt.patientId && (
                  <button
                    type="button"
                    className="h-[36px] px-[16px] bg-white border border-[#DCE3EC] rounded-[7px] text-[11px] font-medium text-[#334155] shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]"
                    onClick={() => navigate(`/prontuario/${apt.patientId}`)}
                  >
                    Abrir prontuário
                  </button>
                )}
                {canStartClinical && (
                  <button
                    type="button"
                    className="h-[36px] px-[18px] bg-[#0EA5E9] border border-[#0EA5E9] rounded-[7px] text-[11px] font-semibold text-white shadow-[0_2px_4px_rgba(14,165,233,0.18)] hover:bg-[#0284C7] hover:border-[#0284C7]"
                    onClick={() => navigate(`/atendimento/${apt.id}`)}
                  >
                    {apt.status === "IN_PROGRESS" ? "Continuar atendimento" : "Iniciar atendimento"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
      <ConfirmDialog />
    </>
  )
}
