import type { OnboardingIcon } from "@/components/onboarding/OnboardingOptionCard"
import type { OnboardingStepMeta } from "@/components/onboarding/OnboardingProgressBar"
import { UsersThreeIcon } from "@/components/onboarding/UsersThreeIcon"
import {
  Briefcase,
  Building2,
  CalendarDays,
  HeartPulse,
  KeyRound,
  MoreHorizontal,
  Stethoscope,
  User,
  UserRound,
  Users,
  Wallet,
} from "lucide-react"

export type OnboardingPath = "create" | "join"
export type CreateRole =
  | "Proprietário / Administrador"
  | "Profissional de saúde"
  | "Administrador e profissional de saúde"
  | "Consultor / Implantação"
export type JoinRole = "Administrador" | "Recepcionista" | "Profissional de saúde" | "Consultor" | "Financeiro"
export type InviteRole = "ADMIN" | "DOCTOR" | "RECEPTION" | "CONSULTANT" | "FINANCE"
export type StepId =
  | "path"
  | "role"
  | "clinic"
  | "alsoTreats"
  | "profile"
  | "operation"
  | "billing"
  | "team"
  | "code"
  | "joinRole"
  | "done"

export const BRAZIL_UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

export const PROFESSIONS: { label: string; council: string }[] = [
  { label: "Médico", council: "CRM" },
  { label: "Psicólogo", council: "CRP" },
  { label: "Nutricionista", council: "CRN" },
  { label: "Fisioterapeuta", council: "CREFITO" },
  { label: "Dentista", council: "CRO" },
  { label: "Enfermeiro", council: "COREN" },
  { label: "Fonoaudiólogo", council: "CRFa" },
  { label: "Terapeuta ocupacional", council: "CREFITO" },
  { label: "Outro profissional", council: "Registro" },
]

export const MEDICAL_SPECIALTIES = [
  "Clínico Geral",
  "Pediatria",
  "Ginecologia e Obstetrícia",
  "Ortopedia",
  "Dermatologia",
  "Cardiologia",
  "Outra",
]

export const CREATE_ROLES: { label: CreateRole; description: string; icon: OnboardingIcon }[] = [
  {
    label: "Proprietário / Administrador",
    description: "Gerencia a clínica, equipe, financeiro e configurações.",
    icon: Building2,
  },
  {
    label: "Profissional de saúde",
    description: "Atende pacientes e utiliza prontuário e agenda.",
    icon: Stethoscope,
  },
  {
    label: "Administrador e profissional de saúde",
    description: "Gerencia a operação e também realiza atendimentos.",
    icon: HeartPulse,
  },
  {
    label: "Consultor / Implantação",
    description: "Auxilia na configuração, com acesso limitado de suporte.",
    icon: Briefcase,
  },
]

export const JOIN_ROLES: { label: JoinRole; description: string; icon: OnboardingIcon }[] = [
  { label: "Administrador", description: "Gestão da clínica, equipe e configurações.", icon: Building2 },
  { label: "Recepcionista", description: "Agenda, pacientes e comunicação.", icon: UserRound },
  { label: "Profissional de saúde", description: "Atendimento, prontuário e agenda própria.", icon: Stethoscope },
  { label: "Consultor", description: "Acesso de implantação e suporte.", icon: Briefcase },
  { label: "Financeiro", description: "Recebimentos, convênios e relatórios.", icon: Wallet },
]

export const SPACE_OPTIONS: { label: string; description: string; icon: OnboardingIcon; teamSize: string }[] = [
  { label: "Consultório individual", description: "Atendimento por um único profissional.", icon: User, teamSize: "1" },
  { label: "Clínica com equipe", description: "Pequena equipe de profissionais.", icon: Users, teamSize: "2 a 4" },
  { label: "Clínica multidisciplinar", description: "Diversas especialidades em um só lugar.", icon: UsersThreeIcon, teamSize: "5 a 10" },
  { label: "Centro médico", description: "Estrutura maior, com vários setores.", icon: Building2, teamSize: "11 a 20" },
  { label: "Outro", description: "Meu modelo de atendimento é diferente.", icon: MoreHorizontal, teamSize: "Mais que 20" },
]

export const TEAM_SIZES = ["1", "2 a 4", "5 a 10", "11 a 20", "Mais que 20"]

export const DAY_PRESETS: { id: string; label: string; description: string; days: string }[] = [
  { id: "weekdays", label: "Segunda a sexta", description: "Horário comercial na semana", days: "1,2,3,4,5" },
  { id: "saturday", label: "Inclui sábado", description: "Segunda a sábado", days: "1,2,3,4,5,6" },
  { id: "everyday", label: "Todos os dias", description: "Inclui domingo", days: "0,1,2,3,4,5,6" },
]

export const SLOT_OPTIONS = [15, 30, 45, 60]

export const CARE_MODES = [
  { label: "Presencial", description: "Atendimento no consultório" },
  { label: "Online", description: "Teleatendimento" },
  { label: "Presencial + Online", description: "Os dois formatos" },
]

export const BILLING_MODES = [
  { label: "Particular", description: "Pagamento direto do paciente", value: "private" },
  { label: "Convênio", description: "Planos de saúde e guias", value: "insurance" },
  { label: "Particular + Convênio", description: "Os dois modelos", value: "both" },
]

