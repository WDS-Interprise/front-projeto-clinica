import { useState, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react"
import {
  AuthCard,
  AuthError,
  AuthLogo,
  AuthPageShell,
  authInputCompactClass,
  authInputCompactWithIconClass,
  authLabelClass,
  authSubmitClass,
} from "@/components/auth/AuthLayout"
import { api } from "@/services/api"
import type { ApiFieldErrors } from "@/services/api"
import { fieldsFromApiError, messageFromApiError } from "@/lib/api-errors"
import { markSelfRegisteredUser } from "@/lib/onboarding"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import { cn } from "@/lib/utils"
import {
  formatCPFInput,
  sanitizePersonName,
  validateCPF,
  validateEmail,
  validateName,
} from "@/lib/form-validation"

function FieldHint({ message }: { message: string }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] text-red-600">
      <X className="h-3 w-3 shrink-0" />
      {message}
    </p>
  )
}

const passwordRules = [
  { label: "8+ caracteres", test: (v: string) => v.length >= 8 },
  { label: "Maiuscula", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Numero", test: (v: string) => /\d/.test(v) },
  { label: "Especial", test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
]

function getStrength(pass: string) {
  const count = passwordRules.filter((r) => r.test(pass)).length
  if (count <= 1) return { level: 1, color: "bg-red-500", label: "Fraca", textColor: "text-red-600" }
  if (count === 2) return { level: 2, color: "bg-amber-500", label: "Media", textColor: "text-amber-600" }
  if (count === 3) return { level: 3, color: "bg-yellow-400", label: "Boa", textColor: "text-yellow-600" }
  return { level: 4, color: "bg-emerald-500", label: "Forte", textColor: "text-emerald-600" }
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={cn(authLabelClass, "text-xs")}>
        {label}<span className="text-slate-900">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          className={authInputCompactWithIconClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const { setTheme } = useTheme()

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
      setSession({
        token: result.token,
        user: result.user,
        clinicId: "",
        permissions: result.permissions ?? [],
      })
      markSelfRegisteredUser()
      setTheme("light")
      navigate("/dashboard", { replace: true })
    } catch (err: unknown) {
      setFieldErrors(fieldsFromApiError(err))
      setError(messageFromApiError(err, "Erro ao cadastrar"))
    } finally {
      setLoading(false)
    }
  }

  const ruleIcon = (ok: boolean) =>
    ok ? <Check className="h-3 w-3 shrink-0 text-emerald-600" /> : <X className="h-3 w-3 shrink-0 text-slate-400" />

  return (
    <AuthPageShell wide>
      <AuthCard>
        <div className="mb-5 text-center">
          <AuthLogo compact />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Criar conta</h1>
          <p className="mt-1 text-sm text-slate-500">Preencha os dados para se cadastrar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="name" className={cn(authLabelClass, "text-xs")}>
                Nome<span className="text-slate-900">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(sanitizePersonName(e.target.value))}
                required
                className={authInputCompactClass}
              />
              {name.length > 0 && name.length < 5 && (
                <FieldHint message="Min. 5 caracteres" />
              )}
              {fieldErrors.name && <FieldHint message={fieldErrors.name} />}
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className={cn(authLabelClass, "text-xs")}>
                E-mail<span className="text-slate-900">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="exemplo@clinmax.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={authInputCompactClass}
              />
              {email.length > 0 && !emailVal.ok && <FieldHint message={emailVal.msg} />}
              {fieldErrors.email && <FieldHint message={fieldErrors.email} />}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="cpf" className={cn(authLabelClass, "text-xs")}>
              CPF<span className="text-slate-900">*</span>
            </label>
            <input
              id="cpf"
              type="text"
              placeholder="000.000.000-00"
              className={authInputCompactClass}
              value={cpf}
              onChange={(e) => setCpf(formatCPFInput(e.target.value))}
              required
              maxLength={14}
            />
            {cpf.length > 0 && !cpfVal.ok && <FieldHint message={cpfVal.msg} />}
            {fieldErrors.cpf && <FieldHint message={fieldErrors.cpf} />}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <PasswordField
              id="password"
              label="Senha"
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggleShow={() => setShowPassword(!showPassword)}
            />
            <PasswordField
              id="confirm"
              label="Repetir senha"
              value={confirm}
              onChange={setConfirm}
              show={showConfirm}
              onToggleShow={() => setShowConfirm(!showConfirm)}
            />
          </div>

          {password.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="mb-1.5 flex items-center gap-2">
                <div className="flex h-1 flex-1 gap-0.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={cn(
                        "flex-1 rounded-full transition-colors",
                        strength.level >= step ? strength.color : "bg-slate-200"
                      )}
                    />
                  ))}
                </div>
                <span className={cn("shrink-0 text-[10px] font-medium", strength.textColor)}>
                  {strength.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                {passwordRules.map((rule) => {
                  const ok = rule.test(password)
                  return (
                    <p
                      key={rule.label}
                      className={cn(
                        "flex items-center gap-1 text-[10px] leading-tight",
                        ok ? "text-emerald-600" : "text-slate-500"
                      )}
                    >
                      {ruleIcon(ok)}
                      {rule.label}
                    </p>
                  )
                })}
                <p
                  className={cn(
                    "flex items-center gap-1 text-[10px] leading-tight",
                    confirmOk ? "text-emerald-600" : "text-slate-500"
                  )}
                >
                  {ruleIcon(confirmOk)}
                  Senhas conferem
                </p>
              </div>
            </div>
          )}

          {error && <AuthError message={error} />}

          <button type="submit" disabled={!allOk || loading} className={authSubmitClass}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Cadastrando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-slate-900 hover:underline">
            Fazer login
          </Link>
        </p>
      </AuthCard>
    </AuthPageShell>
  )
}
