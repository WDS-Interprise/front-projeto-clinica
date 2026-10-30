import { Palette } from "lucide-react"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import ThemeAppearanceCard from "@/components/settings/ThemeAppearanceCard"

export default function AparenciaPage() {
  return (
    <SettingsLayout className="max-w-2xl">
      <SettingsPageHeader
        icon={<Palette className="w-7 h-7 text-primary" />}
        title="Aparência"
        description="O tema escuro é o padrão: preto e cinza. O tema claro usa contraste azul."
      />
      <ThemeAppearanceCard hideHeader />
    </SettingsLayout>
  )
}
