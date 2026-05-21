import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Printer } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import type { AgendaNote, Appointment, Doctor } from "@/types"

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Atendido",
  CANCELLED: "Cancelado",
  NO_SHOW: "Faltou",
  BLOCK: "Bloqueado",
  RESCHEDULED: "Remarcado",
}

interface Props {
  open: boolean
  onClose: () => void
  appointments: Appointment[]
  startDate: string
  endDate: string
  doctorId?: string
}

export default function AgendaPrintPreview({
  open,
  onClose,
  appointments,
  startDate,
  endDate,
  doctorId,
}: Props) {
  const { clinicName } = useAuth()
  const [step, setStep] = useState<"confirm" | "preview">("confirm")
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [dayNotes, setDayNotes] = useState<AgendaNote[]>([])

  const doctorName =
    doctors.find((d) => d.id === doctorId)?.name ?? (doctorId ? "Profissional" : "Todos")

  const sorted = [...appointments]
    .filter((a) => a.type !== "BLOCK" || !doctorId)
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date)
      if (d !== 0) return d
      return (a.startTime ?? a.time ?? "").localeCompare(b.startTime ?? b.time ?? "")
    })

  useEffect(() => {
    if (!open) {
      setStep("confirm")
      return
    }
    api.doctors.list().then(setDoctors)
    const dates = [...new Set(sorted.map((a) => a.date))]
    Promise.all(dates.map((date) => api.agendaNotes.list({ date })))
      .then((lists) => {
        const merged = lists.flat()
        const seen = new Set<string>()
        setDayNotes(
          merged.filter((n) => {
            if (seen.has(n.id)) return false
            seen.add(n.id)
            return n.visibility !== "ADMIN_ONLY"
          })
        )
      })
      .catch(() => setDayNotes([]))
  }, [open])

  const handlePrint = () => {
    window.print()
  }

  if (!open) return null

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #agenda-print-root, #agenda-print-root * { visibility: visible; }
          #agenda-print-root { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {step === "confirm" && (
        <Modal
          open
          onClose={onClose}
          title="Imprimir agenda"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={() => setStep("preview")}>
                Pré-visualizar
              </Button>
            </div>
          }
        >
          <p className="text-sm text-text-secondary">
            Serão impressos <strong>{sorted.length}</strong> agendamentos de{" "}
            <strong>
              {format(new Date(startDate + "T12:00:00"), "dd/MM", { locale: ptBR })} a{" "}
              {format(new Date(endDate + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
            </strong>
            {doctorId ? (
              <>
                {" "}
                para <strong>{doctorName}</strong>
              </>
            ) : (
              " (todos os profissionais permitidos)"
            )}
            .
          </p>
        </Modal>
      )}

      {step === "preview" && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface no-print-overlay">
          <div className="no-print flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
            <h2 className="text-lg font-semibold">Pré-visualização</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep("confirm")}>
                Voltar
              </Button>
              <Button className="gap-2" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-surface-alt">
            <div
              id="agenda-print-root"
              className="max-w-4xl mx-auto bg-white p-8 shadow print:shadow-none"
            >
              <header className="border-b border-gray-300 pb-4 mb-6">
                <h1 className="text-xl font-bold">{clinicName ?? "Clínica"}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Agenda — {format(new Date(startDate + "T12:00:00"), "dd/MM", { locale: ptBR })}{" "}
                  a {format(new Date(endDate + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm text-gray-600">Profissional: {doctorName}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Impresso em {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </header>

              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-400 text-left">
                    <th className="py-2 pr-2">Data</th>
                    <th className="py-2 pr-2">Horário</th>
                    <th className="py-2 pr-2">Paciente</th>
                    <th className="py-2 pr-2">Telefone</th>
                    <th className="py-2 pr-2">Convênio</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((a) => (
                    <tr key={a.id} className="border-b border-gray-200">
                      <td className="py-2 pr-2">
                        {format(new Date(a.date + "T12:00:00"), "dd/MM", { locale: ptBR })}
                      </td>
                      <td className="py-2 pr-2">{a.startTime ?? a.time}</td>
                      <td className="py-2 pr-2">
                        {a.type === "BLOCK" ? "— Bloqueado —" : a.patient?.name ?? "—"}
                      </td>
                      <td className="py-2 pr-2">{a.patient?.phone ?? "—"}</td>
                      <td className="py-2 pr-2">{a.insurancePlan ?? a.patient?.insurancePlan ?? "—"}</td>
                      <td className="py-2">
                        {a.type === "BLOCK"
                          ? "Bloqueio"
                          : statusLabels[a.status] ?? a.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {dayNotes.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-sm font-bold mb-2">Observações do período</h2>
                  <ul className="text-sm space-y-2">
                    {dayNotes.map((n) => (
                      <li key={n.id} className="border-l-2 border-gray-300 pl-3">
                        <strong>{n.title}</strong>
                        <span className="text-gray-500 text-xs ml-2">
                          ({format(new Date(n.date + "T12:00:00"), "dd/MM")})
                        </span>
                        <p className="text-gray-700 whitespace-pre-wrap">{n.description}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
