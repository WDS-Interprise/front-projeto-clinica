import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  CircleHelp,
  FileText,
  Gem,
  Headset,
  Leaf,
  Link2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import { useClinicPlan, usePublicPlans } from "@/hooks/useClinicPlan"
import { BillingStatusBadge } from "@/components/billing/PlanBadges"
import { PlanFeatureList, PlanUsagePanel } from "@/components/billing/PlanUsage"
import { LANDING_SPECIALIST_EMAIL } from "@/lib/landing-content"
import { PLAN_FEATURES, checkoutPath, commercialPlanLabel, nextCommercialPlanSlug } from "@/lib/plan-features"
import { Button } from "@/components/ui/button"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { Modal } from "@/components/ui/modal"
import { cn } from "@/lib/utils"

function formatMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const card = "rounded-[14px] border border-[#E4EBE6] bg-white"

const PLAN_ICONS = {
  essencial: Leaf,
  profissional: Briefcase,
  premium: Rocket,
} as const

const STATUS_LABEL: Record<string, string> = {
  TRIAL: "Trial",
  ACTIVE: "Ativa",
  PAST_DUE: "Em atraso",
  SUSPENDED: "Suspensa",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
}

export default function PlanoAssinaturaPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { subscription, usage, features, loading, refresh } = useClinicPlan()
  const { plans, loading: plansLoading } = usePublicPlans()
  const [invoices, setInvoices] = useState<any[]>([])
  const [plansOpen, setPlansOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [invoicesOpen, setInvoicesOpen] = useState(false)
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

  const pendingPix = invoices.find(
    (inv) =>
      (inv.status === "PENDING" || inv.status === "OVERDUE") &&
      String(inv.reference ?? "").startsWith("upgrade:")
  )

  const cancelUpgrade = async () => {
    try {
      await api.subscription.cancelUpgrade()
      toast("Cobrança de upgrade cancelada")
      loadInvoices()
      refresh()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Não foi possível cancelar a cobrança"), "error")
    }
  }

  const refreshPix = async (invoiceId: string) => {
    try {
      await api.subscription.refreshInvoicePix(invoiceId)
      toast("Pix atualizado")
      loadInvoices()
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao atualizar Pix"), "error")
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

  const pendingPlanSlug =
    plans.find((p) => p.id === subscription?.pendingUpgrade?.planId)?.slug ??
    plans.find((p) => p.name === subscription?.pendingUpgrade?.planName)?.slug

  const cycleLabel = subscription?.billingCycle === "ANNUAL" ? "Anual" : "Mensal"
  const nextCharge = subscription?.nextBillingAt
    ? new Date(subscription.nextBillingAt).toLocaleDateString("pt-BR")
    : "-"
  const statusLabel = subscription ? STATUS_LABEL[subscription.status] ?? subscription.status : "-"

  return (
    <SettingsLayout>
      <SettingsPageHeader
        title="Plano e assinatura"
        description="Gerencie o plano da sua clínica, acompanhe o uso e consulte suas cobranças."
        action={
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#D5DED8] bg-white px-3 text-[13px] font-medium text-[#12261E] hover:bg-[#F4F7F5]"
          >
            <CircleHelp className="h-4 w-4 text-[#006B4D]" />
            Como funciona?
          </button>
        }
      />

      {!subscription ? (
        <div className={cn(card, "p-6 text-sm text-[#6B7C74]")}>
          Nenhuma assinatura vinculada à clínica. Entre em contato com o suporte ClinMax.
        </div>
      ) : (
        <div className="space-y-5">
          {(subscription.pendingUpgrade || pendingPix) && (
            <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p>
                Upgrade para {subscription.pendingUpgrade?.planName ?? "plano superior"} aguardando Pix. O plano{" "}
                {subscription.planName} continua ativo. O pagamento fica no checkout.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    navigate(
                      checkoutPath(
                        pendingPlanSlug ?? "profissional",
                        subscription.pendingUpgrade?.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY"
                      )
                    )
                  }
                >
                  Continuar no checkout
                </Button>
                <Button type="button" variant="outline" onClick={() => void cancelUpgrade()}>
                  Cancelar cobrança
                </Button>
              </div>
            </div>
          )}

          <section className={cn(card, "p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#006B4D] text-white">
                  <Gem className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[22px] font-bold leading-tight text-[#12261E]">{subscription.planName}</h2>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        subscription.status === "ACTIVE"
                          ? "bg-[#006B4D] text-white"
                          : "bg-[#E8F6EE] text-[#006B4D]"
                      )}
                    >
                      {subscription.status === "ACTIVE" ? "Ativo" : statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#6B7C74]">
                    {cycleLabel} · {formatMoney(subscription.price)}
                    {subscription.billingCycle === "MONTHLY" ? " / mês" : " cobrados anualmente"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBillingCycle(subscription.billingCycle)
                  setPlansOpen(true)
                }}
                className="inline-flex h-10 items-center rounded-lg border border-[#006B4D] px-4 text-[13px] font-semibold text-[#006B4D] hover:bg-[#E8F6EE]"
              >
                Ver outros planos
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#E4EBE6] pt-5 sm:grid-cols-2 xl:grid-cols-4">
              <MetaItem icon={Calendar} label="Ciclo" value={cycleLabel} />
              <MetaItem icon={Wallet} label="Próxima cobrança" value={nextCharge} divided />
              <MetaItem icon={Link2} label="Forma de pagamento" value="Pix" divided />
              <MetaItem
                icon={CheckCircle2}
                label="Status da assinatura"
                value={statusLabel}
                valueClass={subscription.status === "ACTIVE" ? "text-[#006B4D]" : undefined}
                divided
              />
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-3">
            <section className={cn(card, "flex min-h-[420px] flex-col p-5")}>
              <h3 className="text-[16px] font-semibold text-[#12261E]">Uso do plano</h3>
              <div className="mt-4 flex-1">
                {usage.length ? (
                  <PlanUsagePanel usage={usage} />
                ) : (
                  <p className="text-sm text-[#6B7C74]">Uso ainda não disponível.</p>
                )}
              </div>
              <p className="mt-5 text-[13px] font-semibold text-[#006B4D]">Ver detalhes de uso</p>
            </section>

            <section className={cn(card, "flex min-h-[420px] flex-col p-5")}>
              <h3 className="text-[16px] font-semibold text-[#12261E]">Recursos incluídos</h3>
              <div className="mt-4 min-h-0 flex-1 overflow-auto pr-1">
                <PlanFeatureList included={features} allFeatures={[...PLAN_FEATURES]} />
              </div>
              <button
                type="button"
                onClick={() => setPlansOpen(true)}
                className="mt-5 text-left text-[13px] font-semibold text-[#006B4D] hover:underline"
              >
                Ver todos os recursos
              </button>
            </section>

            <section className={cn(card, "flex min-h-[420px] flex-col p-5")}>
              <h3 className="text-[16px] font-semibold text-[#12261E]">Histórico de cobranças</h3>
              <div className="mt-4 flex flex-1 flex-col">
                {invoices.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F6EE] text-[#006B4D]">
                      <FileText className="h-7 w-7" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-[#12261E]">Nenhuma cobrança registrada.</p>
                    <p className="mt-1 text-[13px] text-[#6B7C74]">
                      Quando uma cobrança for gerada, ela aparecerá aqui.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {invoices.slice(0, 5).map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium text-[#12261E]">{formatMoney(inv.amount)}</p>
                          <p className="text-[12px] text-[#6B7C74]">
                            {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <BillingStatusBadge status={inv.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => setInvoicesOpen(true)}
                className="mt-5 text-left text-[13px] font-semibold text-[#006B4D] hover:underline"
              >
                Ver todas as cobranças
              </button>
            </section>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 rounded-[14px] bg-[#E8F6EE] px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#006B4D]" />
              <div>
                <p className="font-semibold text-[#12261E]">Dúvidas sobre seu plano?</p>
                <p className="mt-0.5 text-[13px] text-[#3D5C50]">
                  Fale com nosso suporte e tire todas as suas dúvidas sobre recursos, limites e cobranças.
                </p>
              </div>
            </div>
            <a
              href={`mailto:${LANDING_SPECIALIST_EMAIL}`}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#006B4D] bg-white px-4 text-[13px] font-semibold text-[#006B4D] hover:bg-[#F4FBF7]"
            >
              <Headset className="h-4 w-4" />
              Falar com o suporte
            </a>
          </div>
        </div>
      )}

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Como funciona?">
        <div className="space-y-3 text-sm leading-relaxed text-[#3D5C50]">
          <p>O plano é a assinatura do software ClinMax, paga pela clínica.</p>
          <p>Isso é separado do livro-caixa (Finanças) e do Pix de consulta (ClinMax Pay).</p>
          <p>Você usa o plano atual normalmente. Cadastro novo entra no Essencial. Para subir, só vale o próximo plano, e só depois do pagamento. Do Essencial, o próximo é o Profissional. Do Profissional, o próximo é o Premium.</p>
        </div>
      </Modal>

      <Modal open={invoicesOpen} onClose={() => setInvoicesOpen(false)} title="Todas as cobranças" size="lg">
        {invoices.length === 0 ? (
          <p className="text-sm text-[#6B7C74]">Nenhuma cobrança registrada.</p>
        ) : (
          <table className="w-full text-sm">
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
                  <td className="space-x-2 py-2 text-right">
                    {inv.status === "PENDING" && inv.billingType === "PIX" && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#006B4D] hover:underline"
                        onClick={() => void refreshPix(inv.id)}
                      >
                        Atualizar Pix
                      </button>
                    )}
                    {inv.pixCopyPaste && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#006B4D] hover:underline"
                        onClick={() => void copyPix(inv.pixCopyPaste)}
                      >
                        Copiar Pix
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      <Modal open={plansOpen} onClose={() => setPlansOpen(false)} title="Escolher plano" size="2xl">
        {plansLoading ? (
          <p className="text-sm text-[#6B7C74]">Carregando planos...</p>
        ) : (
          <>
            <div className="mb-5 flex justify-center">
              <div className="inline-flex rounded-full border border-[#E4EBE6] bg-[#F4F7F5] p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setBillingCycle("MONTHLY")}
                  className={cn(
                    "rounded-full px-4 py-1.5 font-medium",
                    billingCycle === "MONTHLY" ? "bg-white text-[#12261E] shadow-sm" : "text-[#6B7C74]"
                  )}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("ANNUAL")}
                  className={cn(
                    "rounded-full px-4 py-1.5 font-medium",
                    billingCycle === "ANNUAL" ? "bg-white text-[#12261E] shadow-sm" : "text-[#6B7C74]"
                  )}
                >
                  Anual
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => {
                const Icon = PLAN_ICONS[plan.slug as keyof typeof PLAN_ICONS] ?? Briefcase
                const current = plan.id === subscription?.planId
                const price = billingCycle === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice
                const nextSlug = nextCommercialPlanSlug(subscription?.planSlug)
                const isNext = plan.slug === nextSlug
                const isCheaper = plan.monthlyPrice < (plans.find((p) => p.id === subscription?.planId)?.monthlyPrice ?? 0)
                return (
                  <article
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col rounded-2xl border p-5",
                      plan.highlighted ? "border-2 border-[#006B4D] bg-[#F4FBF7]" : "border-[#E4EBE6] bg-white"
                    )}
                  >
                    {plan.highlighted ? (
                      <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#006B4D] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                        <Sparkles className="h-3 w-3" />
                        Mais escolhido
                      </span>
                    ) : null}
                    <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F6EE] text-[#006B4D]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-bold text-[#12261E]">{plan.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[#6B7C74]">{plan.description}</p>
                    <p className="mt-4 text-2xl font-bold text-[#006B4D]">
                      {formatMoney(price)}
                      <span className="text-sm font-medium text-[#6B7C74]">
                        {billingCycle === "MONTHLY" ? " /mês" : " /ano"}
                      </span>
                    </p>
                    {current ? (
                      <p className="mt-4 text-sm font-semibold text-[#006B4D]">Plano atual</p>
                    ) : isNext ? (
                      <>
                        <p className="mt-3 text-[12px] leading-snug text-[#3D5C50]">
                          Próximo plano. O pagamento libera os recursos novos.
                        </p>
                        <Button
                          className="mt-4 bg-[#006B4D] text-white hover:bg-[#005a41]"
                          onClick={() => navigate(checkoutPath(plan.slug, billingCycle))}
                        >
                          Assinar {plan.name}
                        </Button>
                      </>
                    ) : isCheaper ? (
                      <>
                        <p className="mt-3 text-[12px] leading-snug text-amber-800">
                          Plano mais barato: a diferença já paga não é reembolsada.
                        </p>
                        <Button
                          className="mt-4 bg-[#006B4D] text-white hover:bg-[#005a41]"
                          onClick={() => navigate(checkoutPath(plan.slug, billingCycle))}
                        >
                          Assinar {plan.name}
                        </Button>
                      </>
                    ) : (
                      <p className="mt-4 text-[12px] leading-snug text-[#6B7C74]">
                        {nextSlug
                          ? `Assine o ${commercialPlanLabel(nextSlug)} primeiro. Só é possível subir um plano por vez.`
                          : "Este já é o plano mais alto."}
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
          </>
        )}
      </Modal>
    </SettingsLayout>
  )
}

function MetaItem({
  icon: Icon,
  label,
  value,
  valueClass,
  divided,
}: {
  icon: typeof Calendar
  label: string
  value: string
  valueClass?: string
  divided?: boolean
}) {
  return (
    <div className={cn("flex items-start gap-2.5", divided && "xl:border-l xl:border-[#E4EBE6] xl:pl-4")}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#006B4D]" />
      <div>
        <p className="text-[12px] text-[#6B7C74]">{label}</p>
        <p className={cn("mt-0.5 text-sm font-semibold text-[#12261E]", valueClass)}>{value}</p>
      </div>
    </div>
  )
}
