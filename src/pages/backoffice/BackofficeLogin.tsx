import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Shield, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ThemeToggle from "@/components/ui/ThemeToggle"
import { backofficeApi } from "@/services/backoffice-api"

export default function BackofficeLogin() {
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
      await backofficeApi.login(email, password)
      navigate("/backoffice", { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-surface-alt flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 mx-auto flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text">Backoffice</h1>
            <p className="text-sm text-text-secondary mt-1">
              Somente donos da plataforma (conta com permissão de proprietário)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="[&_label]:text-text-secondary [&_input]:bg-surface-alt [&_input]:border-border [&_input]:text-text">
              <Input
                id="bo-email"
                label="E-mail do administrador"
                type="email"
                placeholder="admin@clinicare.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="bo-password" className="block text-sm font-medium text-text-secondary">
                Senha
              </label>
              <div className="relative">
                <input
                  id="bo-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-lg border border-border bg-surface-alt px-3 py-2 pr-10 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/50 border border-red-900 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-500 text-white"
              size="lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Entrando..." : "Entrar no backoffice"}
            </Button>
          </form>

          <p className="text-center text-xs text-text-secondary mt-4">
            Use as credenciais definidas em ADMIN_EMAIL / ADMIN_PASSWORD no servidor
          </p>

          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site principal
          </Link>
        </div>
      </div>
    </div>
  )
}
