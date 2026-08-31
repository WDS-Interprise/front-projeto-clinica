import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Leaf,
  Rocket,
  Shield,
  Star,
} from "lucide-react"
import AppLogo from "@/components/brand/AppLogo"
import LandingMarquee from "@/components/landing/LandingMarquee"
import LandingReveal from "@/components/landing/LandingReveal"
import { useForceLightTheme } from "@/hooks/useForceLightTheme"
import {
  LANDING_GREEN,
  BRAND_BLUE_DARK,
  LANDING_HERO_IMAGE_ALT,
  LANDING_HERO_IMAGE_SRC,
  LANDING_HERO_SUBTITLE,
  LANDING_HERO_TITLE_ACCENT,
  LANDING_HERO_TITLE_LEAD,
} from "@/lib/brand"
import {
  LANDING_FEATURES,
  LANDING_FOOTER_BLURB,
  LANDING_FOOTER_COLUMNS,
  LANDING_HERO_TRUST,
  LANDING_NAV,
  LANDING_PLAN_FALLBACK,
  LANDING_SPECIALIST_EMAIL,
  LANDING_STEPS,
} from "@/lib/landing-content"
import { formatCompanyAddress, formatCompanyCopyright } from "@/lib/company-legal"
import { api } from "@/services/api"
import { rememberSelectedPlan, checkoutPath, type PublicCatalog, type PublicCatalogPlan } from "@/lib/plan-features"

