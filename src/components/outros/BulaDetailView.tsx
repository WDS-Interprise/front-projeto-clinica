import { useEffect, useMemo, useRef, useState } from "react"
import { ExternalLink, Pill, Star } from "lucide-react"
import { FormattedBulaContent } from "@/components/outros/FormattedBulaContent"
import { Button } from "@/components/ui/button"
import { estimateContentLength } from "@/lib/format-bula-content"
import { formatBulaSourceLine } from "@/lib/bula-source-labels"
import { cn } from "@/lib/utils"

export type BulaPosologia = {
  texto_completo?: string
  gotas?: string
  xarope?: string
  injetavel?: string
  supositorio?: string
  casos_especiais?: string
  creme?: string
  solucao_dermatologica?: string
  comprimido?: string
  [key: string]: string | undefined
}

export type BulaSecoes = {
  indicacao?: string
  farmacocinetica?: string
  contraindicacoes?: string
  posologia?: BulaPosologia
  efeitos_colaterais?: string
  advertencias_precaucoes?: string
  interacoes_medicamentosas?: string
  superdosagem?: string
  composicao?: string
  apresentacoes?: string
  armazenamento?: string
}

export type BulaDetail = {
  id: string
  nome: string
  classes: string[]
  fonte: string
  registro_ms?: string
  informacoes_legais?: string
  laboratorio?: string
  secoes: BulaSecoes
  url_pdf?: string
  atualizado_em: string
}

const NAV_SECTIONS: Array<{ id: string; key: keyof BulaSecoes | "overview"; label: string }> = [
  { id: "overview", key: "overview", label: "Visão geral" },
  { id: "indicacao", key: "indicacao", label: "Indicações" },
  { id: "posologia", key: "posologia", label: "Posologia" },
  { id: "contraindicacoes", key: "contraindicacoes", label: "Contraindicações" },
  { id: "advertencias_precaucoes", key: "advertencias_precaucoes", label: "Advertências" },
  { id: "interacoes_medicamentosas", key: "interacoes_medicamentosas", label: "Interações" },
  { id: "efeitos_colaterais", key: "efeitos_colaterais", label: "Reações adversas" },
  { id: "superdosagem", key: "superdosagem", label: "Superdosagem" },
  { id: "armazenamento", key: "armazenamento", label: "Armazenamento" },
]

const POSOLOGY_KEY_LABELS: Record<string, string> = {
  texto_completo: "Geral",
  gotas: "Gotas",
  xarope: "Xarope",
  injetavel: "Injetável",
  supositorio: "Supositório",
  creme: "Creme",
  solucao_dermatologica: "Solução dermatológica",
  comprimido: "Comprimido / Cápsula",
  casos_especiais: "Casos especiais",
}

function sectionLength(value: string | BulaPosologia | undefined): number {
  if (!value) return 0
  if (typeof value === "string") return estimateContentLength(value)
  return Object.values(value).reduce((acc, v) => acc + estimateContentLength(v ?? ""), 0)
}

function mergePosologyText(pos: BulaPosologia): string {
  if (pos.texto_completo?.trim()) return pos.texto_completo.trim()
  return Object.keys(POSOLOGY_KEY_LABELS)
    .filter((k) => k !== "texto_completo" && pos[k]?.trim())
    .map((k) => pos[k]!.trim())
    .join("\n\n")
}

function ClinicalSectionContent({
  sectionKey,
  value,
}: {
  sectionKey: keyof BulaSecoes
  value: string | BulaPosologia
}) {
  if (sectionKey === "posologia" && typeof value === "object") {
    const content = mergePosologyText(value as BulaPosologia)
    if (!content) return null
    return <FormattedBulaContent content={content} posology />
  }
  if (typeof value === "string") {
    return (
      <FormattedBulaContent content={value} posology={sectionKey === "posologia"} />
    )
  }
  return null
}

type Props = {
  detail: BulaDetail
  compact?: boolean
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onAddToPrescription?: () => void
}

