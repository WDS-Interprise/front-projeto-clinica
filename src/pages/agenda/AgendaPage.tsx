import { useCallback, useEffect, useState } from "react"

import { useLocation } from "react-router-dom"

import {

  Plus,

  ChevronLeft,

  ChevronRight,

  Search,

  ListOrdered,

  MessageSquare,

  Printer,

} from "lucide-react"

import { addDays, format, isSameDay, startOfWeek } from "date-fns"

import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"

import { api } from "@/services/api"

import type { Appointment, Doctor } from "@/types"

import { cn } from "@/lib/utils"

import {
  buildAgendaRows,
  DEFAULT_AGENDA_SCHEDULE,
  parseAgendaSchedule,
  type AgendaSchedule,
} from "@/lib/agenda-schedule"

import { useToast } from "@/context/ToastContext"

import { useAuth } from "@/context/AuthContext"

import AppointmentFormModal from "@/components/agenda/AppointmentFormModal"

import AppointmentDetailDrawer from "@/components/agenda/AppointmentDetailDrawer"

import WaitingListDrawer from "@/components/agenda/WaitingListDrawer"

import AgendaNotesDrawer from "@/components/agenda/AgendaNotesDrawer"

import AgendaPrintPreview from "@/components/agenda/AgendaPrintPreview"

const statusColors: Record<string, string> = {
  SCHEDULED:
    "bg-blue-500/15 border-blue-400/45 text-blue-900 dark:bg-blue-500/28 dark:border-blue-400/55 dark:text-blue-100",
  CONFIRMED:
    "bg-emerald-500/15 border-emerald-400/45 text-emerald-900 dark:bg-emerald-500/28 dark:border-emerald-400/55 dark:text-emerald-100",
  IN_PROGRESS:
    "bg-amber-500/15 border-amber-400/45 text-amber-900 dark:bg-amber-500/28 dark:border-amber-400/55 dark:text-amber-100",
  COMPLETED: "bg-surface-alt border-border text-text-secondary",
  CANCELLED:
    "bg-red-500/15 border-red-400/45 text-red-900 dark:bg-red-500/28 dark:border-red-400/55 dark:text-red-100",
  NO_SHOW:
    "bg-orange-500/15 border-orange-400/45 text-orange-900 dark:bg-orange-500/28 dark:border-orange-400/55 dark:text-orange-100",
  BLOCK:
    "bg-slate-500/20 border-slate-400/50 text-slate-800 dark:bg-slate-500/35 dark:border-slate-400/60 dark:text-slate-200",
  RESCHEDULED:
    "bg-purple-500/15 border-purple-400/45 text-purple-900 dark:bg-purple-500/28 dark:border-purple-400/55 dark:text-purple-100",
}



