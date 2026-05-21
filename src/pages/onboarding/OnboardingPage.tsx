import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/services/api"
import {
  ONBOARDING_KEY,
  shouldSkipOnboarding,
  markSelfRegisteredOnboardingDone,
  isSelfRegisteredUser,
  getAuthHome,
  setAuthHome,
} from "@/lib/onboarding"

const roles = [
  "Médico",
  "Recepcionista",
  "Administrador(a) da clínica",
  "Consultor(a) de TI/Negócios",
  "Outro profissional de saúde",
]

const sizes = ["1", "2 a 4", "5 a 10", "11 a 20", "Mais que 20"]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState("")
  const [size, setSize] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true })
      return
    }
    if (shouldSkipOnboarding()) {
      navigate(getAuthHome(), { replace: true })
    }
  }, [navigate])

  const finish = async () => {
    setError("")
    setLoading(true)
    try {
      const result = await api.auth.completeOnboarding({
        roleLabel: role,
        teamSize: size,
        clinicName: clinicName.trim() || undefined,
      })
      localStorage.setItem("token", result.token)
      localStorage.setItem("user", JSON.stringify(result.user))
      localStorage.setItem("clinicId", result.clinicId)
      localStorage.setItem("permissions", JSON.stringify(result.permissions))
      if (result.clinicName) localStorage.setItem("clinicName", result.clinicName)
      const home = "/dashboard"
      setAuthHome(home)
      markSelfRegisteredOnboardingDone()
      navigate(home, { replace: true })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar configuração"
      if (msg.toLowerCase().includes("token")) {
        localStorage.removeItem("token")
        setError("Sessão expirada ou inválida. Faça login ou cadastre-se novamente.")
        setTimeout(() => navigate("/login", { replace: true }), 2000)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isSelfRegisteredUser() && localStorage.getItem(ONBOARDING_KEY)) {
    return null
  }

  if (shouldSkipOnboarding() && !isSelfRegisteredUser()) {
    return null
  }

  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-surface rounded-2xl border border-border shadow-lg p-8">
        <p className="text-xs text-primary font-medium mb-4 uppercase tracking-wide">
          Configuração inicial da sua conta
        </p>

        {step === 0 && (
          <>
            <h1 className="text-xl font-bold text-text mb-2">
              Qual papel você exerce na clínica/consultório?
            </h1>
            <p className="text-sm text-text-secondary mb-4">
              Este passo é só para quem se cadastrou pelo site. Se a clínica já criou seu
              login, use o e-mail e senha recebidos — você não verá esta tela.
            </p>
            <div className="space-y-2 mt-6">
              {roles.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    role === r ? "border-primary bg-primary-light/50" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={role === r}
                    onChange={() => setRole(r)}
                  />
                  <span className="text-sm font-medium">{r}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between mt-8">
              <Button variant="ghost" disabled>
                Voltar
              </Button>
              <Button disabled={!role} onClick={() => setStep(1)}>
                Avançar
              </Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-xl font-bold text-text mb-2">
              Quantos profissionais da saúde trabalham na clínica?
            </h1>
            <div className="space-y-2 mt-6">
              {sizes.map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${
                    size === s ? "border-primary bg-primary-light/50" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="size"
                    checked={size === s}
                    onChange={() => setSize(s)}
                  />
                  <span className="text-sm font-medium">{s}</span>
                </label>
              ))}
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-text mb-1">
                Nome da clínica (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex.: Clínica São Lucas"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full h-10 rounded-lg border border-border px-3 text-sm"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-4">
                {error}
              </p>
            )}
            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={() => setStep(0)} disabled={loading}>
                Voltar
              </Button>
              <Button disabled={!size || loading} onClick={finish}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Configurando..." : "Iniciar"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
