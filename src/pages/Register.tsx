import { useState, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Hospital, Eye, EyeOff, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ThemeToggle from "@/components/ui/ThemeToggle"
import {
  fieldInputClass,
  fieldInputWithIconClass,
  fieldLabelClass,
  iconButtonMutedClass,
} from "@/lib/form-classes"
import { api } from "@/services/api"
import type { ApiFieldErrors } from "@/services/api"
import { fieldsFromApiError, messageFromApiError } from "@/lib/api-errors"
import { markSelfRegisteredUser } from "@/lib/onboarding"

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

function validateName(name: string) {
  if (name.length < 5) return { ok: false, msg: "Minimo de 5 caracteres" }
  if (/[^a-zA-ZÀ-ÿ\s]/.test(name)) return { ok: false, msg: "Caracteres especiais nao permitidos" }
  return { ok: true, msg: "" }
}

function validateEmail(email: string) {
  if (/\s/.test(email)) return { ok: false, msg: "Nao pode conter espacos" }
  if (email.includes("@")) {
    const afterAt = email.split("@")[1]
    if (afterAt && /[^a-zA-Z0-9.\-]/.test(afterAt)) return { ok: false, msg: "Caracteres especiais nao permitidos apos @" }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, msg: "Email invalido" }
  return { ok: true, msg: "" }
}

function validateCPF(cpf: string) {
  const digits = cpf.replace(/\D/g, "")
  if (digits.length !== 11) return { ok: false, msg: "Deve ter 11 digitos" }
  return { ok: true, msg: "" }
}

const passwordRules = [
  { label: "Minimo 8 caracteres", test: (v: string) => v.length >= 8 },
  { label: "Letra maiuscula", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Numero", test: (v: string) => /\d/.test(v) },
  { label: "Caractere especial", test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
]

function getStrength(pass: string) {
  const count = passwordRules.filter((r) => r.test(pass)).length
  if (count <= 1) return { level: 1, color: "bg-danger", label: "Fraca" }
  if (count === 2) return { level: 2, color: "bg-warning", label: "Media" }
  if (count === 3) return { level: 3, color: "bg-yellow-400", label: "Boa" }
  return { level: 4, color: "bg-success", label: "Forte" }
}

export default function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [cpf, setCpf] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
  const [loading, setLoading] = useState(false)

  const nameVal = useMemo(() => validateName(name), [name])
  const emailVal = useMemo(() => validateEmail(email), [email])
  const cpfVal = useMemo(() => validateCPF(cpf), [cpf])
  const passOk = passwordRules.every((r) => r.test(password))
  const confirmOk = confirm.length > 0 && password === confirm
  const allOk = nameVal.ok && emailVal.ok && cpfVal.ok && passOk && confirmOk

  const strength = useMemo(() => getStrength(password), [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allOk) return
    setError("")
    setFieldErrors({})
    setLoading(true)
    try {
      const cpfDigits = cpf.replace(/\D/g, "")
      const result = await api.auth.register({ name, email, password, cpf: cpfDigits })
      localStorage.setItem("token", result.token)
      localStorage.setItem("user", JSON.stringify(result.user))
      if (result.permissions) {
        localStorage.setItem("permissions", JSON.stringify(result.permissions))
      }
      markSelfRegisteredUser()
      navigate("/onboarding", { replace: true })
    } catch (err: unknown) {
      setFieldErrors(fieldsFromApiError(err))
      setError(messageFromApiError(err, "Erro ao cadastrar"))
    } finally {
      setLoading(false)
    }
  }

  const icon = (ok: boolean) =>
    ok ? <Check className="w-3.5 h-3.5 text-success shrink-0" /> : <X className="w-3.5 h-3.5 text-danger shrink-0" />

  const showRealtime = password.length > 0 || confirm.length > 0

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
            <h1 className="text-2xl font-bold text-text">Criar Conta</h1>
            <p className="text-sm text-text-secondary mt-1">
              Preencha os dados para se cadastrar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                id="name"
                label="Nome completo"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))}
                required
              />
              {name.length > 0 && name.length < 5 && (
                <p className="flex items-center gap-1 mt-1 text-xs text-danger">
                  {icon(false)}
                  Minimo de 5 caracteres
                </p>
              )}
              {fieldErrors.name && (
                <p className="flex items-center gap-1 mt-1 text-xs text-danger">
                  {icon(false)}
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <Input
                id="email"
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {email.length > 0 && !emailVal.ok && (
                <p className="flex items-center gap-1 mt-1 text-xs text-danger">
                  {icon(false)}
                  {emailVal.msg}
                </p>
              )}
              {fieldErrors.email && (
                <p className="flex items-center gap-1 mt-1 text-xs text-danger">
                  {icon(false)}
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="cpf" className={`${fieldLabelClass} mb-1`}>
                CPF
              </label>
              <input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                className={fieldInputClass}
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                required
                maxLength={14}
              />
              {cpf.length > 0 && !cpfVal.ok && (
                <p className="flex items-center gap-1 mt-1 text-xs text-danger">
                  {icon(false)}
                  {cpfVal.msg}
                </p>
              )}
              {fieldErrors.cpf && (
                <p className="flex items-center gap-1 mt-1 text-xs text-danger">
                  {icon(false)}
                  {fieldErrors.cpf}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className={`${fieldLabelClass} mb-1`}>
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

            <div>
              <label htmlFor="confirm" className={`${fieldLabelClass} mb-1`}>
                Repetir senha
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className={fieldInputWithIconClass}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconButtonMutedClass}`}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {showRealtime && (
                <div className="mt-3 space-y-2 p-3 rounded-lg bg-surface-alt border border-border">
                  <div className="flex gap-1 h-2">
                    <div className={`flex-1 rounded-full transition-colors ${strength.level >= 1 ? strength.color : "bg-border"}`} />
                    <div className={`flex-1 rounded-full transition-colors ${strength.level >= 2 ? strength.color : "bg-border"}`} />
                    <div className={`flex-1 rounded-full transition-colors ${strength.level >= 3 ? strength.color : "bg-border"}`} />
                    <div className={`flex-1 rounded-full transition-colors ${strength.level >= 4 ? strength.color : "bg-border"}`} />
                  </div>

                  <p className={`text-xs font-medium ${strength.level <= 1 ? "text-danger" : strength.level === 2 ? "text-warning" : "text-success"}`}>
                    {strength.label}
                  </p>

                  <div className="space-y-1">
                    {passwordRules.map((rule) => {
                      const ok = rule.test(password)
                      return (
                        <p key={rule.label} className={`flex items-center gap-1 text-xs ${ok ? "text-success" : "text-text-secondary"}`}>
                          {icon(ok)}
                          {rule.label}
                        </p>
                      )
                    })}
                    <p className={`flex items-center gap-1 text-xs ${confirmOk ? "text-success" : "text-text-secondary"}`}>
                      {icon(confirmOk)}
                      Senhas conferem
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={!allOk || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Cadastrando..." : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Ja tem conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
