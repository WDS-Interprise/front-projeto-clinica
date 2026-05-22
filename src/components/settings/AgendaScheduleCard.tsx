import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AgendaSchedule } from "@/lib/agenda-schedule"

type Props = {
  value: AgendaSchedule
  onChange: (value: AgendaSchedule) => void
  readOnly?: boolean
}

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
        <div>
          <label className="block text-sm font-medium text-text mb-1">Início do expediente</label>
          <input
            type="time"
            value={value.agendaStartTime}
            onChange={(e) => update({ agendaStartTime: e.target.value })}
            disabled={readOnly}
            className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Fim do expediente</label>
          <input
            type="time"
            value={value.agendaEndTime}
            onChange={(e) => update({ agendaEndTime: e.target.value })}
            disabled={readOnly}
            className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Início do almoço</label>
          <input
            type="time"
            value={value.lunchStartTime}
            onChange={(e) => update({ lunchStartTime: e.target.value })}
            disabled={readOnly}
            className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Fim do almoço</label>
          <input
            type="time"
            value={value.lunchEndTime}
            onChange={(e) => update({ lunchEndTime: e.target.value })}
            disabled={readOnly}
            className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text disabled:opacity-60"
          />
        </div>
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
