import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { AttendanceTimer } from "@/components/atendimento/AttendanceTimer"
import { CidSearchField, type CidSelection } from "@/components/cid/CidSearchField"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useElapsedTimer } from "@/hooks/useElapsedTimer"
import type { Appointment, Patient } from "@/types"
import { isResolvableEntityId } from "@/lib/route-ids"

const sidebarItems = [
  "Histórico de consulta",
  "Tabela de acompanhamentos",
  "Atendimento",
  "Exames e procedimentos",
  "Prescrições",
  "Documentos e atestados",
  "Imagens e anexos",
]

function attendanceStorageKey(id: string) {
  return `clinichub_attendance_started_${id}`
}

type ClinicalForm = {
  mainComplaint: string
  currentIllnessHistory: string
  physicalExam: string
  historyAndAntecedents: string
  conduct: string
  prescriptionSummary: string
  notes: string
}

const emptyClinicalForm = (): ClinicalForm => ({
  mainComplaint: "",
  currentIllnessHistory: "",
  physicalExam: "",
  historyAndAntecedents: "",
  conduct: "",
  prescriptionSummary: "",
  notes: "",
})

export default function AtendimentoPage() {
  const { toast } = useToast()
  const { hasPermission } = useAuth()
  const canAttend = hasPermission("records:write")
  const { id } = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [started, setStarted] = useState(false)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [finishOpen, setFinishOpen] = useState(false)
  const [signMode, setSignMode] = useState<"none" | "local" | "cloud">("none")
  const [starting, setStarting] = useState(false)
  const [cid, setCid] = useState<CidSelection | null>(null)
  const [savingCid, setSavingCid] = useState(false)
  const [clinical, setClinical] = useState<ClinicalForm>(emptyClinicalForm)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const elapsed = useElapsedTimer(started ? startedAt : null)

  const applyClinicalFromAppointment = useCallback((apt: Appointment) => {
    setClinical({
      mainComplaint: apt.mainComplaint ?? "",
      currentIllnessHistory: apt.currentIllnessHistory ?? "",
      physicalExam: apt.physicalExam ?? "",
      historyAndAntecedents: apt.historyAndAntecedents ?? "",
      conduct: apt.conduct ?? "",
      prescriptionSummary: apt.prescriptionSummary ?? "",
      notes: apt.notes ?? "",
    })
  }, [])

  const persistClinical = useCallback(
    (next: ClinicalForm) => {
      if (!appointment || !started || !canAttend || appointment.status === "COMPLETED") return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        try {
          await api.appointments.update(appointment.id, {
            mainComplaint: next.mainComplaint || null,
            currentIllnessHistory: next.currentIllnessHistory || null,
            physicalExam: next.physicalExam || null,
            historyAndAntecedents: next.historyAndAntecedents || null,
            conduct: next.conduct || null,
            prescriptionSummary: next.prescriptionSummary || null,
            notes: next.notes || null,
          })
        } catch (err: unknown) {
          toast(toastMessageFromApiError(err, "Erro ao salvar atendimento"), "error")
        }
      }, 700)
    },
    [appointment, started, canAttend, toast]
  )

  const updateClinicalField = (key: keyof ClinicalForm, value: string) => {
    setClinical((prev) => {
      const next = { ...prev, [key]: value }
      persistClinical(next)
      return next
    })
  }

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isResolvableEntityId(id)) return
    api.appointments
      .getById(id)
      .then((apt) => {
        setAppointment(apt)
        applyClinicalFromAppointment(apt)
        const inProgress = apt.status === "IN_PROGRESS"
        setStarted(inProgress)
        if (apt.cidCode && apt.cidDescription) {
          setCid({
            codigo: apt.cidCode,
            descricao: apt.cidDescription,
            version: (apt.cidVersion as "CID-10" | "CID-11") ?? "CID-10",
          })
        }
        if (apt.startedAt) {
          setStartedAt(apt.startedAt)
        } else if (inProgress) {
          const stored = localStorage.getItem(attendanceStorageKey(apt.id))
          if (stored) setStartedAt(stored)
        }
        if (apt.patientId) {
          return api.patients.getById(apt.patientId).then(setPatient)
        }
      })
      .catch(() => {
        api.patients
          .getById(id)
          .then((p) => {
            setPatient(p)
            const stored = localStorage.getItem(attendanceStorageKey(id))
            if (stored) {
              setStarted(true)
              setStartedAt(stored)
            }
          })
          .catch(() => setPatient(null))
      })
  }, [id])

  const handleStart = async () => {
    if (!canAttend) return
    setStarting(true)
    const now = new Date().toISOString()
    try {
      if (appointment) {
        const updated = await api.appointments.update(appointment.id, { status: "IN_PROGRESS" })
        setAppointment(updated)
        const start = updated.startedAt ?? now
        setStartedAt(start)
        localStorage.setItem(attendanceStorageKey(appointment.id), start)
      } else if (id) {
        setStartedAt(now)
        localStorage.setItem(attendanceStorageKey(id), now)
      }
      setStarted(true)
      toast("Atendimento iniciado com sucesso.")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Não foi possível iniciar o atendimento."), "error")
    } finally {
      setStarting(false)
    }
  }

  const handleCidChange = async (next: CidSelection | null) => {
    setCid(next)
    if (!appointment || !started || !canAttend) return
    setSavingCid(true)
    try {
      await api.appointments.update(appointment.id, {
        cidCode: next?.codigo ?? null,
        cidDescription: next?.descricao ?? null,
        cidVersion: next?.version ?? null,
      })
      if (next) toast("CID vinculado ao atendimento.")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao salvar CID no atendimento"), "error")
    } finally {
      setSavingCid(false)
    }
  }

  const handleFinish = async () => {
    try {
      if (appointment) {
        await api.appointments.receipt(appointment.id)
        localStorage.removeItem(attendanceStorageKey(appointment.id))
      } else if (id) {
        localStorage.removeItem(attendanceStorageKey(id))
      }
      setFinishOpen(false)
      setStarted(false)
      setStartedAt(null)
      toast("Atendimento finalizado.")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao finalizar atendimento."), "error")
    }
  }

  const displayName = patient?.name ?? appointment?.patient?.name ?? "Paciente"
  const patientId = patient?.id ?? appointment?.patientId ?? id

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-surface p-4">
        {canAttend ? (
          <Button
            className="w-full mb-4"
            variant={started ? "danger" : "primary"}
            disabled={starting}
            onClick={() => (started ? setFinishOpen(true) : handleStart())}
          >
            {starting ? "Iniciando..." : started ? "Finalizar atendimento" : "Iniciar atendimento"}
          </Button>
        ) : (
          <p className="text-xs text-text-secondary mb-4 px-1">
            Atendimento clínico disponível apenas para profissionais de saúde.
          </p>
        )}
        {started && <AttendanceTimer elapsed={elapsed} className="mb-4" />}
        <nav className="space-y-1 hidden lg:block">
          {sidebarItems.map((item, i) => (
            <button
              key={item}
              type="button"
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                i === 2 ? "bg-primary-light text-primary font-medium" : "text-text-secondary hover:bg-surface-alt"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-6 overflow-auto">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-text">Atendimento — {displayName}</h1>
            <p className="text-sm text-text-secondary">
              {appointment
                ? `${appointment.startTime ?? appointment.time} – ${appointment.endTime}`
                : `Ref: ${id}`}
            </p>
          </div>
          {started && <AttendanceTimer elapsed={elapsed} compact />}
        </div>

        <div className="grid gap-4 max-w-3xl w-full">
          {(
            [
              { key: "mainComplaint" as const, label: "Queixa principal", placeholder: "Descreva a queixa..." },
              {
                key: "currentIllnessHistory" as const,
                label: "História da moléstia atual",
                placeholder: "Evolução dos sintomas...",
              },
              { key: "physicalExam" as const, label: "Exame físico", placeholder: "Achados do exame..." },
              {
                key: "historyAndAntecedents" as const,
                label: "Histórico e antecedentes",
                placeholder: "Antecedentes pessoais e familiares...",
              },
              { label: "Hipótese diagnóstica / CID", isCid: true as const },
              { key: "conduct" as const, label: "Condutas", placeholder: "Plano terapêutico..." },
              { key: "prescriptionSummary" as const, label: "Prescrevo", placeholder: "Medicamentos e orientações..." },
              {
                key: "notes" as const,
                label: "Observações",
                placeholder: patient?.medications ? `Medicamentos: ${patient.medications}` : "Notas...",
              },
            ] as const
          ).map((field) => (
            <div key={"key" in field ? field.key : field.label}>
              <label className="block text-sm font-medium text-text mb-1.5">{field.label}</label>
              {"isCid" in field && field.isCid ? (
                <CidSearchField
                  value={cid}
                  onChange={handleCidChange}
                  disabled={!started || !canAttend || savingCid}
                />
              ) : (
                <textarea
                  rows={3}
                  value={clinical[field.key]}
                  onChange={(e) => updateClinicalField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={!started || !canAttend}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-y focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none disabled:opacity-60 disabled:bg-surface-alt"
                />
              )}
            </div>
          ))}
        </div>

        <Link to={`/prontuario/${patientId}?tab=prescricoes`}>
          <Button variant="secondary" className="gap-2">
            <FileText className="w-4 h-4" />
            Ir para prescrições
          </Button>
        </Link>
      </div>

      <Drawer
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title="Finalizar atendimento"
        footer={
          <div className="flex flex-col gap-2 w-full">
            <Button variant="secondary" onClick={handleFinish}>
              Finalizar sem assinar
            </Button>
            <Button onClick={handleFinish}>Finalizar</Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary mb-6">
          Ao finalizar um atendimento, você não poderá alterá-lo novamente. Deseja prosseguir?
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
    </div>
  )
}
