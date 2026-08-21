import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, Clock3, XCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/button"
import { api } from "@/services/api"
import { getAuthHome } from "@/lib/onboarding"
import { toastMessageFromApiError } from "@/lib/api-errors"

type WaitState = "pending" | "approved" | "rejected"

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  DOCTOR: "Profissional de saúde",
  RECEPTION: "Recepcionista",
  FINANCE: "Financeiro",
  CONSULTANT: "Consultor",
}

export default function AguardandoAcessoPage() {
  const { logout, refresh, user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [state, setState] = useState<WaitState>("pending")
  const [clinicName, setClinicName] = useState<string | null>(null)
  const announced = useRef(false)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const me = await api.auth.me()
        if (cancelled) return
        if (me.clinicId && me.clinicId !== "none") {
          setState("approved")
          setClinicName(me.clinicName ?? null)
          if (!announced.current) {
            announced.current = true
            toast("Acesso aprovado. Você já pode entrar.")
          }
          return
        }
        if (me.joinRequestStatus === "REJECTED") {
          setState("rejected")
          setClinicName(me.pendingClinicName ?? null)
          return
        }
        setState("pending")
        setClinicName(me.pendingClinicName ?? null)
      } catch (err: unknown) {
        if (!cancelled) {
          toast(toastMessageFromApiError(err, "Não foi possível verificar o acesso"), "error")
        }
      }
    }

    void check()
    const timer = window.setInterval(() => void check(), 4000)
    const onFocus = () => void check()
    window.addEventListener("focus", onFocus)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener("focus", onFocus)
    }
  }, [toast])

  const enter = async () => {
    await refresh()
    navigate(getAuthHome(), { replace: true })
  }

  const roleLabel = user?.role ? ROLE_LABEL[user.role] ?? user.role : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7FAF8] px-4">
      <div className="max-w-md rounded-[10px] border border-[#E8EDF2] bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">ClinMax</p>

        {state === "approved" ? (
          <>
            <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F8F0]">
              <CheckCircle2 className="h-8 w-8 text-[#00A86B]" strokeWidth={2.2} />
            </div>
            <h1 className="mt-4 text-xl font-bold text-[#1E3A4C]">Acesso aprovado</h1>
            <p className="mt-3 text-sm text-[#475569]">
              {clinicName ? `Você já pode entrar em ${clinicName}.` : "Você já pode entrar na clínica."}
              {roleLabel ? ` Cargo: ${roleLabel}.` : ""}
            </p>
            <Button className="mt-6 w-full bg-[#00A86B] hover:bg-[#00915d]" onClick={() => void enter()}>
              Acessar
            </Button>
          </>
        ) : state === "rejected" ? (
          <>
            <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-8 w-8 text-red-500" strokeWidth={2.2} />
            </div>
            <h1 className="mt-4 text-xl font-bold text-[#1E3A4C]">Solicitação recusada</h1>
            <p className="mt-3 text-sm text-[#475569]">
              O administrador não liberou seu acesso
              {clinicName ? ` em ${clinicName}` : ""}. Você pode sair e tentar outro código depois.
            </p>
            <Button className="mt-6" variant="secondary" onClick={logout}>
              Sair
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Clock3 className="h-8 w-8 text-slate-500" strokeWidth={2.2} />
            </div>
            <h1 className="mt-4 text-xl font-bold text-[#1E3A4C]">Solicitação enviada</h1>
            <p className="mt-3 text-sm text-[#475569]">
              {clinicName
                ? `Aguardando o administrador de ${clinicName} aprovar seu acesso.`
                : "Aguardando o administrador aprovar seu acesso."}
              Esta tela atualiza sozinha quando isso acontecer.
            </p>
            <Button className="mt-6" variant="secondary" onClick={logout}>
              Sair
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
