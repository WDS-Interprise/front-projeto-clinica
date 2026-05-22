export type HistoryAttendanceRecord = {
  id: string
  type: "ATTENDANCE"
  appointmentId: string
  status: string
  professionalName: string
  time: string
  durationMinutes: number | null
  locked: boolean
  attendance: {
    mainComplaint?: string | null
    physicalExam?: string | null
    currentIllnessHistory?: string | null
    historyAndAntecedents?: string | null
    diagnosticHypothesis?: string | null
    cidCode?: string | null
    cidDescription?: string | null
    conduct?: string | null
    prescriptionSummary?: string | null
    notes?: string | null
  }
}

export type HistoryPrescriptionRecord = {
  id: string
  type: "PRESCRIPTION"
  prescriptionId: string
  appointmentId?: string | null
  status: string
  professionalName: string
  time: string
  prescriptionNumber: number
  prescription: {
    receiptType: string
    notes?: string | null
    validationCode?: string | null
    items: Array<{
      id: string
      type: string
      name: string
      presentation?: string | null
      dosage?: string | null
      frequency?: string | null
      quantity?: string | null
      instructions?: string | null
      continuousUse: boolean
    }>
  }
}

export type PatientHistoryRecord = HistoryAttendanceRecord | HistoryPrescriptionRecord

export type PatientHistoryDayGroup = {
  date: string
  day: number
  month: string
  year: number
  records: PatientHistoryRecord[]
}

export type PatientHistoryResponse = {
  patientId: string
  days: PatientHistoryDayGroup[]
}
