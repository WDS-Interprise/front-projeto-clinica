import { Link } from "react-router-dom"
import { CheckCircle2, Download, Printer, Plus, RefreshCw } from "lucide-react"
import { Stepper } from "@/components/ui/stepper"
import { Button } from "@/components/ui/button"
import {
  formatEmissionDate,
  latestWhatsAppShare,
  receiptTypeLabel,
} from "@/components/prescricoes/prescription-ui"
import type { Prescription } from "@/types/prescription"

type Props = {
  prescription: Prescription
  resending: boolean
  onSavePdf: () => void
  onPrintPdf: () => void
  onNewPrescription: () => void
  onResendWhatsApp?: () => void
}

export function PrescricaoStepFinalizada({
  prescription,
  resending,
  onSavePdf,
  onPrintPdf,
  onNewPrescription,
  onResendWhatsApp,
}: Props) {
  const professionalName = prescription.professional?.name ?? "Profissional"
  const patientName = prescription.patient?.name ?? "Paciente"
  const receiptLabel = receiptTypeLabel(prescription.receiptType, prescription.items)
  const waShare = latestWhatsAppShare(prescription)
  const hadWhatsAppAttempt = Boolean(waShare)
  const whatsappConfigHint =
    waShare?.errorMessage?.includes("WhatsApp") ||
    waShare?.errorMessage?.includes("whatsapp")

  return (
    <div className="space-y-8 text-center max-w-lg mx-auto">
      <Stepper steps={["Prescrever", "Assinar e compartilhar", "Finalizada"]} current={2} />

      <div className="flex flex-col items-center gap-3 pt-4">
        <CheckCircle2 className="w-16 h-16 text-primary" />
        <h2 className="text-xl font-bold text-text">Tudo certo! Prescrição emitida com sucesso.</h2>
        <p className="text-sm text-text-secondary">
          Dr(a). <strong className="text-text">{professionalName}</strong>, prescrição de{" "}
          <strong className="text-text">{receiptLabel.toLowerCase()}</strong> emitida para o paciente{" "}
          <strong className="text-text">{patientName}</strong> com sucesso.
        </p>
        <p className="text-sm text-text-secondary">
          Emitida em: <strong className="text-text">{formatEmissionDate(prescription)}</strong>
        </p>

        {hadWhatsAppAttempt && waShare?.status === "SENT" && (
          <p className="text-sm text-primary">Prescrição enviada por WhatsApp com sucesso.</p>
        )}
        {hadWhatsAppAttempt && waShare?.status === "PENDING" && (
          <p className="text-sm text-text-secondary">
            Prescrição finalizada. Envio por WhatsApp em andamento.
          </p>
        )}
        {hadWhatsAppAttempt && waShare?.status === "FAILED" && (
          <div className="space-y-2 w-full">
            <p className="text-sm text-danger">
              Prescrição finalizada, mas não foi possível enviar por WhatsApp.
              {waShare.errorMessage ? ` ${waShare.errorMessage}` : ""}
            </p>
            {onResendWhatsApp && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                disabled={resending}
                onClick={onResendWhatsApp}
              >
                <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
                Reenviar
              </Button>
            )}
            {whatsappConfigHint && (
              <p className="text-xs text-text-secondary">
                <Link to="/configuracoes/whatsapp" className="text-primary underline">
                  Configurar WhatsApp
                </Link>
              </p>
            )}
          </div>
        )}

        {prescription.validationCode && (
          <div className="rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm w-full text-left">
            <p>
              <span className="text-text-secondary">Validação: </span>
              <strong className="text-text">{prescription.validationCode}</strong>
            </p>
            {prescription.accessCode && (
              <p className="mt-1">
                <span className="text-text-secondary">Código de acesso: </span>
                <strong className="text-text">{prescription.accessCode}</strong>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" className="gap-2" onClick={onSavePdf}>
          <Download className="w-4 h-4" />
          Salvar PDF
        </Button>
        <Button variant="secondary" className="gap-2" onClick={onPrintPdf}>
          <Printer className="w-4 h-4" />
          Imprimir PDF
        </Button>
        <Button className="gap-2" onClick={onNewPrescription}>
          <Plus className="w-4 h-4" />
          Nova prescrição
        </Button>
      </div>
    </div>
  )
}