export const INVITE_ROLES: { value: InviteRole; label: string; hint: string }[] = [
  { value: "ADMIN", label: "Administrador", hint: "Gestão da clínica, equipe, agenda, financeiro e configurações." },
  { value: "RECEPTION", label: "Recepcionista", hint: "Agenda, cadastro de pacientes e comunicação. Sem perguntas clínicas." },
  { value: "DOCTOR", label: "Profissional de saúde", hint: "O convidado completa CRM/conselho e agenda depois." },
  { value: "FINANCE", label: "Financeiro", hint: "Recebimentos, convênios e relatórios." },
  { value: "CONSULTANT", label: "Consultor", hint: "Acesso limitado para implantação e suporte." },
]

export type PendingInvite = {
  name: string
  email: string
  role: InviteRole
  profession?: string
}

export function councilForProfession(profession: string) {
  return PROFESSIONS.find((item) => item.label === profession)?.council ?? "Registro"
}

export function isClinicalCreateRole(role: string) {
  return role === "Profissional de saúde" || role === "Administrador e profissional de saúde"
}

export function needsAlsoTreats(role: string) {
  return role === "Proprietário / Administrador"
}

export function treatsPatients(role: string, alsoTreats: boolean) {
  if (isClinicalCreateRole(role)) return true
  if (role === "Profissional de saúde") return true
  return alsoTreats
}

export function buildSteps(
  path: OnboardingPath | "",
  role: string,
  alsoTreats: boolean,
  codeBoundRole?: InviteRole | null
): StepId[] {
  if (!path) return ["path"]
  if (path === "join") {
    const steps: StepId[] = ["path", "code"]
    if (codeBoundRole === "DOCTOR") steps.push("profile")
    steps.push("done")
    return steps
  }
  const steps: StepId[] = ["path", "role", "clinic"]
  if (needsAlsoTreats(role)) steps.push("alsoTreats")
  if (treatsPatients(role, alsoTreats)) steps.push("profile")
  steps.push("operation", "billing", "team", "done")
  return steps
}

const STEP_META: Record<StepId, string> = {
  path: "Início",
  role: "Seu papel",
  clinic: "Clínica",
  alsoTreats: "Atendimento",
  profile: "Perfil",
  operation: "Funcionamento",
  billing: "Financeiro",
  team: "Equipe",
  code: "Código",
  joinRole: "Cargo",
  done: "Concluir",
}

export function stepsToMeta(ids: StepId[]): OnboardingStepMeta[] {
  return ids.map((id) => ({ id, label: STEP_META[id] }))
}

export const PATH_OPTIONS: { id: OnboardingPath; label: string; description: string; icon: OnboardingIcon }[] = [
  {
    id: "create",
    label: "Criar uma clínica",
    description: "Configurar um consultório, clínica ou espaço de atendimento novo.",
    icon: Building2,
  },
  {
    id: "join",
    label: "Entrar em uma clínica",
    description: "Recebi um convite ou código de uma clínica que já usa a ClinMax.",
    icon: KeyRound,
  },
]

export const SIDEBAR: Record<StepId, { icon: OnboardingIcon; kicker: string; title: string; description: string }> = {
  path: {
    icon: Building2,
    kicker: "Bem-vindo",
    title: "Como você vai usar a ClinMax?",
    description: "Primeiro definimos se você está criando a operação ou entrando em uma clínica existente. O restante do fluxo muda a partir daqui.",
  },
  role: {
    icon: UserRound,
    kicker: "Seu papel",
    title: "Qual é o seu papel na clínica?",
    description: "Isso define permissões. Administrador não precisa informar CRM nem especialidade médica.",
  },
  clinic: {
    icon: Building2,
    kicker: "Sobre a clínica",
    title: "Vamos conhecer sua clínica",
    description: "Nome, modelo da operação e tamanho da equipe. Usamos isso para configurar o sistema, não só para estatística.",
  },
  alsoTreats: {
    icon: Stethoscope,
    kicker: "Atendimento",
    title: "Você também realiza atendimentos?",
    description: "Administrar a clínica não significa ser o profissional clínico. Só pedimos conselho e especialidade se você atender.",
  },
  profile: {
    icon: Stethoscope,
    kicker: "Perfil profissional",
    title: "Complete seu perfil clínico",
    description: "A profissão define o conselho (CRM, CRP, CRN…). A especialidade só aparece para quem atende.",
  },
  operation: {
    icon: CalendarDays,
    kicker: "Funcionamento",
    title: "Quando sua clínica funciona?",
    description: "Dias, horário e duração padrão da consulta. Isso configura a operação, não a agenda pessoal de cada médico.",
  },
  billing: {
    icon: Wallet,
    kicker: "Recebimento",
    title: "Como a clínica recebe?",
    description: "Particular destaca cobrança direta. Convênio habilita planos e TISS. Ambos deixam os dois caminhos visíveis.",
  },
  team: {
    icon: Users,
    kicker: "Equipe",
    title: "Quem vai trabalhar com você?",
    description: "Convide agora com o cargo certo. O convidado não escolhe de novo se é médico ou recepcionista: isso já vai no convite.",
  },
  code: {
    icon: KeyRound,
    kicker: "Convite",
    title: "Entre com o código da clínica",
    description: "O código localiza a clínica. Se ele já tiver um cargo, pulamos a escolha. Se não tiver, o administrador define o cargo na aprovação. Você não escolhe Administrador sozinho.",
  },
  joinRole: {
    icon: UserRound,
    kicker: "Seu cargo",
    title: "Qual cargo você quer solicitar?",
    description: "Este passo só aparece se o código já vier com cargo. Código genérico não deixa escolher.",
  },
  done: {
    icon: HeartPulse,
    kicker: "Pronto",
    title: "Tudo certo para solicitar entrada",
    description: "Revise o resumo. Com o código da clínica, a entrada só vale depois da aprovação do administrador.",
  },
}
