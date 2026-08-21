export const PLAN_FEATURES = [
  "DASHBOARD",
  "AGENDA",
  "PATIENTS",
  "MEDICAL_RECORDS",
  "PRESCRIPTIONS",
  "CLINICAL_TOOLS",
  "WHATSAPP",
  "WHATSAPP_AI",
  "AUTOMATIONS",
  "FINANCE",
  "CLINMAX_PAY",
  "REPORTS",
  "INVENTORY",
  "TISS",
  "SATISFACTION",
  "MULTI_PROFESSIONAL",
  "ADVANCED_REPORTS",
] as const

export type PlanFeature = (typeof PLAN_FEATURES)[number]

export type PlanLimitKey =
  | "maxUsers"
  | "maxDoctors"
  | "maxWhatsappConnections"
  | "maxAiMessagesPerMonth"
  | "maxAiActionsPerMonth"
  | "maxStorageMb"

export const PLAN_LIMIT_KEYS: PlanLimitKey[] = [
  "maxUsers",
  "maxDoctors",
  "maxWhatsappConnections",
  "maxAiMessagesPerMonth",
  "maxAiActionsPerMonth",
  "maxStorageMb",
]

export const PLAN_FEATURE_LABELS: Record<PlanFeature, string> = {
  DASHBOARD: "Painel",
  AGENDA: "Agenda",
  PATIENTS: "Pacientes",
  MEDICAL_RECORDS: "Prontuário",
  PRESCRIPTIONS: "Prescrições",
  CLINICAL_TOOLS: "Medicamentos, bulas e CID",
  WHATSAPP: "WhatsApp",
  WHATSAPP_AI: "WhatsApp com IA",
  AUTOMATIONS: "Automações",
  FINANCE: "Financeiro",
  CLINMAX_PAY: "ClinMax Pay",
  REPORTS: "Relatórios",
  INVENTORY: "Estoque",
  TISS: "TISS",
  SATISFACTION: "Pesquisa de satisfação",
  MULTI_PROFESSIONAL: "Multi-profissional",
  ADVANCED_REPORTS: "Relatórios avançados",
}

export const PLAN_LIMIT_LABELS: Record<PlanLimitKey, string> = {
  maxUsers: "Usuários",
  maxDoctors: "Profissionais",
  maxWhatsappConnections: "WhatsApps conectados",
  maxAiMessagesPerMonth: "Mensagens IA / mês",
  maxAiActionsPerMonth: "Ações IA / mês",
  maxStorageMb: "Armazenamento",
}

export type ClinicSubscriptionView = {
  id: string
  clinicId: string
  planId: string
  planName: string
  planSlug: string
  status: string
  billingCycle: "MONTHLY" | "ANNUAL"
  price: number
  trialEndsAt: string | null
  nextBillingAt: string | null
  features: PlanFeature[]
  limits: Partial<Record<PlanLimitKey, number | null>>
}

export type PlanUsageItem = {
  key: PlanLimitKey
  current: number
  max: number | null
}

export type PublicPlan = {
  id: string
  name: string
  slug: string
  description: string | null
  monthlyPrice: number
  annualPrice: number
  trialDays: number
  highlighted: boolean
  features: PlanFeature[]
  limits: Partial<Record<PlanLimitKey, number | null>>
}

export type SubscriptionInvoiceView = {
  id: string
  amount: number
  status: string
  billingType: string
  dueDate: string
  paidAt: string | null
  invoiceUrl: string | null
  pixCopyPaste: string | null
  reference: string | null
  planName: string
}
