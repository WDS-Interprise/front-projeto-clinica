import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { FileText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { CidSearchField, type CidSelection } from "@/components/cid/CidSearchField"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useElapsedTimer } from "@/hooks/useElapsedTimer"
import { isResolvableEntityId } from "@/lib/route-ids"
import type { Appointment } from "@/types"
import type { AttendanceAiDraft, Encounter } from "@/types/encounter"

type ClinicalForm = {
  mainComplaint: string
  currentIllnessHistory: string
  physicalExam: string
  historyAndAntecedents: string
  conduct: string
  prescriptionSummary: string
  notes: string
}

type ClinicalTextField = {
  key: keyof ClinicalForm
  label: string
  placeholder: string
}

type CidField = {
  label: string
  isCid: true
}

type AttendanceField = ClinicalTextField | CidField

const attendanceFields: AttendanceField[] = [
  { key: "mainComplaint", label: "Queixa principal", placeholder: "Descreva a queixa..." },
  {
    key: "currentIllnessHistory",
    label: "História da moléstia atual",
    placeholder: "Evolução dos sintomas...",
  },
  { key: "physicalExam", label: "Exame físico", placeholder: "Achados do exame..." },
  {
    key: "historyAndAntecedents",
    label: "Histórico / antecedentes",
    placeholder: "Antecedentes pessoais e familiares...",
  },
  { label: "Hipóteses / CID", isCid: true },
  { key: "conduct", label: "Conduta", placeholder: "Plano terapêutico..." },
  { key: "prescriptionSummary", label: "Prescrição (resumo)", placeholder: "Medicamentos e orientações..." },
  { key: "notes", label: "Observações", placeholder: "Notas..." },
]

const emptyClinicalForm = (): ClinicalForm => ({
  mainComplaint: "",
  currentIllnessHistory: "",
  physicalExam: "",
  historyAndAntecedents: "",
  conduct: "",
  prescriptionSummary: "",
  notes: "",
})

function ageFromBirthDate(birthDate?: string | null): string | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1
  return `${age} anos`
}

function genderLabel(gender?: string | null) {
  if (gender === "M") return "Masculino"
  if (gender === "F") return "Feminino"
  if (gender === "O") return "Outro"
  return null
}

