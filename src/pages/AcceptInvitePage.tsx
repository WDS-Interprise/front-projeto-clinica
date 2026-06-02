import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import {
  AuthCard,
  AuthError,
  AuthLogo,
  AuthPageShell,
  authInputClass,
  authLabelClass,
  authSubmitClass,
} from "@/components/auth/AuthLayout"
import { api } from "@/services/api"
import { messageFromApiError } from "@/lib/api-errors"
import { applyAuthRedirectFlags } from "@/lib/onboarding"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export default function AcceptInvitePage() {
  const { token = "" } = useParams()
  const navigate = useNavigate()
  const { setSession, user } = useAuth()
  const [preview, setPreview] = useState<{
    clinicName: string
    email: string
    roleLabel: string
    status: string
    canAccept: boolean
  } | null>(null)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [cpf, setCpf] = useState("")
  const [crm, setCrm] = useState("")
  const [specialty, setSpecialty] = useState("Clínico Geral")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const isDoctor = preview?.roleLabel.toLowerCase().includes("méd")
  const loggedInMatch = useMemo(
    () => Boolean(user && preview && user.email.toLowerCase() === preview.email.toLowerCase()),
    [user, preview]
  )

  useEffect(() => {
    if (!token) return
    api.invites
      .preview(token)
      .then((data) => {
        setPreview(data)
        setName(user?.name || "")
      })
      .catch((err: unknown) => setError(messageFromApiError(err, "Convite inválido")))
      .finally(() => setLoading(false))
  }, [token, user?.name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !preview?.canAccept) return
    setError("")
    setSubmitting(true)
    try {
      const result = loggedInMatch
        ? await api.invites.acceptAuthenticated(token, {
            crm: isDoctor ? crm : undefined,
            specialty: isDoctor ? specialty : undefined,
            phone: phone || undefined,
          })
        : await api.invites.accept(token, {
            name,
            password,
            cpf: cpf.replace(/\D/g, "") || undefined,
            crm: isDoctor ? crm : undefined,
            specialty: isDoctor ? specialty : undefined,
            phone: phone || undefined,
          })

      setSession({
        token: result.token,
        user: result.user,
        clinicId: result.clinicId,
        permissions: result.permissions,
        clinicName: result.clinicName,
      })
      applyAuthRedirectFlags({
        redirectPath: result.redirectPath,
        provisionedByClinic: result.provisionedByClinic,
        needsOnboarding: false,
      })
      navigate(result.redirectPath || "/agenda", { replace: true })
    } catch (err: unknown) {
      setError(messageFromApiError(err, "Erro ao aceitar convite"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPageShell wide>
      <AuthCard>
        <div className="mb-5 text-center">
          <AuthLogo compact />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Aceitar convite</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p>
                Você foi convidado para <strong>{preview.clinicName}</strong> como{" "}
                <strong>{preview.roleLabel}</strong>.
              </p>
              <p className="mt-1 text-slate-500">E-mail do convite: {preview.email}</p>
              {!preview.canAccept && (
                <p className="mt-2 font-medium text-red-600">Este convite não está mais disponível.</p>
              )}
            </div>

            {!loggedInMatch && preview.canAccept && (
              <p className="text-sm text-slate-500">
                Já tem conta?{" "}
                <Link to={`/login?redirect=/convite/${token}`} className="font-semibold text-slate-900 hover:underline">
                  Faça login
                </Link>{" "}
                com o mesmo e-mail do convite.
              </p>
            )}

            {loggedInMatch && (
              <p className="text-sm text-emerald-700">
                Você está logado como {user?.email}. Confirme os dados abaixo para entrar na clínica.
              </p>
            )}

            {preview.canAccept && (
              <form onSubmit={handleSubmit} className="space-y-3">
                {!loggedInMatch && (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="name" className={authLabelClass}>
                        Nome completo
                      </label>
                      <input
                        id="name"
                        className={authInputClass}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="password" className={authLabelClass}>
                        Criar senha
                      </label>
                      <input
                        id="password"
                        type="password"
                        className={authInputClass}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="cpf" className={authLabelClass}>
                        CPF (opcional)
                      </label>
                      <input
                        id="cpf"
                        className={authInputClass}
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {isDoctor && (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="crm" className={authLabelClass}>
                        CRM
                      </label>
                      <input
                        id="crm"
                        className={authInputClass}
                        value={crm}
                        onChange={(e) => setCrm(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="specialty" className={authLabelClass}>
                        Especialidade
                      </label>
                      <input
                        id="specialty"
                        className={authInputClass}
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label htmlFor="phone" className={authLabelClass}>
                    Telefone (opcional)
                  </label>
                  <input
                    id="phone"
                    className={authInputClass}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {error && <AuthError message={error} />}

                <button type="submit" disabled={submitting} className={cn(authSubmitClass)}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? "Entrando..." : "Entrar na clínica"}
                </button>
              </form>
            )}
          </div>
        ) : (
          error && <AuthError message={error} />
        )}
      </AuthCard>
    </AuthPageShell>
  )
}
