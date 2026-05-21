import { CreditCard, FileDown, ArrowLeftRight, MessageSquare, Smartphone, Video } from "lucide-react"

const sections = [
  {
    icon: CreditCard,
    title: "Assinatura",
    desc: "Planos, faturamento e renovação da plataforma (em breve).",
  },
  {
    icon: CreditCard,
    title: "Cobrança",
    desc: "Gateways, boletos e histórico de pagamentos das clínicas (em breve).",
  },
  {
    icon: MessageSquare,
    title: "Permissões de envio",
    desc: "E-mail e WhatsApp em nível de plataforma (em breve).",
  },
  {
    icon: Smartphone,
    title: "SMS enviados",
    desc: "Relatório consolidado de SMS (em breve).",
  },
  {
    icon: Video,
    title: "Teleconsultas",
    desc: "Uso de teleconsulta por clínica (em breve).",
  },
  {
    icon: FileDown,
    title: "Exportar dados",
    desc: "Exportação em massa para compliance e backup (em breve).",
  },
  {
    icon: ArrowLeftRight,
    title: "Migrar",
    desc: "Importação de bases legadas (em breve).",
  },
]

export default function BackofficePlatformPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Plataforma</h1>
        <p className="text-sm text-text-secondary mt-1">
          Configurações exclusivas dos donos — não disponíveis no CRM das clínicas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="bg-surface border border-border rounded-xl p-5 flex gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-text">{title}</h2>
              <p className="text-sm text-text-secondary mt-1">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
