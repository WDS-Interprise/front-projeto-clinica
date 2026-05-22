import { Palette } from "lucide-react"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import ThemeAppearanceCard from "@/components/settings/ThemeAppearanceCard"

export default function AparenciaPage() {
  return (
    <SettingsLayout className="max-w-2xl">
      <SettingsPageHeader
        icon={<Palette className="w-7 h-7 text-primary" />}
        title="Aparência"
        description="Personalize o tema da interface. A preferência é salva neste navegador."
      />

      <ThemeAppearanceCard hideHeader />
    </SettingsLayout>
  )
}
