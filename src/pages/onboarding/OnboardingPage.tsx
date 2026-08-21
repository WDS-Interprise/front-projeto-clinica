import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Plus, Trash2, Building2, CalendarDays, HeartPulse, Stethoscope, UserRound, Wallet } from "lucide-react"
import { api } from "@/services/api"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { cn } from "@/lib/utils"
import { generateTimeOptions } from "@/lib/agenda-schedule"
import { OnboardingOptionCard } from "@/components/onboarding/OnboardingOptionCard"
import { OnboardingAvatar } from "@/components/onboarding/OnboardingAvatar"
import { OnboardingShell } from "@/components/onboarding/OnboardingShell"
import { markSelfRegisteredOnboardingDone, shouldShowOnboarding } from "@/lib/onboarding"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { useForceLightTheme } from "@/hooks/useForceLightTheme"
import {
  BILLING_MODES,
  BRAZIL_UFS,
  CARE_MODES,
  CREATE_ROLES,
  DAY_PRESETS,
  INVITE_ROLES,
  MEDICAL_SPECIALTIES,
  PATH_OPTIONS,
  PROFESSIONS,
  SIDEBAR,
  SLOT_OPTIONS,
  SPACE_OPTIONS,
  TEAM_SIZES,
  buildSteps,
  councilForProfession,
  isClinicalCreateRole,
  stepsToMeta,
  treatsPatients,
  type InviteRole,
  type OnboardingPath,
  type PendingInvite,
  type StepId,
} from "@/lib/onboarding-flow"

const GREEN_BTN =
  "inline-flex h-10 min-w-[8.5rem] items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-white bg-[#00A86B] hover:bg-[#00915d] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A86B]/50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
const GHOST_BTN =
  "inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
