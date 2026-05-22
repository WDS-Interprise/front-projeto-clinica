import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HistoryPrescriptionRecord } from "@/types/patient-history"
import { HistoryRecordShell } from "./HistoryRecordShell"

function formatItemHeadline(item: HistoryPrescriptionRecord["prescription"]["items"][0]) {
  const parts = [item.name]
  if (item.presentation?.trim()) parts.push(item.presentation.trim())
  let line = parts.join(" — ")
  if (item.quantity?.trim()) line += ` · ${item.quantity.trim()}`
  return line
}

function formatItemSubtitle(item: HistoryPrescriptionRecord["prescription"]["items"][0]) {
  const parts = [item.dosage, item.frequency].filter(Boolean) as string[]
  return parts.length ? parts.join(" | ") : null
}

type Props = {
  record: HistoryPrescriptionRecord
  onInsertInfo: () => void
  onPrintPdf: (prescriptionId: string) => void
}

export function HistoryPrescriptionCard({ record, onInsertInfo, onPrintPdf }: Props) {
  const { prescription, prescriptionNumber } = record
  const medications = prescription.items.filter((i) => i.type === "MEDICATION")
  const exams = prescription.items.filter((i) => i.type === "EXAM")
  const vaccines = prescription.items.filter((i) => i.type === "VACCINE")
  const others = prescription.items.filter(
    (i) => !["MEDICATION", "EXAM", "VACCINE"].includes(i.type)
  )

  const renderItems = (
    items: HistoryPrescriptionRecord["prescription"]["items"],
    emptyLabel: string
  ) => {
    if (items.length === 0) return null
    return (
      <ul className="space-y-3 mt-2">
        {items.map((item) => {
          const subtitle = formatItemSubtitle(item)
          return (
            <li key={item.id} className="leading-snug">
              <p className="font-semibold text-text">
                • {formatItemHeadline(item)}
                {item.continuousUse ? (
                  <span className="ml-2 text-xs italic font-normal text-text-secondary">
                    uso contínuo
                  </span>
                ) : null}
              </p>
              {subtitle && <p className="text-xs text-text-secondary mt-0.5 ml-3">{subtitle}</p>}
              {item.instructions?.trim() && (
                <p className="text-sm text-text-secondary mt-0.5 ml-3">{item.instructions.trim()}</p>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <HistoryRecordShell
      professionalName={record.professionalName}
      time={record.time}
      durationMinutes={null}
      status={record.status}
      sectionTitle="Prescrição"
      onInsertInfo={onInsertInfo}
      onPrint={() => onPrintPdf(record.prescriptionId)}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h4 className="font-bold text-text">Prescrição #{prescriptionNumber}</h4>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => onPrintPdf(record.prescriptionId)}
        >
          <Printer className="w-3 h-3" />
          Imprimir
        </Button>
      </div>

      {medications.length > 0 && renderItems(medications, "medicamentos")}
      {exams.length > 0 && (
        <div className="mt-3">
          <p className="font-semibold text-text text-sm">Exames</p>
          {renderItems(exams, "exames")}
        </div>
      )}
      {vaccines.length > 0 && renderItems(vaccines, "vacinas")}
      {others.length > 0 && renderItems(others, "itens")}

      {prescription.items.length === 0 && (
        <p className="text-text-secondary italic text-sm">Nenhum item prescrito.</p>
      )}

      {prescription.notes?.trim() && (
        <p className="mt-3 text-sm text-text-secondary">
          <span className="font-semibold text-text">Observações: </span>
          {prescription.notes.trim()}
        </p>
      )}
    </HistoryRecordShell>
  )
}
