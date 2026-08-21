import { useState } from "react"
import { createPortal } from "react-dom"
import { Building2, ChevronDown } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useAnchoredDropdown } from "@/hooks/useAnchoredDropdown"

export default function ClinicSwitcher() {
  const { clinics, clinicId, clinicName, switchClinic } = useAuth()
  const { toast } = useToast()
  const { anchorRef, menuRef, open, toggle, close, menuStyle } = useAnchoredDropdown("right")
  const [loading, setLoading] = useState(false)

  if (!clinics || clinics.length <= 1) return null

  const handleSelect = async (id: string) => {
    if (id === clinicId || loading) {
      close()
      return
    }
    setLoading(true)
    try {
      await switchClinic(id)
      toast("Clínica alterada")
      window.location.reload()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao trocar clínica"), "error")
    } finally {
      setLoading(false)
      close()
    }
  }

  return (
    <div className="relative hidden sm:block">
      <button
        ref={anchorRef}
        type="button"
        onClick={toggle}
        disabled={loading}
        className="flex max-w-[148px] items-center gap-1.5 rounded-lg border border-[#E6EEE9] bg-[#F8FBF9] px-2 py-1.5 text-left text-[12px] font-medium text-[#1B2E26] hover:bg-[#F3F7F5] disabled:opacity-60 lg:max-w-[180px] xl:max-w-[220px] xl:px-2.5"
        title={clinicName ?? "Clínica ativa"}
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 text-[#006B4D]" />
        <span className="hidden truncate lg:inline">{clinicName ?? "Clínica"}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#64748B]" />
      </button>
      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[100]" onClick={close} aria-hidden />
            <div
              ref={menuRef}
              className="fixed z-[101] min-w-[220px] rounded-xl border border-[#E6EEE9] bg-white py-1 shadow-lg"
              style={menuStyle}
            >
              {clinics.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className={`flex w-full px-3 py-2 text-left text-[13px] hover:bg-[#F3F7F5] ${
                    c.id === clinicId ? "font-semibold text-[#006B4D]" : "text-[#1B2E26]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </div>
  )
}
