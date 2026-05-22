import { ExternalLink, Pill } from "lucide-react"
import { BulaSectionAccordion } from "@/components/outros/BulaSectionAccordion"
import { FormattedBulaContent } from "@/components/outros/FormattedBulaContent"
import { estimateContentLength } from "@/lib/format-bula-content"

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

const CLINICAL_SECTIONS: Array<{ key: keyof BulaSecoes; label: string }> = [
  { key: "indicacao", label: "Indicação" },
  { key: "farmacocinetica", label: "Farmacocinética" },
  { key: "contraindicacoes", label: "Contraindicações" },
  { key: "posologia", label: "Posologia" },
  { key: "efeitos_colaterais", label: "Efeitos colaterais" },
  { key: "advertencias_precaucoes", label: "Advertências e precauções" },
  { key: "interacoes_medicamentosas", label: "Interações medicamentosas" },
  { key: "superdosagem", label: "Superdosagem" },
  { key: "composicao", label: "Composição" },
  { key: "apresentacoes", label: "Apresentações" },
  { key: "armazenamento", label: "Armazenamento" },
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

const LONG_SECTION_THRESHOLD = 700

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

function hasClinicalSecoes(secoes: BulaSecoes) {
  return CLINICAL_SECTIONS.some(({ key }) => sectionLength(secoes[key]) > 0)
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
      <FormattedBulaContent
        content={value}
        posology={sectionKey === "posologia"}
      />
    )
  }

  return null
}

type Props = {
  detail: BulaDetail
}

export function BulaDetailView({ detail }: Props) {
  return (
    <div className="space-y-4 max-w-4xl">
      <div className="rounded-xl border border-border bg-surface p-5 mb-2">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
            <Pill className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0 space-y-2">
            <h2 className="text-xl font-bold text-text">{detail.nome}</h2>
            {detail.classes.length > 0 ? (
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-text">Classes: </span>
                {detail.classes.join(" · ")}
              </p>
            ) : null}
            <p className="text-xs text-text-secondary leading-relaxed">
              Fonte: {detail.fonte}
              {detail.atualizado_em ? ` · Atualizado em ${detail.atualizado_em}` : ""}
            </p>
            {detail.url_pdf ? (
              <a
                href={detail.url_pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Bula original (PDF)
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {!hasClinicalSecoes(detail.secoes) ? (
        <p className="text-sm text-text-secondary py-6 text-center">
          Conteúdo clínico da bula indisponível no momento.
        </p>
      ) : (
        CLINICAL_SECTIONS.map(({ key, label }) => {
          const value = detail.secoes[key]
          const len = sectionLength(value)
          if (len === 0) return null

          const defaultOpen = key === "indicacao" || len < LONG_SECTION_THRESHOLD

          return (
            <BulaSectionAccordion key={key} title={label} defaultOpen={defaultOpen} collapsible>
              <ClinicalSectionContent sectionKey={key} value={value!} />
            </BulaSectionAccordion>
          )
        })
      )}

      {(detail.informacoes_legais || detail.registro_ms) && (
        <BulaSectionAccordion title="Informações legais" defaultOpen={false}>
          <div className="space-y-3 text-[13px] leading-[1.75] text-text-secondary">
            {detail.registro_ms && !detail.informacoes_legais?.includes(detail.registro_ms) ? (
              <p className="font-medium text-text">MS-{detail.registro_ms}</p>
            ) : null}
            {detail.informacoes_legais ? (
              <FormattedBulaContent content={detail.informacoes_legais} />
            ) : null}
          </div>
        </BulaSectionAccordion>
      )}

      {detail.laboratorio ? (
        <BulaSectionAccordion title="Laboratório" defaultOpen={false}>
          <FormattedBulaContent content={detail.laboratorio} />
        </BulaSectionAccordion>
      ) : null}
    </div>
  )
}

export type { BulaDetail as BulaDetailType }
