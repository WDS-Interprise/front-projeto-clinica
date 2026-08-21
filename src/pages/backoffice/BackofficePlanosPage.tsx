import { useEffect, useState } from "react"
import { Layers, Plus, Copy, Pencil } from "lucide-react"
import { backofficeApi } from "@/services/backoffice-api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { Button } from "@/components/ui/button"
import { PLAN_FEATURES, PLAN_FEATURE_LABELS, PLAN_LIMIT_KEYS, PLAN_LIMIT_LABELS, type PlanFeature, type PlanLimitKey } from "@/lib/plan-features"
import PlanFormModal from "@/components/backoffice/PlanFormModal"

type PlanRow = {
  id: string
  name: string
  slug: string
  active: boolean
  public: boolean
  monthlyPrice: number
  annualPrice: number
  trialDays: number
  highlighted: boolean
  displayOrder: number
  features: PlanFeature[]
  limits: Partial<Record<PlanLimitKey, number | null>>
  clinicsUsing: number
}

function formatMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function BackofficePlanosPage() {
  const { toast } = useToast()
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PlanRow | null>(null)

  const load = () => {
    setLoading(true)
    backofficeApi.plans
      .list()
      .then(setPlans)
      .catch((err: unknown) => toast(toastMessageFromApiError(err, "Erro ao carregar planos"), "error"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const toggleActive = async (plan: PlanRow) => {
    try {
      await backofficeApi.plans.update(plan.id, { active: !plan.active })
      toast(plan.active ? "Plano desativado" : "Plano ativado")
      load()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao atualizar plano"), "error")
    }
  }

  const duplicate = async (id: string) => {
    try {
      await backofficeApi.plans.duplicate(id)
      toast("Plano duplicado")
      load()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao duplicar"), "error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12261E]">Planos da plataforma</h1>
          <p className="mt-1 text-sm text-[#6B7C74]">Defina preços, recursos e limites comercializados.</p>
        </div>
        <Button
          className="gap-2 bg-[#006B4D] hover:bg-[#005a41] text-white border-0"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Criar plano
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-[#6B7C74]">Carregando planos...</p>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-[#E4EBE6] bg-white p-8 text-center">
          <Layers className="mx-auto h-10 w-10 text-[#8A9A90]" />
          <p className="mt-3 font-medium text-[#12261E]">Nenhum plano cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-[#E4EBE6] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#12261E]">{plan.name}</h2>
                    {plan.highlighted && (
                      <span className="rounded-full bg-[#E8F6EE] px-2 py-0.5 text-[10px] font-bold uppercase text-[#006B4D]">
                        Destaque
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8A9A90]">{plan.slug}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${plan.active ? "bg-[#E8F6EE] text-[#006B4D]" : "bg-slate-100 text-slate-500"}`}
                >
                  {plan.active ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[#8A9A90]">Mensal</p>
                  <p className="font-semibold text-[#12261E]">{formatMoney(plan.monthlyPrice)}</p>
                </div>
                <div>
                  <p className="text-[#8A9A90]">Anual</p>
                  <p className="font-semibold text-[#12261E]">{formatMoney(plan.annualPrice)}</p>
                </div>
                <div>
                  <p className="text-[#8A9A90]">Clínicas</p>
                  <p className="font-semibold text-[#12261E]">{plan.clinicsUsing}</p>
                </div>
                <div>
                  <p className="text-[#8A9A90]">Trial</p>
                  <p className="font-semibold text-[#12261E]">{plan.trialDays} dias</p>
                </div>
              </div>

              <p className="mt-3 text-xs text-[#6B7C74]">
                {plan.features.length} recursos · ordem {plan.displayOrder}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    setEditing(plan)
                    setModalOpen(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => duplicate(plan.id)}>
                  <Copy className="h-3.5 w-3.5" />
                  Duplicar
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleActive(plan)}>
                  {plan.active ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlanFormModal
        open={modalOpen}
        plan={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false)
          load()
        }}
      />
    </div>
  )
}

export { PLAN_FEATURES, PLAN_FEATURE_LABELS, PLAN_LIMIT_KEYS, PLAN_LIMIT_LABELS }
