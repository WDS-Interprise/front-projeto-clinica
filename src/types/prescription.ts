export type PrescriptionItemType = "MEDICATION" | "EXAM" | "VACCINE" | "FREE_TEXT"
export type PrescriptionStatus = "DRAFT" | "FINALIZED" | "CANCELLED"

export type PrescriptionItem = {
  id: string
  prescriptionId: string
  type: PrescriptionItemType
  name: string
  presentation?: string | null
  dosage?: string | null
  frequency?: string | null
  duration?: string | null
  quantity?: string | null
  instructions?: string | null
  continuousUse: boolean
  sortOrder: number
}

export type Prescription = {
  id: string
  clinicId: string
  patientId: string
  professionalId: string
  appointmentId?: string | null
  status: PrescriptionStatus
  receiptType: string
  prescriptionDate: string
  showDate: boolean
  notes?: string | null
  validationCode?: string | null
  accessCode?: string | null
  pdfPath?: string | null
  signedAt?: string | null
  sentAt?: string | null
  createdAt: string
  updatedAt: string
  items: PrescriptionItem[]
  patient?: { id: string; name: string; cpf?: string; phone?: string; whatsapp?: string | null }
  professional?: { id: string; name: string }
  shares?: Array<{
    id: string
    channel: string
    recipient: string
    status: string
    sentAt?: string | null
    errorMessage?: string | null
  }>
}

export type PrescriptionTemplate = {
  id: string
  name: string
  description?: string | null
  items: Array<{
    id: string
    type: PrescriptionItemType
    name: string
    presentation?: string | null
    dosage?: string | null
    frequency?: string | null
    duration?: string | null
    instructions?: string | null
    continuousUse: boolean
  }>
}

export type PrescriptionContext = {
  patientId: string
  appointmentId?: string
  recentPrescriptions: Prescription[]
}

export type VaccineFormValues = {
  name: string
  displayName: string
  route: string
  dose: string
  quantity: string
  instructions: string
  observations: string
  recommendedDate: string
  boosterRequired: boolean
  boosterInterval: string
  batch?: string
  manufacturer?: string
  rxcuis: string[]
}

export type ExamFormValues = {
  name: string
  tussCode: string
  showTussCode: boolean
  generateSadtGuide: boolean
}

export type MedicationFormValues = {
  name: string
  presentation: string
  dosage: string
  frequency: string
  duration: string
  quantity: string
  instructions: string
  observations?: string
  continuousUse: boolean
  activeIngredient?: string
  laboratory?: string
}