function LandingHeader() {
  return (
    <header className="landing-header-enter sticky top-0 z-50 overflow-visible border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="relative z-10 block h-10 w-[9.25rem] shrink-0 overflow-hidden rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary sm:w-[10.5rem]"
        >
          <AppLogo
            size="sm"
            rounded={false}
            className="h-full w-full max-w-none scale-[1.08] object-cover object-[18%_center]"
          />
        </Link>

        <nav
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex"
          aria-label="Navegação principal"
        >
          {LANDING_NAV.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-200 hover:bg-surface-alt hover:text-text"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="relative z-10 ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="hidden cursor-pointer rounded-xl px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-200 hover:text-text sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            to="/register"
            className="landing-btn-lift inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(0,145,74,0.25)] transition-colors duration-200 hover:opacity-95"
            style={{ backgroundColor: LANDING_GREEN }}
          >
            Começar grátis
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  )
}

function HeroPreview() {
  return (
    <LandingReveal variant="fade-right" delay={180} immediate className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
      <div className="landing-hero-float relative">
        <img
          src={`${LANDING_HERO_IMAGE_SRC}?v=original`}
          alt={LANDING_HERO_IMAGE_ALT}
          width={1536}
          height={1024}
          decoding="async"
          fetchPriority="high"
          className="relative z-10 h-auto w-full select-none object-contain"
        />
      </div>
    </LandingReveal>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-surface px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-14 lg:px-8 lg:pb-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-[#00914A]/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[#256993]/6 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] lg:gap-8">
        <div className="text-center lg:text-left">
          <LandingReveal immediate delay={0}>
            <h1 className="font-landing-heading text-[2rem] font-bold leading-[1.12] tracking-[-0.03em] text-[#0A1F44] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {LANDING_HERO_TITLE_LEAD}{" "}
              <span style={{ color: LANDING_GREEN }}>{LANDING_HERO_TITLE_ACCENT}</span>
            </h1>
          </LandingReveal>

          <LandingReveal immediate delay={90}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#0A1F44]/75 lg:mx-0 lg:text-[1.05rem]">
              {LANDING_HERO_SUBTITLE}
            </p>
          </LandingReveal>

          <LandingReveal immediate delay={180}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                to="/register"
                className="landing-btn-lift inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(5,150,105,0.28)] transition-colors duration-200 hover:opacity-95 sm:w-auto"
                style={{ backgroundColor: LANDING_GREEN }}
              >
                Criar conta da clínica
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                to="/login"
                className="landing-btn-lift inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-6 text-sm font-semibold transition-colors duration-200 hover:bg-slate-50 sm:w-auto"
                style={{ borderColor: BRAND_BLUE_DARK, color: BRAND_BLUE_DARK }}
              >
                Já tenho conta
              </Link>
            </div>
          </LandingReveal>

          <LandingReveal immediate delay={270}>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-[13px] text-[#0A1F44]/70 lg:justify-start">
              {LANDING_HERO_TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} style={{ color: LANDING_GREEN }} aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </LandingReveal>
        </div>

        <HeroPreview />
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="funcionalidades" className="scroll-mt-20 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.35fr)] lg:gap-14">
        <LandingReveal className="lg:sticky lg:top-24" variant="fade-left">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: LANDING_GREEN }}>
            Recursos
          </p>
          <h2 className="font-landing-heading mt-3 text-3xl font-bold tracking-tight text-[#0A1F44] sm:text-4xl">
            Tudo o que sua clínica precisa, em um só lugar
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#5b6573]">
            Soluções completas para simplificar sua rotina e melhorar a experiência do paciente.
          </p>
        </LandingReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_FEATURES.map(({ icon: Icon, title, description }, index) => (
            <LandingReveal key={title} delay={index * 70} variant="scale-in">
              <article className="landing-card-hover h-full rounded-2xl border border-[#eef1f5] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <span
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: "rgba(0,145,74,0.12)", color: LANDING_GREEN }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.85} aria-hidden />
                </span>
                <h3 className="font-landing-heading text-[15px] font-bold text-[#0A1F44]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5b6573]">{description}</p>
              </article>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <LandingReveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: LANDING_GREEN }}>
            Como funciona
          </p>
          <h2 className="font-landing-heading mt-3 text-3xl font-bold tracking-tight text-[#0A1F44] sm:text-4xl">
            Simples para você. Fácil para seus pacientes.
          </h2>
        </LandingReveal>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] xl:items-stretch">
          {LANDING_STEPS.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="contents">
              <LandingReveal delay={index * 100} variant="fade-up">
                <article className="landing-card-hover flex h-full flex-col rounded-2xl border border-[#eef1f5] bg-white p-5 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <span
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(0,145,74,0.12)", color: LANDING_GREEN }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.85} aria-hidden />
                  </span>
                  <h3 className="font-landing-heading text-[15px] font-bold text-[#0A1F44]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#5b6573]">{description}</p>
                </article>
              </LandingReveal>
              {index < LANDING_STEPS.length - 1 ? (
                <div className="landing-step-arrow hidden items-center justify-center xl:flex" aria-hidden>
                  <ChevronRight className="h-6 w-6" style={{ color: "rgba(0,145,74,0.45)" }} />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function formatLandingPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value)
}

const PLAN_ICONS = {
  essencial: Leaf,
  profissional: Briefcase,
  premium: Rocket,
} as const

function PricingSection() {
  const [cycle, setCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY")
  const [catalog, setCatalog] = useState<PublicCatalog>(LANDING_PLAN_FALLBACK)
  const [compareOpen, setCompareOpen] = useState(false)

  useEffect(() => {
    api.public
      .plans()
      .then((data) => {
        if (data?.plans?.length) setCatalog(data)
      })
      .catch(() => undefined)
  }, [])

  return (
    <section id="planos" className="scroll-mt-20 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <LandingReveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-landing-heading text-2xl font-bold tracking-tight text-[#0A1F44] sm:text-3xl">
            Planos que cabem <span style={{ color: LANDING_GREEN }}>no seu momento</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#5b6573]">
            Escolha o plano da sua clínica. O Essencial cobre o básico. Profissional e Premium liberam mais recursos depois do pagamento.
          </p>
        </LandingReveal>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-[#e6eaf0] bg-[#f7f8fa] p-1 text-sm">
            <button
              type="button"
              onClick={() => setCycle("MONTHLY")}
              className={`rounded-full px-4 py-1.5 font-medium ${cycle === "MONTHLY" ? "bg-white text-[#0A1F44] shadow-sm" : "text-[#5b6573]"}`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setCycle("ANNUAL")}
              className={`rounded-full px-4 py-1.5 font-medium ${cycle === "ANNUAL" ? "bg-white text-[#0A1F44] shadow-sm" : "text-[#5b6573]"}`}
            >
              Anual
            </button>
          </div>
        </div>
        {cycle === "ANNUAL" ? (
          <p className="mt-3 text-center text-sm font-medium" style={{ color: LANDING_GREEN }}>
            {catalog.annualSavingsLabel}
          </p>
        ) : null}

        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {catalog.plans.map((plan, index) => (
            <PlanCard key={plan.slug} plan={plan} cycle={cycle} delay={index * 120} />
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-[#f6f8fa] px-5 py-4 text-sm text-[#3d4654]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-10">
            <p className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0" style={{ color: LANDING_GREEN }} aria-hidden />
              Sem fidelidade. Cancele quando quiser.
            </p>
            <p className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0" style={{ color: LANDING_GREEN }} aria-hidden />
              Ambiente seguro e 100% em nuvem.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setCompareOpen((open) => !open)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#0A1F44] hover:underline"
          >
            Comparar todos os recursos
            <ChevronDown className={`h-4 w-4 transition ${compareOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </div>

        {compareOpen && catalog.plans[0]?.comparison?.length ? (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#e6eaf0]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f7f8fa] text-[#0A1F44]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Recurso</th>
                  {catalog.plans.map((plan) => (
                    <th key={plan.slug} className="px-4 py-3 font-semibold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catalog.plans[0].comparison.map((row, rowIndex) => (
                  <tr key={row.key} className="border-t border-[#eef1f5]">
                    <td className="px-4 py-2.5 text-[#3d4654]">{row.label}</td>
                    {catalog.plans.map((plan) => {
                      const cell = plan.comparison[rowIndex]
                      return (
                        <td key={plan.slug} className="px-4 py-2.5 text-[#0A1F44]">
                          {cell?.included ? cell.value === "Sim" ? "Sim" : cell.value : "Não"}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function PlanCard({
  plan,
  cycle,
  delay,
}: {
  plan: PublicCatalogPlan
  cycle: "MONTHLY" | "ANNUAL"
  delay: number
}) {
  const Icon = PLAN_ICONS[plan.slug as keyof typeof PLAN_ICONS] ?? Briefcase
  const monthly = cycle === "ANNUAL" ? plan.annualEquivalentMonthly : plan.monthlyPrice
  const checkoutTo = checkoutPath(plan.slug, cycle)

  return (
    <LandingReveal delay={delay} variant="scale-in">
      <article
        className={`landing-card-hover relative flex h-full flex-col rounded-2xl bg-white p-6 pt-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] ${
          plan.highlighted ? "landing-plan-highlight border-2" : "border border-[#e6eaf0]"
        }`}
        style={plan.highlighted ? { borderColor: LANDING_GREEN } : undefined}
      >
        {plan.badge ? (
          <span
            className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: LANDING_GREEN }}
          >
            <Star className="h-3 w-3" fill="currentColor" aria-hidden />
            {plan.badge}
          </span>
        ) : null}

        <span
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(0,145,74,0.12)", color: LANDING_GREEN }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.85} aria-hidden />
        </span>
        <h3 className="font-landing-heading text-lg font-bold text-[#0A1F44]">{plan.name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[#5b6573]">{plan.description}</p>
        <p className="mt-5 font-landing-heading text-3xl font-bold tracking-tight" style={{ color: LANDING_GREEN }}>
          R$ {formatLandingPrice(monthly)}
          <span className="text-base font-medium text-[#5b6573]"> /mês</span>
        </p>
        {cycle === "ANNUAL" ? (
          <p className="mt-1 text-xs text-[#5b6573]">
            R$ {formatLandingPrice(plan.annualPrice)} cobrados anualmente
          </p>
        ) : null}

        <Link
          to={checkoutTo}
          onClick={() => rememberSelectedPlan(plan.slug)}
          className={
            plan.highlighted
              ? "landing-btn-lift mt-5 inline-flex h-11 cursor-pointer items-center justify-center rounded-xl text-sm font-semibold text-white"
              : "landing-btn-lift mt-5 inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-[#0A1F44]/20 bg-white text-sm font-semibold text-[#0A1F44] transition-colors duration-200 hover:bg-slate-50"
          }
          style={plan.highlighted ? { backgroundColor: LANDING_GREEN } : undefined}
        >
          {plan.ctaLabel}
        </Link>
        {plan.slug === "premium" ? (
          <p className="mt-2 text-xs leading-snug text-[#5b6573]">
            Cadastro começa no Essencial. O Premium só entra depois do Profissional.
          </p>
        ) : plan.slug === "profissional" ? (
          <p className="mt-2 text-xs leading-snug text-[#5b6573]">
            Cadastro começa no Essencial. Este é o primeiro upgrade pago.
          </p>
        ) : (
          <p className="mt-2 text-xs leading-snug text-[#5b6573]">
            Plano inicial de toda clínica nova.
          </p>
        )}

        <ul className="mt-6 space-y-2.5">
          {plan.marketingFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-[#3d4654]">
              <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} style={{ color: LANDING_GREEN }} aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
      </article>
    </LandingReveal>
  )
}

function CtaSection() {
  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-8">
      <LandingReveal variant="scale-in">
        <div
          className="landing-cta-glow mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-2xl px-6 py-8 sm:px-8 sm:py-9 lg:flex-row lg:items-center"
          style={{ backgroundColor: LANDING_GREEN }}
        >
          <div className="flex items-start gap-4 sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
              <CalendarClock className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <p className="font-landing-heading text-lg font-bold text-white sm:text-xl">
                Pronto para transformar sua clínica?
              </p>
              <p className="mt-1 text-sm text-white/90">
                Comece agora mesmo e veja a diferença na prática.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/register"
              className="landing-btn-lift inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white px-5 text-sm font-semibold text-[#0A1F44] transition-colors duration-200 hover:bg-white/95"
            >
              Criar conta
              <ChevronDown className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href={`mailto:${LANDING_SPECIALIST_EMAIL}`}
              className="landing-btn-lift inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-white px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
            >
              Falar com especialista
            </a>
          </div>
        </div>
      </LandingReveal>
    </section>
  )
}

function SocialIcon({ path, label }: { path: string; label: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <title>{label}</title>
      <path d={path} />
    </svg>
  )
}

function LandingFooter() {
  return (
    <footer id="contato" className="scroll-mt-20 border-t border-[#e6eaf0] bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_2fr]">
        <LandingReveal variant="fade-up">
          <AppLogo
            size="xl"
            rounded={false}
            className="h-[4.75rem] w-auto max-w-[18rem] origin-left object-contain object-left"
          />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#5b6573]">
            {LANDING_FOOTER_BLURB}
          </p>
          <div className="mt-5 flex items-center gap-3 text-[#3d4654]" aria-label="Redes sociais">
            <SocialIcon
              label="Facebook"
              path="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.6L17 11h-3V9z"
            />
            <SocialIcon
              label="Instagram"
              path="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm10 1.8H7A2.2 2.2 0 0 0 4.8 7v10A2.2 2.2 0 0 0 7 19.2h10A2.2 2.2 0 0 0 19.2 17V7A2.2 2.2 0 0 0 17 4.8zM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.4 6.9a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9z"
            />
            <SocialIcon
              label="LinkedIn"
              path="M6.5 9H4v11h2.5V9zM5.2 4A1.6 1.6 0 1 0 5.2 7.2 1.6 1.6 0 0 0 5.2 4zM20 20h-2.5v-5.6c0-1.6-.6-2.7-2-2.7s-1.8.9-2.1 1.8c-.1.2-.1.6-.1.9V20H11s.1-9.4 0-10.4h2.5v1.5c.6-.9 1.8-1.8 3.6-1.8 2.6 0 4.4 1.7 4.4 5.4V20z"
            />
            <SocialIcon
              label="YouTube"
              path="M22 12.2s0-3.2-.4-4.6a2.8 2.8 0 0 0-2-2C17.8 5.2 12 5.2 12 5.2s-5.8 0-7.6.4a2.8 2.8 0 0 0-2 2C2 9 2 12.2 2 12.2s0 3.2.4 4.6a2.8 2.8 0 0 0 2 2c1.8.4 7.6.4 7.6.4s5.8 0 7.6-.4a2.8 2.8 0 0 0 2-2c.4-1.4.4-4.6.4-4.6zM10 15.5v-6.6l5.2 3.3z"
            />
          </div>
        </LandingReveal>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {LANDING_FOOTER_COLUMNS.map((column, index) => (
            <LandingReveal key={column.title} delay={index * 80} variant="fade-up">
              <p className="font-landing-heading text-sm font-bold text-[#0A1F44]">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="cursor-pointer text-sm text-[#5b6573] transition-colors duration-200 hover:text-[#0A1F44]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </LandingReveal>
          ))}
        </div>
      </div>

      <LandingReveal className="mx-auto mt-10 flex max-w-6xl flex-col items-start justify-between gap-3 border-t border-[#e6eaf0] pt-6 sm:flex-row sm:items-center" delay={120}>
        <div className="text-[11px] text-[#5b6573]">
          <p>{formatCompanyCopyright()}</p>
          <p className="mt-1">{formatCompanyAddress()}</p>
        </div>
        <Link
          to="/backoffice/login"
          className="cursor-pointer text-[11px] text-[#5b6573] transition-colors duration-200 hover:text-[#0A1F44]"
        >
          Acesso backoffice
        </Link>
      </LandingReveal>
    </footer>
  )
}

export default function LandingPage() {
  useForceLightTheme()

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "auto"
    return () => {
      document.body.style.overflow = prevOverflow || "hidden"
    }
  }, [])

  return (
    <div className="landing-page min-h-screen bg-surface-alt font-landing-body text-text">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Pular para o conteúdo
      </a>

      <LandingHeader />

      <main id="conteudo-principal">
        <HeroSection />
        <LandingMarquee />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  )
}
