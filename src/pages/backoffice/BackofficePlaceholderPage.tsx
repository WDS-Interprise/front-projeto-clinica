import type { LucideIcon } from "lucide-react"

type Props = {
  title: string
  description: string
  icon: LucideIcon
}

export default function BackofficePlaceholderPage({ title, description, icon: Icon }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#12261E]">{title}</h1>
        <p className="text-sm text-[#6B7C74] mt-1">{description}</p>
      </div>
      <div className="rounded-2xl border border-[#E4EBE6] bg-white p-10 flex flex-col items-center text-center max-w-lg">
        <div className="w-14 h-14 rounded-2xl bg-[#E8F6EE] flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-[#006B4D]" />
        </div>
        <p className="text-[#5B6B63] text-sm">
          Módulo em construção. Os dados reais de assinatura e cobrança serão conectados na próxima fase.
        </p>
      </div>
    </div>
  )
}
