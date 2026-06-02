import { useState } from "react"
import { format, parse, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronDown } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import TimePicker from "@/components/ui/time-picker"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  value?: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  calendarClassName?: string
  defaultOpen?: boolean
}

function toDate(value?: string) {
  if (!value) return undefined
  const parsed = parse(value, "yyyy-MM-dd", new Date())
  return isValid(parsed) ? parsed : undefined
}

function formatDisplayDate(value?: string) {
  const date = toDate(value)
  if (!date) return ""
  return format(date, "dd/MM/yyyy", { locale: ptBR })
}

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Selecionar data",
  disabled = false,
  className,
  calendarClassName,
  defaultOpen = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(defaultOpen)
  const selected = toDate(value)
  const displayValue = formatDisplayDate(value)

  const handleSelect = (date?: Date) => {
    if (!date) return
    onChange(format(date, "yyyy-MM-dd"))
    setOpen(false)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-sm font-medium text-text">{label}</label>}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors",
            "hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60",
            open && "border-b border-border bg-surface-alt"
          )}
        >
          <span className={cn("font-medium", !displayValue && "text-text-secondary")}>
            {displayValue || placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div className="p-1">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              disabled={disabled}
              className={calendarClassName}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function DateTimePicker({
  date,
  onDateChange,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  startTimes,
  endTimes,
  disabled = false,
  className,
  defaultOpen = false,
}: {
  date: string
  onDateChange: (value: string) => void
  startTime: string
  endTime: string
  onStartTimeChange: (value: string) => void
  onEndTimeChange: (value: string) => void
  startTimes: string[]
  endTimes: string[]
  disabled?: boolean
  className?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const selectedDate = toDate(date)
  const summary = `${formatDisplayDate(date) || "Selecionar data"} · ${startTime} – ${endTime}`

  const handleDateSelect = (nextDate?: Date) => {
    if (!nextDate) return
    onDateChange(format(nextDate, "yyyy-MM-dd"))
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors",
          "hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60",
          open && "border-b border-border bg-surface-alt"
        )}
      >
        <span className="font-medium">{summary}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="space-y-4 p-4">
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <TimePicker
              label="Início"
              value={startTime}
              onChange={onStartTimeChange}
              times={startTimes}
              disabled={disabled}
            />
            <span className="hidden pb-2.5 text-sm text-text-secondary sm:block">às</span>
            <TimePicker
              label="Fim"
              value={endTime}
              onChange={onEndTimeChange}
              times={endTimes}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  )
}
