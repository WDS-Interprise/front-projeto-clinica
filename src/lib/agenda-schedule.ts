export type AgendaSchedule = {
  agendaStartTime: string
  agendaEndTime: string
  lunchStartTime: string
  lunchEndTime: string
  slotIntervalMinutes: number
}

export const DEFAULT_AGENDA_SCHEDULE: AgendaSchedule = {
  agendaStartTime: "08:00",
  agendaEndTime: "17:00",
  lunchStartTime: "12:00",
  lunchEndTime: "13:00",
  slotIntervalMinutes: 30,
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + (m ?? 0)
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function generateTimeOptions(
  intervalMinutes = 15,
  start = "06:00",
  end = "22:00"
): string[] {
  const slots: string[] = []
  for (let m = timeToMinutes(start); m <= timeToMinutes(end); m += intervalMinutes) {
    slots.push(minutesToTime(m))
  }
  return slots
}

export function generateScheduleTimeOptions(
  schedule: AgendaSchedule,
  excludeLunch = false
): string[] {
  return generateTimeOptions(
    schedule.slotIntervalMinutes,
    schedule.agendaStartTime,
    schedule.agendaEndTime
  ).filter((time) => {
    if (!excludeLunch) return true
    const m = timeToMinutes(time)
    const lunchStart = timeToMinutes(schedule.lunchStartTime)
    const lunchEnd = timeToMinutes(schedule.lunchEndTime)
    return !(m >= lunchStart && m < lunchEnd)
  })
}

export function parseAgendaSchedule(clinic: Partial<AgendaSchedule> | null | undefined): AgendaSchedule {
  return {
    agendaStartTime: clinic?.agendaStartTime ?? DEFAULT_AGENDA_SCHEDULE.agendaStartTime,
    agendaEndTime: clinic?.agendaEndTime ?? DEFAULT_AGENDA_SCHEDULE.agendaEndTime,
    lunchStartTime: clinic?.lunchStartTime ?? DEFAULT_AGENDA_SCHEDULE.lunchStartTime,
    lunchEndTime: clinic?.lunchEndTime ?? DEFAULT_AGENDA_SCHEDULE.lunchEndTime,
    slotIntervalMinutes: clinic?.slotIntervalMinutes ?? DEFAULT_AGENDA_SCHEDULE.slotIntervalMinutes,
  }
}

export function generateAgendaSlots(schedule: AgendaSchedule): string[] {
  const start = timeToMinutes(schedule.agendaStartTime)
  const end = timeToMinutes(schedule.agendaEndTime)
  const lunchStart = timeToMinutes(schedule.lunchStartTime)
  const lunchEnd = timeToMinutes(schedule.lunchEndTime)
  const interval = schedule.slotIntervalMinutes

  const slots: string[] = []
  for (let m = start; m < end; m += interval) {
    if (m >= lunchStart && m < lunchEnd) continue
    slots.push(minutesToTime(m))
  }
  return slots
}

export type AgendaRow =
  | { kind: "slot"; time: string }
  | { kind: "lunch"; label: string; from: string; to: string }

export function buildAgendaRows(schedule: AgendaSchedule): AgendaRow[] {
  const slots = generateAgendaSlots(schedule)
  const lunchStart = timeToMinutes(schedule.lunchStartTime)
  const lunchEnd = timeToMinutes(schedule.lunchEndTime)
  const hasLunch = lunchStart < lunchEnd && lunchStart >= timeToMinutes(schedule.agendaStartTime)

  if (!hasLunch) {
    return slots.map((time) => ({ kind: "slot", time }))
  }

  const rows: AgendaRow[] = []
  let lunchInserted = false

  for (const time of slots) {
    if (!lunchInserted && timeToMinutes(time) > lunchStart) {
      rows.push({
        kind: "lunch",
        label: "Almoço",
        from: schedule.lunchStartTime,
        to: schedule.lunchEndTime,
      })
      lunchInserted = true
    }
    rows.push({ kind: "slot", time })
  }

  if (!lunchInserted) {
    rows.push({
      kind: "lunch",
      label: "Almoço",
      from: schedule.lunchStartTime,
      to: schedule.lunchEndTime,
    })
  }

  return rows
}

export function overlapsLunch(startTime: string, endTime: string, schedule: AgendaSchedule): boolean {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  const lunchStart = timeToMinutes(schedule.lunchStartTime)
  const lunchEnd = timeToMinutes(schedule.lunchEndTime)
  if (lunchStart >= lunchEnd) return false
  return start < lunchEnd && end > lunchStart
}

export function isWithinWorkHours(startTime: string, endTime: string, schedule: AgendaSchedule): boolean {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  const workStart = timeToMinutes(schedule.agendaStartTime)
  const workEnd = timeToMinutes(schedule.agendaEndTime)
  return start >= workStart && end <= workEnd && end > start
}

export function addMinutesToTime(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes)
}

export function validateAppointmentSchedule(
  startTime: string,
  endTime: string,
  schedule: AgendaSchedule,
  type: "SCHEDULE" | "BLOCK" = "SCHEDULE"
): string | null {
  if (type === "BLOCK") return null
  if (!isWithinWorkHours(startTime, endTime, schedule)) {
    return "Horario fora do expediente da clinica"
  }
  if (overlapsLunch(startTime, endTime, schedule)) {
    return "Horario de almoco — nao e possivel agendar consultas"
  }
  return null
}