function formatClock(iso: string | null | undefined) {
  if (!iso) return "-"
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function applyClinicalFromEncounter(enc: Encounter): ClinicalForm {
  return {
    mainComplaint: enc.mainComplaint ?? "",
    currentIllnessHistory: enc.currentIllnessHistory ?? "",
    physicalExam: enc.physicalExam ?? "",
    historyAndAntecedents: enc.historyAndAntecedents ?? "",
    conduct: enc.conduct ?? "",
    prescriptionSummary: enc.prescriptionSummary ?? "",
    notes: enc.notes ?? "",
  }
}

export default function AtendimentoPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { hasPermission } = useAuth()
  const canAttend = hasPermission("records:write")
  const { id } = useParams()

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [recent, setRecent] = useState<
    Array<{
      id: string
      startedAt: string | null
      mainComplaint: string | null
      cidCode: string | null
      cidDescription: string | null
    }>
  >([])
  const [resumePrompt, setResumePrompt] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [addendumOpen, setAddendumOpen] = useState(false)
  const [addendumBody, setAddendumBody] = useState("")
  const [addendumReason, setAddendumReason] = useState("")
  const [signMode, setSignMode] = useState<"none" | "local" | "cloud">("none")
  const [starting, setStarting] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [cid, setCid] = useState<CidSelection | null>(null)
  const [savingCid, setSavingCid] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDraft, setAiDraft] = useState<AttendanceAiDraft | null>(null)
  const [clinical, setClinical] = useState<ClinicalForm>(emptyClinicalForm)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const inProgress = encounter?.status === "IN_PROGRESS"
  const completed = encounter?.status === "COMPLETED"
  const elapsed = useElapsedTimer(inProgress ? encounter?.startedAt ?? null : null)

  const hydrateEncounter = useCallback((enc: Encounter) => {
    setEncounter(enc)
    setClinical(applyClinicalFromEncounter(enc))
    setLastSavedAt(enc.lastSavedAt)
    if (enc.cidCode && enc.cidDescription) {
      setCid({
        codigo: enc.cidCode,
        descricao: enc.cidDescription,
        version: (enc.cidVersion as "CID-10" | "CID-11") ?? "CID-10",
      })
    } else {
      setCid(null)
    }
  }, [])

  const loadRecent = useCallback(async (patientId: string) => {
    try {
      const res = await api.encounters.recentByPatient(patientId)
      setRecent(res.data ?? [])
    } catch {
      setRecent([])
    }
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isResolvableEntityId(id)) return

    let cancelled = false
    ;(async () => {
      try {
        const apt = await api.appointments.getById(id)
        if (cancelled) return
        setAppointment(apt)
        if (apt.patientId) void loadRecent(apt.patientId)

        try {
          const resolved = await api.encounters.resolve(id)
          if (cancelled) return
          hydrateEncounter(resolved.encounter)
          if (resolved.encounter.status === "IN_PROGRESS") {
            setResumePrompt(true)
          }
        } catch {
          // sem encounter ainda: médico inicia depois
        }
      } catch {
        try {
          const resolved = await api.encounters.resolve(id)
          if (cancelled) return
          hydrateEncounter(resolved.encounter)
          if (resolved.encounter.appointmentId) {
            const apt = await api.appointments.getById(resolved.encounter.appointmentId)
            if (!cancelled) setAppointment(apt)
          }
          if (resolved.encounter.patientId) void loadRecent(resolved.encounter.patientId)
          if (resolved.encounter.status === "IN_PROGRESS") setResumePrompt(true)
        } catch (err: unknown) {
          toast(toastMessageFromApiError(err, "Não foi possível carregar o atendimento"), "error")
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, hydrateEncounter, loadRecent, toast])

  const persistClinical = useCallback(
    (next: ClinicalForm) => {
      if (!encounter || !canAttend || encounter.status !== "IN_PROGRESS") return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        try {
          const updated = await api.encounters.update(encounter.id, {
            mainComplaint: next.mainComplaint || null,
            currentIllnessHistory: next.currentIllnessHistory || null,
            physicalExam: next.physicalExam || null,
            historyAndAntecedents: next.historyAndAntecedents || null,
            conduct: next.conduct || null,
            prescriptionSummary: next.prescriptionSummary || null,
            notes: next.notes || null,
          })
          setEncounter(updated)
          setLastSavedAt(updated.lastSavedAt)
        } catch (err: unknown) {
          toast(toastMessageFromApiError(err, "Erro ao salvar atendimento"), "error")
        }
      }, 700)
    },
    [encounter, canAttend, toast]
  )

  const updateClinicalField = (key: keyof ClinicalForm, value: string) => {
    setClinical((prev) => {
      const next = { ...prev, [key]: value }
      persistClinical(next)
      return next
    })
  }

  const handleStart = async () => {
    if (!canAttend || !appointment) return
    setStarting(true)
    try {
      const result = await api.encounters.startFromAppointment(appointment.id)
      hydrateEncounter(result.encounter)
      setResumePrompt(false)
      if (result.alreadyCompleted) {
        toast("Este atendimento já foi finalizado. Você pode adicionar um adendo.")
      } else if (result.resumed) {
        toast("Atendimento em andamento retomado.")
      } else {
        toast("Atendimento iniciado com sucesso.")
      }
      const apt = await api.appointments.getById(appointment.id)
      setAppointment(apt)
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Não foi possível iniciar o atendimento."), "error")
    } finally {
      setStarting(false)
    }
  }

  const handleCidChange = async (next: CidSelection | null) => {
    setCid(next)
    if (!encounter || !canAttend || encounter.status !== "IN_PROGRESS") return
    setSavingCid(true)
    try {
      const updated = await api.encounters.update(encounter.id, {
        cidCode: next?.codigo ?? null,
        cidDescription: next?.descricao ?? null,
        cidVersion: next?.version ?? null,
      })
      setEncounter(updated)
      setLastSavedAt(updated.lastSavedAt)
      if (next) toast("CID vinculado ao atendimento.")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao salvar CID no atendimento"), "error")
    } finally {
      setSavingCid(false)
    }
  }

  const handleAiDraft = async () => {
    if (!encounter || !canAttend || encounter.status !== "IN_PROGRESS") return
    setAiLoading(true)
    try {
      const draft = await api.encounters.aiDraft(encounter.id)
      setAiDraft(draft)
      toast("Sugestão da IA pronta. Revise e use Inserir na evolução.")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao gerar rascunho com a IA"), "error")
    } finally {
      setAiLoading(false)
    }
  }

  const insertAiIntoEvolution = () => {
    if (!encounter || encounter.status !== "IN_PROGRESS" || !aiDraft) return
    const filled: ClinicalForm = {
      mainComplaint: aiDraft.mainComplaint || clinical.mainComplaint,
      currentIllnessHistory: aiDraft.currentIllnessHistory || clinical.currentIllnessHistory,
      physicalExam: aiDraft.physicalExam || clinical.physicalExam,
      historyAndAntecedents: aiDraft.historyAndAntecedents || clinical.historyAndAntecedents,
      conduct: aiDraft.conduct || clinical.conduct,
      prescriptionSummary: aiDraft.prescriptionSummary || clinical.prescriptionSummary,
      notes: aiDraft.notes || clinical.notes,
    }
    setClinical(filled)
    persistClinical(filled)
    toast("Sugestão inserida na evolução. Revise antes de finalizar.")
  }

  const handleFinish = async () => {
    if (!encounter || !canAttend) return
    setFinishing(true)
    try {
      const updated = await api.encounters.complete(encounter.id)
      hydrateEncounter(updated)
      setFinishOpen(false)
      setResumePrompt(false)
      if (appointment) {
        const apt = await api.appointments.getById(appointment.id)
        setAppointment(apt)
      }
      toast("Atendimento finalizado.")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao finalizar atendimento."), "error")
    } finally {
      setFinishing(false)
    }
  }

  const handleAddendum = async () => {
    if (!encounter || !canAttend) return
    try {
      const updated = await api.encounters.addAddendum(encounter.id, {
        body: addendumBody,
        reason: addendumReason || undefined,
      })
      hydrateEncounter(updated)
      setAddendumOpen(false)
      setAddendumBody("")
      setAddendumReason("")
      toast("Adendo registrado.")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao salvar adendo"), "error")
    }
  }

  const displayName =
    encounter?.patient?.name ?? appointment?.patient?.name ?? "Paciente"
  const patientId = encounter?.patientId ?? appointment?.patientId ?? null
  const age = ageFromBirthDate(encounter?.patient?.birthDate ?? appointment?.patient?.birthDate)
  const gender = genderLabel(encounter?.patient?.gender ?? appointment?.patient?.gender)
  const metaLine = [age, gender].filter(Boolean).join(" • ")

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border bg-surface px-4 py-3 lg:px-6">
        <button
          type="button"
          onClick={() => navigate("/agenda")}
          className="mb-2 text-sm font-medium text-primary"
        >
          ← Agenda
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-text truncate">{displayName}</h1>
              {inProgress && (
                <span className="inline-flex items-center rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary">
                  Em atendimento • {elapsed}
                </span>
              )}
              {completed && (
                <span className="inline-flex items-center rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                  Finalizado
                </span>
              )}
            </div>
            {metaLine ? <p className="text-sm text-text-secondary mt-0.5">{metaLine}</p> : null}
            <p className="text-sm text-text-secondary mt-1">
              {appointment
                ? `Hoje • ${appointment.startTime ?? appointment.time} • Consulta • ${appointment.insurancePlan ?? "Particular"}`
                : "Atendimento clínico"}
              {appointment?.doctor?.name ? ` • ${appointment.doctor.name}` : null}
            </p>
          </div>
          {patientId && (
            <Link to={`/prontuario/${patientId}`}>
              <Button variant="secondary">Ver prontuário</Button>
            </Link>
          )}
        </div>
      </div>

      {resumePrompt && inProgress && canAttend && (
        <div className="mx-4 mt-3 rounded-lg border border-border bg-surface-alt px-4 py-3 lg:mx-6">
          <p className="text-sm text-text">
            Você possui um atendimento em andamento para {displayName} iniciado às{" "}
            {formatClock(encounter?.startedAt)}.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button onClick={() => setResumePrompt(false)}>
              Continuar atendimento
            </Button>
            <Button variant="secondary" onClick={() => setFinishOpen(true)}>
              Encerrar atendimento
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-border bg-surface p-4 lg:w-64 lg:border-b-0 lg:border-r">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-3">
            Últimos atendimentos
          </p>
          <div className="space-y-3 mb-4">
            {recent.length === 0 ? (
              <p className="text-xs text-text-secondary">Sem atendimentos anteriores.</p>
            ) : (
              recent.map((item) => (
                <div key={item.id} className="text-sm">
                  <p className="font-medium text-text">
                    {item.startedAt
                      ? new Date(item.startedAt).toLocaleDateString("pt-BR")
                      : "-"}
                  </p>
                  <p className="text-text-secondary truncate">{item.mainComplaint || "Sem queixa"}</p>
                  {item.cidCode ? (
                    <p className="text-xs text-text-secondary">{item.cidCode}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
          {patientId && (
            <Link to={`/prontuario/${patientId}`} className="text-sm text-primary font-medium">
              Ver prontuário completo
            </Link>
          )}
        </aside>

        <div className="flex-1 min-w-0 overflow-auto p-4 lg:p-6 pb-28">
          {!encounter && canAttend && appointment && (
            <div className="max-w-3xl mb-6 rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-text-secondary mb-3">
                Inicie o atendimento para criar o registro clínico deste compromisso.
              </p>
              <Button disabled={starting} onClick={() => void handleStart()}>
                {starting ? "Iniciando..." : "Iniciar atendimento"}
              </Button>
            </div>
          )}

          {!canAttend && (
            <p className="text-sm text-text-secondary mb-4">
              Atendimento clínico disponível apenas para profissionais de saúde.
            </p>
          )}

          <div className="grid gap-4 max-w-3xl w-full">
            {attendanceFields.map((field) => (
              <div key={"key" in field ? field.key : field.label}>
                <label className="block text-sm font-medium text-text mb-1.5">{field.label}</label>
                {"isCid" in field ? (
                  <>
                    <CidSearchField
                      value={cid}
                      onChange={handleCidChange}
                      disabled={!inProgress || !canAttend || savingCid}
                    />
                    {aiDraft?.cidHint ? (
                      <p className="mt-1 text-xs text-text-secondary">
                        Sugestão da IA (revise): {aiDraft.cidHint}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <textarea
                    rows={3}
                    value={clinical[field.key]}
                    onChange={(e) => updateClinicalField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={!inProgress || !canAttend}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-y focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none disabled:opacity-60 disabled:bg-surface-alt"
                  />
                )}
              </div>
            ))}
          </div>

          {aiDraft && (aiDraft.hypotheses || aiDraft.possibleConducts || aiDraft.summary || aiDraft.mainComplaint) && (
            <div className="mt-4 max-w-3xl rounded-lg border border-border bg-surface-alt p-4 space-y-2">
              <p className="text-sm font-medium text-text">Sugestões da IA (não entram sozinhas)</p>
              {aiDraft.hypotheses ? (
                <p className="text-sm text-text-secondary">
                  <span className="font-medium text-text">Hipóteses:</span> {aiDraft.hypotheses}
                </p>
              ) : null}
              {aiDraft.possibleConducts ? (
                <p className="text-sm text-text-secondary">
                  <span className="font-medium text-text">Condutas possíveis:</span>{" "}
                  {aiDraft.possibleConducts}
                </p>
              ) : null}
              {aiDraft.summary ? (
                <p className="text-sm text-text-secondary">
                  <span className="font-medium text-text">Resumo:</span> {aiDraft.summary}
                </p>
              ) : null}
              {inProgress && canAttend && (
                <Button variant="secondary" onClick={insertAiIntoEvolution}>
                  Inserir na evolução
                </Button>
              )}
            </div>
          )}

          {patientId && (
            <div className="mt-6">
              <Link
                to={
                  encounter
                    ? `/prontuario/${patientId}?tab=prescricoes&encounterId=${encounter.id}`
                    : `/prontuario/${patientId}?tab=prescricoes`
                }
              >
                <Button variant="secondary" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Nova prescrição
                </Button>
              </Link>
            </div>
          )}

          {completed && (
            <div className="mt-8 max-w-3xl space-y-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-semibold text-text mb-1">Atendimento finalizado</p>
                <p className="text-xs text-text-secondary mb-3">
                  Evolução original • {encounter?.doctor?.name ?? appointment?.doctor?.name} •{" "}
                  {formatClock(encounter?.endedAt ?? encounter?.startedAt)}
                </p>
                {(encounter?.addendums ?? []).map((a) => (
                  <div key={a.id} className="mt-3 border-t border-border pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Adendo
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {new Date(a.createdAt).toLocaleString("pt-BR")} • {a.authorName ?? "Profissional"}
                    </p>
                    {a.reason ? (
                      <p className="text-xs text-text-secondary mt-1">Motivo: {a.reason}</p>
                    ) : null}
                    <p className="text-sm text-text mt-1 whitespace-pre-wrap">{a.body}</p>
                  </div>
                ))}
                {canAttend && (
                  <Button className="mt-3" variant="secondary" onClick={() => setAddendumOpen(true)}>
                    Adicionar adendo
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {(inProgress || (!encounter && appointment && canAttend)) && (
        <div className="fixed bottom-0 inset-x-0 z-20 border-t border-border bg-surface/95 backdrop-blur px-4 py-3 lg:pl-[calc(16rem+1.5rem)]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-text-secondary">
              {inProgress
                ? `Salvo automaticamente às ${formatClock(lastSavedAt)}`
                : "Inicie o atendimento para salvar a evolução"}
            </p>
            <div className="flex flex-wrap gap-2">
              {inProgress && canAttend && (
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  disabled={aiLoading}
                  onClick={() => void handleAiDraft()}
                >
                  <Sparkles className="h-4 w-4" />
                  {aiLoading ? "Gerando..." : "Sugerir com IA"}
                </Button>
              )}
              {inProgress && canAttend && (
                <Button onClick={() => setFinishOpen(true)}>Finalizar atendimento</Button>
              )}
              {!encounter && appointment && canAttend && (
                <Button disabled={starting} onClick={() => void handleStart()}>
                  {starting ? "Iniciando..." : "Iniciar atendimento"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Drawer
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title="Finalizar atendimento"
        footer={
          <div className="flex flex-col gap-2 w-full">
            <Button variant="secondary" disabled={finishing} onClick={() => void handleFinish()}>
              Finalizar sem assinar
            </Button>
            <Button disabled={finishing} onClick={() => void handleFinish()}>
              {finishing ? "Finalizando..." : "Finalizar"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary mb-6">
          Ao finalizar, a evolução original não poderá ser editada. Você poderá registrar adendos
          depois. Deseja prosseguir?
        </p>
        <div className="space-y-2">
          {(
            [
              ["none", "Não assinar"],
              ["local", "Certificado instalado"],
              ["cloud", "Certificado na nuvem"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-surface-alt"
            >
              <input
                type="radio"
                name="sign"
                checked={signMode === value}
                onChange={() => setSignMode(value)}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </Drawer>

      <Drawer
        open={addendumOpen}
        onClose={() => setAddendumOpen(false)}
        title="Adicionar adendo"
        footer={
          <Button onClick={() => void handleAddendum()} disabled={!addendumBody.trim()}>
            Salvar adendo
          </Button>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Motivo (opcional)</label>
            <input
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={addendumReason}
              onChange={(e) => setAddendumReason(e.target.value)}
              placeholder="Ex.: informação esquecida na consulta"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Texto do adendo</label>
            <textarea
              rows={5}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={addendumBody}
              onChange={(e) => setAddendumBody(e.target.value)}
              placeholder="Descreva o adendo..."
            />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
