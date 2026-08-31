import { useEffect, useState, useRef } from "react"
import { Plus, User, Building2, Clock, UserPlus, MessageCircle, Stethoscope } from "lucide-react"
import { format } from "date-fns"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { api, ApiError } from "@/services/api"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"
import { isResolvableEntityId } from "@/lib/route-ids"
import {
  getAgendaNotifyPatient,
  setAgendaNotifyPatient,
} from "@/lib/agenda-preferences"
import {
  cpfDigits,
  formatCPFInput,
  phoneDigits,
  sanitizePersonName,
  validateBirthDate,
  validateCPF,
  validateEmailOptional,
  validateName,
  validatePhone,
  validatePhoneOptional,
} from "@/lib/form-validation"
import {
  addMinutesToTime,
  DEFAULT_AGENDA_SCHEDULE,
  generateScheduleTimeOptions,
  timeToMinutes,
  validateAppointmentSchedule,
  type AgendaSchedule,
} from "@/lib/agenda-schedule"
import { DateTimePicker } from "@/components/ui/date-picker"
import type { CreateAppointmentInput, Doctor, Patient, Procedure } from "@/types"

type ProcedureLine = { procedureId: string; quantity: number; unitPrice: number }

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  /** Quando informado, o modal edita o agendamento existente. */
  appointmentId?: string | null
  defaultDate?: Date
  defaultStart?: string
  initialPatientId?: string
  initialDoctorId?: string
  waitingListEntryId?: string
  schedule?: AgendaSchedule
}

const recurrenceOptions = [
  { value: "NONE", label: "Não se repete" },
  { value: "DAILY", label: "Repetir todo dia" },
  { value: "WEEKLY", label: "Repetir toda semana" },
  { value: "BIWEEKLY", label: "Repetir a cada 15 dias" },
  { value: "MONTHLY", label: "Repetir todo mês" },
  { value: "YEARLY", label: "Repetir todo ano" },
] as const

const insuranceOptions = ["Particular", "Unimed", "Bradesco Saúde", "SulAmérica"]

function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d ? `(${d}` : ""
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

const fieldClass =
  "w-full h-10 rounded-[4px] border border-[#D5DEE7] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94A3B8]"
const labelClass = "mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#64748B]"
const linkClass = "inline-flex items-center gap-1 text-[13px] font-medium text-[#2563EB] hover:underline"