export function BulaDetailView({
  detail,
  compact = false,
  isFavorite = false,
  onToggleFavorite,
  onAddToPrescription,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState("overview")

  const visibleSections = useMemo(() => {
    return NAV_SECTIONS.filter(({ key }) => {
      if (key === "overview") return true
      return sectionLength(detail.secoes[key]) > 0
    })
  }, [detail.secoes])

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const observers: IntersectionObserver[] = []
    for (const section of visibleSections) {
      const el = root.querySelector(`#bula-section-${section.id}`)
      if (!el) continue
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(section.id)
        },
        { root: null, rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    }

    return () => observers.forEach((o) => o.disconnect())
  }, [visibleSections])

  const scrollTo = (id: string) => {
    containerRef.current
      ?.querySelector(`#bula-section-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const posologyPreview = detail.secoes.posologia
    ? mergePosologyText(detail.secoes.posologia).slice(0, 280)
    : ""

  return (
    <div className={cn("flex flex-col gap-4", !compact && "pb-8")}>
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/90">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">{detail.nome}</p>
          <p className="text-xs text-text-secondary">{formatBulaSourceLine(detail.fonte, detail.atualizado_em)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onToggleFavorite && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={onToggleFavorite}
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-amber-400 text-amber-500")} />
              {isFavorite ? "Favorito" : "Favoritar"}
            </Button>
          )}
          {onAddToPrescription && (
            <Button type="button" size="sm" onClick={onAddToPrescription}>
              Adicionar à prescrição
            </Button>
          )}
        </div>
      </div>

      <div className={cn("flex gap-6", compact ? "flex-col lg:flex-row" : "flex-col xl:flex-row")}>
        <nav
          className={cn(
            "shrink-0 space-y-0.5",
            compact ? "lg:w-48" : "xl:w-52",
            "hidden md:block"
          )}
        >
          {visibleSections.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={cn(
                "block w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors",
                activeSection === id
                  ? "bg-primary-light text-primary"
                  : "text-text-secondary hover:bg-surface-alt hover:text-text"
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        <div ref={containerRef} className="min-w-0 flex-1 space-y-8">
          <section id="bula-section-overview" className="scroll-mt-24 space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light">
                  <Pill className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 space-y-3">
                  <h2 className="text-xl font-bold text-text">{detail.nome}</h2>
                  <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                    {detail.classes.length > 0 && (
                      <div>
                        <dt className="text-text-secondary">Categoria</dt>
                        <dd className="font-medium text-text">{detail.classes.join(" · ")}</dd>
                      </div>
                    )}
                    {detail.laboratorio && (
                      <div>
                        <dt className="text-text-secondary">Fabricante</dt>
                        <dd className="font-medium text-text">{detail.laboratorio.replace(/<[^>]+>/g, "").slice(0, 120)}</dd>
                      </div>
                    )}
                    {detail.registro_ms && (
                      <div>
                        <dt className="text-text-secondary">Registro</dt>
                        <dd className="font-medium text-text">MS-{detail.registro_ms}</dd>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <dt className="text-text-secondary">Fonte</dt>
                      <dd className="font-medium text-text">{formatBulaSourceLine(detail.fonte, detail.atualizado_em)}</dd>
                    </div>
                  </dl>
                  {detail.url_pdf && (
                    <a
                      href={detail.url_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Bula original (PDF)
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {posologyPreview && (
              <div className="rounded-xl border border-border bg-surface-alt/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Posologia (resumo)</p>
                <p className="mt-1 text-sm text-text line-clamp-4 whitespace-pre-line">{posologyPreview}</p>
              </div>
            )}
          </section>

          {visibleSections
            .filter((s) => s.key !== "overview")
            .map(({ id, key, label }) => {
              if (key === "overview") return null
              const value = detail.secoes[key]
              if (sectionLength(value) === 0) return null
              return (
                <section key={id} id={`bula-section-${id}`} className="scroll-mt-24 space-y-3">
                  <h3 className="text-lg font-semibold text-text border-b border-border pb-2">{label}</h3>
                  <div className="rounded-xl border border-border bg-surface p-5">
                    <ClinicalSectionContent sectionKey={key} value={value!} />
                  </div>
                </section>
              )
            })}

          {(detail.informacoes_legais || detail.registro_ms) && (
            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-text border-b border-border pb-2">Informações legais</h3>
              <div className="rounded-xl border border-border bg-surface p-5 space-y-3 text-[13px] leading-relaxed text-text-secondary">
                {detail.registro_ms && !detail.informacoes_legais?.includes(detail.registro_ms) ? (
                  <p className="font-medium text-text">MS-{detail.registro_ms}</p>
                ) : null}
                {detail.informacoes_legais ? (
                  <FormattedBulaContent content={detail.informacoes_legais} />
                ) : null}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto md:hidden pb-1">
        {visibleSections.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
              activeSection === id ? "bg-primary text-white" : "bg-surface-alt text-text-secondary"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export type { BulaDetail as BulaDetailType }

export function extractPosologyHint(secoes: BulaSecoes): string {
  if (!secoes.posologia) return ""
  return mergePosologyText(secoes.posologia).slice(0, 500)
}
