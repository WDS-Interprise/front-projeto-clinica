const BASE = import.meta.env.VITE_API_BASE ?? "/api"

export type ApiFieldErrors = Partial<Record<"name" | "email" | "cpf", string>>

export type WhatsappTemplate = {
  id: string
  clinicId: string
  name: string
  body: string
  category: string
  active: boolean
  sortOrder: number
}

export type WhatsappChat = {
  id: string
  connectionId: string
  clinicId: string
  patientId: string | null
  remoteJid: string
  phoneDigits: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  patient?: { id: string; name: string; phone: string; whatsapp: string | null } | null
  connection?: { id: string; name: string; status: string }
}

export type WhatsappMessage = {
  id: string
  chatId: string
  waMessageId: string | null
  fromMe: boolean
  type: string
  content: string
  status: string
  sentAt: string
}

export type WhatsappSettings = {
  id: string
  clinicId: string
  defaultConnectionId: string | null
  reminderOffsetsJson: string
  reminderOffsets: number[]
  autoRemindersEnabled: boolean
  connections: { id: string; name: string; status: string; phoneNumber: string | null }[]
}

export type WhatsappConnection = {
  id: string
  clinicId: string
  userId: string
  userName?: string
  name: string
  phoneNumber: string | null
  status: string
  connectionType: string | null
  qrCode: string | null
  pairingCode: string | null
  lastError: string | null
  lastConnectedAt: string | null
  lastDisconnectedAt: string | null
  createdAt: string
  updatedAt: string
}

export class ApiError extends Error {
  fields?: ApiFieldErrors

  constructor(message: string, fields?: ApiFieldErrors) {
    super(message)
    this.name = "ApiError"
    this.fields = fields
  }
}

