import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  CirclePlus,
  CreditCard,
  DollarSign,
  FilePlus,
  Flower2,
  FolderOpen,
  HeartHandshake,
  HeartPulse,
  MessageCircle,
  Plus,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react"
import { COMPANY_LEGAL } from "@/lib/company-legal"

export type LandingFeature = {
  icon: LucideIcon
  title: string
  description: string
}

export type LandingStep = {
  icon: LucideIcon
  title: string
  description: string
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: CalendarClock,
    title: "Agendamento online",
    description:
      "Pacientes agendam 24h por dia e você reduz faltas com lembretes automáticos.",
  },
  {
    icon: FolderOpen,
    title: "Prontuário eletrônico",
    description: "Histórico clínico completo, acessível de qualquer lugar com segurança.",
  },
  {
    icon: FilePlus,
    title: "Receitas e exames",
    description: "Emita receitas, solicitação de exames e atestados de forma rápida e digital.",
  },
  {
    icon: DollarSign,
    title: "Financeiro integrado",
    description: "Controle de recebimentos, despesas e relatórios financeiros em tempo real.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp integrado",
    description: "Comunique-se com seus pacientes de forma prática e segura.",
  },
  {
    icon: BarChart3,
    title: "Relatórios e indicadores",
    description: "Acompanhe o desempenho da sua clínica com dashboards intuitivos.",
  },
]

export const LANDING_STEPS: LandingStep[] = [
  {
    icon: Building2,
    title: "1. Cadastre sua clínica",
    description: "Crie sua conta e personalize as informações da sua clínica em poucos minutos.",
  },
  {
    icon: CalendarDays,
    title: "2. Configure sua agenda",
    description:
      "Defina horários, serviços e profissionais para começar a receber agendamentos.",
  },
  {
    icon: Users,
    title: "3. Atenda e registre",
    description: "Atenda seus pacientes e registre tudo no prontuário eletrônico com facilidade.",
  },
  {
    icon: TrendingUp,
    title: "4. Acompanhe e cresça",
    description: "Acompanhe resultados, melhore processos e faça sua clínica crescer.",
  },
]

export const LANDING_HERO_TRUST = [
  { icon: CreditCard, label: "Sem cartão para testar" },
  { icon: Users, label: "Multi-usuários" },
  { icon: MessageCircle, label: "WhatsApp integrado" },
] as const

/** Faixa de clínicas (prova social ilustrativa até parcerias reais). */
export const LANDING_TRUST_CLINICS: { icon: LucideIcon; name: string }[] = [
  { icon: Plus, name: "Clínica Vitalis" },
  { icon: HeartHandshake, name: "Instituto Bem Estar" },
  { icon: UserRound, name: "Clínica Harmonia" },
  { icon: Flower2, name: "Clínica Pró-Saúde" },
  { icon: CirclePlus, name: "Saúde & Cuidado" },
  { icon: HeartPulse, name: "Clínica Vida" },
]

export const LANDING_NAV = [
  { id: "funcionalidades", label: "Funcionalidades" },
  { id: "como-funciona", label: "Como funciona" },
  { id: "planos", label: "Planos" },
] as const

export const LANDING_PLAN_FALLBACK: import("@/lib/plan-features").PublicCatalog = {
  currency: "BRL",
  annualSavingsLabel: "Economize 2 meses",
  comparisonRows: [],
  plans: [
    {
      slug: "essencial",
      name: "Essencial",
      description: "Operação clínica básica para profissional individual ou consultório pequeno.",
      monthlyPrice: 99,
      annualPrice: 990,
      annualEquivalentMonthly: 82.5,
      trialDays: 0,
      highlighted: false,
      badge: null,
      ctaLabel: "Assinar Essencial",
      marketingFeatures: [
        "Agenda online",
        "Prontuário eletrônico",
        "Pacientes",
        "Prescrições",
        "Bulas e CID",
        "1 profissional",
      ],
      limits: {},
      comparison: [],
    },
    {
      slug: "profissional",
      name: "Profissional",
      description: "Gestão completa para clínicas pequenas e médias em crescimento.",
      monthlyPrice: 199,
      annualPrice: 1990,
      annualEquivalentMonthly: 165.83,
      trialDays: 0,
      highlighted: true,
      badge: "Mais escolhido",
      ctaLabel: "Assinar Profissional",
      marketingFeatures: [
        "Tudo do Essencial",
        "Financeiro",
        "WhatsApp integrado",
        "Relatórios",
        "Pesquisa de satisfação",
        "Até 3 profissionais",
        "Assistente com IA",
      ],
      limits: {},
      comparison: [],
    },
    {
      slug: "premium",
      name: "Premium",
      description: "Automação, inteligência artificial e escala.",
      monthlyPrice: 349,
      annualPrice: 3490,
      annualEquivalentMonthly: 290.83,
      trialDays: 0,
      highlighted: false,
      badge: null,
      ctaLabel: "Assinar Premium",
      marketingFeatures: [
        "Tudo do Profissional",
        "WhatsApp com IA",
        "Automações avançadas",
        "Indicadores avançados",
        "Até 3 WhatsApps",
        "Maior capacidade de IA",
        "Suporte prioritário",
      ],
      limits: {},
      comparison: [],
    },
  ],
}

export const LANDING_SPECIALIST_EMAIL = COMPANY_LEGAL.contactEmail

export const LANDING_FOOTER_BLURB =
  "Gestão clínica e prontuário eletrônico para consultórios e equipes que querem mais tempo para cuidar de pessoas."

export const LANDING_FOOTER_COLUMNS = [
  {
    title: "Produto",
    links: [
      { label: "Funcionalidades", href: "#funcionalidades" },
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Planos", href: "#planos" },
      { label: "Integrações", href: "#funcionalidades" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre nós", href: "#funcionalidades" },
      { label: "Blog", href: "#contato" },
      { label: "Carreiras", href: "#contato" },
      { label: "Contato", href: "#contato" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { label: "Central de ajuda", href: "#contato" },
      { label: "Tutoriais", href: "#como-funciona" },
      { label: "Status do sistema", href: "#contato" },
      { label: "Suporte", href: "#contato" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Política de privacidade", href: "#contato" },
      { label: "Termos de uso", href: "#contato" },
      { label: "LGPD", href: "#contato" },
      { label: "Segurança", href: "#contato" },
    ],
  },
] as const







