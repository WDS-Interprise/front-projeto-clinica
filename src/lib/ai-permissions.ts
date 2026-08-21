export type AiMode = "MANUAL" | "SUGGEST" | "AUTO_REPLY" | "AUTO_ACTIONS"

export type AiPermissionKey =
  | "answerQuestions"
  | "shareAddressHours"
  | "listDoctors"
  | "querySchedule"
  | "offerSlots"
  | "createPatient"
  | "bookAppointment"
  | "rescheduleAppointment"
  | "cancelAppointment"
  | "confirmAppointment"
  | "sendReminders"
  | "sendPrescriptions"
  | "sharePrices"
  | "createCharge"
  | "queryPayment"

export type AiPermissions = Record<AiPermissionKey, boolean>

export const AI_MODE_OPTIONS: Array<{ value: AiMode; label: string; description: string }> = [
  {
    value: "MANUAL",
    label: "Tudo manual",
    description: "A IA não responde conversas. Lembretes automáticos continuam se habilitados.",
  },
  {
    value: "SUGGEST",
    label: "IA apenas sugere respostas",
    description: "A IA gera sugestões na conversa. A equipe revisa e envia.",
  },
  {
    value: "AUTO_REPLY",
    label: "IA responde automaticamente",
    description: "Respostas informativas automáticas, sem executar ações na agenda ou cadastro.",
  },
  {
    value: "AUTO_ACTIONS",
    label: "IA responde e executa ações",
    description: "Responde e executa ações permitidas abaixo (agendar, cadastrar, etc.).",
  },
]

export const AI_PERMISSION_GROUPS: Array<{
  title: string
  items: Array<{ key: AiPermissionKey; label: string }>
}> = [
  {
    title: "Informações",
    items: [
      { key: "answerQuestions", label: "Responder dúvidas da clínica" },
      { key: "shareAddressHours", label: "Informar endereço e horário" },
      { key: "listDoctors", label: "Informar profissionais" },
    ],
  },
  {
    title: "Agenda",
    items: [
      { key: "querySchedule", label: "Consultar agenda" },
      { key: "offerSlots", label: "Oferecer horários" },
      { key: "bookAppointment", label: "Agendar consulta" },
      { key: "rescheduleAppointment", label: "Reagendar consulta" },
      { key: "cancelAppointment", label: "Cancelar consulta" },
      { key: "confirmAppointment", label: "Confirmar consulta" },
    ],
  },
  {
    title: "Pacientes e documentos",
    items: [
      { key: "createPatient", label: "Criar paciente" },
      { key: "sendReminders", label: "Enviar lembretes" },
      { key: "sendPrescriptions", label: "Enviar prescrições" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { key: "sharePrices", label: "Informar valores" },
      { key: "createCharge", label: "Criar cobrança" },
      { key: "queryPayment", label: "Consultar pagamento" },
    ],
  },
]

export const DEFAULT_AI_PERMISSIONS: AiPermissions = {
  answerQuestions: true,
  shareAddressHours: true,
  listDoctors: true,
  querySchedule: true,
  offerSlots: true,
  createPatient: true,
  bookAppointment: true,
  rescheduleAppointment: true,
  cancelAppointment: false,
  confirmAppointment: true,
  sendReminders: true,
  sendPrescriptions: true,
  sharePrices: false,
  createCharge: false,
  queryPayment: false,
}
