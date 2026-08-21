import { useEffect, useMemo, useState } from "react"
import { QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { api, type ClinmaxPaySettings } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import {
  PIX_KEY_KIND_LABEL,
  cpfDigits,
  detectPixKeyKind,
  maskCpfOrCnpjInput,
  maskPixKeyInput,
  sanitizePersonName,
  validateCpfOrCnpj,
  validateName,
  validatePixKey,
} from "@/lib/form-validation"

export default function ClinmaxPaySettingsCard() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<ClinmaxPaySettings | null>(null)
  const [editing, setEditing] = useState(false)
  const [pixKey, setPixKey] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientDocument, setRecipientDocument] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [docLockedToKey, setDocLockedToKey] = useState(true)

  const load = () => {
    api.finance
      .getPaySettings()
      .then((s) => {
        setSettings(s)
        setRecipientName(s.recipientName ?? "")
        if (!s.pixKeyMasked) setEditing(true)
      })
      .catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao carregar ClinMax Pay"), "error"))
  }

  useEffect(() => {
    load()
  }, [])

  const pixKind = detectPixKeyKind(pixKey)
  const pixVal = useMemo(() => validatePixKey(pixKey), [pixKey])
  const nameVal = useMemo(() => validateName(recipientName), [recipientName])
  const docVal = useMemo(() => validateCpfOrCnpj(recipientDocument), [recipientDocument])
  const docMatchesKey =
    pixKind !== "CPF" && pixKind !== "CNPJ"
      ? true
      : cpfDigits(pixKey) === cpfDigits(recipientDocument)
  const formOk = pixVal.ok && nameVal.ok && docVal.ok && docMatchesKey && confirmed

  if (!settings) {
    return (
      <section className="rounded-[14px] border border-[#E4EBE6] bg-white p-5">
        <p className="text-sm text-text-secondary">Carregando recebimentos...</p>
      </section>
    )
  }

  const onPixKeyChange = (value: string) => {
    const next = maskPixKeyInput(value)
    setPixKey(next)
    const kind = detectPixKeyKind(next)
    if ((kind === "CPF" || kind === "CNPJ") && docLockedToKey) {
      setRecipientDocument(maskCpfOrCnpjInput(next))
    }
  }

  const save = async () => {
    if (!formOk) {
      setShowErrors(true)
      toast("Revise os campos destacados antes de salvar", "error")
      return
    }
    setSaving(true)
    try {
      const next = await api.finance.savePaySettings({
        pixKey: pixKey.trim(),
        pixKeyType: pixKind ?? undefined,
        recipientName: recipientName.trim(),
        recipientDocument: cpfDigits(recipientDocument),
        enabled: true,
        confirmed,
      })
      setSettings(next)
      setEditing(false)
      setPixKey("")
      setRecipientDocument("")
      setConfirmed(false)
      setShowErrors(false)
      setDocLockedToKey(true)
      toast("Chave Pix de recebimento salva")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao salvar chave Pix"), "error")
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (enabled: boolean) => {
    try {
      const next = await api.finance.setPayEnabled(enabled)
      setSettings(next)
      toast(enabled ? "Recebimentos integrados ativados" : "Recebimentos integrados desativados")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Não foi possível alterar o status"), "error")
    }
  }

  return (
    <section className="space-y-4 rounded-[14px] border border-[#E4EBE6] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F6EE] text-[#006B4D]">
            <QrCode className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[16px] font-semibold text-[#12261E]">Recebimentos ClinMax</h2>
            <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-[#6B7C74]">
              Paciente paga Pix na conta da plataforma. Depois que o saldo fica disponível, a ClinMax
              retém a taxa e transfere o restante para a chave da clínica.
            </p>
          </div>
        </div>
        <Switch
          id="clinmax-pay-enabled"
          checked={settings.enabled}
          onChange={toggle}
          label={settings.enabled ? "ATIVO" : "INATIVO"}
        />
      </div>

      {!settings.asaasConfigured && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-text">
          Gateway ainda não configurado no servidor. A chave pode ser cadastrada agora. A geração de Pix
          só funciona com ASAAS_API_KEY.
        </p>
      )}

      {settings.outstandingDebit > 0 && (
        <p className="rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
          Compensação pendente: R$ {settings.outstandingDebit.toFixed(2)}. Será descontada no próximo
          repasse.
        </p>
      )}

      {!editing && settings.pixKeyMasked ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-secondary">Chave Pix para recebimento</dt>
            <dd className="font-medium text-text">
              {settings.pixKeyType} {settings.pixKeyMasked}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Titular</dt>
            <dd className="font-medium text-text">{settings.recipientName}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Taxa ClinMax Pay</dt>
            <dd className="font-medium text-text">
              {settings.platformFeePercent}% sobre o valor líquido recebido
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Status da chave</dt>
            <dd className="font-medium text-text">{settings.status === "VERIFIED" ? "Validada" : settings.status}</dd>
          </div>
        </dl>
      ) : (
        <div className="space-y-3">
          <div>
            <Input
              label="Chave Pix"
              value={pixKey}
              onChange={(e) => onPixKeyChange(e.target.value)}
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              autoComplete="off"
              error={showErrors && !pixVal.ok ? pixVal.msg : undefined}
            />
            {pixKind && pixVal.ok && (
              <p className="mt-1 text-[12px] text-[#6B7C74]">Tipo detectado: {PIX_KEY_KIND_LABEL[pixKind]}</p>
            )}
          </div>
          <Input
            label="Titular"
            value={recipientName}
            onChange={(e) => setRecipientName(sanitizePersonName(e.target.value).slice(0, 80))}
            placeholder="Nome completo ou razão social"
            autoComplete="name"
            error={showErrors && !nameVal.ok ? nameVal.msg : undefined}
          />
          <Input
            label="CPF ou CNPJ do titular"
            value={recipientDocument}
            onChange={(e) => {
              setDocLockedToKey(false)
              setRecipientDocument(maskCpfOrCnpjInput(e.target.value))
            }}
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            inputMode="numeric"
            autoComplete="off"
            maxLength={18}
            error={
              showErrors
                ? !docVal.ok
                  ? docVal.msg
                  : !docMatchesKey
                    ? "Quando a chave é CPF ou CNPJ, o documento do titular precisa ser o mesmo"
                    : undefined
                : undefined
            }
          />
          <div className="flex items-start gap-2 text-sm text-text">
            <Checkbox
              id="clinmax-pay-confirm"
              checked={confirmed}
              onCheckedChange={setConfirmed}
              className="mt-0.5"
            />
            <label htmlFor="clinmax-pay-confirm" className="cursor-pointer">
              Confirmo que esta chave Pix pertence à clínica e será usada para receber o repasse das consultas.
            </label>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={() => void save()} disabled={saving || !confirmed}>
              {saving ? "Salvando..." : "Salvar chave Pix"}
            </Button>
          </div>
        </div>
      )}

      {!editing && settings.pixKeyMasked && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setEditing(true)
            setShowErrors(false)
            setConfirmed(false)
            setDocLockedToKey(true)
          }}
        >
          Alterar chave Pix
        </Button>
      )}
    </section>
  )
}