function getToken(): string | null {
  return localStorage.getItem("token")
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  }

  if (options?.body != null && options.body !== "") {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(
      "Não foi possível conectar à API. Inicie o backend (npm run dev na pasta back-projeto-clinica, porta 3001)."
    )
  }

  if (res.status === 204) return undefined as T

  let data: { error?: string; fields?: ApiFieldErrors } = {}
  const contentType = res.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      data = await res.json()
    } catch {
      data = {}
    }
  }

  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new ApiError(
        "Servidor indisponível. Verifique se o backend está rodando em http://localhost:3001."
      )
    }
    throw new ApiError(data.error || "Erro na requisicao", data.fields)
  }

  return data as T
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{
        token: string
        user: {
          id: string
          name: string
          email: string
          role: string
          isAccountAdmin?: boolean
          doctorId?: string
        }
        clinicId: string
        clinics: { id: string; name: string }[]
        permissions: string[]
        redirectPath: string
        needsOnboarding?: boolean
        provisionedByClinic?: boolean
      }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    register: (data: { name: string; email: string; password: string; cpf: string }) =>
      request<{
        token: string
        user: { id: string; name: string; email: string; role: string }
        permissions?: string[]
        needsOnboarding?: boolean
        redirectPath?: string
      }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    completeOnboarding: (data: {
      roleLabel: string
      teamSize: string
      clinicName?: string
    }) =>
      request<{
        token: string
        user: { id: string; name: string; email: string; role: string; doctorId?: string }
        clinicId: string
        clinicName?: string
        permissions: string[]
        redirectPath: string
      }>("/auth/complete-onboarding", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    me: () =>
      request<{
        id: string
        name: string
        email: string
        role: string
        clinicId: string
        clinicName?: string
        permissions: string[]
        linkedDoctorIds?: string[]
        doctorId?: string
        isAccountAdmin?: boolean
        redirectPath?: string
        needsOnboarding?: boolean
        provisionedByClinic?: boolean
      }>("/auth/me"),
  },

  users: {
    list: (role?: string) => {
      const q = role ? `?role=${role}` : ""
      return request<any[]>(`/users${q}`)
    },
    getById: (id: string) => request<any>(`/users/${id}`),
    create: (data: any) =>
      request<any>("/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    setLinkedDoctors: (id: string, doctorIds: string[]) =>
      request<any>(`/users/${id}/linked-doctors`, {
        method: "PUT",
        body: JSON.stringify({ doctorIds }),
      }),
  },

  clinics: {
    list: () => request<any[]>("/clinics"),
    getById: (id: string) => request<any>(`/clinics/${id}`),
    create: (data: any) =>
      request<any>("/clinics", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/clinics/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<void>(`/clinics/${id}`, { method: "DELETE" }),
  },

  dashboard: {
    stats: () =>
      request<{ totalPatients: number; totalAppointments: number; appointmentsToday: number; doctorsAvailable: number }>(
        "/dashboard/stats"
      ),
    panelMetrics: () => request<import("@/types").PanelMetrics>("/dashboard/panel-metrics"),
    todayPatients: () => request<import("@/types").TodayPatientSlot[]>("/dashboard/today-patients"),
    upcoming: () =>
      request<Array<{ id: string; date: string; time: string; status: string; patient: { id: string; name: string }; doctor: { id: string; name: string; specialty: string } }>>(
        "/dashboard/upcoming"
      ),
    recentPatients: () =>
      request<Array<{ id: string; name: string; phone: string; createdAt: string }>>(
        "/dashboard/recent-patients"
      ),
  },

  procedures: {
    list: () => request<import("@/types").Procedure[]>("/procedures"),
  },

  patients: {
    list: (params?: { search?: string; page?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set("search", params.search)
      if (params?.page) q.set("page", String(params.page))
      return request<{ data: any[]; total: number; page: number; totalPages: number }>(
        `/patients?${q}`
      )
    },
    getById: (id: string) => request<any>(`/patients/${id}`),
    create: (data: any) =>
      request<any>("/patients", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/patients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<void>(`/patients/${id}`, { method: "DELETE" }),
  },

  doctors: {
    list: (params?: { available?: boolean }) => {
      const q = new URLSearchParams()
      if (params?.available) q.set("available", "true")
      return request<any[]>(`/doctors?${q}`)
    },
    getById: (id: string) => request<any>(`/doctors/${id}`),
    create: (data: any) =>
      request<any>("/doctors", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/doctors/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<void>(`/doctors/${id}`, { method: "DELETE" }),
  },

  appointments: {
    list: (params?: {
      date?: string
      startDate?: string
      endDate?: string
      doctorId?: string
      patientId?: string
      status?: string
    }) => {
      const q = new URLSearchParams()
      if (params?.date) q.set("date", params.date)
      if (params?.startDate) q.set("startDate", params.startDate)
      if (params?.endDate) q.set("endDate", params.endDate)
      if (params?.doctorId) q.set("doctorId", params.doctorId)
      if (params?.patientId) q.set("patientId", params.patientId)
      if (params?.status) q.set("status", params.status)
      return request<{ data: import("@/types").Appointment[]; total: number }>(`/appointments?${q}`)
    },
    nextSlot: (doctorId: string, date: string) => {
      const q = new URLSearchParams({ doctorId, date })
      return request<{ startTime: string; endTime: string }>(`/appointments/next-slot?${q}`)
    },
    getById: (id: string) => request<import("@/types").Appointment>(`/appointments/${id}`),
    create: (data: import("@/types").CreateAppointmentInput) =>
      request<import("@/types").Appointment>("/appointments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<import("@/types").CreateAppointmentInput>) =>
      request<import("@/types").Appointment>(`/appointments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      request<void>(`/appointments/${id}`, { method: "DELETE" }),
    charge: (id: string, amount?: number) =>
      request(`/appointments/${id}/charge`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      }),
    receipt: (id: string) =>
      request(`/appointments/${id}/receipt`, { method: "POST" }),
    reminder: (id: string, data?: { templateId?: string; body?: string }) =>
      request<import("@/types").Appointment>(`/appointments/${id}/reminder`, {
        method: "POST",
        body: JSON.stringify(data ?? {}),
      }),
  },

  waitingList: {
    list: (params?: { doctorId?: string; status?: string }) => {
      const q = new URLSearchParams()
      if (params?.doctorId) q.set("doctorId", params.doctorId)
      if (params?.status) q.set("status", params.status)
      return request<import("@/types").WaitingListEntry[]>(`/waiting-list?${q}`)
    },
    create: (data: {
      patientId: string
      doctorId?: string
      desiredSpecialty?: string
      priority?: string
      notes?: string
    }) =>
      request<import("@/types").WaitingListEntry>("/waiting-list", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{ status: string; priority: string; notes: string; doctorId: string }>) =>
      request<import("@/types").WaitingListEntry>(`/waiting-list/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      request<void>(`/waiting-list/${id}`, { method: "DELETE" }),
  },

  agendaNotes: {
    list: (params?: { date?: string; startDate?: string; endDate?: string }) => {
      const q = new URLSearchParams()
      if (params?.date) q.set("date", params.date)
      if (params?.startDate) q.set("startDate", params.startDate)
      if (params?.endDate) q.set("endDate", params.endDate)
      return request<import("@/types").AgendaNote[]>(`/agenda-notes?${q}`)
    },
    create: (data: {
      title: string
      description: string
      date?: string
      doctorId?: string
      patientId?: string
      type?: string
      visibility?: string
    }) =>
      request<import("@/types").AgendaNote>("/agenda-notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{ title: string; description: string }>) =>
      request<import("@/types").AgendaNote>(`/agenda-notes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      request<void>(`/agenda-notes/${id}`, { method: "DELETE" }),
  },

  whatsapp: {
    listConnections: () =>
      request<WhatsappConnection[]>("/whatsapp/connections"),
    createConnection: (data: { name: string; connectionType?: "QR" | "PAIRING" }) =>
      request<WhatsappConnection>("/whatsapp/connections", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getStatus: (id: string) =>
      request<WhatsappConnection>(`/whatsapp/connections/${id}/status`),
    startQr: (id: string) =>
      request<WhatsappConnection>(`/whatsapp/connections/${id}/qr`, { method: "POST" }),
    startPairing: (id: string, phoneNumber: string) =>
      request<WhatsappConnection>(`/whatsapp/connections/${id}/pairing-code`, {
        method: "POST",
        body: JSON.stringify({ phone_number: phoneNumber }),
      }),
    disconnect: (id: string) =>
      request<WhatsappConnection>(`/whatsapp/connections/${id}/disconnect`, {
        method: "POST",
      }),
    logout: (id: string) =>
      request<WhatsappConnection>(`/whatsapp/connections/${id}/logout`, { method: "POST" }),
    remove: (id: string) =>
      request<void>(`/whatsapp/connections/${id}`, { method: "DELETE" }),
    listChats: (params?: { patientId?: string }) => {
      const q = params?.patientId ? `?patientId=${params.patientId}` : ""
      return request<WhatsappChat[]>(`/whatsapp/chats${q}`)
    },
    getChatMessages: (chatId: string) =>
      request<{ chat: WhatsappChat; messages: WhatsappMessage[] }>(
        `/whatsapp/chats/${chatId}/messages`
      ),
    sendMessage: (
      connectionId: string,
      data: { to: string; message: string; patientId?: string; templateId?: string }
    ) =>
      request<{ connectionId: string; jid: string; messageId?: string }>(
        `/whatsapp/connections/${connectionId}/messages`,
        { method: "POST", body: JSON.stringify(data) }
      ),
    listTemplates: () => request<WhatsappTemplate[]>("/whatsapp/templates"),
    createTemplate: (data: {
      name: string
      body: string
      category?: string
      active?: boolean
    }) =>
      request<WhatsappTemplate>("/whatsapp/templates", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateTemplate: (
      id: string,
      data: Partial<{ name: string; body: string; category: string; active: boolean }>
    ) =>
      request<WhatsappTemplate>(`/whatsapp/templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteTemplate: (id: string) =>
      request<void>(`/whatsapp/templates/${id}`, { method: "DELETE" }),
    previewTemplate: (body: string, context?: Record<string, string>) =>
      request<{ rendered: string }>("/whatsapp/templates/preview", {
        method: "POST",
        body: JSON.stringify({ body, context }),
      }),
    getSettings: () => request<WhatsappSettings>("/whatsapp/settings"),
    updateSettings: (data: {
      defaultConnectionId?: string | null
      reminderOffsets?: number[]
      autoRemindersEnabled?: boolean
    }) =>
      request<WhatsappSettings>("/whatsapp/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  records: {
    list: (params?: { patientId?: string }) => {
      const q = new URLSearchParams()
      if (params?.patientId) q.set("patientId", params.patientId)
      return request<{ data: any[]; total: number }>(`/records?${q}`)
    },
    getById: (id: string) => request<any>(`/records/${id}`),
    create: (data: any) =>
      request<any>("/records", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/records/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<void>(`/records/${id}`, { method: "DELETE" }),
  },
}
