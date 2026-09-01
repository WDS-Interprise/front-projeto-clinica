import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: "md" | "lg" | "xl" | "2xl"
  zIndexClass?: string
}

export function Modal({ open, onClose, title, children, footer, size = "md", zIndexClass = "z-50" }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4`}>
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        className={`relative w-full bg-white rounded-[10px] shadow-xl border border-[#E8EDF2] ${
          size === "2xl" ? "max-w-5xl" : size === "xl" ? "max-w-4xl" : size === "lg" ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8EDF2]">
          <h2 className="text-lg font-bold text-[#1E3A4C]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:bg-surface-alt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="max-h-[min(72vh,40rem)] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border">{footer}</div>}
      </div>
    </div>
  )
}
