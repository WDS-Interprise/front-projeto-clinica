import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { api } from "@/services/api"
import type { PatientHistoryDayGroup, PatientHistoryRecord } from "@/types/patient-history"
import { HistoryDateMarker } from "./HistoryDateMarker"
import { HistoryAttendanceCard } from "./HistoryAttendanceCard"
import { HistoryPrescriptionCard } from "./HistoryPrescriptionCard"

type Props = {
  patientId: string
  days: PatientHistoryDayGroup[]
}

export function HistoryTimeline({ patientId, days }: Props) {
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleAttendanceInsert = (record: Extract<PatientHistoryRecord, { type: "ATTENDANCE" }>) => {
    if (record.locked) {
      toast("Atendimento finalizado. Não é possível alterar o registro.", "error")
      return
    }
    navigate(`/atendimento/${record.appointmentId}`)
  }

  const handlePrescriptionInsert = () => {
    navigate(`/prontuario/${patientId}?tab=prescricoes`)
  }

  const handlePrintPdf = async (prescriptionId: string) => {
    try {
      const token = localStorage.getItem("token")
      const url = api.prescriptions.pdfUrl(prescriptionId).split("?")[0]
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || "Erro ao carregar PDF")
      }
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const w = window.open(blobUrl, "_blank")
      if (w) {
        w.onload = () => w.print()
      } else {
        toast("Permita pop-ups para imprimir.", "error")
      }
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao imprimir prescrição"), "error")
    }
  }

  return (
    <div className="space-y-10">
      {days.map((group) => (
        <section key={group.date} className="relative">
          <div className="flex gap-4 md:gap-6">
            <div className="relative flex flex-col items-center">
              <HistoryDateMarker day={group.day} month={group.month} year={group.year} />
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 w-px bg-border min-h-[calc(100%-3rem)] h-full"
                aria-hidden
              />
            </div>

            <div className="flex-1 min-w-0 space-y-4 pb-2">
              {group.records.map((record) =>
                record.type === "ATTENDANCE" ? (
                  <HistoryAttendanceCard
                    key={record.id}
                    record={record}
                    onInsertInfo={() => handleAttendanceInsert(record)}
                  />
                ) : (
                  <HistoryPrescriptionCard
                    key={record.id}
                    record={record}
                    onInsertInfo={handlePrescriptionInsert}
                    onPrintPdf={handlePrintPdf}
                  />
                )
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
