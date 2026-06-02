import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Briefcase,
  Building2,
  HeartPulse,
  Loader2,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { api } from "@/services/api"
import { cn } from "@/lib/utils"
import { OnboardingOptionCard } from "@/components/onboarding/OnboardingOptionCard"
import { OnboardingAvatar } from "@/components/onboarding/OnboardingAvatar"
import { OnboardingShell } from "@/components/onboarding/OnboardingShell"
import {
  markSelfRegisteredOnboardingDone,
  shouldShowOnboarding,
} from "@/lib/onboarding"
import { useAuth } from "@/context/AuthContext"

const TOTAL_STEPS = 2

const roleOptions: { label: string; description: string; icon: LucideIcon }[] = [
  {
    label: "Médico",
    description: "Atendimento clínico e prontuário",
    icon: Stethoscope,
  },
  {
    label: "Recepcionista",
    description: "Agenda, pacientes e recepção",
    icon: UserRound,
  },
  {
    label: "Administrador(a) da clínica",
    description: "Gestão da operação e equipe",
    icon: Building2,
  },
  {
    label: "Consultor(a) de TI/Negócios",
    description: "Implantação e suporte ao sistema",
    icon: Briefcase,
  },
  {
    label: "Outro profissional de saúde",
    description: "Enfermagem, nutrição e outras áreas",
    icon: HeartPulse,
  },
]

const sizeOptions: { label: string; description: string; icon: LucideIcon }[] = [
  { label: "1", description: "Profissional solo ou consultório individual", icon: UserRound },
  { label: "2 a 4", description: "Equipe enxuta", icon: Users },
  { label: "5 a 10", description: "Clínica em crescimento", icon: Users },
  { label: "11 a 20", description: "Operação estruturada", icon: Building2 },
  { label: "Mais que 20", description: "Clínica de maior porte", icon: Building2 },
]

type Props = {
  onComplete?: () => void
}

