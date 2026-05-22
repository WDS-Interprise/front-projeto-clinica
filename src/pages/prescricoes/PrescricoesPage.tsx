import { useEffect, useState } from "react"
import { Navigate, useParams } from "react-router-dom"
import { api } from "@/services/api"
import { isResolvableEntityId } from "@/lib/route-ids"

/** Redireciona rotas antigas /prescricoes/:id para o prontuário integrado */
export default function PrescricoesPage() {
  const { atendimentoId } = useParams()
  const [patientId, setPatientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isResolvableEntityId(atendimentoId)) {
      setLoading(false)
      return
    }
    api.prescriptions
      .resolveContext(atendimentoId)
      .then((ctx) => setPatientId(ctx.patientId))
      .catch(() => {
        api.patients
          .getById(atendimentoId!)
          .then((p) => setPatientId(p.id))
          .catch(() => setPatientId(null))
      })
      .finally(() => setLoading(false))
  }, [atendimentoId])

  if (!isResolvableEntityId(atendimentoId)) {
    return <Navigate to="/pacientes" replace />
  }

  if (loading) {
    return <p className="p-8 text-text-secondary">Redirecionando...</p>
  }

  if (!patientId) {
    return <Navigate to="/pacientes" replace />
  }

  return <Navigate to={`/prontuario/${patientId}?tab=prescricoes`} replace />
}
