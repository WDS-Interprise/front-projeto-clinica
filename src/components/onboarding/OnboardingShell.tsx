import { useEffect, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { OnboardingProgressBar } from "@/components/onboarding/OnboardingProgressBar"

type Props = {
  progress: number
  stepKey: string | number
  children: ReactNode
  footer: ReactNode
  className?: string
}

export function OnboardingShell({ progress, stepKey, children, footer, className }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="presentation">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className={cn(
          "relative z-10 flex w-full max-w-4xl flex-col rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/10",
          className
        )}
      >
        <div className="shrink-0 px-5 pt-4 sm:px-6 sm:pt-5">
          <OnboardingProgressBar value={progress} />
        </div>

        <div
          key={stepKey}
          className="px-5 py-4 sm:px-6 sm:py-5 animate-[onboardingFadeIn_0.35s_ease-out_both]"
        >
          {children}
        </div>

        <div className="shrink-0 border-t border-slate-200 px-5 py-3 sm:px-6">{footer}</div>
      </div>
    </div>
  )
}
