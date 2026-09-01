import { useEffect } from "react"
import { Link } from "react-router-dom"
import AppLogo from "@/components/brand/AppLogo"
import { useForceLightTheme } from "@/hooks/useForceLightTheme"
import { formatCompanyCopyright } from "@/lib/company-legal"
import { LEGAL_DOCUMENTS, LEGAL_NAV, type LegalSlug } from "@/lib/legal-documents"

export default function LegalPage({ slug }: { slug: LegalSlug }) {
  useForceLightTheme()
  const doc = LEGAL_DOCUMENTS[slug]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  return (
    <div className="min-h-screen bg-surface-alt text-text">
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
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{doc.updatedLabel}</p>
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