export default function OnboardingPage({ onComplete }: Props) {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState("")
  const [size, setSize] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [setupMode, setSetupMode] = useState<"create" | "join">("create")
  const [inviteCode, setInviteCode] = useState("")
  const [crm, setCrm] = useState("")
  const [specialty, setSpecialty] = useState("Clínico Geral")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const progress = useMemo(
    () => (step / (TOTAL_STEPS + 1)) * 100,
    [step]
  )

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true })
    }
  }, [navigate])

  const isDoctorRole = role === "Médico" || role === "Outro profissional de saúde"

  const finish = async () => {
    setError("")
    setLoading(true)
    try {
      const result = await api.auth.completeOnboarding({
        roleLabel: role,
        teamSize: setupMode === "join" ? "Convite" : size,
        clinicName: setupMode === "join" ? undefined : clinicName.trim() || undefined,
        inviteCode: setupMode === "join" ? inviteCode.trim() : undefined,
        crm: setupMode === "join" && isDoctorRole ? crm.trim() : undefined,
        specialty: setupMode === "join" && isDoctorRole ? specialty.trim() : undefined,
      })
      setSession({
        token: result.token,
        user: result.user,
        clinicId: result.clinicId,
        permissions: result.permissions,
        clinicName: result.clinicName,
      })
      markSelfRegisteredOnboardingDone()
      onComplete?.()
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

  if (!shouldShowOnboarding()) {
    return null
  }

  const canAdvance =
    step === 0
      ? Boolean(role)
      : setupMode === "join"
        ? Boolean(inviteCode.trim()) && (!isDoctorRole || Boolean(crm.trim()))
        : Boolean(size)

  const introBlock = (
    <>
      <OnboardingAvatar className="mb-2.5" />
      <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#256993] sm:text-left text-center">
        Configuração inicial da sua conta
      </p>
      {step === 0 ? (
        <>
          <h1
            id="onboarding-title"
            className="text-[15px] font-bold leading-snug text-slate-900 sm:text-left text-center"
          >
            Qual papel você exerce na clínica/consultório?
          </h1>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 sm:text-left text-center">
            Este passo é só para quem se cadastrou pelo site. Se a clínica já criou seu
            login, use o e-mail e senha recebidos — você não verá esta tela.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-[15px] font-bold leading-snug text-slate-900 sm:text-left text-center">
            {setupMode === "join"
              ? "Entrar na clínica com código"
              : "Quantos profissionais da saúde trabalham na clínica?"}
          </h1>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 sm:text-left text-center">
            {setupMode === "join"
              ? "Digite o código recebido do administrador da clínica ou informado no e-mail de convite."
              : "Isso nos ajuda a preparar a experiência ideal para o tamanho da sua equipe."}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setSetupMode("create")}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors",
                setupMode === "create"
                  ? "bg-[#256993] text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              Criar clínica
            </button>
            <button
              type="button"
              onClick={() => setSetupMode("join")}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors",
                setupMode === "join"
                  ? "bg-[#256993] text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              Tenho código
            </button>
          </div>
          {setupMode === "create" && (
            <div className="mt-3 hidden sm:block">
              <label
                htmlFor="clinic-name"
                className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500"
              >
                Nome da clínica (opcional)
              </label>
              <input
                id="clinic-name"
                type="text"
                placeholder="Ex.: Clínica São Lucas"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#256993]/50 focus:outline-none focus:ring-2 focus:ring-[#256993]/20"
              />
            </div>
          )}
          {setupMode === "join" && (
            <div className="mt-3 space-y-3">
              <div>
                <label
                  htmlFor="invite-code"
                  className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500"
                >
                  Código da clínica
                </label>
                <input
                  id="invite-code"
                  type="text"
                  placeholder="Ex.: A3K9X2M1"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-mono uppercase tracking-[0.2em] text-slate-900 placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400 transition-colors focus:border-[#256993]/50 focus:outline-none focus:ring-2 focus:ring-[#256993]/20"
                />
              </div>
              {isDoctorRole && (
                <>
                  <div>
                    <label
                      htmlFor="crm"
                      className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500"
                    >
                      CRM
                    </label>
                    <input
                      id="crm"
                      type="text"
                      value={crm}
                      onChange={(e) => setCrm(e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 transition-colors focus:border-[#256993]/50 focus:outline-none focus:ring-2 focus:ring-[#256993]/20"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="specialty"
                      className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500"
                    >
                      Especialidade
                    </label>
                    <input
                      id="specialty"
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 transition-colors focus:border-[#256993]/50 focus:outline-none focus:ring-2 focus:ring-[#256993]/20"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </>
  )

  const optionsGrid =
    step === 0 || setupMode === "join" ? (
      step === 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {roleOptions.map((option, index, list) => (
            <OnboardingOptionCard
              key={option.label}
              label={option.label}
              description={option.description}
              icon={option.icon}
              selected={role === option.label}
              onSelect={() => setRole(option.label)}
              className={index === list.length - 1 && list.length % 2 === 1 ? "col-span-2" : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
          Preencha o código da clínica ao lado e clique em <strong>Iniciar</strong>.
        </div>
      )
    ) : (
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {sizeOptions.map((option, index, list) => (
          <OnboardingOptionCard
            key={option.label}
            label={option.label}
            description={option.description}
            icon={option.icon}
            selected={size === option.label}
            onSelect={() => setSize(option.label)}
            className={index === list.length - 1 && list.length % 2 === 1 ? "col-span-2" : undefined}
          />
        ))}
      </div>
    )

  return (
    <OnboardingShell
      progress={progress}
      stepKey={step}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || loading}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-all duration-200",
              "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#256993]/40",
              "disabled:pointer-events-none disabled:opacity-40"
            )}
          >
            Voltar
          </button>
          <button
            type="button"
            disabled={!canAdvance || loading}
            onClick={() => {
              if (step === 0) setStep(1)
              else finish()
            }}
            className={cn(
              "inline-flex h-10 min-w-[7.5rem] items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold text-white transition-all duration-300",
              "bg-[#256993] hover:bg-[#1a4f6e] shadow-lg shadow-[#256993]/25",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#256993]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Configurando..." : step === 0 ? "Avançar" : "Iniciar"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8">
        <aside className="sm:py-1">{introBlock}</aside>
        <div className="min-w-0">
          {optionsGrid}
          {step === 1 && setupMode === "create" && (
            <div className="mt-3 sm:hidden">
              <label
                htmlFor="clinic-name-mobile"
                className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500"
              >
                Nome da clínica (opcional)
              </label>
              <input
                id="clinic-name-mobile"
                type="text"
                placeholder="Ex.: Clínica São Lucas"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#256993]/50 focus:outline-none focus:ring-2 focus:ring-[#256993]/20"
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </OnboardingShell>
  )
}
