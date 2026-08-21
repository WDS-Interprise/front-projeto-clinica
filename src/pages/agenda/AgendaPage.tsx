import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Info,
  ListOrdered,
  MessageSquare,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Stethoscope,
  TestTube2,
  Video,
  X,
} from "lucide-react"
import { addDays, format, isSameDay, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { api } from "@/services/api"
import type { Appointment, Doctor } from "@/types"
import {
  DEFAULT_AGENDA_SCHEDULE,
  parseAgendaSchedule,
  type AgendaSchedule,
} from "@/lib/agenda-schedule"
import { classifyAppointment, KIND_META } from "@/lib/agenda-ui"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/context/AuthContext"
import AppointmentFormModal from "@/components/agenda/AppointmentFormModal"
import AppointmentDetailView from "@/components/agenda/AppointmentDetailView"
import WaitingListDrawer from "@/components/agenda/WaitingListDrawer"
import AgendaNotesDrawer from "@/components/agenda/AgendaNotesDrawer"
import AgendaPrintPreview from "@/components/agenda/AgendaPrintPreview"
import AgendaWeekGrid from "@/components/agenda/AgendaWeekGrid"
import { EmptyState } from "@/components/ui/empty-state"

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Faltou",
  RESCHEDULED: "Reagendado",
}

