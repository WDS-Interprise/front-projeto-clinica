export type EncounterStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"

export type EncounterAddendum = {
  id: string
  body: string
  reason?: string | null
  createdAt: string
  authorId: string
  authorName: string | null
}

export type Encounter = {
  id: string
  clinicId: string
  appointmentId: string | null
  patientId: string
  doctorId: string
  status: EncounterStatus
  startedAt: string | null
  endedAt: string | null
  lastSavedAt: string | null
  mainComplaint?: string | null
  physicalExam?: string | null
  currentIllnessHistory?: string | null
  historyAndAntecedents?: string | null
  conduct?: string | null
  prescriptionSummary?: string | null
  notes?: string | null
  cidCode?: string | null
  cidDescription?: string | null
  cidVersion?: string | null
  createdAt: string
  updatedAt: string
  patient?: {
    id: string
    name: string
    phone?: string
    birthDate?: string
    gender?: string
    allergies?: string
    medications?: string
  } | null
  doctor?: { id: string; name: string; specialty?: string } | null
  appointment?: {
    id: string
    date: string
    startTime: string
    endTime: string
    status: string
    insurancePlan?: string | null
    type?: string
  } | null
  addendums: EncounterAddendum[]
}

export type AttendanceAiDraft = {
  mainComplaint: string
  currentIllnessHistory: string
  physicalExam: string
  historyAndAntecedents: string
  conduct: string
  prescriptionSummary: string
  notes: string
  cidHint: string
  hypotheses?: string
  possibleConducts?: string
  summary?: string
}