const FIELD =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00A86B]/50 focus:outline-none focus:ring-2 focus:ring-[#00A86B]/15"

type Props = { onComplete?: () => void }

export default function OnboardingPage({ onComplete }: Props) {
  useForceLightTheme()
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const { toast } = useToast()

  const [path, setPath] = useState<OnboardingPath | "">("")
  const [role, setRole] = useState("")
  const [alsoTreats, setAlsoTreats] = useState(false)
  const [clinicName, setClinicName] = useState("")
  const [space, setSpace] = useState(SPACE_OPTIONS[0].label)
  const [teamSize, setTeamSize] = useState("")
  const [profession, setProfession] = useState("")
  const [councilUf, setCouncilUf] = useState("SP")
  const [councilNumber, setCouncilNumber] = useState("")
  const [specialty, setSpecialty] = useState("Clínico Geral")
  const [dayPreset, setDayPreset] = useState(DAY_PRESETS[0].id)
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("18:00")
  const [slotMinutes, setSlotMinutes] = useState(30)
  const [careMode, setCareMode] = useState(CARE_MODES[0].label)
  const [billing, setBilling] = useState(BILLING_MODES[0].value)
  const [inviteCode, setInviteCode] = useState("")
  const [joinClinicName, setJoinClinicName] = useState("")
  const [codeBoundRole, setCodeBoundRole] = useState<InviteRole | null>(null)
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [inviteDraft, setInviteDraft] = useState<PendingInvite>({ name: "", email: "", role: "RECEPTION", profession: "" })
  const [loading, setLoading] = useState(false)
  const [validatingCode, setValidatingCode] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const stepIds = useMemo(
    () => buildSteps(path, role, alsoTreats, codeBoundRole),
    [path, role, alsoTreats, codeBoundRole]
  )
  const currentId: StepId = stepIds[Math.min(stepIndex, stepIds.length - 1)] ?? "path"
  const stepMeta = stepsToMeta(stepIds)
  const clinical =
    treatsPatients(role, alsoTreats) ||
    role === "Profissional de saúde" ||
    (path === "join" && codeBoundRole === "DOCTOR")
  const hours = generateTimeOptions(30, "06:00", "22:00")

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login", { replace: true })
  }, [navigate])

  useEffect(() => {
    setStepIndex((index) => Math.min(index, stepIds.length - 1))
  }, [stepIds.length])

  const canAdvance = (() => {
    switch (currentId) {
      case "path":
        return Boolean(path)
      case "role":
        return Boolean(role)
      case "clinic":
        return Boolean(clinicName.trim()) && Boolean(space) && Boolean(teamSize)
      case "alsoTreats":
        return true
      case "profile":
        return Boolean(profession) && Boolean(councilNumber.trim())
      case "operation":
        return Boolean(dayPreset) && Boolean(startTime) && Boolean(endTime)
      case "billing":
        return Boolean(careMode) && Boolean(billing)
      case "team":
        return true
      case "code":
        return Boolean(inviteCode.trim())
      case "done":
        return true
      default:
        return false
    }
  })()

  const validateCode = async () => {
    setValidatingCode(true)
    try {
      const result = await api.invites.previewClinicCode(inviteCode.trim())
      setJoinClinicName(result.clinicName)
      setCodeBoundRole(result.role)
      toast(
        result.roleLabel
          ? `Clínica encontrada: ${result.clinicName} · cargo do código: ${result.roleLabel}`
          : `Clínica encontrada: ${result.clinicName}`
      )
      return true
    } catch (err: unknown) {
      setJoinClinicName("")
      setCodeBoundRole(null)
      toast(toastMessageFromApiError(err, "Código inválido"), "error")
      return false
    } finally {
      setValidatingCode(false)
    }
  }

  const finish = async () => {
    setLoading(true)
    try {
      const days = DAY_PRESETS.find((item) => item.id === dayPreset)?.days ?? "1,2,3,4,5"
      const result = await api.auth.completeOnboarding({
        path: path || "create",
        roleLabel: path === "join" ? undefined : role,
        alsoTreats: role === "Proprietário / Administrador" ? alsoTreats : isClinicalCreateRole(role),
        profession: clinical ? profession : undefined,
        councilNumber: clinical ? councilNumber.trim() : undefined,
        councilUf: clinical ? councilUf : undefined,
        specialty: clinical ? specialty : undefined,
        teamSize: path === "join" ? "Convite" : teamSize,
        clinicName: path === "join" ? undefined : clinicName.trim(),
        spaceType: path === "join" ? undefined : space,
        billingModel: path === "join" ? undefined : billing,
        careMode: path === "join" ? undefined : careMode,
        operatingDays: path === "join" ? undefined : days,
        agendaStartTime: path === "join" ? undefined : startTime,
        agendaEndTime: path === "join" ? undefined : endTime,
        slotIntervalMinutes: path === "join" ? undefined : slotMinutes,
        inviteCode: path === "join" ? inviteCode.trim() : undefined,
        crm: clinical ? councilNumber.trim() : undefined,
        pendingInvites: path === "create" ? pendingInvites : undefined,
      })
      setSession({
        token: result.token,
        user: result.user,
        clinicId: result.clinicId,
        permissions: result.permissions,
        clinicName: result.clinicName,
      })
      markSelfRegisteredOnboardingDone()
      if (result.pendingApproval) {
        toast(
          codeBoundRole
            ? "Solicitação enviada. Aguarde o administrador aprovar."
            : "Solicitação enviada. O administrador vai definir seu cargo."
        )
        navigate("/aguardando-acesso", { replace: true })
        return
      }
      toast("Bem-vindo à ClinMax!")
      onComplete?.()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao concluir configuração"), "error")
    } finally {
      setLoading(false)
    }
  }

  const goNext = async () => {
    if (currentId === "code" && !joinClinicName) {
      const ok = await validateCode()
      if (!ok) return
    }
    if (currentId === "done") {
      await finish()
      return
    }
    setStepIndex((index) => Math.min(index + 1, stepIds.length - 1))
  }

  const addInvite = () => {
    if (!inviteDraft.email.trim()) {
      toast("Informe o e-mail da pessoa", "error")
      return
    }
    setPendingInvites((list) => [...list, { ...inviteDraft, email: inviteDraft.email.trim().toLowerCase() }])
    setInviteDraft({ name: "", email: "", role: "RECEPTION", profession: "" })
  }

  if (!shouldShowOnboarding()) return null

  const copy = SIDEBAR[currentId]
  const sidebar = (
    <>
      <OnboardingAvatar icon={copy.icon} className="mb-5" />
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00A86B]">{copy.kicker}</p>
      <h1 id="onboarding-title" className="text-[22px] font-bold leading-snug text-slate-800">
        {copy.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">{copy.description}</p>
    </>
  )

  let body: ReactNode = null

  if (currentId === "path") {
    body = (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PATH_OPTIONS.map((option) => (
          <OnboardingOptionCard
            key={option.id}
            label={option.label}
            description={option.description}
            icon={option.icon}
            selected={path === option.id}
            onSelect={() => {
              setPath(option.id)
              setRole("")
              setStepIndex(0)
            }}
          />
        ))}
      </div>
    )
  } else if (currentId === "role") {
    body = (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CREATE_ROLES.map((option) => (
          <OnboardingOptionCard
            key={option.label}
            label={option.label}
            description={option.description}
            icon={option.icon}
            selected={role === option.label}
            onSelect={() => setRole(option.label)}
          />
        ))}
      </div>
    )
  } else if (currentId === "clinic") {
    body = (
      <>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Como é o seu espaço de atendimento?</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {SPACE_OPTIONS.map((option) => (
            <OnboardingOptionCard
              key={option.label}
              label={option.label}
              description={option.description}
              icon={option.icon}
              selected={space === option.label}
              onSelect={() => {
                setSpace(option.label)
                if (!teamSize) setTeamSize(option.teamSize)
              }}
            />
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-800">Nome da clínica</label>
            <input className={FIELD} placeholder="Ex.: Clínica Bem Estar" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800">Quantos profissionais trabalham na clínica?</label>
            <select className={cn(FIELD, !teamSize && "text-slate-400")} value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
              <option value="">Selecione</option>
              {TEAM_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </>
    )
  } else if (currentId === "alsoTreats") {
    body = (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <OnboardingOptionCard
          label="Não, cuido apenas da gestão"
          description="Equipe, agenda, financeiro e operação. Sem CRM nem especialidade."
          icon={Building2}
          selected={!alsoTreats}
          onSelect={() => setAlsoTreats(false)}
        />
        <OnboardingOptionCard
          label="Sim, também atendo pacientes"
          description="Além da gestão, preciso de agenda e prontuário próprios."
          icon={HeartPulse}
          selected={alsoTreats}
          onSelect={() => setAlsoTreats(true)}
        />
      </div>
    )
  } else if (currentId === "profile") {
    const council = councilForProfession(profession)
    body = (
      <div className="space-y-6">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Qual é a sua profissão?</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {PROFESSIONS.map((item) => (
              <OnboardingOptionCard
                key={item.label}
                label={item.label}
                description={item.council}
                icon={Stethoscope}
                selected={profession === item.label}
                onSelect={() => setProfession(item.label)}
              />
            ))}
          </div>
        </div>
        {profession ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800">{council}</label>
              <input className={FIELD} value={councilNumber} onChange={(e) => setCouncilNumber(e.target.value)} placeholder={`Número do ${council}`} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800">UF</label>
              <select className={FIELD} value={councilUf} onChange={(e) => setCouncilUf(e.target.value)}>
                {BRAZIL_UFS.map((uf) => (
                  <option key={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
        {profession === "Médico" ? (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Especialidade</h3>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {MEDICAL_SPECIALTIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSpecialty(item)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left text-sm font-medium",
                    specialty === item ? "border-[#00A86B] text-slate-900 shadow-[0_0_0_1px_#00A86B]" : "border-slate-200 text-slate-600"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : profession ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800">Área de atuação</label>
            <input className={FIELD} value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ex.: Psicologia clínica, nutrição esportiva..." />
          </div>
        ) : null}
      </div>
    )
  } else if (currentId === "operation") {
    body = (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DAY_PRESETS.map((item) => (
            <OnboardingOptionCard
              key={item.id}
              label={item.label}
              description={item.description}
              icon={CalendarDays}
              selected={dayPreset === item.id}
              onSelect={() => setDayPreset(item.id)}
            />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800">Início</label>
            <select className={FIELD} value={startTime} onChange={(e) => setStartTime(e.target.value)}>
              {hours.map((time) => (
                <option key={time}>{time}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800">Fim</label>
            <select className={FIELD} value={endTime} onChange={(e) => setEndTime(e.target.value)}>
              {hours.map((time) => (
                <option key={time}>{time}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800">Duração da consulta</label>
            <select className={FIELD} value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))}>
              {SLOT_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutos
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  } else if (currentId === "billing") {
    body = (
      <div className="space-y-6">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Como vocês atendem?</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CARE_MODES.map((item) => (
              <OnboardingOptionCard
                key={item.label}
                label={item.label}
                description={item.description}
                icon={UserRound}
                selected={careMode === item.label}
                onSelect={() => setCareMode(item.label)}
              />
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Forma de cobrança</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {BILLING_MODES.map((item) => (
              <OnboardingOptionCard
                key={item.value}
                label={item.label}
                description={item.description}
                icon={Wallet}
                selected={billing === item.value}
                onSelect={() => setBilling(item.value)}
              />
            ))}
          </div>
        </div>
      </div>
    )
  } else if (currentId === "team") {
    const hint = INVITE_ROLES.find((item) => item.value === inviteDraft.role)?.hint
    body = (
      <div className="space-y-5">
        <p className="text-sm text-slate-500">Convide agora ou faça depois. Cada pessoa já entra com a função certa.</p>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">Novo membro</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={FIELD} placeholder="Nome" value={inviteDraft.name} onChange={(e) => setInviteDraft((d) => ({ ...d, name: e.target.value }))} />
            <input className={FIELD} placeholder="E-mail" value={inviteDraft.email} onChange={(e) => setInviteDraft((d) => ({ ...d, email: e.target.value }))} />
            <select
              className={FIELD}
              value={inviteDraft.role}
              onChange={(e) => setInviteDraft((d) => ({ ...d, role: e.target.value as InviteRole }))}
            >
              {INVITE_ROLES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {inviteDraft.role === "DOCTOR" ? (
              <select className={FIELD} value={inviteDraft.profession} onChange={(e) => setInviteDraft((d) => ({ ...d, profession: e.target.value }))}>
                <option value="">Profissão (opcional)</option>
                {PROFESSIONS.map((item) => (
                  <option key={item.label}>{item.label}</option>
                ))}
              </select>
            ) : null}
          </div>
          {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
          <button type="button" onClick={addInvite} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#00A86B]">
            <Plus className="h-4 w-4" /> Adicionar pessoa
          </button>
        </div>
        {pendingInvites.length ? (
          <ul className="space-y-2">
            {pendingInvites.map((invite, index) => (
              <li key={`${invite.email}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span>
                  <strong>{invite.name || invite.email}</strong>
                  <span className="text-slate-500"> · {INVITE_ROLES.find((item) => item.value === invite.role)?.label}</span>
                </span>
                <button type="button" onClick={() => setPendingInvites((list) => list.filter((_, i) => i !== index))} className="text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Nenhum convite na fila. Você pode fazer isso depois nas configurações.</p>
        )}
      </div>
    )
  } else if (currentId === "code") {
    body = (
      <div className="max-w-md space-y-3">
        <label className="mb-1.5 block text-sm font-medium text-slate-800">Código da clínica</label>
        <input
          className={cn(FIELD, "font-mono uppercase tracking-[0.18em]")}
          value={inviteCode}
          onChange={(e) => {
            setInviteCode(e.target.value.toUpperCase())
            setJoinClinicName("")
            setCodeBoundRole(null)
          }}
          placeholder="Ex.: A3K9X2M1"
        />
        {joinClinicName ? (
          <p className="text-sm text-[#00A86B]">
            Clínica: {joinClinicName}
            {codeBoundRole
              ? ` · cargo do código: ${INVITE_ROLES.find((item) => item.value === codeBoundRole)?.label}`
              : " · sem cargo no código"}
          </p>
        ) : null}
        <button type="button" disabled={!inviteCode.trim() || validatingCode} onClick={() => void validateCode()} className={GHOST_BTN}>
          {validatingCode ? "Validando..." : "Validar código"}
        </button>
      </div>
    )
  } else {
    const joinRoleLabel = codeBoundRole
      ? INVITE_ROLES.find((item) => item.value === codeBoundRole)?.label ?? codeBoundRole
      : "A definir pelo administrador"
    const rows = [
      ["Caminho", path === "join" ? "Entrar em clínica existente" : "Criar clínica"],
      path === "join"
        ? codeBoundRole
          ? ["Papel", joinRoleLabel]
          : null
        : ["Papel", role],
      path === "join" ? ["Clínica", joinClinicName] : ["Clínica", clinicName],
      clinical ? ["Profissão", profession] : null,
      clinical ? ["Registro", `${councilForProfession(profession)} ${councilNumber}/${councilUf}`] : null,
      path === "create" ? ["Funcionamento", `${DAY_PRESETS.find((item) => item.id === dayPreset)?.label} · ${startTime}-${endTime} · ${slotMinutes} min`] : null,
      path === "create" ? ["Recebimento", BILLING_MODES.find((item) => item.value === billing)?.label] : null,
      path === "create" ? ["Equipe", pendingInvites.length ? `${pendingInvites.length} convite(s)` : "Só eu por enquanto"] : null,
    ].filter(Boolean) as [string, string][]

    body = (
      <div className="max-w-xl rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Resumo</h2>
        <dl className="mt-4 space-y-1 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-slate-200/80 py-1.5">
              <dt className="text-slate-500">{label}</dt>
              <dd className="text-right font-medium text-slate-800">{value || "-"}</dd>
            </div>
          ))}
        </dl>
      </div>
    )
  }

  return (
    <OnboardingShell
      steps={stepMeta.slice(0, stepIndex + 1)}
      currentStep={stepIndex}
      stepKey={currentId}
      sidebar={sidebar}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button type="button" className={GHOST_BTN} disabled={stepIndex === 0 || loading} onClick={() => setStepIndex((index) => Math.max(0, index - 1))}>
            Voltar
          </button>
          <button type="button" className={GREEN_BTN} disabled={!canAdvance || loading} onClick={() => void goNext()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading
              ? "Salvando..."
              : currentId === "done"
                ? path === "join"
                  ? "Solicitar entrada"
                  : "Entrar na ClinMax"
                : currentId === "team" && pendingInvites.length === 0
                  ? "Pular"
                  : "Avançar"}
          </button>
        </div>
      }
    >
      {body}
    </OnboardingShell>
  )
}
