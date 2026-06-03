import { cn } from "@/lib/utils"

type Props = {
  /** Mensagens da clínica/IA à direita; do paciente à esquerda */
  side: "left" | "right"
  label?: string
}

export default function WhatsappTypingBubble({ side, label }: Props) {
  return (
    <div className={cn("flex", side === "right" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-lg px-4 py-3 shadow-sm",
          side === "right"
            ? "rounded-tr-none bg-[#d9fdd3]"
            : "rounded-tl-none bg-white"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span
              className={cn(
                "h-2 w-2 animate-bounce rounded-full [animation-duration:1s]",
                side === "right" ? "bg-[#008069]" : "bg-[#8696a0]"
              )}
              style={{ animationDelay: "0ms" }}
            />
            <span
              className={cn(
                "h-2 w-2 animate-bounce rounded-full [animation-duration:1s]",
                side === "right" ? "bg-[#008069]" : "bg-[#8696a0]"
              )}
              style={{ animationDelay: "160ms" }}
            />
            <span
              className={cn(
                "h-2 w-2 animate-bounce rounded-full [animation-duration:1s]",
                side === "right" ? "bg-[#008069]" : "bg-[#8696a0]"
              )}
              style={{ animationDelay: "320ms" }}
            />
          </div>
          {label && (
            <span className="text-[11px] text-[#667781]">{label}</span>
          )}
        </div>
      </div>
    </div>
  )
}
