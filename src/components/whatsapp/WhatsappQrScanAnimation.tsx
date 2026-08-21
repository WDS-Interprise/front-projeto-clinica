import { DotLottieReact } from "@lottiefiles/dotlottie-react"

import { cn } from "@/lib/utils"

type WhatsappQrScanAnimationProps = {
  className?: string
}

export function WhatsappQrScanAnimation({ className }: WhatsappQrScanAnimationProps) {
  return (
    <DotLottieReact
      src="/animations/qr-code-scan.json"
      loop
      autoplay
      className={cn("mx-auto h-[200px] w-[160px] max-w-full", className)}
      aria-hidden
    />
  )
}
