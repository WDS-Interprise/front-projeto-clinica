import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/button"

type InssInfo = {
  temCarencia: boolean
  temIrpf: boolean
  temNtep: boolean
  fonteCarencia?: string | null
  fonteIrpf?: string | null
  fonteNtep?: string | null
}

type Props = {
  codigo: string
  descricao: string
  capitulo?: string
  capituloDesc?: string
  grupo?: string
  grupoDesc?: string
  bloco?: string
  blocoDesc?: string
  categoria?: string
  categoriaDesc?: string
  tipo?: string
  cid10Equivalente?: string | null
  inss?: InssInfo | null
}

export function CidDetailCard({
  codigo,
  descricao,
  capitulo,
  capituloDesc,
  grupo,
  grupoDesc,
  bloco,
  blocoDesc,
  categoria,
  categoriaDesc,
  tipo,
  cid10Equivalente,
  inss,
}: Props) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopied(true)
      toast("Código copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast("Não foi possível copiar o código", "error")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-mono font-bold text-primary">{codigo}</p>
          <p className="text-lg text-text mt-1">{descricao}</p>
        </div>
        <Button variant="secondary" size="sm" className="gap-2" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          Copiar código
        </Button>
      </div>

      <dl className="space-y-3 text-sm">
        {capituloDesc && (
          <div>
            <dt className="text-text-secondary">Capítulo</dt>
            <dd className="text-text">
              {capitulo ? `${capitulo} — ` : ""}
              {capituloDesc}
            </dd>
          </div>
        )}
        {grupoDesc && (
          <div>
            <dt className="text-text-secondary">Grupo</dt>
            <dd className="text-text">
              {grupo ? `${grupo} — ` : ""}
              {grupoDesc}
            </dd>
          </div>
        )}
        {blocoDesc && (
          <div>
            <dt className="text-text-secondary">Bloco</dt>
            <dd className="text-text">
              {bloco ? `${bloco} — ` : ""}
              {blocoDesc}
            </dd>
          </div>
        )}
        {categoriaDesc && (
          <div>
            <dt className="text-text-secondary">Categoria</dt>
            <dd className="text-text">
              {categoria ? `${categoria} — ` : ""}
              {categoriaDesc}
            </dd>
          </div>
        )}
        {tipo && (
          <div>
            <dt className="text-text-secondary">Tipo</dt>
            <dd className="text-text capitalize">{tipo}</dd>
          </div>
        )}
        {cid10Equivalente && (
          <div>
            <dt className="text-text-secondary">CID-10 equivalente</dt>
            <dd className="font-mono text-primary">{cid10Equivalente}</dd>
          </div>
        )}
      </dl>

      {inss && (inss.temCarencia || inss.temIrpf || inss.temNtep) && (
        <div className="rounded-lg border border-border bg-surface-alt/60 p-3 text-sm">
          <p className="font-medium text-text mb-2">Informações relacionadas (INSS)</p>
          <ul className="space-y-1 text-text-secondary">
            {inss.temCarencia && <li>• Possui regra de carência{inss.fonteCarencia ? ` (${inss.fonteCarencia})` : ""}</li>}
            {inss.temIrpf && <li>• Possui relação com IRPF{inss.fonteIrpf ? ` (${inss.fonteIrpf})` : ""}</li>}
            {inss.temNtep && <li>• Pode ter relação com NTEP{inss.fonteNtep ? ` (${inss.fonteNtep})` : ""}</li>}
          </ul>
          <p className="text-xs text-text-secondary mt-2">Apoio administrativo — não substitui avaliação clínica.</p>
        </div>
      )}
    </div>
  )
}
