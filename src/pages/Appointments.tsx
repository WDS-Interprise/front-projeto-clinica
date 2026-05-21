import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import { api } from "@/services/api"
import type { Appointment } from "@/types"

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export default function Appointments() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])

  const dateStr = formatDate(selectedDate, { year: "numeric", month: "2-digit", day: "2-digit" })
    .split("/")
    .reverse()
    .join("-")

  useEffect(() => {
    api.appointments.list({ date: dateStr }).then((res) => {
      setAppointments(res.data)
    })
  }, [dateStr])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Consultas</h1>
          <p className="text-sm text-text-secondary mt-1">Agende e gerencie consultas médicas</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Consulta
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-surface-alt transition-colors">
                <ChevronLeft className="w-4 h-4 text-text-secondary" />
              </button>
              <h3 className="text-sm font-semibold text-text">
                {formatDate(currentMonth, { month: "long", year: "numeric" })}
              </h3>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded hover:bg-surface-alt transition-colors">
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-xs font-medium text-text-secondary py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "w-full aspect-square rounded-lg text-sm font-medium transition-colors",
                    isSameDay(day, selectedDate)
                      ? "bg-primary text-white"
                      : isToday(day)
                        ? "bg-primary-light text-primary"
                        : "text-text-secondary hover:bg-surface-alt"
                  )}
                >
                  {day.getDate()}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-text">
                Consultas em {formatDate(selectedDate, { day: "numeric", month: "long", year: "numeric" })}
              </h3>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-16">
                <CalendarIcon className="w-12 h-12 text-text-secondary/60 mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Nenhuma consulta agendada para esta data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/20 hover:bg-primary-light/30 transition-all"
                  >
                    <div className="text-center min-w-[52px]">
                      <p className="text-sm font-mono font-bold text-primary">{apt.time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{apt.patient?.name ?? "—"}</p>
                      <p className="text-xs text-text-secondary">
                        {apt.doctor.name} — {apt.doctor.specialty}
                      </p>
                    </div>
                    <Badge status={apt.status.toLowerCase() as any} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
