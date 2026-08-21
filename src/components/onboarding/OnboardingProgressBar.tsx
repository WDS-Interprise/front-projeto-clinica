import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type OnboardingStepMeta = {
  id: string
  label: string
}

type Props = {
  steps: OnboardingStepMeta[]
  current: number
  className?: string
}

function Connector({ filled }: { filled: boolean }) {
  const [grow, setGrow] = useState(false)

  useEffect(() => {
    if (!filled) {
      setGrow(false)
      return
    }
    const frame = requestAnimationFrame(() => setGrow(true))
    return () => cancelAnimationFrame(frame)
  }, [filled])

  return (
    <div
      className="pointer-events-none absolute top-3 z-0 h-[2px] overflow-hidden bg-slate-200"
      style={{ left: "calc(50% + 10px)", width: "calc(100% - 20px)" }}
      aria-hidden
    >
      <div
        className="h-full origin-left bg-[#00A86B] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: grow ? "scaleX(1)" : "scaleX(0)" }}
      />
    </div>
  )
}

export function OnboardingProgressBar({ steps, current, className }: Props) {
  return (
    <ol className={cn("flex w-full items-start justify-start", className)} aria-label="Progresso do onboarding">
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <li
            key={step.id}
            className={cn(
              "relative flex w-28 shrink-0 flex-col items-center",
              index > 0 && "onboarding-step-reveal"
            )}
          >
            {index < steps.length - 1 ? <Connector filled={index < current} /> : null}
            <span
              className={cn(
                "relative z-[1] flex h-6 w-6 items-center justify-center rounded-full border bg-white text-[11px] transition-all duration-300",
                done && "delay-300 border-[#00A86B] bg-[#00A86B] text-white",
                active && "border-[#00A86B] text-[#00A86B] ring-[3px] ring-[#00A86B]/20",
                !done && !active && "border-slate-300 text-slate-300"
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? (
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              ) : (
                <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-[#00A86B]" : "bg-transparent")} />
              )}
            </span>
            <span
              className={cn(
                "mt-1.5 w-full truncate text-center text-[11px] leading-none transition-colors duration-300",
                active ? "font-semibold text-slate-900" : "font-medium text-slate-400",
                done && "text-slate-500"
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
