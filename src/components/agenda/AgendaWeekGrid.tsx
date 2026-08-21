import { useMemo, useState } from "react"
import { format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MoreVertical, RotateCcw, Stethoscope, User, Video, X } from "lucide-react"
import type { Appointment } from "@/types"
import { cn } from "@/lib/utils"
import { addMinutesToTime, timeToMinutes, type AgendaSchedule } from "@/lib/agenda-schedule"
import { getAgendaNotifyPatient } from "@/lib/agenda-preferences"
import { classifyAppointment, DAY_ABBR, formatAgendaName, KIND_META, type AptKind } from "@/lib/agenda-ui"
import { useClickOutside } from "@/hooks/useClickOutside"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useConfirm } from "@/hooks/useConfirm"
import { useAuth } from "@/context/AuthContext"

const SLOT_H = 70
const TIME_COL = 52
/** Acima disso no mesmo horário, usa card agrupado em vez de colunas estreitas. */
const MAX_SIDE_BY_SIDE = 3

function KindIcon({ kind }: { kind: AptKind }) {
  const cls = "h-3 w-3 shrink-0"
  if (kind === "tele") return <Video className={cls} />
  if (kind === "exame") return <Stethoscope className={cls} />
  if (kind === "retorno") return <RotateCcw className={cls} />
  if (kind === "block") return <X className={cls} />
  return <User className={cls} />
}

function buildSlots(schedule: AgendaSchedule) {
  const start = timeToMinutes(schedule.agendaStartTime)
  const end = timeToMinutes(schedule.agendaEndTime)
  const interval = schedule.slotIntervalMinutes || 30
  const lunchStart = timeToMinutes(schedule.lunchStartTime)
  const lunchEnd = timeToMinutes(schedule.lunchEndTime)
  const slots: { time: string; lunch: boolean }[] = []
  for (let m = start; m < end; m += interval) {
    slots.push({
      time: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
      lunch: m >= lunchStart && m < lunchEnd,
    })
  }
  return slots
}

function durationMinutes(a: Appointment) {
  const start = timeToMinutes(a.startTime ?? a.time)
  const end = a.endTime ? timeToMinutes(a.endTime) : start + 30
  return Math.max(30, end - start)
}

function appointmentCardTitle(apt: Appointment, kind: AptKind) {
  if (apt.type === "BLOCK") return "Horário bloqueado"
  const timeRange = apt.endTime
    ? `${apt.startTime ?? apt.time}. ${apt.endTime}`
    : (apt.startTime ?? apt.time)
  const doctor = apt.doctor?.name ?? ""
  if (apt.occupancyOnly) {
    return ["Horário ocupado", timeRange, doctor].filter(Boolean).join("\n")
  }
  return [
    formatAgendaName(apt.patient?.name ?? "Agendamento"),
    KIND_META[kind].label,
    format(new Date(apt.date), "d 'de' MMMM", { locale: ptBR }),
    timeRange,
    doctor,
  ]
    .filter(Boolean)
    .join("\n")
}

type Props = {
  weekDays: Date[]
  appointments: Appointment[]
  schedule: AgendaSchedule
  onNewAt: (day: Date, time: string) => void
  onOpen: (id: string) => void
  onEdit?: (id: string) => void
  onChanged: () => void
}

function sameSlotAppointments(dayApts: Appointment[], apt: Appointment) {
  const start = apt.startTime ?? apt.time
  return dayApts.filter((a) => (a.startTime ?? a.time) === start && a.status !== "CANCELLED")
}

function stackLayout(dayApts: Appointment[], apt: Appointment) {
  const sameSlot = sameSlotAppointments(dayApts, apt)
  const stackTotal = sameSlot.length
  const stackIndex = sameSlot.findIndex((a) => a.id === apt.id)
  if (stackTotal <= 1 || stackIndex < 0) {
    return { stackTotal: 1, stackIndex: 0, narrow: false, bundled: false }
  }
  const bundled = stackTotal > MAX_SIDE_BY_SIDE
  return {
    stackTotal,
    stackIndex,
    narrow: !bundled && stackTotal > 1,
    bundled,
    sameSlot,
  }
}

