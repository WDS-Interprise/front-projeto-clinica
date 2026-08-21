import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { backofficeApi } from "@/services/backoffice-api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import {
  PLAN_FEATURES,
  PLAN_FEATURE_LABELS,
  PLAN_LIMIT_KEYS,
  PLAN_LIMIT_LABELS,
  type PlanFeature,
  type PlanLimitKey,
} from "@/lib/plan-features"

type PlanForm = {
  id?: string
  name: string
  slug: string
  description: string
  active: boolean
  public: boolean
  monthlyPrice: number
  annualPrice: number
  trialDays: number
  highlighted: boolean
  displayOrder: number
  features: PlanFeature[]
  limits: Partial<Record<PlanLimitKey, number | null>>
}

const empty: PlanForm = {
  name: "",
  slug: "",
  description: "",
  active: true,
  public: true,
  monthlyPrice: 0,
  annualPrice: 0,
  trialDays: 14,
  highlighted: false,
  displayOrder: 0,
  features: ["DASHBOARD", "AGENDA", "PATIENTS"],
  limits: {},
}

export default function PlanFormModal({
  open,
  plan,
  onClose,
  onSaved,
}: {
  open: boolean
  plan: Partial<PlanForm> | null
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState<PlanForm>(empty)
  const [saving, setSaving] = useState(false)
  const [unlimited, setUnlimited] = useState<Partial<Record<PlanLimitKey, boolean>>>({})

  useEffect(() => {
    if (!open) return
    if (plan) {
      setForm({ ...empty, ...plan, description: plan.description ?? "" })
      const u: Partial<Record<PlanLimitKey, boolean>> = {}
      for (const key of PLAN_LIMIT_KEYS) {
        u[key] = plan.limits?.[key] === null
      }
      setUnlimited(u)
    } else {
      setForm(empty)
      setUnlimited({})
    }
  }, [open, plan])

  const toggleFeature = (f: PlanFeature) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(f) ? prev.features.filter((x) => x !== f) : [...prev.features, f],
    }))
  }

  const setLimit = (key: PlanLimitKey, value: number | null | undefined) => {
    setForm((prev) => ({
      ...prev,
      limits: {
        ...prev.limits,
        ...(value === undefined ? {} : { [key]: value }),
      },
    }))
  }

  const submit = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast("Nome e slug são obrigatórios", "error")
      return
    }
    setSaving(true)
    const limits: Partial<Record<PlanLimitKey, number | null>> = {}
    for (const key of PLAN_LIMIT_KEYS) {
      limits[key] = unlimited[key] ? null : (form.limits[key] ?? null)
    }
    const payload = { ...form, limits }
    try {
      if (form.id) await backofficeApi.plans.update(form.id, payload)
      else await backofficeApi.plans.create(payload)
      toast(form.id ? "Plano atualizado" : "Plano criado")
      onSaved()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao salvar plano"), "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={form.id ? "Editar plano" : "Criar plano"} size="lg">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-[#6B7C74]">Nome</span>
            <input
              className="mt-1 w-full rounded-lg border border-[#E4EBE6] px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#6B7C74]">Slug</span>
            <input
              className="mt-1 w-full rounded-lg border border-[#E4EBE6] px-3 py-2 text-sm"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-[#6B7C74]">Descrição</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-[#E4EBE6] px-3 py-2 text-sm"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="text-[#6B7C74]">Mensal (R$)</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-[#E4EBE6] px-3 py-2 text-sm"
              value={form.monthlyPrice}
              onChange={(e) => setForm({ ...form, monthlyPrice: Number(e.target.value) })}
            />
          </label>
          <label className="text-sm">
            <span className="text-[#6B7C74]">Anual (R$)</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-[#E4EBE6] px-3 py-2 text-sm"
              value={form.annualPrice}
              onChange={(e) => setForm({ ...form, annualPrice: Number(e.target.value) })}
            />
          </label>
          <label className="text-sm">
            <span className="text-[#6B7C74]">Trial (dias)</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-[#E4EBE6] px-3 py-2 text-sm"
              value={form.trialDays}
              onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) })}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Ativo
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.public} onChange={(e) => setForm({ ...form, public: e.target.checked })} />
            Público
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.highlighted}
              onChange={(e) => setForm({ ...form, highlighted: e.target.checked })}
            />
            Destaque
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-[#12261E]">Recursos incluídos</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PLAN_FEATURES.map((f) => (
              <label key={f} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.features.includes(f)} onChange={() => toggleFeature(f)} />
                {PLAN_FEATURE_LABELS[f]}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-[#12261E]">Limites</p>
          <div className="space-y-3">
            {PLAN_LIMIT_KEYS.map((key) => (
              <div key={key} className="flex flex-wrap items-center gap-3">
                <span className="w-40 text-sm text-[#6B7C74]">{PLAN_LIMIT_LABELS[key]}</span>
                <input
                  type="number"
                  disabled={unlimited[key]}
                  className="w-28 rounded-lg border border-[#E4EBE6] px-2 py-1.5 text-sm disabled:opacity-50"
                  value={form.limits[key] ?? ""}
                  onChange={(e) => setLimit(key, e.target.value === "" ? undefined : Number(e.target.value))}
                />
                <label className="flex items-center gap-1 text-xs text-[#6B7C74]">
                  <input
                    type="checkbox"
                    checked={!!unlimited[key]}
                    onChange={(e) => {
                      setUnlimited((u) => ({ ...u, [key]: e.target.checked }))
                      if (e.target.checked) setLimit(key, null)
                    }}
                  />
                  Ilimitado
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button className="bg-[#006B4D] text-white hover:bg-[#005a41]" onClick={submit} disabled={saving}>
          {saving ? "Salvando..." : "Salvar plano"}
        </Button>
      </div>
    </Modal>
  )
}
