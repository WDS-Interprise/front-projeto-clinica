import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepperProps {
  steps: string[]
  current: number
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center gap-2 w-full">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2",
                  done && "bg-primary border-primary text-white",
                  active && !done && "border-primary text-primary bg-primary-light",
                  !done && !active && "border-border text-text-secondary"
                )}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:inline",
                  active ? "text-text" : "text-text-secondary"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-3",
                  i < current ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
