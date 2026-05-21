import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Phone, Mail, Play, Heart, AlertTriangle, Pill, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import type { Patient } from "@/types"
import { differenceInYears } from "date-fns"

const clinicalCards = [
  { title: "Antecedentes clínicos", icon: Heart },
  { title: "Antecedentes cirúrgicos", icon: Heart },
  { title: "Antecedentes familiares", icon: Heart },
  { title: "Hábitos", icon: Heart },
  { title: "Alergias", icon: AlertTriangle },
  { title: "Medicamentos em uso", icon: Pill },
]

const recordSections = [
  "Últimos diagnósticos",
  "Tabela de acompanhamento",
  "Histórico de consulta",
  "Prescrições",
  "Exames e procedimentos",
  "Documentos e atestados",
  "Imagens e anexos",
]

export default function ProntuarioPage() {
  const { hasPermission } = useAuth()
  const canEditClinical = hasPermission("records:write")
  const { pacienteId } = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pacienteId) return
    setLoading(true)
    api.patients
      .getById(pacienteId)
      .then(setPatient)
      .catch(() => setPatient(null))
      .finally(() => setLoading(false))
  }, [pacienteId])

  if (loading) {
    return <p className="p-8 text-text-secondary">Carregando prontuário...</p>
  }

  if (!patient) {
    return <p className="p-8 text-danger">Paciente não encontrado.</p>
  }

  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
  const age = differenceInYears(new Date(), new Date(patient.birthDate))

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-56 shrink-0 border-r border-border bg-surface p-4 hidden lg:block">
        <p className="text-xs font-semibold text-text-secondary uppercase mb-3 px-2">
          Seções do prontuário
        </p>
        <nav className="space-y-1">
          {recordSections.map((s, i) => (
            <button
              key={s}
              type="button"
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                i === 0
                  ? "bg-primary-light text-primary font-medium"
                  : "text-text-secondary hover:bg-surface-alt"
              }`}
            >
              {s}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-auto">
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-text">{patient.name}</h1>
              <p className="text-sm text-text-secondary mt-1">
                {age} anos · {patient.insurancePlan ?? "Particular"} ·{" "}
                {patient.allergies ? `Alergias: ${patient.allergies}` : "Sem alergias registradas"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`tel:${patient.phone}`}
                className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-border bg-surface hover:bg-surface-alt"
              >
                <Phone className="w-4 h-4" />
              </a>
              {patient.email && (
                <a
                  href={`mailto:${patient.email}`}
                  className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-border bg-surface hover:bg-surface-alt"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {canEditClinical && (
                <Link to={`/atendimento/${pacienteId}`}>
                  <Button className="gap-2">
                    <Play className="w-4 h-4" />
                    Iniciar atendimento
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clinicalCards.map(({ title, icon: Icon }) => (
            <Card key={title} className={canEditClinical ? "hover:shadow-md transition-shadow cursor-pointer" : ""}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-text">{title}</h3>
                </div>
                <p className="text-xs text-text-secondary">
                  {title === "Alergias"
                    ? patient.allergies || "Nenhuma"
                    : title === "Medicamentos em uso"
                      ? patient.medications || "Nenhum"
                      : canEditClinical
                        ? "Clique para editar"
                        : "Somente leitura"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              Histórico de consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.appointments?.length ? (
              <ul className="space-y-2 text-sm">
                {patient.appointments?.map((a) => (
                  <li key={a.id} className="flex justify-between py-2 border-b border-border">
                    <span>
                      {new Date(a.date).toLocaleDateString("pt-BR")} — {a.startTime ?? a.time}
                    </span>
                    <span className="text-text-secondary">{a.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary">Sem consultas registradas.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
