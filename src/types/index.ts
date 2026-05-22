export interface Patient {
  id: string
  name: string
  email: string | null
  phone: string
  phoneHome?: string | null
  cpf: string
  birthDate: string
  gender: "M" | "F" | "O"
  address: string | null
  bloodType: string | null
  allergies: string
  medications: string
  clinicalHistory?: string
  surgicalHistory?: string
  familyHistory?: string
  habits?: string
  insurancePlan?: string
  whatsapp?: string | null
  insuranceCard?: string | null
  notes?: string | null
  active?: boolean
  createdAt: string
  updatedAt: string
  appointments?: Array<{
    id: string
    date: string
    startTime?: string
    time?: string
    status: string
  }>
}

export interface Doctor {
  id: string
  name: string
  email: string
  phone: string
  crm: string
  specialty: string
  available: boolean
  createdAt: string
  updatedAt: string
}

export interface Procedure {
  id: string
  name: string
  defaultPrice: number
  active: boolean
}

export interface AppointmentProcedureLine {
  id?: string
  procedureId: string
  name?: string
  quantity: number
  unitPrice: number
  subtotal?: number
}

export interface Appointment {
  id: string
  type?: "SCHEDULE" | "BLOCK"
  patientId: string | null
  doctorId: string
  date: string
  startTime?: string
  endTime?: string
  time: string
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED"
  insurancePlan?: string
  recurrence?: string
  notes: string | null
  generatePaymentLink?: boolean
  paymentLinkUrl?: string | null
  paymentStatus?: string
  reminderSentAt?: string | null
  startedAt?: string | null
  endedAt?: string | null
  cidCode?: string | null
  cidDescription?: string | null
  cidVersion?: string | null
  mainComplaint?: string | null
  physicalExam?: string | null
  currentIllnessHistory?: string | null
  historyAndAntecedents?: string | null
  conduct?: string | null
  prescriptionSummary?: string | null
  totalAmount?: number
  chargedAmount?: number
  billingStatus?: string
  createdAt: string
  updatedAt: string
  patient?: {
    id: string
    name: string
    phone: string
    phoneHome?: string | null
    whatsapp?: string | null
    email?: string | null
    insurancePlan?: string
    birthDate?: string
    gender?: string
  } | null
  doctor: { id: string; name: string; specialty: string; email?: string }
  procedures?: AppointmentProcedureLine[]
  billing?: {
    totalAmount: number
    chargedAmount: number
    billingStatus: string
    receivedAt?: string | null
  }
}

export interface PanelMetrics {
  scheduled: number
  confirmed: number
  completed: number
  noShow: number
  newVsReturning: { new: number; returning: number }
  byInsurance: Array<{ label: string; count: number }>
  procedures: Array<{ label: string; count: number }>
  appointmentsInPeriod: number
  avgDurationMinutes: number
}

export interface TodayPatientSlot {
  id: string
  patientId: string | null
  time: string
  endTime: string
  status: string
  date: string
  patient: { id: string; name: string; phone: string } | null
  doctor: { id: string; name: string; specialty: string }
}

export type WaitingListEntry = {
  id: string
  patientId: string
  doctorId?: string | null
  desiredSpecialty?: string | null
  priority: "LOW" | "NORMAL" | "HIGH"
  status: "WAITING" | "CONTACTED" | "SCHEDULED" | "CANCELLED" | "NO_ANSWER"
  notes?: string | null
  createdAt: string
  patient?: { id: string; name: string; phone: string; insurancePlan?: string }
  doctor?: { id: string; name: string; specialty: string } | null
}

export type AgendaNote = {
  id: string
  title: string
  description: string
  date: string
  type: string
  visibility: string
  doctor?: { id: string; name: string } | null
  patient?: { id: string; name: string } | null
  createdBy?: { id: string; name: string }
}

export interface CreateAppointmentInput {
  type?: "SCHEDULE" | "BLOCK"
  patientId?: string | null
  doctorId: string
  date: string
  startTime: string
  endTime: string
  status?: Appointment["status"]
  insurancePlan?: string
  recurrence?: "NONE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "YEARLY"
  notes?: string
  generatePaymentLink?: boolean
  cidCode?: string | null
  cidDescription?: string | null
  cidVersion?: string | null
  mainComplaint?: string | null
  physicalExam?: string | null
  currentIllnessHistory?: string | null
  historyAndAntecedents?: string | null
  conduct?: string | null
  prescriptionSummary?: string | null
  procedures?: Array<{ procedureId: string; quantity: number; unitPrice: number }>
  waitingListEntryId?: string
}

export interface MedicalRecord {
  id: string
  patientId: string
  doctorId: string
  date: string
  diagnosis: string
  prescription: string
  notes: string | null
  createdAt: string
  updatedAt: string
  patient: { id: string; name: string }
  doctor: { id: string; name: string }
}
