import { cn } from "@/lib/utils"

type Props = {
  value: number
  className?: string
}

export function OnboardingProgressBar({ value, className }: Props) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#256993] to-[#3d8fc4] transition-all duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
