import { useEffect, useState, useRef } from "react"
import { Plus, User, Building2, RotateCcw, DollarSign, UserPlus } from "lucide-react"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { api } from "@/services/api"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { isResolvableEntityId } from "@/lib/route-ids"
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
  "w-full h-11 rounded border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
const labelClass = "block text-sm font-medium text-text mb-1"

export default function AppointmentFormModal({
  open,
  onClose,
  onSaved,
  defaultDate,
  defaultStart,
  initialPatientId,
  initialDoctorId,
  waitingListEntryId,
  schedule = DEFAULT_AGENDA_SCHEDULE,
}: Props) {
  const navigate = useNavigate()
  const [type, setType] = useState<"SCHEDULE" | "BLOCK">("SCHEDULE")
  const [doctorId, setDoctorId] = useState("")
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
  const [paymentLink, setPaymentLink] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setDate(format(defaultDate ?? new Date(), "yyyy-MM-dd"))
    if (defaultStart) {
      setStartTime(defaultStart)
      setEndTime(addMinutesToTime(defaultStart, schedule.slotIntervalMinutes))
    }
    api.doctors.list().then((docs: Doctor[]) => {
      if (initialDoctorId) setDoctorId(initialDoctorId)
      else if (docs[0]) setDoctorId(docs[0].id)
    })
    if (isResolvableEntityId(initialPatientId)) {
      setPatientId(initialPatientId)
      api.patients.getById(initialPatientId).then((p) => {
        setPatientSearch(p.name)
        setPhone(maskPhone(p.phone))
        setPhoneHome(p.phoneHome ? maskPhone(p.phoneHome) : "")
        setEmail(p.email ?? "")
        setInsurancePlan(p.insurancePlan ?? "")
      })
    } else {
      setPatientId("")
      setPatientSearch("")
    }
    api.procedures.list().then((procs) => {
      setCatalog(procs)
      if (procs.length) {
        setLines([
          {
            procedureId: procs.find((p) => p.name === "Retorno")?.id ?? procs[0].id,
            quantity: 1,
            unitPrice: Number(procs.find((p) => p.name === "Retorno")?.defaultPrice ?? procs[0].defaultPrice),
          },
        ])
      }
    })
  }, [open, defaultDate, defaultStart, initialPatientId, initialDoctorId, schedule.slotIntervalMinutes])

  useEffect(() => {
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
  }, [patientSearch])

  const selectPatient = (p: Patient) => {
    setPatientId(p.id)
    setPatientSearch(p.name)
    setPhone(maskPhone(p.phone))
    setPhoneHome(p.phoneHome ? maskPhone(p.phoneHome) : "")
    setEmail(p.email ?? "")
    setInsurancePlan(p.insurancePlan ?? "")
    setShowResults(false)
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
      if (!patientId && patientSearch.length < 2) {
        setError("Busque e selecione um paciente")
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
      let finalPatientId = patientId
      if (type === "SCHEDULE" && !finalPatientId && patientSearch) {
        const created = await api.patients.create({
          name: patientSearch,
          phone: phone.replace(/\D/g, "") || "11999999999",
          phoneHome: phoneHome.replace(/\D/g, "") || "",
          email: email || "",
          cpf: String(Date.now()).slice(-11),
          birthDate: "1990-01-01",
          gender: "O",
          insurancePlan: insurancePlan || "Particular",
        })
        finalPatientId = created.id
      }

      const payload: CreateAppointmentInput = {
        type,
        patientId: type === "BLOCK" ? null : finalPatientId,
        doctorId,
        date,
        startTime,
        endTime,
        insurancePlan: insurancePlan || "Particular",
        recurrence,
        notes,
        generatePaymentLink: paymentLink,
        procedures: type === "SCHEDULE" ? lines : [],
        ...(waitingListEntryId ? { waitingListEntryId } : {}),
      }
      await api.appointments.create(payload)
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
    <Modal open={open} onClose={onClose} title="" size="lg">
      <div className="space-y-5 max-h-[80vh] overflow-y-auto -mt-2">
        <div className="flex gap-6 border-b border-border pb-4">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="radio"
              name="apt-type"
              checked={type === "SCHEDULE"}
              onChange={() => setType("SCHEDULE")}
              className="accent-primary"
            />
            Agendar
          </label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="radio"
              name="apt-type"
              checked={type === "BLOCK"}
              onChange={() => setType("BLOCK")}
              className="accent-primary"
            />
            Bloquear horário
          </label>
        </div>

        {type === "SCHEDULE" && (
          <>
            <div>
              <label className={labelClass}>Procedimentos</label>
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-center mt-2">
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
                  <div className="w-20">
                    <span className="text-xs text-text-secondary">Quant.</span>
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
              <button
                type="button"
                onClick={addLine}
                className="mt-2 text-sm text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>

            <div ref={searchRef} className="relative">
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className={labelClass} htmlFor="appointment-patient-search">
                  Paciente
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate("/pacientes", { state: { openNewPatient: true } })
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Cadastrar paciente
                </button>
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="appointment-patient-search"
                  type="text"
                  className={`${fieldClass} pl-10 ${patientFieldError ? "border-danger ring-1 ring-danger/30" : ""}`}
                  placeholder="Digite 3 letras para buscar..."
                  value={patientSearch}
                  aria-invalid={patientFieldError}
                  aria-describedby={patientFieldError ? "appointment-patient-error" : undefined}
                  onChange={(e) => {
                    setPatientSearch(e.target.value)
                    setPatientId("")
                    setPatientFieldError(false)
                  }}
                  onFocus={() => patientSearch.length >= 3 && setShowResults(true)}
                />
              </div>
              {showResults && searchResults.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-40 overflow-auto">
                  {searchResults.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-light"
                        onClick={() => selectPatient(p)}
                      >
                        {p.name}
                        <span className="text-text-secondary ml-2 text-xs">{p.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {patientSearch.length >= 3 && searchResults.length === 0 && showResults && (
                <p className="text-xs text-text-secondary mt-1 px-1">
                  Nenhum paciente encontrado. O nome digitado sera usado ao salvar.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className={labelClass}>E-mail (opcional)</label>
              <input
                type="email"
                className={fieldClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Convênio</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <select
                  className={`${fieldClass} pl-10 appearance-none`}
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

        <div className="space-y-3">
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
          <button
            type="button"
            onClick={handleNextFreeSlot}
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            Próximo horário livre
          </button>
        </div>

        <div>
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

        <div className="flex items-center justify-between rounded-lg bg-surface-alt border border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-text">
            <DollarSign className="w-4 h-4 text-text-secondary" />
            Gerar link de pagamento
          </div>
          <Switch checked={paymentLink} onChange={setPaymentLink} />
        </div>

        <div>
          <label className={labelClass}>Observações (opcional)</label>
          <textarea
            rows={3}
            className={`${fieldClass} resize-none`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p
            id={patientFieldError ? "appointment-patient-error" : undefined}
            role="alert"
            className="text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2"
          >
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
        <Button variant="secondary" onClick={onClose} className="uppercase tracking-wide text-xs">
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={loading} className="uppercase tracking-wide text-xs">
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Modal>
  )
}
