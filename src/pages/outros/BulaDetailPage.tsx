import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { ClinicalToolsPageShell } from "@/components/clinical/ClinicalToolsPageShell"
import {
  BulaDetailView,
  extractPosologyHint,
  type BulaDetail,
} from "@/components/outros/BulaDetailView"
import { MedicationFormModal } from "@/components/prescricoes/MedicationFormModal"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import {
  isMedicamentoFavorite,
  recordMedicamentoView,
  toggleMedicamentoFavorite,
  type MedicamentoBookmark,
} from "@/lib/medicamentos-preferences"
import type { MedicationFormValues } from "@/types/prescription"

export default function BulaDetailPage() {
  const { bulaId } = useParams<{ bulaId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [detail, setDetail] = useState<BulaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorite, setFavorite] = useState(false)
  const [medModalOpen, setMedModalOpen] = useState(false)

  const fromPrescription = Boolean(
    (location.state as { fromPrescription?: boolean } | null)?.fromPrescription
  )
  const returnSearch =
    (location.state as { returnSearch?: string } | null)?.returnSearch?.trim() ?? ""
  const backHref = returnSearch
    ? `/outros/bulas?q=${encodeURIComponent(returnSearch)}`
    : "/outros/bulas"
  const bookmarkFromState = (location.state as { bookmark?: MedicamentoBookmark } | null)?.bookmark

  useEffect(() => {
    if (!bulaId) return
    setLoading(true)
    setDetail(null)
    api.outros
      .getBulaDetail(decodeURIComponent(bulaId))
      .then((data) => {
        setDetail(data)
        const bookmark: MedicamentoBookmark = bookmarkFromState ?? {
          id: `bula:${data.id}`,
          name: data.nome,
          bulaId: data.id,
        }
        recordMedicamentoView(bookmark)
        setFavorite(isMedicamentoFavorite(bookmark.id))
      })
      .catch((err: unknown) => {
        toast(toastMessageFromApiError(err, "Erro ao carregar bula"), "error")
      })
      .finally(() => setLoading(false))
    // bookmarkFromState intentionally excluded: only used on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulaId, toast])

  const bookmark: MedicamentoBookmark | null = detail
    ? (bookmarkFromState ?? { id: `bula:${detail.id}`, name: detail.nome, bulaId: detail.id })
    : null

  const handleToggleFavorite = () => {
    if (!bookmark) return
    const added = toggleMedicamentoFavorite(bookmark)
    setFavorite(added)
    toast(added ? "Adicionado aos favoritos." : "Removido dos favoritos.", "success")
  }

  const buildInitialForm = (): MedicationFormValues => {
    const posHint = detail ? extractPosologyHint(detail.secoes) : ""
    return {
      name: detail?.nome ?? "",
      presentation: detail?.secoes.apresentacoes?.slice(0, 120) ?? "",
      dosage: detail?.classes[0] ?? "",
      frequency: "",
      duration: "",
      quantity: "",
      instructions: posHint,
      continuousUse: false,
      activeIngredient: detail?.nome ?? "",
      laboratory: detail?.laboratorio?.replace(/<[^>]+>/g, "").slice(0, 120) ?? "",
    }
  }

  const handleAddToPrescription = () => {
    if (fromPrescription) {
      navigate(-1)
      return
    }
    toast("Medicamento configurado. Adicione durante um atendimento em prescrição.", "success")
  }

  return (
    <ClinicalToolsPageShell
      title="Medicamentos"
      description="Conteúdo completo da bula para consulta clínica."
    >
      <div>
        <Link
          to={backHref}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs text-text shadow-sm hover:bg-surface-alt"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à busca
        </Link>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-text-secondary">Carregando bula…</p>
      ) : !detail ? (
        <p className="py-12 text-center text-sm text-text-secondary">
          Não foi possível carregar esta bula.{" "}
          <Link to={backHref} className="text-primary hover:underline">
            Voltar à busca
          </Link>
        </p>
      ) : (
        <BulaDetailView
          detail={detail}
          isFavorite={favorite}
          onToggleFavorite={handleToggleFavorite}
          onAddToPrescription={() => setMedModalOpen(true)}
        />
      )}

      <MedicationFormModal
        open={medModalOpen}
        onClose={() => setMedModalOpen(false)}
        initialValues={detail ? buildInitialForm() : null}
        onSubmit={handleAddToPrescription}
      />
    </ClinicalToolsPageShell>
  )
}
