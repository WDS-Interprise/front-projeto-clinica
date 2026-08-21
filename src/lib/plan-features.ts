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
  "AI_ASSISTANT",
] as const

export type PlanFeature = (typeof PLAN_FEATURES)[number]

export type PlanLimitKey =
  | "maxUsers"
  | "maxDoctors"
  | "maxWhatsappConnections"
  | "maxAiAssistantMessagesPerMonth"
  | "maxAiAutomationActionsPerMonth"
  | "maxStorageMb"

export const PLAN_LIMIT_KEYS: PlanLimitKey[] = [
  "maxUsers",
  "maxDoctors",
  "maxWhatsappConnections",
  "maxAiAssistantMessagesPerMonth",
  "maxAiAutomationActionsPerMonth",
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
  AI_ASSISTANT: "IA assistiva",
}

export const PLAN_LIMIT_LABELS: Record<PlanLimitKey, string> = {
  maxUsers: "Usuários",
  maxDoctors: "Profissionais",
  maxWhatsappConnections: "WhatsApps conectados",
  maxAiAssistantMessagesPerMonth: "IA assistiva / mês",
  maxAiAutomationActionsPerMonth: "Ações automáticas IA / mês",
  maxStorageMb: "Armazenamento",
}

export const PLAN_LIMIT_USAGE_HINT: Record<PlanLimitKey, { noun: string; unit?: string }> = {
  maxUsers: { noun: "usuários utilizados" },
  maxDoctors: { noun: "profissionais utilizados" },
  maxWhatsappConnections: { noun: "WhatsApps utilizados" },
  maxAiAssistantMessagesPerMonth: { noun: "mensagens de IA assistiva" },
  maxAiAutomationActionsPerMonth: { noun: "ações automáticas de IA" },
  maxStorageMb: { noun: "de armazenamento usados", unit: "MB" },
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
  pendingUpgrade?: {
    planId: string
    planName: string
    billingCycle: "MONTHLY" | "ANNUAL"
    amount: number
    invoiceId: string
  } | null
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

export type PublicCatalogPlan = {
  slug: string
  name: string
  description: string | null
  monthlyPrice: number
  annualPrice: number
  annualEquivalentMonthly: number
  trialDays: number
  highlighted: boolean
  badge: string | null
  ctaLabel: string
  marketingFeatures: string[]
  limits: Partial<Record<PlanLimitKey, number | null>>
  comparison: Array<{ key: string; label: string; included: boolean; value: string }>
}

export type PublicCatalog = {
  currency: string
  annualSavingsLabel: string
  plans: PublicCatalogPlan[]
  comparisonRows: Array<{ key: string; label: string }>
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
  pixQrCode?: string | null
  reference: string | null
  planName: string
}

export const SELECTED_PLAN_STORAGE_KEY = "clinichub_selected_plan"

export function checkoutPath(slug: string, cycle: "MONTHLY" | "ANNUAL" = "MONTHLY") {
  return `/checkout?plan=${encodeURIComponent(slug)}&cycle=${cycle}`
}

export function rememberSelectedPlan(slug: string) {
  sessionStorage.setItem(SELECTED_PLAN_STORAGE_KEY, slug)
}

export function readSelectedPlan(): string | null {
  return sessionStorage.getItem(SELECTED_PLAN_STORAGE_KEY)
}
