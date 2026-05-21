import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { api, type WhatsappSettings } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

export default function WhatsappRemindersSection() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<WhatsappSettings | null>(null)
  const [offsetsText, setOffsetsText] = useState("24, 2")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.whatsapp
      .getSettings()
      .then((s) => {
        setSettings(s)
        setOffsetsText(s.reminderOffsets.join(", "))
      })
      .catch((e: unknown) =>
        toast(toastMessageFromApiError(e, "Erro ao carregar"), "error")
      )
  }, [toast])

  const handleSave = async () => {
    if (!settings) return
    const offsets = offsetsText
      .split(/[,;\s]+/)
      .map((x) => parseInt(x.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0)
    if (offsets.length === 0) {
      toast("Informe ao menos uma hora (ex.: 24, 2)", "error")
      return
    }
    setSaving(true)
    try {
      const updated = await api.whatsapp.updateSettings({
        defaultConnectionId: settings.defaultConnectionId,
        autoRemindersEnabled: settings.autoRemindersEnabled,
        reminderOffsets: offsets,
      })
      setSettings(updated)
      toast("Configurações salvas")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao salvar"), "error")
    } finally {
      setSaving(false)
    }
  }

  if (!settings) return <p className="text-sm text-text-secondary">Carregando...</p>

  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-4 max-w-lg">
      <h2 className="font-semibold text-text">Lembretes automáticos</h2>
      <label className="flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          checked={settings.autoRemindersEnabled}
          onChange={(e) =>
            setSettings({ ...settings, autoRemindersEnabled: e.target.checked })
          }
        />
        Enviar lembretes automaticamente
      </label>
      <div>
        <label className="text-sm font-medium text-text">Conexão padrão</label>
        <select
          className="mt-1 w-full h-10 rounded-lg border border-border px-3 text-sm bg-surface text-text"
          value={settings.defaultConnectionId ?? ""}
          onChange={(e) =>
            setSettings({
              ...settings,
              defaultConnectionId: e.target.value || null,
            })
          }
        >
          <option value="">Automática (primeira conectada)</option>
          {settings.connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.status})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-text">
          Horas antes da consulta (separadas por vírgula)
        </label>
        <input
          className="mt-1 w-full h-10 rounded-lg border border-border px-3 text-sm bg-surface text-text"
          value={offsetsText}
          onChange={(e) => setOffsetsText(e.target.value)}
          placeholder="24, 2"
        />
        <p className="text-xs text-text-secondary mt-1">
          Ex.: 24 envia 24h antes; 2 envia 2h antes. Usa o template &quot;Lembrete de consulta&quot;.
        </p>
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Salvando..." : "Salvar lembretes"}
      </Button>
    </div>
  )
}
