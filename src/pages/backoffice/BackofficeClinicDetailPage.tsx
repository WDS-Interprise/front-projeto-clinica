import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Building2, ArrowLeft } from "lucide-react"
import { backofficeApi } from "@/services/backoffice-api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { SubscriptionStatusBadge, PlanBadge } from "@/components/billing/PlanBadges"
import ClinicDetailTabs from "@/components/backoffice/ClinicDetailTabs"

export default function BackofficeClinicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    backofficeApi.clinicDetail
      .get(id)
      .then(setDetail)
      .catch((err: unknown) => toast(toastMessageFromApiError(err, "Erro ao carregar clínica"), "error"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-sm text-[#6B7C74]">Carregando clínica...</p>
  if (!detail) return <p className="text-sm text-red-600">Clínica não encontrada.</p>

  const sub = detail.subscription

  return (
    <div className="space-y-6">
      <Link to="/backoffice/clinicas" className="inline-flex items-center gap-1 text-sm text-[#006B4D] hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Voltar para clínicas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#E4EBE6] bg-white p-6">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#006B4D]" />
            <h1 className="text-2xl font-bold text-[#12261E]">{detail.name}</h1>
          </div>
          <p className="mt-1 text-sm text-[#6B7C74]">
            Cadastro: {new Date(detail.createdAt).toLocaleDateString("pt-BR")} ·{" "}
            {detail.active ? "Ativa" : "Inativa"}
          </p>
          {sub && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PlanBadge name={sub.planName} />
              <SubscriptionStatusBadge status={sub.status} />
            </div>
          )}
        </div>
        {sub && (
          <Link to="/backoffice/assinaturas" className="text-sm font-semibold text-[#006B4D] hover:underline">
            Abrir assinatura
          </Link>
        )}
      </div>

      <ClinicDetailTabs detail={detail} />
    </div>
  )
}
