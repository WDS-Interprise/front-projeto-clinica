import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: "md" | "lg"
  /** Use "stack" quando o drawer abre sobre outro drawer (ex.: WhatsApp na agenda). */
  layer?: "base" | "stack"
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = "md",
  layer = "base",
}: DrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className={cn(
        "fixed inset-0 flex justify-end",
        layer === "stack" ? "z-[60]" : "z-50"
      )}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar"
        onClick={onClose}
      />
      <aside
        className={cn(
          "relative h-full bg-surface shadow-2xl flex flex-col animate-in slide-in-from-right duration-200",
          width === "lg" ? "w-full max-w-lg" : "w-full max-w-md"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:bg-surface-alt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="border-t border-border px-6 py-4 bg-surface-alt">{footer}</div>
        )}
      </aside>
    </div>
  )
}
