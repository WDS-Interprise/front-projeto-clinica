import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"

export default function PlaceholderConfigPage({ title }: { title: string }) {
  return (
    <SettingsLayout className="max-w-2xl">
      <SettingsPageHeader title={title} description="Seção em construção — estrutura preparada conforme esboço do projeto." />
    </SettingsLayout>
  )
}
