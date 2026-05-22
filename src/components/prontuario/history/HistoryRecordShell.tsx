import { Clock, Lock, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDuration, formatHistoryStatus, statusBadgeClass } from "./history-ui"

type Props = {
  professionalName: string
  time: string
  durationMinutes: number | null
  locked?: boolean
  status: string
  sectionTitle: string
  onInsertInfo?: () => void
  onPrint?: () => void
  children: React.ReactNode
}

export function HistoryRecordShell({
  professionalName,
  time,
  durationMinutes,
  locked,
  status,
  sectionTitle,
  onInsertInfo,
  onPrint,
  children,
}: Props) {
  const duration = formatDuration(durationMinutes)

  return (
    <article className="rounded-lg border border-border bg-surface overflow-hidden shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-surface-alt border-b border-border text-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-text-secondary">Por:</span>
          <span className="font-medium text-text truncate">{professionalName}</span>
          {locked && <Lock className="w-3.5 h-3.5 text-primary shrink-0" aria-label="Registro finalizado" />}
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-xs shrink-0">
          <span
            className={`rounded px-2 py-0.5 font-medium ${statusBadgeClass(status)}`}
          >
            {formatHistoryStatus(status)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {time}
            {duration ? ` (${duration})` : ""}
          </span>
        </div>
      </header>

      <div className="px-4 py-2 bg-surface-alt/60 border-b border-border">
        <h3 className="text-sm font-bold text-text">{sectionTitle}</h3>
      </div>

      <div className="px-4 py-4 text-sm text-text">{children}</div>

      <footer className="flex flex-wrap justify-end gap-2 px-4 py-3 border-t border-border bg-surface">
        {onInsertInfo && (
          <Button variant="secondary" size="sm" onClick={onInsertInfo}>
            Inserir informações
          </Button>
        )}
        {onPrint && (
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={onPrint}>
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </Button>
        )}
      </footer>
    </article>
  )
}
