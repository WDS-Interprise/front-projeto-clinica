import { Input } from "@/components/ui/input"
import TimePicker from "@/components/ui/time-picker"
import type { AgendaSchedule } from "@/lib/agenda-schedule"

type Props = {
  value: AgendaSchedule
  onChange: (value: AgendaSchedule) => void
  readOnly?: boolean
}

const configTimeOptions = {
  intervalMinutes: 15,
  startTime: "06:00",
  endTime: "22:00",
} as const

export default function AgendaScheduleCard({ value, onChange, readOnly = false }: Props) {
  const update = (patch: Partial<AgendaSchedule>) => onChange({ ...value, ...patch })

  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Horários da agenda</h2>
        <p className="text-sm text-text-secondary mt-1">
          Define o expediente exibido na agenda, o intervalo de almoço e a duração dos slots.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TimePicker
          label="Início do expediente"
          value={value.agendaStartTime}
          onChange={(agendaStartTime) => update({ agendaStartTime })}
          disabled={readOnly}
          {...configTimeOptions}
        />
        <TimePicker
          label="Fim do expediente"
          value={value.agendaEndTime}
          onChange={(agendaEndTime) => update({ agendaEndTime })}
          disabled={readOnly}
          {...configTimeOptions}
        />
        <TimePicker
          label="Início do almoço"
          value={value.lunchStartTime}
          onChange={(lunchStartTime) => update({ lunchStartTime })}
          disabled={readOnly}
          {...configTimeOptions}
        />
        <TimePicker
          label="Fim do almoço"
          value={value.lunchEndTime}
          onChange={(lunchEndTime) => update({ lunchEndTime })}
          disabled={readOnly}
          {...configTimeOptions}
        />
      </div>

      <Input
        label="Intervalo entre horários (minutos)"
        type="number"
        min={15}
        max={120}
        step={15}
        value={String(value.slotIntervalMinutes)}
        onChange={(e) => update({ slotIntervalMinutes: Number(e.target.value) || 30 })}
        readOnly={readOnly}
      />

      <p className="text-xs text-text-secondary">
        Consultas não podem ser agendadas durante o horário de almoço. Bloqueios manuais continuam
        permitidos em qualquer horário.
      </p>
    </div>
  )
}
