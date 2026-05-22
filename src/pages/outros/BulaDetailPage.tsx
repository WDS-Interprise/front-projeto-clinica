import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { OutrosPageShell } from "@/components/outros/OutrosPageShell"
import { BulaDetailView, type BulaDetail } from "@/components/outros/BulaDetailView"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

export default function BulaDetailPage() {
  const { bulaId } = useParams<{ bulaId: string }>()
  const { toast } = useToast()
  const [detail, setDetail] = useState<BulaDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bulaId) return
    setLoading(true)
    setDetail(null)
    api.outros
      .getBulaDetail(decodeURIComponent(bulaId))
      .then(setDetail)
      .catch((err: unknown) => {
        toast(toastMessageFromApiError(err, "Erro ao carregar bula"), "error")
      })
      .finally(() => setLoading(false))
  }, [bulaId, toast])

  return (
    <OutrosPageShell title="Bula" description="Conteúdo completo para consulta clínica.">
      <div>
        <Link
          to="/outros/bulas"
          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg bg-surface text-text border border-border hover:bg-surface-alt shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à busca
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-text-secondary py-12 text-center">Carregando bula…</p>
      ) : !detail ? (
        <p className="text-sm text-text-secondary py-12 text-center">
          Não foi possível carregar esta bula.{" "}
          <Link to="/outros/bulas" className="text-primary hover:underline">
            Voltar à busca
          </Link>
        </p>
      ) : (
        <BulaDetailView detail={detail} />
      )}
    </OutrosPageShell>
  )
}
