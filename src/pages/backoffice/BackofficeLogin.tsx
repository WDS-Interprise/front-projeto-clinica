import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    <div className="relative min-h-screen bg-[#F4F7F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#E4EBE6] rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#006B4D] text-white font-bold">
                CM
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-[#12261E]">ClinMax</p>
                <p className="text-xs text-[#6B7C74]">Backoffice privado</p>
              </div>
            </div>
            <h1 className="text-xl font-bold text-[#12261E]">Entrar no console</h1>
            <p className="text-sm text-[#6B7C74] mt-1">
              Acesso exclusivo para proprietários da plataforma
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="bo-email"
              label="E-mail"
              type="email"
              placeholder="admin@clinmax.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1">
              <label htmlFor="bo-password" className="block text-sm font-medium text-[#5B6B63]">
                Senha
              </label>
              <div className="relative">
                <input
                  id="bo-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  className="flex h-10 w-full rounded-lg border border-[#E4EBE6] bg-[#F4F7F5] px-3 py-2 pr-10 text-sm text-[#12261E] placeholder:text-[#8A9A90] focus:border-[#006B4D]/40 focus:outline-none focus:ring-2 focus:ring-[#006B4D]/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9A90] hover:text-[#12261E]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#006B4D] hover:bg-[#005a41] text-white"
              size="lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Entrando..." : "Entrar no backoffice"}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#E8F6EE] px-3 py-3 text-xs text-[#006B4D]">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Use o e-mail e senha de proprietário configurados no servidor.
            </p>
          </div>

          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-[#6B7C74] hover:text-[#12261E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site principal
          </Link>
        </div>
      </div>
    </div>
  )
}
