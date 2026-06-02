import { ChevronDown, Clock } from "lucide-react"

import { fieldInputClass, fieldLabelClass } from "@/lib/form-classes"
import { generateTimeOptions } from "@/lib/agenda-schedule"
import { cn } from "@/lib/utils"

type TimePickerProps = {
  value: string
  onChange: (value: string) => void
  times?: string[]
  label?: string
  disabled?: boolean
  className?: string
  selectClassName?: string
  intervalMinutes?: number
  startTime?: string
  endTime?: string
}

export default function TimePicker({
  value,
  onChange,
  times,
  label,
  disabled = false,
  className,
  selectClassName,
  intervalMinutes = 15,
  startTime = "06:00",
  endTime = "22:00",
}: TimePickerProps) {
  const options = times ?? generateTimeOptions(intervalMinutes, startTime, endTime)
  const hasCurrentValue = !value || options.includes(value)

  return (
    <div className={cn("space-y-1", className)}>
      {label && <label className={fieldLabelClass}>{label}</label>}
      <div className="relative">
        <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={cn(
            fieldInputClass,
            "cursor-pointer appearance-none pl-10 pr-10 font-medium tabular-nums",
            selectClassName
          )}
        >
          {!hasCurrentValue && value ? <option value={value}>{value}</option> : null}
          {!value ? <option value="">Selecionar</option> : null}
          {options.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
      </div>
    </div>
  )
}
