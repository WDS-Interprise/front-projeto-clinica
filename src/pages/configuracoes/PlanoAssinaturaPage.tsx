import { useEffect, useState } from "react"
import { CreditCard, Sparkles } from "lucide-react"
import SettingsLayout from "@/components/layout/SettingsLayout"
import { useClinicPlan, usePublicPlans } from "@/hooks/useClinicPlan"
import { SubscriptionStatusBadge, BillingStatusBadge } from "@/components/billing/PlanBadges"
import { PlanFeatureList, PlanUsagePanel } from "@/components/billing/PlanUsage"
import { PLAN_FEATURES } from "@/lib/plan-features"
import { Button } from "@/components/ui/button"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { Modal } from "@/components/ui/modal"

function formatMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function PlanoAssinaturaPage() {
  const { toast } = useToast()
  const { subscription, usage, features, loading, refresh } = useClinicPlan()
  const { plans, loading: plansLoading } = usePublicPlans()
  const [invoices, setInvoices] = useState<any[]>([])
  const [plansOpen, setPlansOpen] = useState(false)
  const [changing, setChanging] = useState(false)

  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY")

  const loadInvoices = () => {
    api.subscription.invoices().then(setInvoices).catch(() => setInvoices([]))
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  if (loading) {
    return (
      <SettingsLayout>
        <p className="text-sm text-text-secondary">Carregando plano...</p>
      </SettingsLayout>
    )
  }

  const trialDaysLeft =
    subscription?.status === "TRIAL" && subscription.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86_400_000))
      : null

  useEffect(() => {
    if (subscription?.billingCycle) setBillingCycle(subscription.billingCycle)
  }, [subscription?.billingCycle])

  const refreshPix = async (invoiceId: string) => {
    try {
      await api.subscription.refreshInvoicePix(invoiceId)
      toast("Pix atualizado")
      loadInvoices()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao atualizar Pix"), "error")
    }
  }

  const changePlan = async (planId: string) => {
    setChanging(true)
    try {
      await api.subscription.changePlan({ planId, billingCycle })
      toast("Plano alterado com sucesso")
      setPlansOpen(false)
      refresh()
      loadInvoices()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao alterar plano"), "error")
    } finally {
      setChanging(false)
    }
  }

  const copyPix = async (pix: string | null) => {
    if (!pix) return
    try {
      await navigator.clipboard.writeText(pix)
      toast("Pix copiado")
    } catch {
      toast("Não foi possível copiar o Pix", "error")
    }
  }

  return (
    <SettingsLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-[#12261E]">Plano e assinatura</h1>
          <p className="mt-1 text-sm text-[#6B7C74]">
            Gerencie o plano da sua clínica, acompanhe o uso e consulte suas cobranças.
          </p>
        </div>

        {!subscription ? (
          <div className="rounded-xl border border-[#E4EBE6] bg-white p-6 text-sm text-[#6B7C74]">
            Nenhuma assinatura vinculada à clínica. Entre em contato com o suporte ClinMax.
          </div>
        ) : (
          <>
            {subscription.status === "PAST_DUE" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Pagamento pendente. Regularize para evitar interrupções.
              </div>
            )}

            <div className="rounded-xl border border-[#E4EBE6] bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#006B4D]" />
                    <h2 className="text-lg font-bold text-[#12261E]">{subscription.planName}</h2>
                  </div>
                  <p className="mt-1 text-sm text-[#6B7C74]">
                    {subscription.billingCycle === "ANNUAL" ? "Anual" : "Mensal"} · {formatMoney(subscription.price)}
                    {subscription.billingCycle === "MONTHLY" ? " / mês" : " / ano"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <SubscriptionStatusBadge status={subscription.status} />
                    {trialDaysLeft != null && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                        Trial: restam {trialDaysLeft} dias
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="outline" onClick={() => setPlansOpen(true)}>
                  Ver outros planos
                </Button>
              </div>
              {subscription.nextBillingAt && (
                <p className="mt-4 text-sm text-[#6B7C74]">
                  Próxima cobrança: {new Date(subscription.nextBillingAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#E4EBE6] bg-white p-5">
                <h3 className="font-semibold text-[#12261E]">Uso do plano</h3>
                <div className="mt-4">
                  <PlanUsagePanel usage={usage} />
                </div>
              </div>
              <div className="rounded-xl border border-[#E4EBE6] bg-white p-5">
                <h3 className="font-semibold text-[#12261E]">Recursos incluídos</h3>
                <div className="mt-4">
                  <PlanFeatureList included={features} allFeatures={[...PLAN_FEATURES]} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E4EBE6] bg-white p-5">
              <h3 className="font-semibold text-[#12261E]">Histórico de cobranças</h3>
              {invoices.length === 0 ? (
                <p className="mt-3 text-sm text-[#6B7C74]">Nenhuma cobrança registrada.</p>
              ) : (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[#8A9A90]">
                      <th className="pb-2">Data</th>
                      <th className="pb-2">Valor</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-t border-[#EEF2EF]">
                        <td className="py-2">{new Date(inv.dueDate).toLocaleDateString("pt-BR")}</td>
                        <td className="py-2">{formatMoney(inv.amount)}</td>
                        <td className="py-2">
                          <BillingStatusBadge status={inv.status} />
                        </td>
                        <td className="py-2 text-right space-x-2">
                          {inv.status === "PENDING" && inv.billingType === "PIX" && (
                            <button
                              type="button"
                              className="text-[#006B4D] text-xs font-semibold hover:underline"
                              onClick={() => refreshPix(inv.id)}
                            >
                              Atualizar Pix
                            </button>
                          )}
                          {inv.pixCopyPaste && (
                            <button type="button" className="text-[#006B4D] text-xs font-semibold hover:underline" onClick={() => copyPix(inv.pixCopyPaste)}>
                              Copiar Pix
                            </button>
                          )}
                          {inv.invoiceUrl && (
                            <a href={inv.invoiceUrl} target="_blank" rel="noreferrer" className="ml-2 text-xs text-[#006B4D] hover:underline">
                              Fatura
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      <Modal open={plansOpen} onClose={() => setPlansOpen(false)} title="Escolher plano" size="lg">
        {plansLoading ? (
          <p className="text-sm text-[#6B7C74]">Carregando planos...</p>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setBillingCycle("MONTHLY")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${billingCycle === "MONTHLY" ? "bg-[#E8F6EE] text-[#006B4D]" : "border border-[#E4EBE6]"}`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("ANNUAL")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${billingCycle === "ANNUAL" ? "bg-[#E8F6EE] text-[#006B4D]" : "border border-[#E4EBE6]"}`}
              >
                Anual
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border p-4 ${plan.id === subscription?.planId ? "border-[#006B4D] bg-[#F4FBF7]" : "border-[#E4EBE6]"}`}
              >
                <div className="flex items-center gap-2">
                  {plan.highlighted && <Sparkles className="h-4 w-4 text-[#006B4D]" />}
                  <h3 className="font-bold text-[#12261E]">{plan.name}</h3>
                </div>
                <p className="mt-1 text-sm text-[#6B7C74]">
                  {formatMoney(billingCycle === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice)}
                  {billingCycle === "MONTHLY" ? " / mês" : " / ano"}
                </p>
                <p className="mt-2 text-xs text-[#8A9A90] line-clamp-2">{plan.description}</p>
                {plan.id === subscription?.planId ? (
                  <p className="mt-3 text-xs font-semibold text-[#006B4D]">Plano atual</p>
                ) : (
                  <Button
                    size="sm"
                    className="mt-3 bg-[#006B4D] text-white"
                    disabled={changing}
                    onClick={() => changePlan(plan.id)}
                  >
                    Escolher plano
                  </Button>
                )}
              </div>
            ))}
            </div>
          </>
        )}
      </Modal>
    </SettingsLayout>
  )
}