export default function AgendaWeekGrid({
  weekDays,
  appointments,
  schedule,
  onNewAt,
  onOpen,
  onEdit,
  onChanged,
}: Props) {
  const { toast } = useToast()
  const { hasPermission } = useAuth()
  const canNotifyWhatsapp = hasPermission("whatsapp:send")
  const { confirm, ConfirmDialog } = useConfirm()
  const slots = useMemo(() => buildSlots(schedule), [schedule])
  const [menuId, setMenuId] = useState<string | null>(null)
  const [bundleKey, setBundleKey] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const byDay = (day: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.date), day) && a.status !== "CANCELLED")

  const occupiedAt = (day: Date, time: string, exceptId?: string) =>
    byDay(day).some((a) => {
      if (a.id === exceptId) return false
      const start = timeToMinutes(a.startTime ?? a.time)
      const end = a.endTime ? timeToMinutes(a.endTime) : start + 30
      const t = timeToMinutes(time)
      return t >= start && t < end
    })

  const moveAppointment = async (apt: Appointment, day: Date, time: string) => {
    const mins = durationMinutes(apt)
    const endTime = addMinutesToTime(time, mins)
    const from = `${format(new Date(apt.date), "dd/MM")} às ${apt.startTime ?? apt.time}`
    const to = `${format(day, "dd/MM")} às ${time}`
    const notifyPreferred = getAgendaNotifyPatient()
    const ok = await confirm({
      title: `Reagendar ${apt.patient?.name ?? "agendamento"}?`,
      message: notifyPreferred && canNotifyWhatsapp
        ? `De: ${from}\nPara: ${to}\n\nO paciente será avisado no WhatsApp (preferência ativa).`
        : `De: ${from}\nPara: ${to}`,
      confirmLabel: "Reagendar",
      cancelLabel: "Cancelar",
    })
    if (!ok) return
    try {
      await api.appointments.update(apt.id, {
        doctorId: apt.doctorId,
        date: format(day, "yyyy-MM-dd"),
        startTime: time,
        endTime,
        status: "RESCHEDULED",
      })
      if (notifyPreferred && canNotifyWhatsapp && apt.type !== "BLOCK" && apt.patientId) {
        try {
          await api.appointments.reminder(apt.id, { purpose: "reschedule" })
        } catch (notifyErr: unknown) {
          toast(
            toastMessageFromApiError(
              notifyErr,
              "Reagendado, mas nao foi possivel avisar o paciente no WhatsApp"
            ),
            "error"
          )
          onChanged()
          return
        }
      }
      toast("Agendamento reagendado")
      onChanged()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Não foi possível reagendar"), "error")
    }
  }

  const patchStatus = async (apt: Appointment, status: Appointment["status"]) => {
    try {
      await api.appointments.update(apt.id, {
        doctorId: apt.doctorId,
        date: format(new Date(apt.date), "yyyy-MM-dd"),
        startTime: apt.startTime ?? apt.time,
        endTime: apt.endTime ?? addMinutesToTime(apt.startTime ?? apt.time, 30),
        status,
      })
      toast("Status atualizado")
      onChanged()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Não foi possível atualizar"), "error")
    }
  }

  const removeApt = async (apt: Appointment) => {
    const ok = await confirm({
      title: "Excluir agendamento",
      message: `Excluir o horário de ${apt.patient?.name ?? "este paciente"}?`,
      confirmLabel: "Excluir",
      variant: "danger",
    })
    if (!ok) return
    try {
      await api.appointments.remove(apt.id)
      toast("Agendamento excluído")
      onChanged()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Não foi possível excluir"), "error")
    }
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#E8EDF2] bg-white">
      <ConfirmDialog />
      <div className="max-h-[calc(100vh-280px)] overflow-auto">
        <div
          className="sticky top-0 z-20 grid bg-white"
          style={{ gridTemplateColumns: `${TIME_COL}px repeat(7, minmax(0, 1fr))` }}
        >
          <div className="border-r border-[#E8EDF2]" />
          {weekDays.map((d) => {
            const today = isSameDay(d, new Date())
            return (
              <div
                key={d.toISOString()}
                className={cn(
                  "relative border-l border-[#E8EDF2] py-2.5 text-center",
                  today && "bg-[#F3FAF5]"
                )}
              >
                {today && <span className="absolute inset-x-0 top-0 h-[2px] bg-[#22A06B]" />}
                <p className={cn("text-[11px] font-bold tracking-[0.06em]", today ? "text-[#1F8A58]" : "text-[#334155]")}>
                  {DAY_ABBR[d.getDay()]}
                </p>
                <p className={cn("mt-0.5 text-[11px] font-medium", today ? "text-[#1F8A58]" : "text-[#94A3B8]")}>
                  {format(d, "dd/MM")}
                </p>
              </div>
            )
          })}
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: `${TIME_COL}px repeat(7, minmax(0, 1fr))` }}
        >
          <div>
            {slots.map((s) => (
              <div
                key={s.time}
                className="border-r border-[#E8EDF2] px-1.5 pt-1.5 text-[11px] font-medium text-[#475569]"
                style={{ height: SLOT_H }}
              >
                {s.time}
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const todayCol = isSameDay(day, new Date())
            const dayApts = byDay(day)
            return (
              <div
                key={day.toISOString()}
                className={cn("relative border-l border-[#E8EDF2]", todayCol && "bg-[#F7FCF9]")}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData("text/plain") || draggingId
                  if (!id) return
                  const apt = appointments.find((a) => a.id === id)
                  if (!apt) return
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                  const y = e.clientY - rect.top
                  const idx = Math.max(0, Math.min(slots.length - 1, Math.floor(y / SLOT_H)))
                  const slot = slots[idx]
                  if (!slot || slot.lunch) return
                  void moveAppointment(apt, day, slot.time)
                  setDraggingId(null)
                }}
              >
                {slots.map((s) => {
                  const taken = occupiedAt(day, s.time)
                  return (
                    <div
                      key={s.time}
                      className={cn(
                        "border-b border-dashed border-[#E8EDF2]",
                        s.lunch && "bg-[#F8FAFC]"
                      )}
                      style={{ height: SLOT_H }}
                    >
                      {s.lunch ? null : (
                        !taken && (
                          <button
                            type="button"
                            title={`Novo agendamento às ${s.time}`}
                            onClick={() => onNewAt(day, s.time)}
                            className="flex h-full w-full cursor-pointer items-center justify-center"
                          >
                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#9FD4B3] text-[11px] leading-none text-[#7BC296] opacity-35 hover:opacity-100">
                              +
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  )
                })}

                {dayApts.map((apt) => {
                  const start = apt.startTime ?? apt.time
                  const startIdx = slots.findIndex((s) => s.time === start)
                  if (startIdx < 0) return null
                  const span = durationMinutes(apt) / (schedule.slotIntervalMinutes || 30)
                  const kind = classifyAppointment(apt)
                  const meta = KIND_META[kind]
                  const layout = stackLayout(dayApts, apt)
                  const { stackTotal, stackIndex, narrow, bundled, sameSlot } = layout
                  const bundleId = `${day.toISOString()}-${start}`

                  if (bundled && stackIndex > 0) return null

                  if (bundled && sameSlot) {
                    return (
                      <SlotBundleCard
                        key={bundleId}
                        appointments={sameSlot}
                        slotTime={start}
                        top={startIdx * SLOT_H + 3}
                        height={span * SLOT_H - 6}
                        open={bundleKey === bundleId}
                        onToggle={() => setBundleKey((k) => (k === bundleId ? null : bundleId))}
                        onClose={() => setBundleKey(null)}
                        onOpen={(id) => {
                          setBundleKey(null)
                          onOpen(id)
                        }}
                      />
                    )
                  }

                  return (
                    <AppointmentCard
                      key={apt.id}
                      apt={apt}
                      kind={kind}
                      meta={meta}
                      top={startIdx * SLOT_H + 3}
                      height={span * SLOT_H - 6}
                      stackIndex={stackIndex}
                      stackTotal={stackTotal}
                      narrow={narrow}
                      menuOpen={menuId === apt.id}
                      onToggleMenu={() => setMenuId((id) => (id === apt.id ? null : apt.id))}
                      onCloseMenu={() => setMenuId(null)}
                      onOpen={() => {
                        setMenuId(null)
                        onOpen(apt.id)
                      }}
                      onEdit={() => {
                        setMenuId(null)
                        ;(onEdit ?? onOpen)(apt.id)
                      }}
                      onStatus={(status) => {
                        setMenuId(null)
                        void patchStatus(apt, status)
                      }}
                      onDelete={() => {
                        setMenuId(null)
                        void removeApt(apt)
                      }}
                      onDragStart={() => setDraggingId(apt.id)}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SlotBundleCard({
  appointments,
  slotTime,
  top,
  height,
  open,
  onToggle,
  onClose,
  onOpen,
}: {
  appointments: Appointment[]
  slotTime: string
  top: number
  height: number
  open: boolean
  onToggle: () => void
  onClose: () => void
  onOpen: (id: string) => void
}) {
  const menuRef = useClickOutside<HTMLDivElement>(open, onClose)
  const count = appointments.length

  return (
    <div
      className="absolute z-10"
      style={{
        top,
        left: 4,
        width: "calc(100% - 8px)",
        height: Math.max(height, 58),
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        title={`${count} agendamentos às ${slotTime}. Clique para ver a lista.`}
        className="relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[6px] border border-[#86EFAC] bg-[#ECFDF5] px-2 py-1.5 text-left transition-[box-shadow,border-color] hover:shadow-[0_2px_8px_rgba(15,23,42,0.07)]"
      >
        <span className="absolute top-0 bottom-0 left-0 w-[3px] rounded-l-[6px] bg-[#22A06B]" />
        <span className="pl-1 text-[10px] font-semibold text-[#1F8A58]">{slotTime}</span>
        <span className="mt-0.5 pl-1 text-[12px] font-bold leading-snug text-[#1E293B]">
          {count} consultas
        </span>
        <span className="mt-auto pl-1 text-[9px] font-medium text-[#64748B]">Ver todos</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 z-40 mb-1 max-h-64 w-full min-w-[220px] overflow-y-auto rounded-lg border border-[#E8EDF2] bg-white py-1 shadow-lg"
        >
          <p className="border-b border-[#E8EDF2] px-3 py-2 text-[11px] font-semibold text-[#64748B]">
            {count} agendamentos · {slotTime}
          </p>
          {appointments.map((apt) => {
            const kind = classifyAppointment(apt)
            const meta = KIND_META[kind]
            const doctor = apt.doctor?.name?.replace(/^(Dra?\.)\s*/, "") ?? ""
            return (
              <button
                key={apt.id}
                type="button"
                className="flex w-full flex-col gap-0.5 border-b border-[#F1F5F9] px-3 py-2 text-left last:border-0 hover:bg-[#F8FAFC]"
                onClick={() => onOpen(apt.id)}
              >
                <span className="text-[12px] font-semibold text-[#1E293B]">
                  {formatAgendaName(apt.patient?.name ?? "Agendamento")}
                </span>
                <span className="text-[10px] text-[#64748B]">
                  {[doctor, meta.label].filter(Boolean).join(" · ")}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AppointmentCard({
  apt,
  kind,
  meta,
  top,
  height,
  stackIndex,
  stackTotal,
  narrow,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpen,
  onEdit,
  onStatus,
  onDelete,
  onDragStart,
}: {
  apt: Appointment
  kind: AptKind
  meta: (typeof KIND_META)[AptKind]
  top: number
  height: number
  stackIndex: number
  stackTotal: number
  narrow: boolean
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onOpen: () => void
  onEdit: () => void
  onStatus: (status: Appointment["status"]) => void
  onDelete: () => void
  onDragStart: () => void
}) {
  const { hasPermission } = useAuth()
  const canCompleteClinical = hasPermission("records:write")
  const menuRef = useClickOutside<HTMLDivElement>(menuOpen, onCloseMenu)
  const colWidth = 100 / Math.min(stackTotal, MAX_SIDE_BY_SIDE)
  const inset = 4

  return (
    <div
      draggable={!apt.occupancyOnly}
      onDragStart={(e) => {
        if (apt.occupancyOnly) return
        e.dataTransfer.setData("text/plain", apt.id)
        e.dataTransfer.effectAllowed = "move"
        onDragStart()
      }}
      className="absolute z-10"
      style={{
        top,
        left: `calc(${inset}px + ${stackIndex * colWidth}%)`,
        width: `calc(${colWidth}% - ${inset * 2}px)`,
        height: Math.max(height, narrow ? 52 : 58),
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        title={appointmentCardTitle(apt, kind)}
        className="relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[6px] border px-2 py-1.5 text-left transition-[box-shadow,border-color] hover:shadow-[0_2px_8px_rgba(15,23,42,0.07)]"
        style={{ background: meta.bg, borderColor: meta.border }}
      >
        <span
          className="absolute top-0 bottom-0 left-0 w-[3px] rounded-l-[6px]"
          style={{ background: meta.accent }}
        />
        <span className="flex min-w-0 items-start justify-between gap-1 pl-1">
          <span className="text-[10px] font-semibold text-slate-500">{apt.startTime ?? apt.time}</span>
          {!apt.occupancyOnly && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onToggleMenu()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation()
                onToggleMenu()
              }
            }}
            className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-white/70 hover:text-slate-600"
            aria-label="Ações do agendamento"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </span>
          )}
        </span>
        <span
          className={cn(
            "mt-0.5 min-w-0 pl-1 pr-0.5 font-semibold leading-snug text-[#1E293B]",
            narrow ? "text-[9px] line-clamp-3" : "text-[11px] line-clamp-2"
          )}
        >
          {apt.type === "BLOCK"
            ? "Bloqueado"
            : apt.occupancyOnly
              ? "Horário ocupado"
              : formatAgendaName(apt.patient?.name ?? "-")}
        </span>
        {(narrow || height >= 72) && apt.doctor?.name && !apt.occupancyOnly && apt.type !== "BLOCK" && (
          <span className="mt-0.5 min-w-0 truncate pl-1 text-[9px] font-medium text-slate-500">
            {apt.doctor.name.replace(/^(Dra?\.)\s*/, "")}
          </span>
        )}
        {height >= 72 && !narrow && (
          <span className="mt-1 flex min-w-0 items-center gap-1 overflow-hidden pl-1 text-[10px] text-slate-500">
            <KindIcon kind={kind} />
            <span className="truncate">{meta.label}</span>
          </span>
        )}
      </button>

      {menuOpen && !apt.occupancyOnly && (
        <div
          ref={menuRef}
          className="absolute top-7 right-1 z-30 w-48 overflow-hidden rounded-lg border border-[#E8EDF2] bg-white py-1 shadow-lg"
        >
          {[
            ["Ver agendamento", onOpen],
            ["Editar", onEdit],
            ["Reagendar", onEdit],
            ["Confirmar consulta", () => onStatus("CONFIRMED")],
            ...(canCompleteClinical
              ? ([["Marcar como atendido", () => onStatus("COMPLETED")]] as const)
              : []),
          ].map(([label, fn]) => (
            <button
              key={label as string}
              type="button"
              className="block w-full px-3 py-1.5 text-left text-[12px] text-slate-700 hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation()
                ;(fn as () => void)()
              }}
            >
              {label}
            </button>
          ))}
          <div className="my-1 border-t border-[#E8EDF2]" />
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-[12px] text-red-600 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation()
              onStatus("CANCELLED")
            }}
          >
            Cancelar consulta
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-[12px] text-red-600 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            Excluir
          </button>
        </div>
      )}
    </div>
  )
}
