import SettingsSidebar from "@/components/layout/SettingsSidebar"

export default function PlaceholderConfigPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] p-6 lg:p-8 gap-8">
      <SettingsSidebar />
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        <p className="text-sm text-text-secondary mt-2">
          Seção em construção — estrutura preparada conforme esboço do projeto.
        </p>
      </div>
    </div>
  )
}
