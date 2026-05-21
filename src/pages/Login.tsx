import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Hospital, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ThemeToggle from "@/components/ui/ThemeToggle"
import { fieldInputWithIconClass, fieldLabelClass, iconButtonMutedClass } from "@/lib/form-classes"
import { api } from "@/services/api"
import { applyAuthRedirectFlags } from "@/lib/onboarding"
import { APP_LOGIN_SUBTITLE, APP_NAME } from "@/lib/brand"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await api.auth.login(email, password)
      localStorage.setItem("token", result.token)
      localStorage.setItem("user", JSON.stringify(result.user))
      if (result.clinicId) localStorage.setItem("clinicId", result.clinicId)
      if (result.permissions) {
        localStorage.setItem("permissions", JSON.stringify(result.permissions))
      }
      const clinicName = result.clinics?.[0]?.name
      if (clinicName) localStorage.setItem("clinicName", clinicName)
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

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary via-primary-dark to-secondary flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle className="border-white/30 bg-surface/90 backdrop-blur" />
      </div>
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl shadow-2xl shadow-primary/10 p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary mx-auto flex items-center justify-center mb-4">
              <Hospital className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text">{APP_NAME}</h1>
            <p className="text-sm text-text-secondary mt-1">{APP_LOGIN_SUBTITLE}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1">
              <label htmlFor="password" className={fieldLabelClass}>
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={fieldInputWithIconClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconButtonMutedClass}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-xs text-text-secondary mt-4">
            admin@clinicare.com / admin123 · recepcao@clinicare.com / recep123
          </p>

          <p className="text-center text-sm text-text-secondary mt-4">
            Nao tem conta?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Cadastre-se
            </Link>
          </p>

          <p className="text-center text-xs text-text-secondary mt-3">
            <Link to="/backoffice/login" className="text-text-secondary hover:text-primary">
              Acesso dono da plataforma (backoffice)
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
