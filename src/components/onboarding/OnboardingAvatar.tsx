import type { OnboardingIcon } from "@/components/onboarding/OnboardingOptionCard"
import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  icon?: OnboardingIcon
}

export function OnboardingAvatar({ className, icon: Icon = Building2 }: Props) {
  return (
    <div className={cn("flex shrink-0", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#00A86B] bg-white">
        <Icon className="h-5 w-5 text-[#00A86B]" strokeWidth={1.5} />
      </div>
    </div>
  )
}
