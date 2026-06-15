import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { AuthCard, AuthError, AuthLogo, AuthPageShell } from "@/components/auth/AuthLayout"
import { useAuth } from "@/context/AuthContext"
import { getAuthHome } from "@/lib/onboarding"

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Login com Google cancelado.",
  google_invalid_state: "Sessão expirada. Tente novamente.",
  google_no_email: "Conta Google sem e-mail disponível.",
  google_failed: "Não foi possível entrar com Google.",
  google_inactive: "Usuário inativo.",
}

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [error, setError] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get("error")
    const token = params.get("token")

    if (oauthError) {
      setError(GOOGLE_ERROR_MESSAGES[oauthError] ?? GOOGLE_ERROR_MESSAGES.google_failed)
      return
    }

    if (!token) {
      setError("Resposta inválida do login com Google.")
      return
    }

    localStorage.setItem("token", token)

    void refresh().then(() => {
      if (!localStorage.getItem("token")) {
        setError("Não foi possível concluir o login com Google.")
        return
      }
      navigate(getAuthHome(), { replace: true })
    })
  }, [navigate, refresh])

  return (
    <AuthPageShell>
      <AuthCard>
        <div className="mb-6 text-center">
          <AuthLogo />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Entrando com Google</h1>
        </div>

        {error ? (
          <>
            <AuthError message={error} />
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Voltar ao login
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Finalizando autenticação...</p>
          </div>
        )}
      </AuthCard>
    </AuthPageShell>
  )
}
