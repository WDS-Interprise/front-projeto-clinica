import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react"
import AppLogo from "@/components/brand/AppLogo"
import { useForceLightTheme } from "@/hooks/useForceLightTheme"
import {
  BRAND_ACCENT,
  BRAND_BLUE,
  BRAND_BLUE_DARK,
  APP_NAME,
  LANDING_HERO_LOTTIE_SRC,
  LANDING_HERO_SUBTITLE,
  LANDING_HERO_TITLE,
} from "@/lib/brand"
import {
  LANDING_FEATURES,
  LANDING_NAV,
  LANDING_ROLES,
  LANDING_STATS,
  LANDING_STEPS,
} from "@/lib/landing-content"

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="relative z-10 flex h-10 shrink-0 items-center overflow-visible rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <AppLogo size="sm" className="origin-left scale-[1.85] sm:scale-[2.15]" />
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
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white transition-colors duration-200 hover:opacity-95"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            Começar grátis
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  )
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setPrefersReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener("change", update)
    return () => mediaQuery.removeEventListener("change", update)
  }, [])

  return prefersReducedMotion
}

function HeroPreview() {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <div className="landing-fade-up relative mx-auto w-full max-w-lg lg:max-w-none">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-60 blur-2xl dark:opacity-30"
        style={{ background: `radial-gradient(circle at 50% 50%, ${BRAND_BLUE}33, transparent 70%)` }}
        aria-hidden
      />
      <div
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl sm:aspect-square lg:aspect-[5/4]"
        aria-hidden
      >
        <DotLottieReact
          src={LANDING_HERO_LOTTIE_SRC}
          loop={!prefersReducedMotion}
          autoplay={!prefersReducedMotion}
          className="h-full w-full"
        />
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full blur-3xl dark:opacity-40"
        style={{ backgroundColor: `${BRAND_BLUE}18` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full blur-3xl dark:opacity-30"
        style={{ backgroundColor: `${BRAND_ACCENT}14` }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="landing-fade-up text-center lg:text-left">
          <p
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" aria-hidden />
            Plataforma para clínicas e consultórios no Brasil
          </p>

          <h1 className="font-landing-heading text-3xl font-bold leading-tight tracking-tight text-text sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
            {LANDING_HERO_TITLE}
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-text-secondary lg:mx-0 lg:text-lg">
            {LANDING_HERO_SUBTITLE}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              to="/register"
              className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition-colors duration-200 hover:opacity-95 sm:w-auto"
              style={{ backgroundColor: BRAND_ACCENT }}
            >
              Criar conta da clínica
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 text-sm font-semibold text-text transition-colors duration-200 hover:bg-surface-alt sm:w-auto"
            >
              Já tenho conta
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-secondary lg:justify-start">
            {["Sem cartão para testar", "Multi-usuários", "Tema claro e escuro"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <HeroPreview />
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section className="border-y border-border bg-surface-alt px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {LANDING_STATS.map(({ value, label, detail }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-surface p-5 text-center transition-colors duration-200 sm:text-left"
          >
            <p className="font-landing-heading text-2xl font-bold text-text">{value}</p>
            <p className="mt-1 text-sm font-semibold text-text">{label}</p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="funcionalidades" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Funcionalidades</p>
          <h2 className="font-landing-heading mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Tudo que sua clínica precisa no dia a dia
          </h2>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            Do primeiro contato com o paciente até o fechamento financeiro — módulos integrados
            para médicos, enfermagem, recepção e gestão.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LANDING_FEATURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="group cursor-default rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="font-landing-heading text-base font-semibold text-text">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 border-t border-border bg-surface-alt px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Como funciona</p>
          <h2 className="font-landing-heading mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Em três passos, sua clínica no ar
          </h2>
        </div>

        <ol className="mt-12 grid gap-6 lg:grid-cols-3">
          {LANDING_STEPS.map(({ step, title, description }) => (
            <li
              key={step}
              className="relative rounded-2xl border border-border bg-surface p-6"
            >
              <span
                className="font-landing-heading text-4xl font-bold"
                style={{ color: `${BRAND_BLUE}33` }}
                aria-hidden
              >
                {step}
              </span>
              <h3 className="font-landing-heading mt-2 text-lg font-semibold text-text">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function RolesSection() {
  return (
    <section id="para-quem" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Para quem</p>
          <h2 className="font-landing-heading mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Pensado para cada papel na clínica
          </h2>
          <p className="mt-3 text-base text-text-secondary">
            Permissões granulares e interfaces focadas no que cada profissional precisa fazer.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {LANDING_ROLES.map(({ icon: Icon, title, bullets }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="font-landing-heading text-lg font-semibold text-text">{title}</h3>
              <ul className="mt-4 space-y-2.5">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm text-text-secondary">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                    {bullet}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-8">
      <div
        className="mx-auto max-w-6xl overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-10 sm:py-14"
        style={{
          background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_BLUE_DARK})`,
        }}
      >
        <h2 className="font-landing-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Pronto para organizar sua clínica?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
          Cadastre sua clínica em minutos e comece com agenda, prontuário e prescrições
          integrados — sem complicação.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold transition-colors duration-200 hover:bg-white/95 sm:w-auto"
            style={{ color: BRAND_BLUE_DARK }}
          >
            Criar conta gratuita
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/login"
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-white/30 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 sm:w-auto"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface-alt px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <AppLogo size="md" className="mx-auto sm:mx-0" />
        <p className="text-center text-xs text-text-secondary sm:text-left">
          Desenvolvido para clínicas gerais, consultórios e equipes multiprofissionais no Brasil.
        </p>
        <Link
          to="/backoffice/login"
          className="cursor-pointer text-xs text-text-secondary transition-colors duration-200 hover:text-text"
        >
          Acesso backoffice
        </Link>
      </div>
      <p className="mx-auto mt-6 max-w-6xl text-center text-[11px] text-text-secondary/80">
        © {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.
      </p>
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
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <RolesSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  )
}
