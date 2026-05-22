import type { HistoryAttendanceRecord } from "@/types/patient-history"
import { HistoryRecordShell } from "./HistoryRecordShell"

type ClinicalField = { label: string; value?: string | null }

function ClinicalBlock({ label, value }: ClinicalField) {
  if (!value?.trim()) return null
  return (
    <div className="mb-3 last:mb-0">
      <p className="font-semibold text-text mb-0.5">{label}:</p>
      <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">{value.trim()}</p>
    </div>
  )
}

function buildPrintHtml(record: HistoryAttendanceRecord): string {
  const a = record.attendance
  const fields: ClinicalField[] = [
    { label: "Queixa principal", value: a.mainComplaint },
    { label: "Exame físico", value: a.physicalExam },
    { label: "História da moléstia atual", value: a.currentIllnessHistory },
    { label: "Histórico e antecedentes", value: a.historyAndAntecedents },
    { label: "Hipótese diagnóstica", value: a.diagnosticHypothesis },
    { label: "Condutas", value: a.conduct },
    { label: "Prescrevo", value: a.prescriptionSummary },
    { label: "Observações", value: a.notes },
  ]
  const body = fields
    .filter((f) => f.value?.trim())
    .map(
      (f) =>
        `<p><strong>${f.label}:</strong><br/>${f.value!.trim().replace(/\n/g, "<br/>")}</p>`
    )
    .join("")
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Atendimento</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#111;font-size:12px;line-height:1.5}
h1{font-size:16px;margin:0 0 8px}p{margin:0 0 12px}</style></head><body>
<h1>Atendimento — ${record.professionalName}</h1>
<p><strong>Horário:</strong> ${record.time}</p>
${body || "<p>Sem conteúdo clínico registrado.</p>"}
</body></html>`
}

type Props = {
  record: HistoryAttendanceRecord
  onInsertInfo: () => void
}

export function HistoryAttendanceCard({ record, onInsertInfo }: Props) {
  const a = record.attendance
  const isScheduledOnly =
    record.status === "SCHEDULED" || record.status === "CONFIRMED"

  const handlePrint = () => {
    const html = buildPrintHtml(record)
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.onload = () => w.print()
  }

  return (
    <HistoryRecordShell
      professionalName={record.professionalName}
      time={record.time}
      durationMinutes={record.durationMinutes}
      locked={record.locked}
      status={record.status}
      sectionTitle="Atendimento"
      onInsertInfo={onInsertInfo}
      onPrint={handlePrint}
    >
      {isScheduledOnly &&
      !a.mainComplaint &&
      !a.physicalExam &&
      !a.currentIllnessHistory ? (
        <p className="text-text-secondary italic">
          Consulta agendada. O conteúdo clínico será registrado durante o atendimento.
        </p>
      ) : (
        <>
          <ClinicalBlock label="Queixa principal" value={a.mainComplaint} />
          <ClinicalBlock label="Exame físico" value={a.physicalExam} />
          <ClinicalBlock label="História da moléstia atual" value={a.currentIllnessHistory} />
          <ClinicalBlock label="Histórico e antecedentes" value={a.historyAndAntecedents} />
          <ClinicalBlock label="Hipótese diagnóstica" value={a.diagnosticHypothesis} />
          <ClinicalBlock label="Condutas" value={a.conduct} />
          <ClinicalBlock label="Prescrevo" value={a.prescriptionSummary} />
          <ClinicalBlock label="Observações" value={a.notes} />
        </>
      )}
    </HistoryRecordShell>
  )
}

export { buildPrintHtml as buildAttendancePrintHtml }
