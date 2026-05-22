import { useEffect, useMemo, useState } from "react"
import { useParams, Link, useSearchParams } from "react-router-dom"
import { Eye, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PrescricaoPanel } from "@/components/prescricoes/PrescricaoPanel"
import { PatientHistorySection } from "@/components/prontuario/history/PatientHistorySection"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { useElapsedTimer } from "@/hooks/useElapsedTimer"
import type { Patient } from "@/types"
import { differenceInYears } from "date-fns"

type ProntuarioTab = "historico" | "acompanhamentos" | "prescricoes"

const sidebarNav: Array<{ id: ProntuarioTab; label: string }> = [
  { id: "historico", label: "Histórico de Consulta" },
  { id: "acompanhamentos", label: "Tabela de acompanhamentos" },
  { id: "prescricoes", label: "Prescrições" },
]

function attendanceStorageKey(id: string) {
  return `clinichub_attendance_started_${id}`
}

function isProntuarioTab(value: string | null): value is ProntuarioTab {
  return value === "historico" || value === "acompanhamentos" || value === "prescricoes"
}

export default function ProntuarioPage() {
  const { hasPermission } = useAuth()
  const canAttend = hasPermission("records:write")
  const canPrescribe = hasPermission("prescriptions:write")
  const { pacienteId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ProntuarioTab>(() => {
    const tab = searchParams.get("tab")
    return isProntuarioTab(tab) ? tab : "historico"
  })

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (isProntuarioTab(tab)) setActiveTab(tab)
  }, [searchParams])

  useEffect(() => {
    if (!pacienteId) return
    setLoading(true)
    api.patients
      .getById(pacienteId)
      .then(setPatient)
      .catch(() => setPatient(null))
      .finally(() => setLoading(false))
  }, [pacienteId])

  const inProgressAppointment = useMemo(() => {
    return patient?.appointments?.find((a) => a.status === "IN_PROGRESS")
  }, [patient?.appointments])

  const attendanceRefId = inProgressAppointment?.id ?? pacienteId ?? ""
  const storedStart =
    typeof window !== "undefined" && attendanceRefId
      ? localStorage.getItem(attendanceStorageKey(attendanceRefId))
      : null

  const startedAt =
    (inProgressAppointment as { startedAt?: string } | undefined)?.startedAt ??
    storedStart ??
    null

  const elapsed = useElapsedTimer(inProgressAppointment ? startedAt : null)

  const selectTab = (tab: ProntuarioTab) => {
    setActiveTab(tab)
    setSearchParams(tab === "historico" ? {} : { tab }, { replace: true })
  }

  if (loading) {
    return <p className="p-8 text-text-secondary">Carregando prontuário...</p>
  }

  if (!patient || !pacienteId) {
    return <p className="p-8 text-danger">Paciente não encontrado.</p>
  }

  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
  const age = differenceInYears(new Date(), new Date(patient.birthDate))
  const hasAllergies = Boolean(patient.allergies?.trim())
  const showPatientHeader = activeTab !== "prescricoes"

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      <aside className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-surface p-4">
        {canAttend ? (
          <Link to={`/atendimento/${inProgressAppointment?.id ?? pacienteId}`} className="block mb-4">
            <Button className="w-full gap-2">
              <Play className="w-4 h-4" />
              {inProgressAppointment ? "Continuar atendimento" : "Iniciar atendimento"}
            </Button>
          </Link>
        ) : (
          <p className="text-xs text-text-secondary mb-4 px-1">
            Atendimento clínico disponível apenas para profissionais de saúde.
          </p>
        )}

        <div className="mb-4 px-1">
          <div className="flex items-center gap-2 mb-2 text-sm text-text-secondary">
            <Eye className="w-4 h-4 shrink-0" />
            <span>Duração</span>
          </div>
          <div className="rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-center text-lg font-medium tabular-nums tracking-wide text-text">
            {elapsed}
          </div>
        </div>

        <nav className="space-y-1">
          {sidebarNav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === item.id
                  ? "bg-primary-light text-primary font-medium"
                  : "text-text-secondary hover:bg-surface-alt hover:text-text"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-6 overflow-auto">
        {showPatientHeader && (
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex flex-wrap items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-lg font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-text">{patient.name}</h1>
                <p className="text-sm text-text-secondary mt-1">
                  {age} anos · {patient.insurancePlan ?? "Particular"}
                  {hasAllergies ? (
                    <>
                      {" · "}
                      <span className="text-warning font-medium">Alergias: {patient.allergies}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "historico" && <PatientHistorySection patientId={pacienteId} />}

        {activeTab === "acompanhamentos" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tabela de acompanhamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="Sem acompanhamentos"
                description="Registre evoluções e retornos durante o atendimento para acompanhar o paciente."
              />
            </CardContent>
          </Card>
        )}

        {activeTab === "prescricoes" && (
          canPrescribe ? (
            <PrescricaoPanel
              embedded
              patientId={pacienteId}
              appointmentId={inProgressAppointment?.id}
              patientName={patient.name}
              patientPhone={patient.whatsapp?.trim() || patient.phone?.trim() || ""}
            />
          ) : (
            <Card>
              <CardContent className="py-8">
                <EmptyState
                  title="Sem permissão"
                  description="A prescrição digital está disponível apenas para profissionais de saúde."
                />
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  )
}
