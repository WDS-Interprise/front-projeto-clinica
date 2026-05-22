import { FileText, Plus, RefreshCw, LayoutTemplate } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { EmptyState } from "@/components/ui/empty-state"
import type { Prescription, PrescriptionTemplate } from "@/types/prescription"

type Props = {
  patientName: string
  showDate: boolean
  onShowDateChange: (v: boolean) => void
  prescriptionDate: string
  onDateChange: (iso: string) => void
  recent: Prescription[]
  templates: PrescriptionTemplate[]
  loading: boolean
  embedded?: boolean
  onCreateBlank: () => void
  onRenew: (id: string) => void
}

export function PrescricaoHub({
  patientName,
  showDate,
  onShowDateChange,
  prescriptionDate,
  onDateChange,
  recent,
  templates,
  loading,
  embedded = false,
  onCreateBlank,
  onRenew,
}: Props) {
  const finalized = recent.filter((r) => r.status === "FINALIZED")

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4">
        <div>
          {embedded ? (
            <>
              <p className="text-xs font-semibold text-primary tracking-wide">Prescrição</p>
              <p className="text-sm text-text mt-1">
                Consulta: <span className="font-medium">{patientName}</span>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-text">Prescrição Digital</h1>
              <p className="text-sm text-text-secondary mt-1">{patientName}</p>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Switch checked={showDate} onChange={onShowDateChange} label="Mostrar data" />
          <input
            type="date"
            value={prescriptionDate.slice(0, 10)}
            onChange={(e) => onDateChange(new Date(e.target.value).toISOString())}
            className="h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text">Criar prescrição</h2>
        <div className="flex flex-wrap gap-3">
        <Button variant="secondary" className="gap-2" disabled title="Biblioteca vazia — em breve">
          <LayoutTemplate className="w-4 h-4" />
          Usar modelo
        </Button>
        <Button className="gap-2" onClick={onCreateBlank} disabled={loading}>
          <Plus className="w-4 h-4" />
          Criar nova em branco
        </Button>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-text mb-3">Prescrições mais recentes</h2>
        {loading ? (
          <p className="text-sm text-text-secondary">Carregando...</p>
        ) : finalized.length === 0 ? (
          <EmptyState
            title="Nenhuma prescrição anterior"
            description="Crie a primeira prescrição em branco para este paciente."
            actionLabel="Criar nova em branco"
            onAction={onCreateBlank}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {finalized.map((rx) => (
              <div
                key={rx.id}
                className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3"
              >
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-text text-sm">
                      {format(new Date(rx.prescriptionDate), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {rx.items.length} item(ns)
                      {rx.validationCode ? ` · ${rx.validationCode}` : ""}
                    </p>
                  </div>
                </div>
                <ul className="text-xs text-text-secondary line-clamp-2">
                  {rx.items.slice(0, 3).map((i) => (
                    <li key={i.id}>{i.name}</li>
                  ))}
                </ul>
                <Button variant="secondary" size="sm" className="gap-2 w-fit" onClick={() => onRenew(rx.id)}>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Renovar prescrição
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text mb-3">Biblioteca de modelos</h2>
        {templates.length === 0 ? (
          <p className="text-sm text-text-secondary rounded-xl border border-dashed border-border p-6 text-center">
            Você não adicionou modelos. Salve prescrições frequentes como modelo em versões futuras.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {templates.map((t) => (
              <div key={t.id} className="rounded-lg border border-border p-3 text-sm">
                {t.name}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
