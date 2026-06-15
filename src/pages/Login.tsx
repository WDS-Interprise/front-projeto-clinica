import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AuthBackofficeLink,
  AuthCard,
  AuthDivider,
  AuthError,
  AuthLogo,
  AuthPageShell,
  AuthSocialButtons,
  authInputClass,
  authInputWithIconClass,
  authLabelClass,
  authSubmitClass,
} from "@/components/auth/AuthLayout"
import { api } from "@/services/api"
import { applyAuthRedirectFlags } from "@/lib/onboarding"
import { useAuth } from "@/context/AuthContext"
import { getGoogleAuthStartUrl } from "@/lib/api-origin"

const REMEMBER_EMAIL_KEY = "clinmax_remember_email"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()
  const { setSession } = useAuth()

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY)
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberDevice(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await api.auth.login(email, password)
      const clinicName = result.clinics?.[0]?.name

      setSession({
        token: result.token,
        user: result.user,
        clinicId: result.clinicId,
        permissions: result.permissions ?? [],
        clinicName,
      })

      if (rememberDevice) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email)
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      }

      const home = result.redirectPath || "/dashboard"
      applyAuthRedirectFlags({
        redirectPath: home,
        provisionedByClinic: result.provisionedByClinic,
        needsOnboarding: result.needsOnboarding,
      })
      navigate(home, { replace: true })
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    setError("")
    setGoogleLoading(true)
    window.location.href = getGoogleAuthStartUrl()
  }

  return (
    <AuthPageShell footer={<AuthBackofficeLink />}>
      <AuthCard>
        <div className="mb-7 text-center">
          <AuthLogo />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Bem-vindo ao Clinmax
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">Faça login na sua conta agora</p>
        </div>

        <AuthSocialButtons onGoogleClick={handleGoogleLogin} googleLoading={googleLoading} />
        <AuthDivider text="ou faça login com" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className={authLabelClass}>
              E-mail<span className="text-slate-900">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="exemplo@clinmax.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={authInputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className={authLabelClass}>
              Senha<span className="text-slate-900">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={authInputWithIconClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-0.5">
            <label htmlFor="remember-device" className="flex cursor-pointer items-center gap-2.5">
              <Checkbox
                id="remember-device"
                checked={rememberDevice}
                onCheckedChange={setRememberDevice}
              />
              <span className="text-xs text-slate-600 sm:text-sm">Lembre-se deste dispositivo</span>
            </label>
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 sm:text-sm"
            >
              Esqueceu sua senha?
            </button>
          </div>

          {error && <AuthError message={error} />}

          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Não tem uma conta?{" "}
          <Link to="/register" className="font-semibold text-slate-900 hover:underline">
            Crie uma conta.
          </Link>
        </p>
      </AuthCard>
    </AuthPageShell>
  )
}
