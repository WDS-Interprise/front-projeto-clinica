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
  patientEmail?: string
  saving: boolean
  onBack: () => void
  onFinalize: (opts: {
    shareWhatsApp: boolean
    shareSms: boolean
    shareEmail: boolean
    sharePhone?: string
    shareEmailAddress?: string
    signDigital: boolean
  }) => void
}

export function PrescricaoStepAssinar({
  prescription,
  patientPhone,
  patientEmail = "",
  saving,
  onBack,
  onFinalize,
}: Props) {
  const [signEnabled, setSignEnabled] = useState(false)
  const [signedStub, setSignedStub] = useState(false)
  const [shareEnabled, setShareEnabled] = useState(false)
  const [whatsapp, setWhatsapp] = useState(true)
  const [sms, setSms] = useState(false)
  const [email, setEmail] = useState(false)
  const [phone, setPhone] = useState(patientPhone)
  const [emailAddress, setEmailAddress] = useState(patientEmail)
  const [signModal, setSignModal] = useState(false)

  const counts = itemCounts(prescription.items)
  const patientName = prescription.patient?.name ?? "Paciente"
  const hasChannel = whatsapp || sms || email

  const shareError =
    shareEnabled && !hasChannel
      ? "Selecione ao menos um canal de envio."
      : shareEnabled && (whatsapp || sms) && !phone.trim()
        ? "Informe o telefone para WhatsApp ou SMS."
        : shareEnabled && email && !emailAddress.trim()
          ? "Informe o e-mail para enviar a prescrição."
          : shareEnabled && email && !emailAddress.includes("@")
            ? "Informe um e-mail válido."
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

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
        Assinatura digital ICP-Brasil: em desenvolvimento. Hoje você pode simular o fluxo. O PDF
        dirá claramente que não há validade jurídica.
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="space-y-1">
          <Switch
            checked={signEnabled}
            onChange={(v) => {
              setSignEnabled(v)
              if (!v) setSignedStub(false)
            }}
            label="Demonstração de assinatura (em desenvolvimento)"
          />
          <p className="text-sm text-text-secondary pl-14">
            Simula o fluxo futuro de certificado. Não gera assinatura jurídica.
          </p>
        </div>
        {signEnabled && (
          <div className="pl-2">
            {signedStub ? (
              <p className="text-sm text-primary">
                Fluxo demo registrado. PDF marcado como simulação.
              </p>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setSignModal(true)}>
                Ver como será a assinatura ICP
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
            <Input
              label="E-mail do paciente"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="paciente@email.com"
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
            <label className="flex items-start gap-2 text-sm text-text cursor-pointer">
              <input
                type="checkbox"
                checked={sms}
                onChange={(e) => setSms(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span>
                SMS para este telefone
                <span className="block text-xs text-text-secondary">
                  Registrado na trilha. Gateway SMS ainda não está ligado.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm text-text cursor-pointer">
              <input
                type="checkbox"
                checked={email}
                onChange={(e) => setEmail(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span>
                E-mail com o PDF
                <span className="block text-xs text-text-secondary">
                  Envia se o SMTP da plataforma estiver configurado.
                </span>
              </span>
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
              shareSms: shareEnabled && sms,
              shareEmail: shareEnabled && email,
              sharePhone: phone.trim() || undefined,
              shareEmailAddress: emailAddress.trim() || undefined,
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
