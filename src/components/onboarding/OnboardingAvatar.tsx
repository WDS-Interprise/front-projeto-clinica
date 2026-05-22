import { Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
}

export function OnboardingAvatar({ className }: Props) {
  return (
    <div className={cn("flex shrink-0 justify-center sm:justify-start", className)}>
      <div className="relative">
        <div
          className="absolute inset-0 scale-110 rounded-full bg-[#256993]/15 blur-lg"
          aria-hidden
        />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#256993]/15 to-[#256993]/5 ring-2 ring-[#256993]/20">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
            <Stethoscope className="h-4 w-4 text-[#256993]" strokeWidth={1.75} />
          </div>
        </div>
      </div>
    </div>
  )
}
