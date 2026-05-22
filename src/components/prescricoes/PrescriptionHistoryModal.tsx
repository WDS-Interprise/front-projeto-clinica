import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RefreshCw } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import type { Prescription } from "@/types/prescription"

type Props = {
  open: boolean
  onClose: () => void
  prescriptions: Prescription[]
  onRenew: (prescriptionId: string) => void
}

export function PrescriptionHistoryModal({ open, onClose, prescriptions, onRenew }: Props) {
  const finalized = prescriptions.filter((p) => p.status === "FINALIZED")

  return (
    <Modal open={open} onClose={onClose} title="Histórico de prescrições" size="md">
      {finalized.length === 0 ? (
        <p className="text-sm text-text-secondary py-4">Nenhuma prescrição anterior para este paciente.</p>
      ) : (
        <ul className="space-y-3 max-h-[360px] overflow-y-auto">
          {finalized.map((rx) => (
            <li
              key={rx.id}
              className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-medium text-text">
                  {format(new Date(rx.prescriptionDate), "dd MMM yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {rx.items.length} item(ns)
                  {rx.professional?.name ? ` · ${rx.professional.name}` : ""}
                </p>
                <ul className="text-xs text-text-secondary mt-2 space-y-0.5">
                  {rx.items.slice(0, 3).map((i) => (
                    <li key={i.id}>{i.name}</li>
                  ))}
                </ul>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => {
                  onRenew(rx.id)
                  onClose()
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Renovar prescrição
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
