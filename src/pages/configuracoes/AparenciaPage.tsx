import { Palette } from "lucide-react"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"

export default function AparenciaPage() {
  return (
    <SettingsLayout className="max-w-2xl">
      <SettingsPageHeader
        icon={<Palette className="w-7 h-7 text-primary" />}
        title="Aparência"
        description="A interface do ClinMax usa o tema claro."
      />
      <div className="rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
        O modo escuro foi desativado. Toda a plataforma permanece no tema claro.
      </div>
    </SettingsLayout>
  )
}
