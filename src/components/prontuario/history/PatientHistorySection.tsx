import { useEffect, useState } from "react"
import { Stethoscope } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { api } from "@/services/api"
import type { PatientHistoryResponse } from "@/types/patient-history"
import { HistoryTimeline } from "./HistoryTimeline"

type Props = {
  patientId: string
}

export function PatientHistorySection({ patientId }: Props) {
  const { toast } = useToast()
  const [history, setHistory] = useState<PatientHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.patients
      .getHistory(patientId)
      .then(setHistory)
      .catch((err: unknown) => {
        setHistory(null)
        toast(toastMessageFromApiError(err, "Erro ao carregar histórico"), "error")
      })
      .finally(() => setLoading(false))
  }, [patientId, toast])

  const hasRecords = (history?.days.length ?? 0) > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary" />
          Histórico de consultas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-text-secondary py-8 text-center">Carregando histórico...</p>
        ) : hasRecords && history ? (
          <HistoryTimeline patientId={patientId} days={history.days} />
        ) : (
          <EmptyState
            title="Nenhum histórico de consulta encontrado"
            description="Os atendimentos e prescrições finalizados aparecerão aqui em formato de timeline clínica."
          />
        )}
      </CardContent>
    </Card>
  )
}
