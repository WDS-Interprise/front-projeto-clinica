import { useState } from "react"
import { Stepper } from "@/components/ui/stepper"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { SignatureStubModal } from "@/components/prescricoes/SignatureStubModal"
import { itemCounts, receiptSummaryLine } from "@/components/prescricoes/prescription-ui"
import type { Prescription } from "@/types/prescription"

type Props = {
  prescription: Prescription
  patientPhone: string
  saving: boolean
  onBack: () => void
  onFinalize: (opts: {
    shareWhatsApp: boolean
    sharePhone?: string
    signDigital: boolean
  }) => void
}

export function PrescricaoStepAssinar({
  prescription,
  patientPhone,
  saving,
  onBack,
  onFinalize,
}: Props) {
  const [signEnabled, setSignEnabled] = useState(false)
  const [signedStub, setSignedStub] = useState(false)
  const [shareEnabled, setShareEnabled] = useState(false)
  const [whatsapp, setWhatsapp] = useState(true)
  const [phone, setPhone] = useState(patientPhone)
  const [signModal, setSignModal] = useState(false)

  const counts = itemCounts(prescription.items)
  const patientName = prescription.patient?.name ?? "Paciente"

  const shareError =
    shareEnabled && whatsapp && !phone.trim()
      ? "Informe o telefone para compartilhar por WhatsApp."
      : shareEnabled && !whatsapp
        ? "Selecione ao menos um canal de envio."
        : null

  return (
    <div className="space-y-6">
      <Stepper steps={["Prescrever", "Assinar e compartilhar", "Finalizada"]} current={1} />

      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <h2 className="font-semibold text-text">Resumo da prescrição</h2>
        <p className="text-sm text-text-secondary">{receiptSummaryLine(prescription)}</p>
        <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
          {counts.medication > 0 && (
            <span className="rounded-full bg-surface-alt px-2.5 py-1 border border-border">
              {counts.medication} medicamento{counts.medication > 1 ? "s" : ""}
            </span>
          )}
          {counts.exam > 0 && (
            <span className="rounded-full bg-surface-alt px-2.5 py-1 border border-border">
              {counts.exam} exame{counts.exam > 1 ? "s" : ""}
            </span>
          )}
          {counts.vaccine > 0 && (
            <span className="rounded-full bg-surface-alt px-2.5 py-1 border border-border">
              {counts.vaccine} vacina{counts.vaccine > 1 ? "s" : ""}
            </span>
          )}
          {counts.freeText > 0 && (
            <span className="rounded-full bg-surface-alt px-2.5 py-1 border border-border">
              {counts.freeText} texto{counts.freeText > 1 ? "s" : ""} livre{counts.freeText > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-text">
          <span className="text-text-secondary">Paciente: </span>
          <strong>{patientName}</strong>
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="space-y-1">
          <Switch
            checked={signEnabled}
            onChange={(v) => {
              setSignEnabled(v)
              if (!v) setSignedStub(false)
            }}
            label="Assinatura Digital"
          />
          <p className="text-sm text-text-secondary pl-14">
            Utilizar certificado digital para assinar a prescrição.
          </p>
        </div>
        {signEnabled && (
          <div className="pl-2">
            {signedStub ? (
              <p className="text-sm text-primary">Assinatura simulada registrada (demo).</p>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setSignModal(true)}>
                Configurar certificado
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="space-y-1">
          <Switch
            checked={shareEnabled}
            onChange={setShareEnabled}
            label="Enviar Prescrição"
          />
          <p className="text-sm text-text-secondary pl-14">
            Como deseja compartilhar esta prescrição?
          </p>
        </div>
        {shareEnabled && (
          <div className="space-y-3 pl-2">
            <Input
              label="Telefone do paciente"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(62) 99999-9999"
            />
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
              <input
                type="checkbox"
                checked={whatsapp}
                onChange={(e) => setWhatsapp(e.target.checked)}
                className="rounded border-border"
              />
              WhatsApp para este telefone
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-not-allowed opacity-60">
              <input type="checkbox" disabled className="rounded border-border" />
              SMS para este telefone (em breve)
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-not-allowed opacity-60">
              <input type="checkbox" disabled className="rounded border-border" />
              Compartilhar com este e-mail (em breve)
            </label>
          </div>
        )}
        {shareError && <p className="text-sm text-danger">{shareError}</p>}
      </div>

      <SignatureStubModal
        open={signModal}
        onClose={() => setSignModal(false)}
        onConfirm={() => {
          setSignedStub(true)
          setSignModal(false)
        }}
      />

      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="secondary" onClick={onBack} disabled={saving}>
          Anterior
        </Button>
        <Button
          disabled={Boolean(shareError) || saving || (signEnabled && !signedStub)}
          onClick={() =>
            onFinalize({
              shareWhatsApp: shareEnabled && whatsapp,
              sharePhone: phone.trim() || undefined,
              signDigital: signEnabled && signedStub,
            })
          }
        >
          Finalizar
        </Button>
      </div>
    </div>
  )
}
