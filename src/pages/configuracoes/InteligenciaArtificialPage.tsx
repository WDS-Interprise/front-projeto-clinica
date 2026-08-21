import { useCallback, useEffect, useState } from "react"
import { Bot, Bell, Lock } from "lucide-react"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import { Checkbox } from "@/components/ui/checkbox"
import { api, type WhatsappSettings } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import {
  AI_MODE_OPTIONS,
  AI_PERMISSION_GROUPS,
  DEFAULT_AI_PERMISSIONS,
  type AiMode,
  type AiPermissionKey,
  type AiPermissions,
} from "@/lib/ai-permissions"
import { cn } from "@/lib/utils"

function AiModeCard({
  selected,
  disabled,
  label,
  description,
  onSelect,
}: {
  selected: boolean
  disabled?: boolean
  label: string
  description: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-[#006B4D]/35 bg-[#E8F6EE]"
          : "border-[#E4EBE6] bg-white hover:border-[#006B4D]/20 hover:bg-[#FAFCFB]",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-[#006B4D]" : "border-[#C5D0CA]"
        )}
        aria-hidden
      >
        {selected && <span className="h-2 w-2 rounded-full bg-[#006B4D]" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-[#12261E]">{label}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-[#6B7C74]">{description}</span>
      </span>
    </button>
  )
}

export default function InteligenciaArtificialPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<WhatsappSettings | null>(null)
  const [aiMode, setAiMode] = useState<AiMode>("MANUAL")
  const [permissions, setPermissions] = useState<AiPermissions>(DEFAULT_AI_PERMISSIONS)
  const [offsetsText, setOffsetsText] = useState("24, 2")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.whatsapp
      .getSettings()
      .then((s) => {
        setSettings(s)
        setAiMode(s.aiMode ?? "MANUAL")
        setPermissions({ ...DEFAULT_AI_PERMISSIONS, ...s.aiPermissions })
        setOffsetsText(s.reminderOffsets.join(", "))
      })
      .catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao carregar IA"), "error"))
  }, [toast])

  const togglePermission = useCallback((key: AiPermissionKey) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleSave = async () => {
    if (!settings) return
    const offsets = offsetsText
      .split(/[,;\s]+/)
      .map((x) => parseInt(x.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0)
    if (offsets.length === 0) {
      toast("Informe ao menos uma hora para lembretes (ex.: 24, 2)", "error")
      return
    }
    setSaving(true)
    try {
      const updated = await api.whatsapp.updateSettings({
        defaultConnectionId: settings.defaultConnectionId,
        autoRemindersEnabled: settings.autoRemindersEnabled,
        reminderOffsets: offsets,
        aiMode,
        aiPermissions: permissions,
      })
      setSettings(updated)
      setAiMode(updated.aiMode ?? aiMode)
      setOffsetsText(updated.reminderOffsets.join(", "))
      toast("Configurações salvas")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao salvar configurações"), "error")
    } finally {
      setSaving(false)
    }
  }

  if (!settings) {
    return (
      <SettingsLayout>
        <p className="text-sm text-[#6B7C74]">Carregando...</p>
      </SettingsLayout>
    )
  }

  const permissionsDisabled = aiMode === "MANUAL"

  return (
    <SettingsLayout>
      <SettingsPageHeader
        title="Inteligência Artificial"
        description="Defina como a IA da clínica atende pacientes no WhatsApp."
      />

      {!settings.openRouterConfigured && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Configure OPENROUTER_API_KEY no servidor para habilitar o assistente.
        </div>
      )}

      <div className="rounded-2xl border border-[#E4EBE6] bg-white shadow-sm">
        <section className="border-b border-[#E4EBE6] px-6 py-6 sm:px-8">
          <h2 className="text-[15px] font-semibold text-[#12261E]">Modo de atendimento</h2>
          <div className="mt-4 space-y-3">
            {AI_MODE_OPTIONS.map((opt) => (
              <AiModeCard
                key={opt.value}
                selected={aiMode === opt.value}
                disabled={!settings.openRouterConfigured && opt.value !== "MANUAL"}
                label={opt.label}
                description={opt.description}
                onSelect={() => setAiMode(opt.value)}
              />
            ))}
          </div>
        </section>

        <section className="border-b border-[#E4EBE6] px-6 py-6 sm:px-8">
          <div className="flex items-center gap-2">
            <Bot className="h-[18px] w-[18px] text-[#006B4D]" />
            <h2 className="text-[15px] font-semibold text-[#12261E]">Permissões da IA</h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {AI_PERMISSION_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A9A90]">
                  {group.title}
                </p>
                <ul className="space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item.key}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-[#1B2E26]",
                          permissionsDisabled && "cursor-not-allowed opacity-55"
                        )}
                      >
                        <Checkbox
                          id={`ai-perm-${item.key}`}
                          checked={permissions[item.key]}
                          disabled={permissionsDisabled}
                          onCheckedChange={() => togglePermission(item.key)}
                          className={
                            permissions[item.key]
                              ? "border-[#006B4D] bg-[#006B4D] focus-visible:ring-[#006B4D]/30"
                              : "border-[#C5D0CA] bg-white focus-visible:ring-[#006B4D]/20"
                          }
                        />
                        <span className="pt-px">{item.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-6 sm:px-8">
          <div className="flex items-center gap-2">
            <Bell className="h-[18px] w-[18px] text-[#006B4D]" />
            <h2 className="text-[15px] font-semibold text-[#12261E]">Lembretes automáticos</h2>
          </div>

          <div className="mt-5 space-y-4">
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#1B2E26]">
              <Checkbox
                checked={settings.autoRemindersEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoRemindersEnabled: checked === true })
                }
                className={
                  settings.autoRemindersEnabled
                    ? "border-[#006B4D] bg-[#006B4D] focus-visible:ring-[#006B4D]/30"
                    : "border-[#C5D0CA] bg-white focus-visible:ring-[#006B4D]/20"
                }
              />
              Enviar lembretes automaticamente
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <div>
                <label className="text-[13px] font-medium text-[#12261E]">Conexão padrão</label>
                <select
                  className="mt-1.5 h-10 w-full cursor-pointer rounded-lg border border-[#D5DED8] bg-white px-3 pr-10 text-sm text-[#12261E] outline-none focus:border-[#006B4D]"
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
                <label className="text-[13px] font-medium text-[#12261E]">
                  Horas antes da consulta (separadas por vírgula)
                </label>
                <input
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#D5DED8] bg-white px-3 text-sm text-[#12261E] outline-none focus:border-[#006B4D]"
                  value={offsetsText}
                  onChange={(e) => setOffsetsText(e.target.value)}
                  placeholder="24, 2"
                  autoComplete="off"
                />
              </div>
            </div>

            <p className="text-[12px] leading-relaxed text-[#8A9A90]">
              Ex.: 24 envia 24h antes; 2 envia 2h antes. Usa o template &quot;Lembrete de
              consulta&quot;.
            </p>
          </div>
        </section>

        <footer className="border-t border-[#E4EBE6] px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#006B4D] px-5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#005a41] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lock className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar configurações"}
            </button>
          </div>

          <p className="mt-4 max-w-3xl text-[12px] leading-relaxed text-[#8A9A90]">
            As mudanças afetarão o comportamento da IA no atendimento via WhatsApp para todos os
            usuários da clínica.
          </p>
        </footer>
      </div>
    </SettingsLayout>
  )
}
