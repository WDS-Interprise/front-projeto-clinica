import { useCallback, useId, useMemo, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { useClickOutside } from "@/hooks/useClickOutside"
import { fieldInputClass, fieldLabelClass, fieldTriggerClass } from "@/lib/form-classes"
import { cn } from "@/lib/utils"

export type SelectOption = {
  value: string
  label: string
}

type SelectProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  "aria-label"?: string
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const generatedId = useId()
  const triggerId = id ?? generatedId
  const listId = `${triggerId}-list`

  const close = useCallback(() => setOpen(false), [])
  const ref = useClickOutside<HTMLDivElement>(open, close)

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  const pick = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <div className={cn("relative space-y-1", className)} ref={ref}>
      {label && (
        <label htmlFor={triggerId} className={fieldLabelClass}>
          {label}
        </label>
      )}
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel ?? label}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          fieldTriggerClass,
          "justify-between gap-2 text-left shadow-none",
          open && "border-primary ring-1 ring-primary/20",
          !selected && "text-text-secondary"
        )}
      >
        <span className="min-w-0 truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200",
            open && "rotate-180 text-primary"
          )}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={triggerId}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[#E4EBE6] bg-white p-1 shadow-[0_8px_24px_rgba(18,38,30,0.12)]"
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => pick(option.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-[#E8F6EE] font-medium text-[#006B4D]"
                      : "text-[#12261E] hover:bg-[#F4F7F5]"
                  )}
                >
                  {option.label}
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