export default function AppointmentFormModal({
  open,
  onClose,
  onSaved,
  appointmentId = null,
  defaultDate,
  defaultStart,
  initialPatientId,
  initialDoctorId,
  waitingListEntryId,
  schedule = DEFAULT_AGENDA_SCHEDULE,
}: Props) {
  const { toast } = useToast()
  const { user, hasPermission } = useAuth()
  const isEditing = Boolean(appointmentId)
  const canNotifyWhatsapp = hasPermission("whatsapp:send")
  const doctorLocked = user?.role === "DOCTOR"
  const [type, setType] = useState<"SCHEDULE" | "BLOCK">("SCHEDULE")
  const [doctorId, setDoctorId] = useState("")
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [catalog, setCatalog] = useState<Procedure[]>([])
  const [lines, setLines] = useState<ProcedureLine[]>([])

  const [patientSearch, setPatientSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [showResults, setShowResults] = useState(false)
  const [patientId, setPatientId] = useState("")

  const [phone, setPhone] = useState("")
  const [phoneHome, setPhoneHome] = useState("")
  const [email, setEmail] = useState("")
  const [insurancePlan, setInsurancePlan] = useState("")

  const [date, setDate] = useState(format(defaultDate ?? new Date(), "yyyy-MM-dd"))
  const [startTime, setStartTime] = useState(defaultStart ?? schedule.agendaStartTime)
  const [endTime, setEndTime] = useState(
    defaultStart
      ? addMinutesToTime(defaultStart, schedule.slotIntervalMinutes)
      : addMinutesToTime(schedule.agendaStartTime, schedule.slotIntervalMinutes)
  )
  const [patientFieldError, setPatientFieldError] = useState(false)
  const [recurrence, setRecurrence] = useState<CreateAppointmentInput["recurrence"]>("NONE")
  const [notes, setNotes] = useState("")
  const [notifyPatient, setNotifyPatient] = useState(() => getAgendaNotifyPatient())
  const [originalSchedule, setOriginalSchedule] = useState<{
    doctorId: string
    date: string
    startTime: string
    endTime: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [registeringPatient, setRegisteringPatient] = useState(false)
  const [birthDate, setBirthDate] = useState("")
  const [cpf, setCpf] = useState("")
  const [gender, setGender] = useState<"M" | "F" | "O">("M")
  const [whatsapp, setWhatsapp] = useState("")
  const [address, setAddress] = useState("")
  const [insuranceCard, setInsuranceCard] = useState("")
  const [patientNotes, setPatientNotes] = useState("")
  const [existingMatch, setExistingMatch] = useState<ApiError["existing"] | null>(null)
  const [duplicateKind, setDuplicateKind] = useState<"block" | "warn" | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const resetCreateDefaults = () => {
    setType("SCHEDULE")
    setDate(format(defaultDate ?? new Date(), "yyyy-MM-dd"))
    if (defaultStart) {
      setStartTime(defaultStart)
      setEndTime(addMinutesToTime(defaultStart, schedule.slotIntervalMinutes))
    } else {
      setStartTime(schedule.agendaStartTime)
      setEndTime(addMinutesToTime(schedule.agendaStartTime, schedule.slotIntervalMinutes))
    }
    setNotes("")
    setRecurrence("NONE")
    setNotifyPatient(getAgendaNotifyPatient())
    setOriginalSchedule(null)
    setRegisteringPatient(false)
    setBirthDate("")
    setCpf("")
    setGender("M")
    setWhatsapp("")
    setAddress("")
    setInsuranceCard("")
    setPatientNotes("")
    setExistingMatch(null)
    setShowResults(false)
    setError("")
    setPatientFieldError(false)
  }

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const loadDoctorsAndCatalog = async () => {
      const [docs, procs] = await Promise.all([api.doctors.list(), api.procedures.list()])
      if (cancelled) return
      setDoctors(docs)
      setCatalog(procs)

      if (appointmentId) {
        try {
          const apt = await api.appointments.getById(appointmentId)
          if (cancelled) return
          const aptDate = format(new Date(apt.date), "yyyy-MM-dd")
          const aptStart = apt.startTime ?? apt.time
          const aptEnd =
            apt.endTime ?? addMinutesToTime(aptStart, schedule.slotIntervalMinutes)
          setType(apt.type === "BLOCK" ? "BLOCK" : "SCHEDULE")
          setDoctorId(apt.doctorId)
          setDate(aptDate)
          setStartTime(aptStart)
          setEndTime(aptEnd)
          setInsurancePlan(apt.insurancePlan ?? "Particular")
          setNotes(apt.notes ?? "")
          setRecurrence("NONE")
          setNotifyPatient(getAgendaNotifyPatient())
          setOriginalSchedule({
            doctorId: apt.doctorId,
            date: aptDate,
            startTime: aptStart,
            endTime: aptEnd,
          })
          if (apt.patient) {
            setPatientId(apt.patientId ?? apt.patient.id)
            setPatientSearch(apt.patient.name)
            setPhone(maskPhone(apt.patient.phone ?? ""))
            setPhoneHome(apt.patient.phoneHome ? maskPhone(apt.patient.phoneHome) : "")
            setEmail(apt.patient.email ?? "")
          } else {
            setPatientId("")
            setPatientSearch("")
            setPhone("")
            setPhoneHome("")
            setEmail("")
          }
          if (apt.procedures?.length) {
            setLines(
              apt.procedures.map((p) => ({
                procedureId: p.procedureId,
                quantity: p.quantity,
                unitPrice: Number(p.unitPrice),
              }))
            )
          } else if (procs.length) {
            setLines([
              {
                procedureId: procs.find((p) => p.name === "Retorno")?.id ?? procs[0].id,
                quantity: 1,
                unitPrice: Number(
                  procs.find((p) => p.name === "Retorno")?.defaultPrice ?? procs[0].defaultPrice
                ),
              },
            ])
          } else {
            setLines([])
          }
        } catch (err: unknown) {
          if (!cancelled) {
            setError(toastMessageFromApiError(err, "Erro ao carregar agendamento"))
          }
        }
        return
      }

      resetCreateDefaults()
      if (initialDoctorId) setDoctorId(initialDoctorId)
      else if (user?.role === "DOCTOR" && user.doctorId) setDoctorId(user.doctorId)
      else if (docs[0]) setDoctorId(docs[0].id)

      if (isResolvableEntityId(initialPatientId)) {
        setPatientId(initialPatientId)
        api.patients.getById(initialPatientId).then((p) => {
          if (cancelled) return
          setPatientSearch(p.name)
          setPhone(maskPhone(p.phone))
          setPhoneHome(p.phoneHome ? maskPhone(p.phoneHome) : "")
          setEmail(p.email ?? "")
          setInsurancePlan(p.insurancePlan ?? "")
        })
      } else {
        setPatientId("")
        setPatientSearch("")
        setPhone("")
        setPhoneHome("")
        setEmail("")
        setInsurancePlan("")
      }

      if (procs.length) {
        setLines([
          {
            procedureId: procs.find((p) => p.name === "Retorno")?.id ?? procs[0].id,
            quantity: 1,
            unitPrice: Number(
              procs.find((p) => p.name === "Retorno")?.defaultPrice ?? procs[0].defaultPrice
            ),
          },
        ])
      } else {
        setLines([])
      }
    }

    void loadDoctorsAndCatalog().catch((err: unknown) => {
      if (!cancelled) {
        toast(toastMessageFromApiError(err, "Erro ao carregar formulário"), "error")
      }
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset tied to modal open payload
  }, [open, appointmentId, defaultDate, defaultStart, initialPatientId, initialDoctorId, schedule.slotIntervalMinutes, user?.role, user?.doctorId])

  useEffect(() => {
    if (registeringPatient) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    if (patientSearch.length < 3) {
      setSearchResults([])
      return
    }
    const t = setTimeout(() => {
      api.patients.list({ search: patientSearch }).then((r) => {
        setSearchResults(r.data)
        setShowResults(true)
      })
    }, 300)
    return () => clearTimeout(t)
  }, [patientSearch, registeringPatient])

  const selectPatient = (p: Patient) => {
    setPatientId(p.id)
    setPatientSearch(p.name)
    setPhone(maskPhone(p.phone))
    setPhoneHome(p.phoneHome ? maskPhone(p.phoneHome) : "")
    setEmail(p.email ?? "")
    setInsurancePlan(p.insurancePlan ?? "")
    setShowResults(false)
    setRegisteringPatient(false)
    setExistingMatch(null)
  }

  const enterRegister = () => {
    setRegisteringPatient(true)
    setShowResults(false)
    setSearchResults([])
    setPatientId("")
    setPatientFieldError(false)
    setExistingMatch(null)
    setError("")
  }

  const exitRegister = () => {
    setRegisteringPatient(false)
    setBirthDate("")
    setCpf("")
    setWhatsapp("")
    setAddress("")
    setInsuranceCard("")
    setPatientNotes("")
    setExistingMatch(null)
    setError("")
  }

  const handleSavePatient = async (force = false) => {
    setError("")
    const nameVal = validateName(patientSearch)
    const birthVal = validateBirthDate(birthDate)
    const cpfVal = cpf.trim() ? validateCPF(cpf) : { ok: true, msg: "" }
    const phoneVal = phone.trim() ? validatePhone(phone) : { ok: true, msg: "" }
    const emailVal = validateEmailOptional(email)
    const whatsappVal = validatePhoneOptional(whatsapp)
    const phoneHomeVal = validatePhoneOptional(phoneHome)
    const hasContact = phoneDigits(phone).length >= 10 || cpfDigits(cpf).length === 11
    if (!nameVal.ok) {
      setError(nameVal.msg || "Informe o nome completo")
      setPatientFieldError(true)
      return
    }
    if (!birthVal.ok) {
      setError(birthVal.msg)
      return
    }
    if (!hasContact) {
      setError("Informe telefone ou CPF para cadastrar o paciente")
      return
    }
    if (!cpfVal.ok || !phoneVal.ok || !emailVal.ok || !whatsappVal.ok || !phoneHomeVal.ok) {
      setError(cpfVal.msg || phoneVal.msg || emailVal.msg || whatsappVal.msg || phoneHomeVal.msg)
      return
    }

    setLoading(true)
    setExistingMatch(null)
    try {
      const created = await api.patients.create({
        name: patientSearch.trim(),
        cpf: cpf.trim() ? cpfDigits(cpf) : "",
        birthDate,
        gender,
        phone: phone.trim() ? phoneDigits(phone) : "",
        phoneHome: phoneHome.trim() ? phoneDigits(phoneHome) : "",
        whatsapp: whatsapp.trim() ? phoneDigits(whatsapp) : "",
        email: email.trim(),
        address,
        insurancePlan: insurancePlan || "Particular",
        insuranceCard,
        notes: patientNotes,
        active: true,
        force,
      })
      toast("Paciente cadastrado com sucesso!")
      selectPatient(created as Patient)
    } catch (e: unknown) {
      if (e instanceof ApiError && e.existing) {
        setExistingMatch(e.existing)
        setDuplicateKind(e.code === "PATIENT_POSSIBLE_DUPLICATE" ? "warn" : "block")
        setError(e.message)
      } else {
        setError(toastMessageFromApiError(e, "Erro ao cadastrar paciente"))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNextFreeSlot = async () => {
    if (!doctorId) return
    try {
      const slot = await api.appointments.nextSlot(doctorId, date)
      setStartTime(slot.startTime)
      setEndTime(slot.endTime)
    } catch {
      setError("Nao foi possivel buscar proximo horario")
    }
  }

  const addLine = () => {
    const proc = catalog[0]
    if (!proc) return
    setLines((l) => [
      ...l,
      { procedureId: proc.id, quantity: 1, unitPrice: Number(proc.defaultPrice) },
    ])
  }

  const handleSave = async () => {
    setError("")
    setPatientFieldError(false)
    if (!doctorId) {
      setError("Profissional nao configurado")
      return
    }
    if (type === "SCHEDULE") {
      if (!patientId) {
        setError("Busque e selecione um paciente, ou cadastre um novo neste fluxo")
        setPatientFieldError(true)
        return
      }
      if (!insurancePlan) {
        setError("Selecione o convenio")
        return
      }
    }

    const scheduleError = validateAppointmentSchedule(startTime, endTime, schedule, type)
    if (scheduleError) {
      setError(scheduleError)
      return
    }

    setLoading(true)
    try {
      const scheduleChanged =
        isEditing &&
        originalSchedule &&
        (originalSchedule.doctorId !== doctorId ||
          originalSchedule.date !== date ||
          originalSchedule.startTime !== startTime ||
          originalSchedule.endTime !== endTime)

      const payload: CreateAppointmentInput = {
        type,
        patientId: type === "BLOCK" ? null : patientId,
        doctorId,
        date,
        startTime,
        endTime,
        insurancePlan: insurancePlan || "Particular",
        notes,
        generatePaymentLink: false,
        procedures: type === "SCHEDULE" ? lines : [],
        ...(isEditing
          ? scheduleChanged
            ? { status: "RESCHEDULED" as const }
            : {}
          : {
              recurrence,
              ...(waitingListEntryId ? { waitingListEntryId } : {}),
            }),
      }

      const saved = isEditing && appointmentId
        ? await api.appointments.update(appointmentId, payload)
        : await api.appointments.create(payload)

      setAgendaNotifyPatient(notifyPatient)

      if (
        notifyPatient &&
        canNotifyWhatsapp &&
        type === "SCHEDULE" &&
        (isEditing ? scheduleChanged : true) &&
        saved?.id
      ) {
        try {
          await api.appointments.reminder(saved.id, {
            purpose: isEditing ? "reschedule" : "reminder",
          })
        } catch (notifyErr: unknown) {
          toast(
            toastMessageFromApiError(
              notifyErr,
              "Agendamento salvo, mas nao foi possivel avisar o paciente no WhatsApp"
            ),
            "error"
          )
        }
      }

      onSaved()
      onClose()
    } catch (e: unknown) {
      setError(toastMessageFromApiError(e, "Erro ao salvar"))
    } finally {
      setLoading(false)
    }
  }

  const startTimes = generateScheduleTimeOptions(schedule, type === "SCHEDULE")
  const endTimes = generateScheduleTimeOptions(schedule, false).filter(
    (time) => timeToMinutes(time) > timeToMinutes(startTime)
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        registeringPatient
          ? "Cadastrar paciente"
          : isEditing
            ? "Editar agendamento"
            : "Novo agendamento"
      }
      size="xl"
      footer={
        registeringPatient ? (
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={exitRegister}
              className="h-10 rounded-[6px] border-[#D5DEE7] bg-white px-4 text-sm font-medium text-[#334155]"
            >
              Voltar
            </Button>
            <Button
              onClick={() => void handleSavePatient()}
              disabled={loading}
              className="h-10 rounded-[6px] bg-[#006B4D] px-4 text-sm font-medium text-white shadow-none hover:bg-[#005A41]"
            >
              {loading ? "Salvando..." : "Salvar paciente"}
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              className="h-10 rounded-[6px] border-[#D5DEE7] bg-white px-4 text-sm font-medium text-[#334155]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="h-10 rounded-[6px] bg-[#006B4D] px-4 text-sm font-medium text-white shadow-none hover:bg-[#005A41]"
            >
              {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Salvar agendamento"}
            </Button>
          </div>
        )
      }
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {registeringPatient ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="register-patient-name">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    id="register-patient-name"
                    type="text"
                    className={`${fieldClass} pl-10 ${patientFieldError ? "border-danger ring-1 ring-danger/30" : ""}`}
                    placeholder="Nome completo"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(sanitizePersonName(e.target.value))
                      setPatientFieldError(false)
                      setExistingMatch(null)
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>CPF</label>
                  <input
                    type="text"
                    className={fieldClass}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={cpf}
                    onChange={(e) => {
                      setCpf(formatCPFInput(e.target.value))
                      setExistingMatch(null)
                    }}
                  />
                </div>
                <div>
                  <label className={labelClass}>Data de nascimento</label>
                  <input
                    type="date"
                    className={fieldClass}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Sexo</label>
                <select
                  className={fieldClass}
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "M" | "F" | "O")}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="O">Outro</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Telefone celular</label>
                  <input
                    type="text"
                    className={fieldClass}
                    placeholder="(  )     -    "
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Telefone residencial (opcional)</label>
                  <input
                    type="text"
                    className={fieldClass}
                    placeholder="(  )     -    "
                    value={phoneHome}
                    onChange={(e) => setPhoneHome(maskPhone(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>WhatsApp (opcional)</label>
                <input
                  type="text"
                  className={fieldClass}
                  placeholder="(  )     -    "
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                />
              </div>
            </div>
            <div className="flex flex-col space-y-4">
              <div>
                <label className={labelClass}>E-mail (opcional)</label>
                <input
                  type="email"
                  className={fieldClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
                />
              </div>
              <div>
                <label className={labelClass}>Endereço (opcional)</label>
                <input
                  type="text"
                  className={fieldClass}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Convênio</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <select
                    className={`${fieldClass} appearance-none pl-10`}
                    value={insurancePlan}
                    onChange={(e) => setInsurancePlan(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {insuranceOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Número da carteirinha (opcional)</label>
                <input
                  type="text"
                  className={fieldClass}
                  value={insuranceCard}
                  onChange={(e) => setInsuranceCard(e.target.value)}
                />
              </div>
              <div className="flex min-h-[120px] flex-1 flex-col">
                <label className={labelClass}>Observações (opcional)</label>
                <textarea
                  className={`${fieldClass} min-h-[120px] h-full resize-none py-2`}
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              {!isEditing && (
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-[#334155] cursor-pointer">
                    <input
                      type="radio"
                      name="apt-type"
                      checked={type === "SCHEDULE"}
                      onChange={() => setType("SCHEDULE")}
                      className="accent-[#006B4D]"
                    />
                    Agendar
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-[#334155] cursor-pointer">
                    <input
                      type="radio"
                      name="apt-type"
                      checked={type === "BLOCK"}
                      onChange={() => setType("BLOCK")}
                      className="accent-[#006B4D]"
                    />
                    Bloquear horário
                  </label>
                </div>
              )}

              <div>
                <label className={labelClass}>Profissional</label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <select
                    className={`${fieldClass} appearance-none pl-10`}
                    value={doctorId}
                    disabled={doctorLocked}
                    onChange={(e) => setDoctorId(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                        {d.specialty ? ` (${d.specialty})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {type === "SCHEDULE" && (
                <>
                  <div>
                    <label className={labelClass}>Procedimentos</label>
                    {lines.map((line, i) => (
                      <div key={i} className="mt-2 flex items-end gap-2">
                        <select
                          className={`${fieldClass} flex-1`}
                          value={line.procedureId}
                          onChange={(e) => {
                            const proc = catalog.find((p) => p.id === e.target.value)
                            setLines((arr) =>
                              arr.map((l, j) =>
                                j === i
                                  ? {
                                      ...l,
                                      procedureId: e.target.value,
                                      unitPrice: proc ? Number(proc.defaultPrice) : l.unitPrice,
                                    }
                                  : l
                              )
                            )
                          }}
                        >
                          {catalog.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <div className="w-[72px]">
                          <span className="mb-1 block text-[11px] text-[#64748B]">Quant.</span>
                          <input
                            type="number"
                            min={1}
                            className={fieldClass}
                            value={line.quantity}
                            onChange={(e) =>
                              setLines((arr) =>
                                arr.map((l, j) =>
                                  j === i ? { ...l, quantity: Number(e.target.value) } : l
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addLine} className={`${linkClass} mt-2`}>
                      <Plus className="h-3.5 w-3.5" /> Adicionar procedimento
                    </button>
                  </div>

                  <div ref={searchRef} className="relative">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label className={`${labelClass} mb-0`} htmlFor="appointment-patient-search">
                        Paciente
                      </label>
                      {!isEditing && (
                        <button type="button" onClick={enterRegister} className={linkClass}>
                          <UserPlus className="h-3.5 w-3.5" />
                          Cadastrar paciente
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        id="appointment-patient-search"
                        type="text"
                        className={`${fieldClass} pl-10 ${patientFieldError ? "border-danger ring-1 ring-danger/30" : ""}`}
                        placeholder="Digite 3 letras para buscar..."
                        value={patientSearch}
                        disabled={isEditing}
                        aria-invalid={patientFieldError}
                        aria-describedby={patientFieldError ? "appointment-patient-error" : undefined}
                        onChange={(e) => {
                          setPatientSearch(e.target.value)
                          setPatientId("")
                          setPatientFieldError(false)
                        }}
                        onFocus={() => !isEditing && patientSearch.length >= 3 && setShowResults(true)}
                      />
                    </div>
                    {!isEditing && showResults && searchResults.length > 0 && (
                      <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-[4px] border border-[#D5DEE7] bg-white shadow-lg">
                        {searchResults.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#F8FAFC]"
                              onClick={() => selectPatient(p)}
                            >
                              {p.name}
                              <span className="ml-2 text-xs text-[#64748B]">{p.phone}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!isEditing && patientSearch.length >= 3 && searchResults.length === 0 && showResults && (
                      <p className="mt-1 px-1 text-xs text-[#64748B]">
                        Nenhum paciente encontrado.{" "}
                        <button type="button" className={linkClass} onClick={enterRegister}>
                          Cadastrar agora
                        </button>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Telefone celular</label>
                      <input
                        type="text"
                        className={fieldClass}
                        placeholder="(  )     -    "
                        value={phone}
                        disabled={isEditing}
                        onChange={(e) => setPhone(maskPhone(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Telefone residencial (opcional)</label>
                      <input
                        type="text"
                        className={fieldClass}
                        placeholder="(  )     -    "
                        value={phoneHome}
                        disabled={isEditing}
                        onChange={(e) => setPhoneHome(maskPhone(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>E-mail (opcional)</label>
                    <input
                      type="email"
                      className={fieldClass}
                      value={email}
                      disabled={isEditing}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Convênio</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                      <select
                        className={`${fieldClass} appearance-none pl-10`}
                        value={insurancePlan}
                        onChange={(e) => setInsurancePlan(e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {insuranceOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col space-y-4">
              <div>
                <label className={labelClass}>Data e horário</label>
                <DateTimePicker
                  date={date}
                  onDateChange={setDate}
                  startTime={startTime}
                  endTime={endTime}
                  onStartTimeChange={(nextStart) => {
                    setStartTime(nextStart)
                    if (timeToMinutes(endTime) <= timeToMinutes(nextStart)) {
                      setEndTime(addMinutesToTime(nextStart, schedule.slotIntervalMinutes))
                    }
                  }}
                  onEndTimeChange={setEndTime}
                  startTimes={startTimes}
                  endTimes={endTimes.length ? endTimes : startTimes}
                />
                <button type="button" onClick={handleNextFreeSlot} className={`${linkClass} mt-2`}>
                  <Clock className="h-3.5 w-3.5" />
                  Próximo horário livre
                </button>
              </div>

              {!isEditing && (
                <div>
                  <label className={labelClass}>Repetição</label>
                  <select
                    className={fieldClass}
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as CreateAppointmentInput["recurrence"])}
                  >
                    {recurrenceOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {type === "SCHEDULE" && canNotifyWhatsapp && (
                <div className="flex items-center justify-between rounded-[4px] border border-[#E8EDF2] bg-[#F8FAFC] px-3 py-2.5">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-[#334155]">
                      <MessageCircle className="h-4 w-4 text-[#64748B]" />
                      Avisar paciente no WhatsApp
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#64748B]">
                      {isEditing
                        ? "Envia a remarcação quando data, horário ou médico mudarem. A preferência fica salva."
                        : "Envia confirmação ao salvar. A preferência fica salva."}
                    </p>
                  </div>
                  <Switch
                    checked={notifyPatient}
                    onChange={(next) => {
                      setNotifyPatient(next)
                      setAgendaNotifyPatient(next)
                    }}
                  />
                </div>
              )}

              <div className="flex min-h-[140px] flex-1 flex-col">
                <label className={labelClass}>Observações (opcional)</label>
                <textarea
                  className={`${fieldClass} min-h-[140px] h-full resize-none py-2`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {existingMatch && registeringPatient && (
          <div className="mt-4 rounded-[4px] border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-sm text-[#1E3A4C]">
            <p>
              {duplicateKind === "warn"
                ? `Há um cadastro com o mesmo contato: ${existingMatch.name}. Pode ser coincidência.`
                : `Encontramos ${existingMatch.name}.`}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                className={linkClass}
                onClick={() => {
                  selectPatient({
                    id: existingMatch.id,
                    name: existingMatch.name,
                    phone: existingMatch.phone,
                    email: existingMatch.email,
                    cpf: existingMatch.cpf,
                    insurancePlan: existingMatch.insurancePlan ?? "",
                    phoneHome: "",
                    birthDate: "",
                    gender: "O",
                    address: null,
                    bloodType: null,
                    allergies: "",
                    createdAt: "",
                    updatedAt: "",
                  } as Patient)
                }}
              >
                Usar este paciente
              </button>
              {duplicateKind === "warn" && (
                <button
                  type="button"
                  className={linkClass}
                  onClick={() => void handleSavePatient(true)}
                >
                  Cadastrar mesmo assim
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <p
            id={patientFieldError ? "appointment-patient-error" : undefined}
            role="alert"
            className="mt-4 rounded-[4px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}
