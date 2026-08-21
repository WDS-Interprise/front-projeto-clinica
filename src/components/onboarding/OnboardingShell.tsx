import { useEffect, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { OnboardingProgressBar, type OnboardingStepMeta } from "@/components/onboarding/OnboardingProgressBar"

type Props = {
  steps: OnboardingStepMeta[]
  currentStep: number
  stepKey: string | number
  sidebar: ReactNode
  children: ReactNode
  footer: ReactNode
  className?: string
}

export function OnboardingShell({
  steps,
  currentStep,
  stepKey,
  sidebar,
  children,
  footer,
  className,
}: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="presentation">
      <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px]" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className={cn(
          "relative z-10 flex max-h-[min(92vh,880px)] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20",
          className
        )}
      >
        <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-8">
          <OnboardingProgressBar steps={steps} current={currentStep} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="shrink-0 border-b border-slate-100 bg-[#f3f5f7] px-6 py-6 lg:w-[260px] lg:border-b-0 lg:border-r lg:py-8 xl:w-[300px]">
            {sidebar}
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div
              key={stepKey}
              className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6 animate-[onboardingFadeIn_0.35s_ease-out_both]"
            >
              {children}
            </div>
            <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3.5 sm:px-8">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
