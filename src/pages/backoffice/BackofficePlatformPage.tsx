import { useEffect, useState } from "react"
import { backofficeApi } from "@/services/backoffice-api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { Button } from "@/components/ui/button"

export default function BackofficePlatformPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([backofficeApi.platformSettings.get(), backofficeApi.plans.list()])
      .then(([s, p]) => {
        setSettings(s)
        setPlans(p.filter((x: any) => x.active))
      })
      .catch((err: unknown) => toast(toastMessageFromApiError(err, "Erro ao carregar configurações"), "error"))
  }, [])

  const save = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const updated = await backofficeApi.platformSettings.update(settings)
      setSettings(updated)
      toast("Configurações salvas")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao salvar"), "error")
    } finally {
      setSaving(false)
    }
  }

  if (!settings) {
    return <p className="text-sm text-[#6B7C74]">Carregando configurações...</p>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#12261E]">Configurações da plataforma</h1>
        <p className="mt-1 text-sm text-[#6B7C74]">Billing SaaS, trial padrão e cadastros.</p>
      </div>

      <div className="rounded-xl border border-[#E4EBE6] bg-white p-6 space-y-4">
        <label className="block text-sm">
          <span className="text-[#6B7C74]">Plano padrão para novas clínicas</span>
          <select
            className="mt-1 w-full rounded-lg border border-[#E4EBE6] px-3 py-2 text-sm"
            value={settings.defaultPlanId ?? ""}
            onChange={(e) => setSettings({ ...settings, defaultPlanId: e.target.value || null })}
          >
            <option value="">Selecione...</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-[#6B7C74]">Dias de trial padrão</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-[#E4EBE6] px-3 py-2 text-sm"
            value={settings.defaultTrialDays}
            onChange={(e) => setSettings({ ...settings, defaultTrialDays: Number(e.target.value) })}
          />
        </label>

        <label className="block text-sm">
          <span className="text-[#6B7C74]">Dias de tolerância após vencimento</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-[#E4EBE6] px-3 py-2 text-sm"
            value={settings.gracePeriodDays}
            onChange={(e) => setSettings({ ...settings, gracePeriodDays: Number(e.target.value) })}
          />
        </label>

        <label className="block text-sm">
          <span className="text-[#6B7C74]">E-mail financeiro</span>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-[#E4EBE6] px-3 py-2 text-sm"
            value={settings.billingEmail ?? ""}
            onChange={(e) => setSettings({ ...settings, billingEmail: e.target.value || null })}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.newSignupsEnabled}
            onChange={(e) => setSettings({ ...settings, newSignupsEnabled: e.target.checked })}
          />
          Permitir novos cadastros de clínicas
        </label>

        <p className="text-xs text-[#8A9A90]">
          Chaves da API Asaas permanecem no servidor (.env). Não são editáveis aqui.
        </p>

        <Button className="bg-[#006B4D] text-white" onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </div>
  )
}
