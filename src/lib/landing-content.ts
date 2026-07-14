import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  FileText,
  MessageCircle,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react"

export type LandingFeature = {
  icon: LucideIcon
  title: string
  description: string
}

export type LandingStep = {
  step: string
  title: string
  description: string
}

export type LandingRole = {
  icon: LucideIcon
  title: string
  bullets: string[]
}

export const LANDING_STATS = [
  { value: "100%", label: "Fluxo digital", detail: "Sem papel na rotina clínica" },
  { value: "24/7", label: "Acesso seguro", detail: "Dados na nuvem com controle por perfil" },
  { value: "WhatsApp", label: "Comunicação", detail: "Lembretes e mensagens automáticas" },
  { value: "TISS", label: "Convênios", detail: "Gestão financeira integrada" },
] as const

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: CalendarClock,
    title: "Agenda inteligente",
    description:
      "Horários, confirmações, fila do dia e logs de alterações para recepção e profissionais.",
  },
  {
    icon: FileText,
    title: "Prontuário eletrônico",
    description:
      "Histórico clínico completo, evoluções e documentos vinculados ao paciente em um só lugar.",
  },
  {
    icon: Pill,
    title: "Prescrições digitais",
    description:
      "Medicamentos, exames e vacinas com consulta integrada a bulas e referências clínicas.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp integrado",
    description:
      "Lembretes de consulta, templates de mensagem e comunicação direta com pacientes.",
  },
  {
    icon: Wallet,
    title: "Finanças e fluxo de caixa",
    description:
      "Receitas, despesas, extrato e relatórios financeiros para gestão do consultório.",
  },
  {
    icon: BarChart3,
    title: "Relatórios e indicadores",
    description:
      "Painel com métricas de atendimento, satisfação do paciente e desempenho da clínica.",
  },
  {
    icon: ClipboardList,
    title: "Estoque e TISS",
    description:
      "Controle de materiais e recursos para operadoras de saúde e convênios.",
  },
  {
    icon: ShieldCheck,
    title: "Permissões por perfil",
    description:
      "Médicos, recepção e administradores com acessos definidos por função na clínica.",
  },
]

export const LANDING_STEPS: LandingStep[] = [
  {
    step: "01",
    title: "Cadastre sua clínica",
    description:
      "Crie sua conta, configure usuários, convites e personalize a aparência do sistema.",
  },
  {
    step: "02",
    title: "Organize a operação",
    description:
      "Importe pacientes, configure a agenda, prontuário e integrações como WhatsApp.",
  },
  {
    step: "03",
    title: "Atenda com fluidez",
    description:
      "Do check-in à prescrição e cobrança — tudo registrado e acessível em tempo real.",
  },
]

export const LANDING_ROLES: LandingRole[] = [
  {
    icon: Stethoscope,
    title: "Profissionais de saúde",
    bullets: [
      "Prontuário e prescrições no fluxo do atendimento",
      "Consulta rápida a CID-10, CID-11 e bulas",
      "Histórico clínico sempre disponível",
    ],
  },
  {
    icon: Users,
    title: "Recepção e equipe",
    bullets: [
      "Agenda visual com confirmações e lembretes",
      "Cadastro de pacientes e contatos",
      "Comunicação via WhatsApp integrada",
    ],
  },
  {
    icon: BarChart3,
    title: "Gestão da clínica",
    bullets: [
      "Finanças, extrato e fluxo de caixa",
      "Relatórios e pesquisa de satisfação",
      "Usuários, permissões e multi-clínicas",
    ],
  },
]

export const LANDING_NAV = [
  { id: "funcionalidades", label: "Funcionalidades" },
  { id: "como-funciona", label: "Como funciona" },
  { id: "para-quem", label: "Para quem" },
] as const
