import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  Check,
  CreditCard,
  Gift,
  Headset,
  IdCard,
  Info,
  Lock,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  User,
} from "lucide-react"
import AppLogo from "@/components/brand/AppLogo"
import { Checkbox } from "@/components/ui/checkbox"
import { useForceLightTheme } from "@/hooks/useForceLightTheme"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { formattedCompanyCnpj } from "@/lib/company-legal"
import { maskCepInput, maskCpfOrCnpjInput, maskPhoneInput, validateCpfOrCnpj, validateEmail } from "@/lib/form-validation"
import { LANDING_PLAN_FALLBACK, LANDING_SPECIALIST_EMAIL } from "@/lib/landing-content"
import {
  checkoutPath,
  commercialPlanLabel,
  isCommercialRankUpgrade,
  isNextCommercialUpgrade,
  nextCommercialPlanSlug,
  rememberSelectedPlan,
  type ClinicSubscriptionView,
  type PublicCatalogPlan,
  type PublicPlan,
} from "@/lib/plan-features"
import { api } from "@/services/api"
import { cn } from "@/lib/utils"

const GREEN = "#006B4D"
const CHECKOUT_BG = "/checkout/left-card-bg.png?v=2"

function formatMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function CheckoutPage() {
  useForceLightTheme()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { toast } = useToast()
  const { user, clinicId } = useAuth()
  const loggedIn = Boolean(localStorage.getItem("token"))

  const slug = params.get("plan") || "profissional"
  const cycleParam = params.get("cycle") === "ANNUAL" ? "ANNUAL" : "MONTHLY"

  const [plan, setPlan] = useState<PublicCatalogPlan | null>(
    LANDING_PLAN_FALLBACK.plans.find((p) => p.slug === slug) ?? LANDING_PLAN_FALLBACK.plans[1]
  )
  const [planId, setPlanId] = useState<string | null>(null)
  const [annual, setAnnual] = useState(cycleParam === "ANNUAL")
  const [payMethod, setPayMethod] = useState<"pix" | "card">("pix")
  const [cardKind, setCardKind] = useState<"credit" | "debit">("credit")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [addressNumber, setAddressNumber] = useState("")
  const [email, setEmail] = useState(user?.email ?? "")
  const [fullName, setFullName] = useState(user?.name ?? "")
  const [document, setDocument] = useState("")
  const [phone, setPhone] = useState("")
  const [cep, setCep] = useState("")
  const [terms, setTerms] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(2)
  const [pix, setPix] = useState<{ qr?: string; copy?: string; amount?: number; invoiceUrl?: string; billingType?: string } | null>(null)
  const [currentSub, setCurrentSub] = useState<ClinicSubscriptionView | null>(null)
  const [clinicPlans, setClinicPlans] = useState<PublicPlan[]>([])

  useEffect(() => {
    rememberSelectedPlan(slug)
    api.public
      .plans()
      .then((data) => {
        const found = data.plans.find((p) => p.slug === slug)
        if (found) setPlan(found)
      })
      .catch(() => undefined)
    if (loggedIn) {
      api.subscription
        .plans()
        .then((rows) => {
          setClinicPlans(rows)
          const found = rows.find((p) => p.slug === slug)
          if (found) setPlanId(found.id)
        })
        .catch(() => undefined)
      api.subscription
        .current()
        .then(setCurrentSub)
        .catch(() => undefined)
    }
    if (clinicId) {
      api.clinics
        .getById(clinicId)
        .then((clinic) => {
          if (clinic.email) setEmail(String(clinic.email))
          if (clinic.phone) setPhone(maskPhoneInput(String(clinic.phone)))
          if (clinic.cnpj) setDocument(maskCpfOrCnpjInput(String(clinic.cnpj)))
          if (clinic.addressZip) setCep(maskCepInput(String(clinic.addressZip)))
          if (clinic.name && !fullName) setFullName(String(clinic.name))
        })
        .catch(() => undefined)
    }
  }, [slug, clinicId, loggedIn])

  const cycle = annual ? "ANNUAL" : "MONTHLY"
  const monthlyPrice = plan?.monthlyPrice ?? 0
  const annualPrice = plan?.annualPrice ?? 0
  const displayMonthly = annual ? plan?.annualEquivalentMonthly ?? monthlyPrice : monthlyPrice
  const dueToday = annual ? annualPrice : monthlyPrice
  const yearSubtotal = monthlyPrice * 12
  const yearDiscount = Math.max(0, yearSubtotal - annualPrice)

  const features = plan?.marketingFeatures ?? []
  const currentPlan = clinicPlans.find((p) => p.slug === currentSub?.planSlug)
  const isDowngrade = Boolean(
    loggedIn && currentPlan && plan && plan.monthlyPrice < currentPlan.monthlyPrice
  )
  const assumedFromSlug = loggedIn ? currentSub?.planSlug : "essencial"
  const nextAllowedSlug = nextCommercialPlanSlug(assumedFromSlug)
  const skipBlocked = Boolean(
    plan &&
      (!loggedIn || currentSub) &&
      isCommercialRankUpgrade(assumedFromSlug ?? "legacy", plan.slug) &&
      !isNextCommercialUpgrade(assumedFromSlug, plan.slug)
  )

  const confirm = async () => {
    const emailOk = validateEmail(email)
    if (!emailOk.ok) {
      toast(emailOk.msg, "error")
      return
    }
    const docOk = validateCpfOrCnpj(document)
    if (!docOk.ok) {
      toast(docOk.msg, "error")
      return
    }
    if (skipBlocked) {
      toast(
        nextAllowedSlug
          ? `Só é possível subir um plano por vez. Assine o ${commercialPlanLabel(nextAllowedSlug)} primeiro.`
          : "Só é possível subir um plano por vez.",
        "error"
      )
      return
    }
    if (!terms) {
      toast("Aceite os termos para continuar", "error")
      return
    }
    if (!isDowngrade && payMethod !== "pix" && payMethod !== "card") {
      toast("Escolha Pix ou cartão", "error")
      return
    }

    const expiryParts = cardExpiry.replace(/\D/g, "")
    if (!isDowngrade && payMethod === "card" && cardKind === "credit") {
      if (cardNumber.replace(/\D/g, "").length < 13) {
        toast("Informe um número de cartão válido", "error")
        return
      }
      if (expiryParts.length < 4) {
        toast("Informe a validade do cartão", "error")
        return
      }
      if (cardCvv.replace(/\D/g, "").length < 3) {
        toast("Informe o CVV", "error")
        return
      }
      if (!addressNumber.trim()) {
        toast("Informe o número do endereço para o cartão", "error")
        return
      }
    }

    if (!loggedIn) {
      rememberSelectedPlan(slug)
      sessionStorage.setItem("clinichub_checkout_cycle", cycle)
      navigate(`/register?plan=${encodeURIComponent(slug)}&next=/checkout`)
      return
    }
    if (!planId) {
      toast("Não foi possível identificar o plano", "error")
      return
    }

    setSubmitting(true)
    try {
      if (clinicId) {
        await api.clinics.update(clinicId, {
          cnpj: document.replace(/\D/g, ""),
          phone: phone.replace(/\D/g, "") || undefined,
          email,
          addressZip: cep.replace(/\D/g, "") || undefined,
        })
      }
      await api.auth.updateMe({ name: fullName, email, phone: phone.replace(/\D/g, "") || undefined })
      const usingCard = !isDowngrade && payMethod === "card"
      const digits = cardNumber.replace(/\D/g, "")
      const exp = cardExpiry.replace(/\D/g, "")
      await api.subscription.changePlan({
        planId,
        billingCycle: cycle,
        paymentMethod: usingCard ? "CREDIT_CARD" : "PIX",
        ...(usingCard && cardKind === "credit"
          ? {
              creditCard: {
                holderName: fullName.trim(),
                number: digits,
                expiryMonth: exp.slice(0, 2),
                expiryYear: `20${exp.slice(2, 4)}`,
                ccv: cardCvv.replace(/\D/g, ""),
              },
              creditCardHolderInfo: {
                name: fullName.trim(),
                email,
                cpfCnpj: document.replace(/\D/g, ""),
                postalCode: cep.replace(/\D/g, ""),
                addressNumber: addressNumber.trim(),
                phone: phone.replace(/\D/g, ""),
              },
            }
          : {}),
      })
      const invoices = await api.subscription.invoices()
      const pending = invoices.find(
        (inv) =>
          (inv.status === "PENDING" || inv.status === "OVERDUE") &&
          String(inv.reference ?? "").startsWith("upgrade:")
      )
      if (isDowngrade || !pending) {
        toast(
          isDowngrade
            ? "Plano alterado. A diferença já paga não é reembolsada."
            : usingCard
              ? "Pagamento aprovado. Plano atualizado."
              : "Plano atualizado."
        )
        navigate("/configuracoes/plano")
        return
      }
      setPix({
        qr: pending.pixQrCode ?? undefined,
        copy: pending.pixCopyPaste ?? undefined,
        amount: pending.amount ?? dueToday,
        invoiceUrl: pending.invoiceUrl ?? undefined,
        billingType: pending.billingType,
      })
      setStep(3)
      toast(
        pending.billingType === "CREDIT_CARD"
          ? "Abra a fatura Asaas para pagar com crédito ou débito."
          : "Checkout iniciado. Pague o Pix para concluir o plano."
      )
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Não foi possível confirmar a assinatura"), "error")
    } finally {
      setSubmitting(false)
    }
  }

  const copyPix = async () => {
    if (!pix?.copy) return
    try {
      await navigator.clipboard.writeText(pix.copy)
      toast("Pix copiado")
    } catch {
      toast("Não foi possível copiar o Pix", "error")
    }
  }

  const cancelAndBack = async () => {
    setCancelling(true)
    try {
      await api.subscription.cancelUpgrade()
      setPix(null)
      setStep(2)
      toast("Cobrança cancelada. Você pode voltar quando quiser.")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Não foi possível cancelar a cobrança"), "error")
    } finally {
      setCancelling(false)
    }
  }

  const qrSrc = useMemo(() => {
    if (!pix?.qr) return ""
    return pix.qr.startsWith("data:") ? pix.qr : `data:image/png;base64,${pix.qr}`
  }, [pix])

  if (!plan) return null

  return (
    <div className="flex min-h-dvh flex-col bg-[#F6F8F7] text-[#12261E]">
      <header className="sticky top-0 z-20 shrink-0 border-b border-[#E4EBE6] bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="relative z-10 block h-12 w-[132px] shrink-0 overflow-hidden sm:w-[150px] xl:w-[172px]"
          >
            <AppLogo
              size="lg"
              rounded={false}
              className="absolute top-1/2 left-0 h-14 max-w-none origin-left -translate-y-1/2 scale-[1.32] sm:scale-[1.42] xl:h-16 xl:scale-[1.55]"
            />
          </Link>
          <ol className="hidden items-center gap-3 sm:flex" aria-label="Etapas do checkout">
            <Step done label="Plano" />
            <span className="h-px w-8 bg-[#D5DED8]" />
            <Step current={step === 2} done={step === 3} index={2} label="Pagamento" />
            <span className="h-px w-8 bg-[#D5DED8]" />
            <Step current={step === 3} index={3} label="Confirmação" />
          </ol>
          <a
            href={`mailto:${LANDING_SPECIALIST_EMAIL}`}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#3D5C50] hover:text-[#006B4D]"
          >
            <Headset className="h-4 w-4" />
            <span className="hidden md:inline">Precisa de ajuda? Fale com nosso time.</span>
          </a>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-start gap-4 px-4 py-3 sm:px-6 lg:grid-cols-2 lg:items-stretch">
        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-[20px] bg-[#E8F5EE] p-4 sm:p-5 lg:min-h-[calc(100dvh-5.5rem)]">
          <img
            src={CHECKOUT_BG}
            alt=""
            className="pointer-events-none absolute inset-x-0 -top-[22%] left-1/2 h-[145%] w-[108%] max-w-none -translate-x-1/2 object-cover object-[center_top]"
          />
          <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#E8F6EE] px-2.5 py-0.5 text-[11px] font-semibold text-[#006B4D]">
            <Gift className="h-3 w-3" />
            Cancele quando quiser
          </span>
          <h1 className="mt-3 text-[22px] font-bold leading-tight text-[#12261E]">Finalizar assinatura</h1>
          <p className="mt-1 max-w-sm text-[13px] text-[#5A6B64]">
            Escolha seu plano e conclua sua assinatura com segurança.
          </p>

          <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#006B4D]" />
              <h2 className="text-sm font-semibold">Plano {plan.name}</h2>
            </div>
            <p className="mt-2 text-[24px] font-bold leading-none" style={{ color: GREEN }}>
              {formatMoney(displayMonthly)}
              <span className="text-sm font-medium text-[#6B7C74]"> / mês</span>
            </p>
            <p className={cn("mt-1 min-h-[14px] text-[11px] text-[#6B7C74]", !annual && "invisible")}>
              {formatMoney(annualPrice)} cobrados anualmente
            </p>

            {isDowngrade ? (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[12px] leading-snug text-amber-950">
                Você está indo para um plano mais barato. A diferença já paga não é reembolsada. O plano novo entra na hora.
              </p>
            ) : skipBlocked ? (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[12px] leading-snug text-amber-950">
                {nextAllowedSlug
                  ? `Só é possível subir um plano por vez. Assine o ${commercialPlanLabel(nextAllowedSlug)} primeiro.`
                  : "Só é possível subir um plano por vez."}
              </p>
            ) : null}

            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#F4FBF7] px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <p className="text-[13px] font-medium">Cobrança anual</p>
                <span
                  className={cn(
                    "inline-flex rounded-full bg-[#E8F6EE] px-2 py-0.5 text-[10px] font-semibold text-[#006B4D]",
                    !annual && "invisible"
                  )}
                >
                  Economize 2 meses
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={annual}
                onClick={() => {
                  setAnnual((v) => !v)
                  navigate(checkoutPath(slug, annual ? "MONTHLY" : "ANNUAL"), { replace: true })
                }}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  annual ? "bg-[#006B4D]" : "bg-[#D5DED8]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    annual ? "left-5" : "left-0.5"
                  )}
                />
              </button>
            </div>

            <ul className="mt-3 space-y-1.5">
              {features.slice(0, 4).map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] text-[#3D5C50]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#006B4D]" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-auto space-y-1 border-t border-[#E4EBE6] pt-3 text-[13px]">
              <Row label={annual ? "Subtotal (12 meses)" : "Subtotal (mensal)"} value={formatMoney(annual ? yearSubtotal : monthlyPrice)} />
              <div className={cn(!annual && "invisible")}>
                <Row label="Desconto (anual, 2 meses)" value={`- ${formatMoney(yearDiscount)}`} />
              </div>
              <div className="flex items-center justify-between pt-1.5 text-sm font-bold">
                <span>Total devido hoje</span>
                <span style={{ color: GREEN }}>{isDowngrade ? formatMoney(0) : formatMoney(dueToday)}</span>
              </div>
            </div>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#5A6B64]">
            <Lock className="h-3 w-3" />
            Pagamento seguro. Cancele quando quiser.
          </p>
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#E4EBE6] bg-white lg:max-h-[calc(100dvh-5.5rem)]">
          {step === 3 ? (
            <div className="flex h-full flex-col items-center justify-center overflow-y-auto p-4 text-center sm:p-5">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F6EE] text-[#006B4D]">
                <QrCode className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-lg font-bold">Confirme o pagamento</h2>
              <p className="mt-1 max-w-md text-[13px] text-[#6B7C74]">
                {pix?.billingType === "CREDIT_CARD"
                  ? `Pague com crédito ou débito na fatura Asaas para concluir o upgrade para ${plan.name}.`
                  : `Seu plano atual continua ativo. Pague o Pix para concluir o upgrade para ${plan.name}.`}
              </p>
              {pix?.billingType === "CREDIT_CARD" && pix.invoiceUrl ? (
                <a
                  href={pix.invoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex h-11 w-full max-w-sm items-center justify-center rounded-xl bg-[#006B4D] text-sm font-semibold text-white hover:bg-[#005a41]"
                >
                  Pagar com cartão na fatura Asaas
                </a>
              ) : qrSrc ? (
                <img src={qrSrc} alt="QR Code Pix da assinatura ClinMax" className="mt-3 h-40 w-40 rounded-xl border border-[#E4EBE6] bg-white p-2" />
              ) : (
                <p className="mt-3 text-[13px] text-[#6B7C74]">
                  QR em processamento. Cancele e confirme de novo se o código não aparecer.
                </p>
              )}
              {pix?.amount ? <p className="mt-2 text-base font-bold text-[#006B4D]">{formatMoney(pix.amount)}</p> : null}
              <div className="mt-3 flex w-full max-w-sm flex-col items-center">
                {pix?.copy && pix.billingType !== "CREDIT_CARD" ? (
                  <button
                    type="button"
                    onClick={() => void copyPix()}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#006B4D] text-sm font-semibold text-white hover:bg-[#005a41]"
                  >
                    Copiar Pix
                  </button>
                ) : null}
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => void cancelAndBack()}
                    disabled={cancelling}
                    className="font-medium text-[#8A9A90] hover:text-[#3D5C50] disabled:opacity-60"
                  >
                    {cancelling ? "Cancelando..." : "Cancelar"}
                  </button>
                  <span className="h-3 w-px bg-[#D5DED8]" aria-hidden />
                  <Link to="/configuracoes/plano" className="font-semibold text-[#006B4D] hover:underline">
                    Ir para o plano
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {skipBlocked ? (
                <p className="mb-4 flex gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-950">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  {nextAllowedSlug ? (
                    <span>
                      Cadastro começa no Essencial. Só dá para assinar o próximo plano.{" "}
                      <Link className="font-semibold text-[#006B4D] hover:underline" to={checkoutPath(nextAllowedSlug, cycle)}>
                        Ir para {commercialPlanLabel(nextAllowedSlug)}
                      </Link>
                    </span>
                  ) : (
                    "Só é possível subir um plano por vez."
                  )}
                </p>
              ) : null}
              <div>
                <h2 className="text-sm font-semibold">Contato</h2>
                <label className="mt-2 block">
                  <span className="sr-only">E-mail</span>
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9A90]" />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="h-11 w-full rounded-xl border border-[#E4EBE6] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#006B4D] focus:ring-1 focus:ring-[#006B4D]/20"
                    />
                  </span>
                </label>
              </div>

              <div className="mt-4">
                <h2 className="text-sm font-semibold">Método de pagamento</h2>
                {isDowngrade ? (
                  <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-950">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    Plano mais barato: a diferença já paga não é reembolsada. Confirmar aplica o plano na hora, sem Pix e sem cartão.
                  </p>
                ) : (
                  <>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <PayTab active={payMethod === "pix"} onClick={() => setPayMethod("pix")} icon={QrCode} label="Pix" />
                  <PayTab active={payMethod === "card"} onClick={() => setPayMethod("card")} icon={CreditCard} label="Cartão" />
                </div>
                {payMethod === "pix" ? (
                  <p className="mt-3 rounded-xl bg-[#F4FBF7] px-3 py-2.5 text-[13px] text-[#3D5C50]">
                    O Pix é gerado ao confirmar. Pague para o plano novo entrar. Enquanto isso, o plano atual segue ativo.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCardKind("credit")}
                        className={cn(
                          "h-10 rounded-xl border text-sm font-medium",
                          cardKind === "credit"
                            ? "border-[#006B4D] bg-[#F4FBF7] text-[#006B4D]"
                            : "border-[#E4EBE6] text-[#6B7C74]"
                        )}
                      >
                        Crédito
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardKind("debit")}
                        className={cn(
                          "h-10 rounded-xl border text-sm font-medium",
                          cardKind === "debit"
                            ? "border-[#006B4D] bg-[#F4FBF7] text-[#006B4D]"
                            : "border-[#E4EBE6] text-[#6B7C74]"
                        )}
                      >
                        Débito
                      </button>
                    </div>
                    {cardKind === "credit" ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={cardNumber}
                          onChange={(e) =>
                            setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "))
                          }
                          placeholder="Número do cartão"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          className="h-11 rounded-xl border border-[#E4EBE6] px-3 text-sm outline-none focus:border-[#006B4D] sm:col-span-2"
                        />
                        <input
                          value={cardExpiry}
                          onChange={(e) => {
                            const d = e.target.value.replace(/\D/g, "").slice(0, 4)
                            setCardExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d)
                          }}
                          placeholder="Validade MM/AA"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          className="h-11 rounded-xl border border-[#E4EBE6] px-3 text-sm outline-none focus:border-[#006B4D]"
                        />
                        <input
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="CVV"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          className="h-11 rounded-xl border border-[#E4EBE6] px-3 text-sm outline-none focus:border-[#006B4D]"
                        />
                        <input
                          value={addressNumber}
                          onChange={(e) => setAddressNumber(e.target.value)}
                          placeholder="Número do endereço"
                          className="h-11 rounded-xl border border-[#E4EBE6] px-3 text-sm outline-none focus:border-[#006B4D] sm:col-span-2"
                        />
                      </div>
                    ) : (
                      <p className="rounded-xl bg-[#F4FBF7] px-3 py-2.5 text-[13px] text-[#3D5C50]">
                        O débito é pago na fatura segura do Asaas, que também aceita crédito. Ao confirmar, você abre essa fatura.
                      </p>
                    )}
                  </div>
                )}
                  </>
                )}
              </div>

              <div className="mt-4">
                <h2 className="text-sm font-semibold">Detalhes de faturamento</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <IconField icon={User} value={fullName} onChange={setFullName} placeholder="Nome completo" />
                  <IconField icon={IdCard} value={document} onChange={(v) => setDocument(maskCpfOrCnpjInput(v))} placeholder="CPF ou CNPJ" />
                  <IconField icon={Phone} value={phone} onChange={(v) => setPhone(maskPhoneInput(v))} placeholder="Telefone" />
                  <div>
                    <IconField icon={MapPin} value={cep} onChange={(v) => setCep(maskCepInput(v))} placeholder="CEP" />
                    <a
                      href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-block text-[11px] font-semibold text-[#006B4D] hover:underline"
                    >
                      Não sei meu CEP
                    </a>
                  </div>
                </div>
              </div>
              </div>

              <div className="sticky bottom-0 shrink-0 border-t border-[#E4EBE6] bg-white px-4 py-3 sm:px-5">
              <div className="flex items-start gap-2 text-sm text-[#3D5C50]">
                <Checkbox
                  id="checkout-terms"
                  checked={terms}
                  onCheckedChange={setTerms}
                  className={terms ? "border-[#006B4D] bg-[#006B4D]" : undefined}
                />
                <label htmlFor="checkout-terms" className="min-w-0 flex-1 cursor-pointer leading-relaxed">
                  Li e concordo com os Termos de Uso e a Política de Privacidade.
                  <span className="mt-1 block text-xs text-[#6B7C74]">
                    ClinMax. CNPJ {formattedCompanyCnpj()}.
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (skipBlocked && nextAllowedSlug) {
                    navigate(checkoutPath(nextAllowedSlug, cycle))
                    return
                  }
                  void confirm()
                }}
                disabled={submitting}
                className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#006B4D] text-sm font-semibold text-white hover:bg-[#005a41] disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                {submitting
                  ? "Confirmando..."
                  : skipBlocked && nextAllowedSlug
                    ? `Assinar ${commercialPlanLabel(nextAllowedSlug)} primeiro`
                    : isDowngrade
                      ? "Confirmar plano"
                      : "Confirmar assinatura"}
              </button>

              <Link
                to={loggedIn ? "/configuracoes/plano" : "/#planos"}
                className="mt-3 inline-flex w-full items-center justify-center gap-1 text-sm font-medium text-[#6B7C74] hover:text-[#006B4D]"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar aos planos
              </Link>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

function Step({
  label,
  index,
  current,
  done,
}: {
  label: string
  index?: number
  current?: boolean
  done?: boolean
}) {
  return (
    <li className="flex items-center gap-2 text-sm font-medium">
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs",
          done || (!index && !current)
            ? "bg-[#006B4D] text-white"
            : current
              ? "bg-[#006B4D] text-white"
              : "bg-[#E4EBE6] text-[#6B7C74]"
        )}
      >
        {done || (!index && !current) ? <Check className="h-3.5 w-3.5" /> : index}
      </span>
      <span className={current || done || !index ? "text-[#12261E]" : "text-[#8A9A90]"}>{label}</span>
    </li>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[#5A6B64]">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function PayTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof QrCode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-medium",
        active ? "border-[#006B4D] bg-[#F4FBF7] text-[#006B4D]" : "border-[#E4EBE6] text-[#6B7C74]"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function IconField({
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  icon: typeof User
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <span className="relative block">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9A90]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-[#E4EBE6] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#006B4D] focus:ring-1 focus:ring-[#006B4D]/20"
      />
    </span>
  )
}
