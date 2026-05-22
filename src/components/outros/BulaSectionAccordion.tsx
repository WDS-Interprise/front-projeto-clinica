import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  collapsible?: boolean
  variant?: "default" | "nested"
}

export function BulaSectionAccordion({
  title,
  children,
  defaultOpen = true,
  collapsible = true,
  variant = "default",
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  const isNested = variant === "nested"

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-surface overflow-hidden",
        isNested && "border-border/70 bg-surface-alt/40"
      )}
    >
      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        disabled={!collapsible}
        className={cn(
          "w-full flex items-center justify-between gap-3 text-left transition-colors",
          isNested ? "px-4 py-3" : "px-5 py-4",
          collapsible && "hover:bg-surface-alt/60 cursor-pointer",
          !collapsible && "cursor-default"
        )}
      >
        <h2
          className={cn(
            "font-semibold text-text",
            isNested ? "text-sm" : "text-base"
          )}
        >
          {title}
        </h2>
        {collapsible ? (
          <ChevronDown
            className={cn(
              "w-4 h-4 shrink-0 text-text-secondary transition-transform",
              open && "rotate-180"
            )}
          />
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            "border-t border-border",
            isNested ? "px-4 py-3" : "px-5 py-4"
          )}
        >
          {children}
        </div>
      ) : null}
    </section>
  )
}
