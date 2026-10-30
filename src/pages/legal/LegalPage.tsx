import { useEffect } from "react"
import { Link } from "react-router-dom"
import AppLogo from "@/components/brand/AppLogo"
import { useForceLightTheme } from "@/hooks/useForceLightTheme"
import { formatCompanyCopyright } from "@/lib/company-legal"
import { LEGAL_DOCUMENTS, LEGAL_NAV, type LegalSlug } from "@/lib/legal-documents"
import { breadcrumbJsonLd, usePageSeo } from "@/lib/seo"

const SEO_DESCRIPTION: Record<LegalSlug, string> = {
  privacidade: "Como a ClinMax trata dados pessoais no site e na plataforma.",
  termos: "Regras de uso da plataforma ClinMax, planos e responsabilidades da clínica.",
  lgpd: "Papéis, bases legais e direitos de quem tem dados tratados na ClinMax.",
  seguranca: "Como a ClinMax protege o acesso e os dados da clínica.",
  sobre: "Quem opera a ClinMax, o endereço da empresa e como falar com a gente.",
  contato: "Canais oficiais da ClinMax para comercial, suporte e assuntos legais.",
}

export default function LegalPage({ slug }: { slug: LegalSlug }) {
  useForceLightTheme()
  const doc = LEGAL_DOCUMENTS[slug]
  const path = `/${slug}`
  usePageSeo({
    title: `${doc.title} | ClinMax`,
    description: SEO_DESCRIPTION[slug],
    path,
    jsonLd: breadcrumbJsonLd(doc.title, path),
  })

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "auto"
    window.scrollTo(0, 0)
    return () => {
      document.body.style.overflow = prevOverflow || "hidden"
    }
  }, [slug])

  return (
    <div className="legal-page min-h-dvh overflow-y-auto bg-surface-alt text-text">
      <header className="border-b border-border/80 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="block h-10 w-[9.25rem] overflow-hidden rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <AppLogo
              size="sm"
              rounded={false}
              className="h-full w-full max-w-none scale-[1.08] object-cover object-[18%_center]"
            />
          </Link>
          <Link to="/" className="text-sm font-medium text-text-secondary hover:text-text">
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm text-text-secondary">
          <Link to="/" className="font-medium text-[#0A1F44] hover:underline">
            Início
          </Link>
          <span className="px-1.5">/</span>
          <span>{doc.title}</span>
        </p>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-text-secondary">{doc.updatedLabel}</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0A1F44]">{doc.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">{doc.intro}</p>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Documentos legais">
          {LEGAL_NAV.map((item) => (
            <Link
              key={item.slug}
              to={item.path}
              className={
                item.slug === slug
                  ? "rounded-full bg-[#0A1F44] px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 space-y-8">
          {doc.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-[#0A1F44]">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 64)} className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border bg-surface px-4 py-6 text-center text-[11px] text-text-secondary">
        {formatCompanyCopyright()}
      </footer>
    </div>
  )
}