function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export default function AgendaPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { hasPermission, user, clinicId } = useAuth()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null)
  const [formSlot, setFormSlot] = useState<{ date?: Date; time?: string }>({})
  const [formPrefill, setFormPrefill] = useState<{
    patientId?: string
    doctorId?: string
    waitingListEntryId?: string
  }>({})
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [waitingOpen, setWaitingOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [notesCount, setNotesCount] = useState(0)
  const [hideEmptyHint, setHideEmptyHint] = useState(false)
  const [agendaSchedule, setAgendaSchedule] = useState<AgendaSchedule>(DEFAULT_AGENDA_SCHEDULE)

  const canWaiting = hasPermission("waiting_list:manage")
  const canNotes = hasPermission("agenda_notes:manage")
  const canPrint = hasPermission("agenda:print")
  const canManageAgenda = hasPermission("agenda:manage")
  const occupancyOnly = !hasPermission("patients:view") && user?.role !== "DOCTOR"

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const startDate = format(weekDays[0], "yyyy-MM-dd")
  const endDate = format(weekDays[6], "yyyy-MM-dd")
  const todayStr = format(new Date(), "yyyy-MM-dd")

  const load = useCallback(() => {
    setLoading(true)
    setLoadError("")
    api.appointments
      .list({
        startDate,
        endDate,
        doctorId: selectedDoctorId || undefined,
      })
      .then((r) => setAppointments(r.data))
      .catch((e: unknown) => {
        setAppointments([])
        const msg = e instanceof Error ? e.message : "Erro ao carregar"
        setLoadError(msg)
        toast("Erro ao carregar agenda. reinicie o backend (npm run dev)", "error")
      })
      .finally(() => setLoading(false))
  }, [startDate, endDate, selectedDoctorId, toast])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    api.doctors.list().then((docs) => {
      setDoctors(docs)
      if (user?.role === "DOCTOR" && user.doctorId) {
        setSelectedDoctorId(user.doctorId)
      }
    })
  }, [user?.role, user?.doctorId])

  useEffect(() => {
    const loadId = clinicId
    if (!loadId) {
      api.clinics.list().then((list) => {
        if (list[0]) setAgendaSchedule(parseAgendaSchedule(list[0]))
      })
      return
    }
    api.clinics.getById(loadId).then((c) => setAgendaSchedule(parseAgendaSchedule(c))).catch(() => {})
  }, [clinicId])

  useEffect(() => {
    if (!canNotes) return
    api.agendaNotes
      .list({ date: todayStr })
      .then((n) => setNotesCount(n.length))
      .catch(() => setNotesCount(0))
  }, [canNotes, todayStr, notesOpen])

  useEffect(() => {
    const state = location.state as { openNewAppointment?: boolean } | null
    if (state?.openNewAppointment) {
      setFormPrefill({})
      setFormOpen(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const filtered = appointments.filter(
    (a) =>
      !search ||
      a.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.type === "BLOCK"
  )

  const todayApts = useMemo(
    () =>
      filtered
        .filter((a) => a.type !== "BLOCK" && isSameDay(new Date(a.date), new Date()))
        .sort((a, b) => (a.startTime ?? a.time).localeCompare(b.startTime ?? b.time)),
    [filtered]
  )

  const daySummary = useMemo(() => {
    const counts = { consulta: 0, retorno: 0, exame: 0, tele: 0 }
    for (const a of todayApts) {
      const k = classifyAppointment(a)
      if (k !== "block") counts[k] += 1
    }
    return counts
  }, [todayApts])

  const openAppointment = (id: string) => {
    setSelectedId(id)
  }

  const openNewAt = (day: Date, time: string) => {
    setEditingAppointmentId(null)
    setFormSlot({ date: day, time })
    setFormPrefill({})
    setFormOpen(true)
  }

  const openNewAppointment = () => {
    setEditingAppointmentId(null)
    setFormSlot({})
    setFormPrefill({})
    setFormOpen(true)
  }

  const openEditAppointment = (id: string) => {
    setEditingAppointmentId(id)
    setFormSlot({})
    setFormPrefill({})
    setFormOpen(true)
  }

  const handleScheduleFromWaiting = (data: {
    patientId: string
    doctorId?: string
    waitingListEntryId: string
  }) => {
    setEditingAppointmentId(null)
    setFormPrefill(data)
    setFormSlot({ date: new Date() })
    setFormOpen(true)
  }

  const initialDoctorForModal = formPrefill.doctorId || selectedDoctorId || undefined
  const emptyWeek = !loading && filtered.length === 0 && !loadError

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-[#F4F7F5]">
      <aside className="hidden w-[280px] shrink-0 flex-col gap-4 overflow-auto border-r border-[#E2EBE5] bg-white p-4 xl:flex">
        <section>
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[#1B2E26]">
            <CalendarDays className="h-4 w-4 text-[#006B4D]" />
            Pacientes do dia
          </h2>
          <p className="mt-3 text-[40px] font-bold leading-none text-[#16A34A]">{todayApts.length}</p>
          <p className="mt-1 text-[13px] text-[#6B7C73]">agendamentos hoje</p>
          <button
            type="button"
            className="mt-2 text-[13px] font-medium text-[#2563EB] hover:underline"
            onClick={() => document.getElementById("agenda-hoje-lista")?.scrollIntoView({ behavior: "smooth" })}
          >
            Ver lista completa →
          </button>
          <div id="agenda-hoje-lista" className="mt-4 space-y-2">
            {todayApts.length === 0 && (
              <EmptyState
                className="rounded-xl border border-[#E8EEEA] bg-[#F8FBF9] px-3 py-6"
                icon={<CalendarDays className="h-8 w-8 text-[#006B4D]" />}
                title="Nenhum paciente hoje"
                description="Não há agendamentos para esta data."
                actionLabel="Novo agendamento"
                onAction={openNewAppointment}
              />
            )}
              {todayApts.slice(0, 8).map((a) => {
                const kind = classifyAppointment(a)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => openAppointment(a.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left cursor-pointer transition-colors ${
                      selectedId === a.id
                        ? "border-[#006B4D]/40 bg-[#E8F6EE] ring-1 ring-[#006B4D]/20"
                        : "border-[#E8EEEA] bg-white hover:border-[#006B4D]/25"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F6EE] text-[11px] font-bold text-[#006B4D]">
                      {initials(a.patient?.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-[#1B2E26]">
                        {a.patient?.name ?? "-"}
                      </span>
                      <span className="block text-[12px] text-[#6B7C73]">
                        {a.startTime ?? a.time} • {KIND_META[kind].label}
                      </span>
                    </span>
                    <span className="rounded-full bg-[#E8F8EE] px-2 py-0.5 text-[10px] font-semibold text-[#15803D]">
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </button>
                )
              })}
          </div>
        </section>

        <section className="rounded-xl border border-[#E8EEEA] p-4">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[#1B2E26]">
            <Crosshair className="h-4 w-4 text-[#006B4D]" />
            Resumo do dia
          </h2>
          <ul className="mt-4 space-y-3 text-[13px]">
            <li className="flex items-center justify-between text-[#1B2E26]">
              <span className="flex items-center gap-2 text-[#5A6B64]">
                <Stethoscope className="h-4 w-4" /> Consultas
              </span>
              <span className="font-semibold">{daySummary.consulta}</span>
            </li>
            <li className="flex items-center justify-between text-[#1B2E26]">
              <span className="flex items-center gap-2 text-[#5A6B64]">
                <RotateCcw className="h-4 w-4" /> Retornos
              </span>
              <span className="font-semibold">{daySummary.retorno}</span>
            </li>
            <li className="flex items-center justify-between text-[#1B2E26]">
              <span className="flex items-center gap-2 text-[#5A6B64]">
                <TestTube2 className="h-4 w-4" /> Exames
              </span>
              <span className="font-semibold">{daySummary.exame}</span>
            </li>
            <li className="flex items-center justify-between text-[#1B2E26]">
              <span className="flex items-center gap-2 text-[#5A6B64]">
                <Video className="h-4 w-4" /> Teleconsultas
              </span>
              <span className="font-semibold">{daySummary.tele}</span>
            </li>
          </ul>
          <button
            type="button"
            onClick={() => navigate("/gestao/relatorios-atendimento")}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#006B4D] text-[13px] font-medium text-[#006B4D] hover:bg-[#E8F6EE]"
          >
            <BarChart3 className="h-4 w-4" />
            Ver relatório do dia
          </button>
        </section>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto p-5 lg:p-6">
        {selectedId ? (
          <AppointmentDetailView
            appointmentId={selectedId}
            onBack={() => setSelectedId(null)}
            onUpdated={load}
            onEdit={() => openEditAppointment(selectedId)}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-[28px] font-bold tracking-tight text-[#1B2E26]">Agenda</h1>
                <p className="mt-1 flex items-center gap-1 text-[13px] text-[#6B7C73]">
                  {format(weekDays[0], "dd/MM", { locale: ptBR })} a{" "}
                  {format(weekDays[6], "dd/MM/yyyy", { locale: ptBR })}
                  <ChevronDown className="h-3.5 w-3.5" />
                  {loading && <span className="ml-1">· atualizando...</span>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canWaiting && (
                  <button
                    type="button"
                    onClick={() => setWaitingOpen(true)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#C5D9CC] bg-white px-3 text-[13px] font-medium text-[#006B4D] hover:bg-[#E8F6EE]"
                  >
                    <ListOrdered className="h-4 w-4" />
                    Lista de espera
                  </button>
                )}
                {canNotes && (
                  <button
                    type="button"
                    onClick={() => setNotesOpen(true)}
                    className="relative inline-flex h-9 items-center gap-2 rounded-lg border border-[#C5D9CC] bg-white px-3 text-[13px] font-medium text-[#006B4D] hover:bg-[#E8F6EE]"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Observações
                    {notesCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#006B4D] px-1 text-[10px] font-bold text-white">
                        {notesCount}
                      </span>
                    )}
                  </button>
                )}
                {canPrint && (
                  <button
                    type="button"
                    onClick={() => setPrintOpen(true)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#C5D9CC] bg-white px-3 text-[13px] font-medium text-[#006B4D] hover:bg-[#E8F6EE]"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir agenda
                  </button>
                )}
                {canManageAgenda && (
                  <button
                    type="button"
                    onClick={openNewAppointment}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2563EB] px-3 text-[13px] font-medium text-white shadow-sm hover:bg-[#1D4ED8]"
                  >
                    <Plus className="h-4 w-4" />
                    Novo agendamento
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1 max-w-md">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8A9A90]" />
                <input
                  type="text"
                  placeholder={occupancyOnly ? "Busca indisponível nesta visão" : "Buscar paciente..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={occupancyOnly}
                  className="h-10 w-full rounded-lg border border-[#D7E3DB] bg-white pr-4 pl-10 text-sm text-[#1B2E26] outline-none focus:border-[#006B4D] disabled:opacity-60"
                />
              </div>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="h-10 min-w-[200px] rounded-lg border border-[#D7E3DB] bg-white px-3 text-sm text-[#1B2E26]"
                disabled={user?.role === "DOCTOR"}
              >
                <option value="">Todos profissionais</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWeekStart(addDays(weekStart, -7))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D7E3DB] bg-white text-[#5A6B64] hover:bg-[#F3F7F5]"
                  aria-label="Semana anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
                  className="h-9 rounded-lg border border-[#D7E3DB] bg-white px-3 text-[13px] font-medium text-[#1B2E26] hover:bg-[#F3F7F5]"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setWeekStart(addDays(weekStart, 7))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D7E3DB] bg-white text-[#5A6B64] hover:bg-[#F3F7F5]"
                  aria-label="Próxima semana"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {loadError && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Não foi possível carregar consultas: {loadError}.
              </div>
            )}

            {emptyWeek && !hideEmptyHint && (
              <div className="mt-4 flex items-center gap-3 rounded-[8px] border border-[#D1E9FF] bg-[#F0F7FF] px-4 py-3 text-[12px] text-[#1E3A5F]">
                <Info className="h-4 w-4 shrink-0 text-[#2563EB]" />
                <p className="flex-1">
                  Nenhuma consulta nesta semana. Clique em{" "}
                  <strong className="text-[#1D4ED8]">Novo agendamento</strong> ou no{" "}
                  <strong>+</strong> na grade.
                </p>
                <button type="button" onClick={() => setHideEmptyHint(true)} aria-label="Fechar aviso">
                  <X className="h-4 w-4 text-[#64748B]" />
                </button>
              </div>
            )}

            <div className="mt-4">
              <AgendaWeekGrid
                weekDays={weekDays}
                appointments={filtered}
                schedule={agendaSchedule}
                onNewAt={openNewAt}
                onOpen={openAppointment}
                onEdit={openEditAppointment}
                onChanged={load}
              />
            </div>
          </>
        )}
      </div>

      <AppointmentFormModal
        open={formOpen}
        appointmentId={editingAppointmentId}
        onClose={() => {
          setFormOpen(false)
          setEditingAppointmentId(null)
          setFormPrefill({})
        }}
        onSaved={() => {
          toast(
            editingAppointmentId
              ? "Agendamento atualizado com sucesso"
              : "Agendamento salvo com sucesso"
          )
          setSelectedId(null)
          load()
        }}
        defaultDate={formSlot.date}
        defaultStart={formSlot.time}
        initialPatientId={formPrefill.patientId}
        initialDoctorId={initialDoctorForModal}
        waitingListEntryId={formPrefill.waitingListEntryId}
        schedule={agendaSchedule}
      />

      {canWaiting && (
        <WaitingListDrawer
          open={waitingOpen}
          onClose={() => setWaitingOpen(false)}
          defaultDoctorId={selectedDoctorId || undefined}
          onSchedule={handleScheduleFromWaiting}
        />
      )}

      {canNotes && (
        <AgendaNotesDrawer
          open={notesOpen}
          onClose={() => setNotesOpen(false)}
          noteDate={todayStr}
          onCountChange={setNotesCount}
        />
      )}

      {canPrint && (
        <AgendaPrintPreview
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          appointments={filtered}
          startDate={startDate}
          endDate={endDate}
          doctorId={selectedDoctorId || undefined}
        />
      )}
    </div>
  )
}