export default function AgendaPage() {

  const location = useLocation()

  const { toast } = useToast()

  const { hasPermission, user, clinicId } = useAuth()

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }))

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)

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

  const [agendaSchedule, setAgendaSchedule] = useState<AgendaSchedule>(DEFAULT_AGENDA_SCHEDULE)

  const agendaRows = buildAgendaRows(agendaSchedule)



  const canWaiting = hasPermission("waiting_list:manage")

  const canNotes = hasPermission("agenda_notes:manage")

  const canPrint = hasPermission("agenda:print")



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

        toast("Erro ao carregar agenda — reinicie o backend (npm run dev)", "error")

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



  const openNewAt = (day: Date, time: string) => {

    setFormSlot({ date: day, time })

    setFormPrefill({})

    setFormOpen(true)

  }



  const openNewAppointment = () => {

    setFormSlot({})

    setFormPrefill({})

    setFormOpen(true)

  }



  const handleScheduleFromWaiting = (data: {

    patientId: string

    doctorId?: string

    waitingListEntryId: string

  }) => {

    setFormPrefill(data)

    setFormSlot({ date: new Date() })

    setFormOpen(true)

  }

  const initialDoctorForModal =
    formPrefill.doctorId || selectedDoctorId || undefined

  return (

    <div className="h-full overflow-y-auto p-4 lg:p-6 space-y-6">

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <h1 className="text-2xl font-bold text-text">Agenda</h1>

          <p className="text-sm text-text-secondary mt-1">

            {format(weekDays[0], "dd/MM", { locale: ptBR })} a{" "}

            {format(weekDays[6], "dd/MM/yyyy", { locale: ptBR })}

            {loading && " · atualizando..."}

          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          {canWaiting && (

            <Button

              variant="secondary"

              className="gap-2"

              onClick={() => setWaitingOpen(true)}

            >

              <ListOrdered className="w-4 h-4" />

              Lista de espera

            </Button>

          )}

          {canNotes && (

            <Button

              variant="secondary"

              className="gap-2 relative"

              onClick={() => setNotesOpen(true)}

            >

              <MessageSquare className="w-4 h-4" />

              Observações

              {notesCount > 0 && (

                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold px-1">

                  {notesCount}

                </span>

              )}

            </Button>

          )}

          {canPrint && (

            <Button

              variant="secondary"

              className="gap-2"

              onClick={() => setPrintOpen(true)}

            >

              <Printer className="w-4 h-4" />

              Imprimir agenda

            </Button>

          )}

          <Button className="gap-2" onClick={openNewAppointment}>

            <Plus className="w-4 h-4" />

            Novo agendamento

          </Button>

        </div>

      </div>



      <div className="flex flex-wrap items-center gap-3">

        <div className="relative flex-1 min-w-[200px] max-w-md">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />

          <input

            type="text"

            placeholder="Buscar paciente..."

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface text-sm"

          />

        </div>

        <select

          value={selectedDoctorId}

          onChange={(e) => setSelectedDoctorId(e.target.value)}

          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm min-w-[180px]"

          disabled={user?.role === "DOCTOR"}

        >

          <option value="">Todos profissionais</option>

          {doctors.map((d) => (

            <option key={d.id} value={d.id}>

              {d.name}

            </option>

          ))}

        </select>

        <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-surface">

          <button

            type="button"

            onClick={() => setWeekStart(addDays(weekStart, -7))}

            className="p-2 hover:bg-surface-alt rounded"

          >

            <ChevronLeft className="w-4 h-4" />

          </button>

          <button

            type="button"

            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}

            className="px-3 py-1.5 text-sm font-medium text-primary"

          >

            Hoje

          </button>

          <button

            type="button"

            onClick={() => setWeekStart(addDays(weekStart, 7))}

            className="p-2 hover:bg-surface-alt rounded"

          >

            <ChevronRight className="w-4 h-4" />

          </button>

        </div>

      </div>



      {loadError && (

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">

          Não foi possível carregar consultas: {loadError}. Confira se o backend está rodando em{" "}

          <code className="bg-amber-100 px-1 rounded">localhost:3001</code> e se você fez login.

        </div>

      )}



      {!loading && filtered.length === 0 && !loadError && (

        <p className="text-sm text-text-secondary text-center py-4">

          Nenhuma consulta nesta semana. Clique em <strong>Novo agendamento</strong> ou no{" "}

          <strong>+</strong> na grade.

        </p>

      )}



      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">

        <div className="grid grid-cols-8 border-b border-border bg-surface-alt text-xs font-medium text-text-secondary">

          <div className="p-3" />

          {weekDays.map((d) => (

            <div

              key={d.toISOString()}

              className={cn(

                "p-3 text-center border-l border-border",

                isSameDay(d, new Date()) &&
                  "bg-primary-light/50 text-primary dark:bg-primary/20 dark:text-primary"

              )}

            >

              <p>{format(d, "EEE", { locale: ptBR })}</p>

              <p className="text-lg font-bold text-text">{format(d, "d")}</p>

            </div>

          ))}

        </div>

        <div className="max-h-[560px] overflow-y-auto">

          {agendaRows.map((row) => (

            <div

              key={row.kind === "slot" ? row.time : `lunch-${row.from}`}

              className="grid grid-cols-8 border-b border-border min-h-[44px]"

            >

              <div className="p-2 text-xs font-mono text-text-secondary border-r border-border flex items-start">

                {row.kind === "slot" ? row.time : `${row.from} – ${row.to}`}

              </div>

              {row.kind === "lunch" ? (

                <div className="col-span-7 flex items-center justify-center bg-surface-alt/80 text-xs font-medium text-text-secondary border-l border-border">

                  {row.label}

                </div>

              ) : (

                weekDays.map((day) => {

                  const hour = row.time

                  const apt = filtered.find(

                    (a) =>

                      (a.startTime === hour || a.time === hour) &&

                      isSameDay(new Date(a.date), day)

                  )

                  return (

                    <div

                      key={`${day}-${hour}`}

                      className="p-0.5 border-l border-border relative min-h-[44px]"

                    >

                      {apt ? (

                        <button

                          type="button"

                          onClick={() => setSelectedId(apt.id)}

                          className={cn(

                            "w-full h-full min-h-[40px] text-left text-xs p-1.5 rounded-md border truncate",

                            statusColors[apt.type === "BLOCK" ? "BLOCK" : apt.status] ??

                              statusColors.SCHEDULED

                          )}

                        >

                          {apt.type === "BLOCK"

                            ? "Bloqueado"

                            : apt.patient?.name ?? "—"}

                        </button>

                      ) : (

                        <button

                          type="button"

                          className="w-full h-full opacity-0 hover:opacity-100 hover:bg-primary-light/30 dark:hover:bg-primary/25 rounded text-[10px] text-primary"

                          onClick={() => openNewAt(day, hour)}

                        >

                          +

                        </button>

                      )}

                    </div>

                  )

                })

              )}

            </div>

          ))}

        </div>

      </div>



      <AppointmentFormModal

        open={formOpen}

        onClose={() => {

          setFormOpen(false)

          setFormPrefill({})

        }}

        onSaved={() => {

          toast("Agendamento salvo com sucesso")

          load()

        }}

        defaultDate={formSlot.date}

        defaultStart={formSlot.time}

        initialPatientId={formPrefill.patientId}

        initialDoctorId={initialDoctorForModal}

        waitingListEntryId={formPrefill.waitingListEntryId}

        schedule={agendaSchedule}

      />



      <AppointmentDetailDrawer

        appointmentId={selectedId}

        onClose={() => setSelectedId(null)}

        onUpdated={load}

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


