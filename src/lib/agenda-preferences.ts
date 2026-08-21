const NOTIFY_PATIENT_KEY = "clinmax_agenda_notify_patient"

/** Preferência da recepção: avisar paciente no WhatsApp ao remarcar. Padrão: ativo. */
export function getAgendaNotifyPatient(): boolean {
  try {
    const raw = localStorage.getItem(NOTIFY_PATIENT_KEY)
    if (raw === null) return true
    return raw === "1" || raw === "true"
  } catch {
    return true
  }
}

export function setAgendaNotifyPatient(value: boolean) {
  localStorage.setItem(NOTIFY_PATIENT_KEY, value ? "1" : "0")
}
