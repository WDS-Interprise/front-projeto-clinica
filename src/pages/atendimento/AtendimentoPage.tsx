import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Clock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
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

export default function AtendimentoPage() {
  const { hasPermission } = useAuth()
  const canAttend = hasPermission("records:write")
  const { id } = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [started, setStarted] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [signMode, setSignMode] = useState<"none" | "local" | "cloud">("none")

  useEffect(() => {
    if (!isResolvableEntityId(id)) return
    api.appointments
      .getById(id)
      .then((apt) => {
        setAppointment(apt)
        setStarted(apt.status === "IN_PROGRESS")
        if (apt.patientId) {
          return api.patients.getById(apt.patientId).then(setPatient)
        }
      })
      .catch(() => {
        api.patients.getById(id).then(setPatient).catch(() => setPatient(null))
      })
  }, [id])

  const handleStart = async () => {
    if (appointment) {
      await api.appointments.update(appointment.id, { status: "IN_PROGRESS" })
      setStarted(true)
    } else {
      setStarted(true)
    }
  }

  const handleFinish = async () => {
    if (appointment) {
      await api.appointments.receipt(appointment.id)
    }
    setFinishOpen(false)
    setStarted(false)
  }

  const displayName = patient?.name ?? appointment?.patient?.name ?? "Paciente"
  const prescricaoId = appointment?.id ?? id

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-64 shrink-0 border-r border-border bg-surface p-4">
        {canAttend ? (
          <Button
            className="w-full mb-4"
            variant={started ? "danger" : "primary"}
            onClick={() => (started ? setFinishOpen(true) : handleStart())}
          >
            {started ? "Finalizar atendimento" : "Iniciar atendimento"}
          </Button>
        ) : (
          <p className="text-xs text-text-secondary mb-4 px-1">
            Atendimento clínico disponível apenas para profissionais de saúde.
          </p>
        )}
        {started && (
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-4 px-1">
            <Clock className="w-4 h-4 text-primary" />
            <span>Em atendimento</span>
          </div>
        )}
        <nav className="space-y-1">
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

      <div className="flex-1 p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-text">Atendimento — {displayName}</h1>
          <p className="text-sm text-text-secondary">
            {appointment
              ? `${appointment.startTime ?? appointment.time} – ${appointment.endTime}`
              : `Ref: ${id}`}
          </p>
        </div>

        <div className="grid gap-4 max-w-3xl">
          {[
            { label: "Queixa principal", placeholder: "Descreva a queixa..." },
            { label: "História da doença atual", placeholder: "Evolução dos sintomas..." },
            { label: "Exame físico", placeholder: "Achados do exame..." },
            { label: "Hipótese diagnóstica", placeholder: "Diagnóstico provável..." },
            { label: "Conduta", placeholder: "Plano terapêutico..." },
            { label: "Observações", placeholder: patient?.medications ? `Medicamentos: ${patient.medications}` : "Notas..." },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-text mb-1.5">{field.label}</label>
              <textarea
                rows={3}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-y focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
              />
            </div>
          ))}
        </div>

        <Link to={`/prescricoes/${prescricaoId}`}>
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
