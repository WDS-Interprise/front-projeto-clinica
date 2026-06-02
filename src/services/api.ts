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
  aiPaused: boolean
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
  aiAssistantEnabled: boolean
  aiAutoReplyEnabled: boolean
  openRouterConfigured?: boolean
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

  if (options?.body != null && options.body !== "" && !(options.body instanceof FormData)) {
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
      inviteCode?: string
      crm?: string
      specialty?: string
      phone?: string
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
        phone?: string | null
        gender?: "M" | "F" | "O"
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
    meAvatar: () => request<{ imageUrl: string | null }>("/auth/me/avatar"),
    uploadAvatar: (file: File) => {
      const body = new FormData()
      body.append("file", file)
      return request<{ imageUrl: string | null }>("/auth/me/avatar", {
        method: "POST",
        body,
      })
    },
    updateMe: (data: {
      name?: string
      email?: string
      phone?: string
      gender?: "M" | "F" | "O"
      password?: string
      currentPassword?: string
    }) =>
      request<{
        id: string
        name: string
        email: string
        role: string
        phone?: string | null
        gender?: "M" | "F" | "O"
        clinicId: string
        clinicName?: string
        permissions: string[]
      }>("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
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

  invites: {
    preview: (token: string) =>
      request<{
        clinicName: string
        email: string
        role: string
        roleLabel: string
        status: string
        canAccept: boolean
        expiresAt: string
      }>(`/invites/preview/${token}`),
    accept: (
      token: string,
      data: {
        name: string
        password: string
        cpf?: string
        crm?: string
        specialty?: string
        phone?: string
      }
    ) =>
      request<any>(`/invites/accept/${token}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    acceptAuthenticated: (
      token: string,
      data: { crm?: string; specialty?: string; phone?: string }
    ) =>
      request<any>(`/invites/accept/${token}/authenticated`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    joinByCode: (data: {
      inviteCode: string
      roleLabel?: string
      crm?: string
      specialty?: string
      phone?: string
      cpf?: string
    }) =>
      request<any>("/invites/join-by-code", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    list: (clinicId: string) =>
      request<{
        inviteCode: string
        invites: Array<{
          id: string
          email: string
          role: string
          roleLabel: string
          status: string
          expiresAt: string
          createdAt: string
        }>
      }>(`/clinics/${clinicId}/invites`),
    create: (clinicId: string, data: { email: string; role: "ADMIN" | "DOCTOR" | "RECEPTION" }) =>
      request<{
        invite: { id: string; email: string; role: string; roleLabel: string; status: string }
        inviteUrl: string
        inviteCode: string
        emailDelivered: boolean
      }>(`/clinics/${clinicId}/invites`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    revoke: (clinicId: string, inviteId: string) =>
      request<{ ok: boolean }>(`/clinics/${clinicId}/invites/${inviteId}`, {
        method: "DELETE",
      }),
    regenerateCode: (clinicId: string) =>
      request<{ inviteCode: string }>(`/clinics/${clinicId}/invites/regenerate-code`, {
        method: "POST",
      }),
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
    getHistory: (id: string) =>
      request<import("@/types/patient-history").PatientHistoryResponse>(`/patients/${id}/history`),
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
    createChat: (data: { patientId?: string; phone?: string }) =>
      request<WhatsappChat>("/whatsapp/chats", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getChatMessages: (chatId: string) =>
      request<{ chat: WhatsappChat; messages: WhatsappMessage[] }>(
        `/whatsapp/chats/${chatId}/messages`
      ),
    setChatAiPaused: (chatId: string, aiPaused: boolean) =>
      request<WhatsappChat>(`/whatsapp/chats/${chatId}/ai`, {
        method: "PATCH",
        body: JSON.stringify({ aiPaused }),
      }),
    sendMessage: (
      connectionId: string,
      data: {
        to: string
        message: string
        remoteJid?: string
        patientId?: string
        templateId?: string
      }
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
      aiAssistantEnabled?: boolean
      aiAutoReplyEnabled?: boolean
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

  cid10: {
    search: (params?: { search?: string; capitulo?: string; grupo?: string; tipo?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set("search", params.search)
      if (params?.capitulo) q.set("capitulo", params.capitulo)
      if (params?.grupo) q.set("grupo", params.grupo)
      if (params?.tipo) q.set("tipo", params.tipo)
      if (params?.page) q.set("page", String(params.page))
      if (params?.limit) q.set("limit", String(params.limit))
      return request<{
        data: Array<{
          id: string
          codigo: string
          descricao: string
          capitulo: string
          capituloDesc: string
          grupo: string
          grupoDesc: string
          categoria: string
          categoriaDesc: string
          tipo: string
        }>
        total: number
        page: number
        limit: number
        totalPages: number
      }>(`/cid10?${q}`)
    },
    getByCodigo: (codigo: string) =>
      request<{
        id: string
        codigo: string
        descricao: string
        capitulo: string
        capituloDesc: string
        grupo: string
        grupoDesc: string
        categoria: string
        categoriaDesc: string
        tipo: string
      }>(`/cid10/${encodeURIComponent(codigo)}`),
    capitulos: () =>
      request<Array<{ codigo: string; descricao: string }>>("/cid10/capitulos"),
    grupos: (capitulo?: string) => {
      const q = capitulo ? `?capitulo=${encodeURIComponent(capitulo)}` : ""
      return request<Array<{ codigo: string; descricao: string; capitulo: string }>>(`/cid10/grupos${q}`)
    },
  },

  cid11: {
    search: (params?: { search?: string; capitulo?: string; bloco?: string; tipo?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set("search", params.search)
      if (params?.capitulo) q.set("capitulo", params.capitulo)
      if (params?.bloco) q.set("bloco", params.bloco)
      if (params?.tipo) q.set("tipo", params.tipo)
      if (params?.page) q.set("page", String(params.page))
      if (params?.limit) q.set("limit", String(params.limit))
      return request<{
        data: Array<{
          id: string
          codigo: string
          descricao: string
          bloco: string
          blocoDesc: string
          capitulo: string
          capituloDesc: string
          tipo: string
          cid10Equivalente: string | null
        }>
        total: number
        page: number
        limit: number
        totalPages: number
      }>(`/cid11?${q}`)
    },
    getByCodigo: (codigo: string) =>
      request<{
        id: string
        codigo: string
        descricao: string
        bloco: string
        blocoDesc: string
        capitulo: string
        capituloDesc: string
        tipo: string
        cid10Equivalente: string | null
      }>(`/cid11/${encodeURIComponent(codigo)}`),
    capitulos: () =>
      request<Array<{ codigo: string; descricao: string }>>("/cid11/capitulos"),
    blocos: (capitulo?: string) => {
      const q = capitulo ? `?capitulo=${encodeURIComponent(capitulo)}` : ""
      return request<Array<{ codigo: string; descricao: string; capitulo: string }>>(`/cid11/blocos${q}`)
    },
  },

  cid: {
    inss: (codigo: string) =>
      request<{
        codigo: string
        temCarencia: boolean
        fonteCarencia: string | null
        temIrpf: boolean
        fonteIrpf: string | null
        temNtep: boolean
        fonteNtep: string | null
        cnaes: unknown
        versao: string | null
      }>(`/cid/inss/${encodeURIComponent(codigo)}`),
  },

  prescriptions: {
    resolveContext: (routeId: string) =>
      request<import("@/types/prescription").PrescriptionContext>(
        `/prescriptions/context/${encodeURIComponent(routeId)}`
      ),
    list: (params?: {
      patientId?: string
      appointmentId?: string
      status?: string
      limit?: number
    }) => {
      const q = new URLSearchParams()
      if (params?.patientId) q.set("patientId", params.patientId)
      if (params?.appointmentId) q.set("appointmentId", params.appointmentId)
      if (params?.status) q.set("status", params.status)
      if (params?.limit) q.set("limit", String(params.limit))
      return request<{ data: import("@/types/prescription").Prescription[] }>(
        `/prescriptions?${q}`
      )
    },
    getById: (id: string) =>
      request<import("@/types/prescription").Prescription>(`/prescriptions/${id}`),
    create: (data: {
      patientId: string
      appointmentId?: string
      prescriptionDate?: string
      showDate?: boolean
      notes?: string
    }) =>
      request<import("@/types/prescription").Prescription>("/prescriptions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: Partial<{
        prescriptionDate: string
        showDate: boolean
        notes: string | null
      }>
    ) =>
      request<import("@/types/prescription").Prescription>(`/prescriptions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    addItem: (
      id: string,
      data: {
        type: import("@/types/prescription").PrescriptionItemType
        name: string
        presentation?: string
        dosage?: string
        frequency?: string
        duration?: string
        quantity?: string
        instructions?: string
        continuousUse?: boolean
        extraJson?: string
      }
    ) =>
      request<{ prescription: import("@/types/prescription").Prescription }>(
        `/prescriptions/${id}/items`,
        { method: "POST", body: JSON.stringify(data) }
      ),
    removeItem: (id: string, itemId: string) =>
      request<import("@/types/prescription").Prescription>(
        `/prescriptions/${id}/items/${itemId}`,
        { method: "DELETE" }
      ),
    finalize: (
      id: string,
      data?: { shareWhatsApp?: boolean; sharePhone?: string; signDigital?: boolean }
    ) =>
      request<import("@/types/prescription").Prescription>(
        `/prescriptions/${id}/finalize`,
        { method: "POST", body: JSON.stringify(data ?? {}) }
      ),
    renew: (id: string) =>
      request<import("@/types/prescription").Prescription>(
        `/prescriptions/${id}/renew`,
        { method: "POST", body: JSON.stringify({}) }
      ),
    resendWhatsapp: (id: string, data?: { phone?: string }) =>
      request<import("@/types/prescription").Prescription>(
        `/prescriptions/${id}/resend-whatsapp`,
        { method: "POST", body: JSON.stringify(data ?? {}) }
      ),
    listTemplates: () =>
      request<{ data: import("@/types/prescription").PrescriptionTemplate[] }>(
        "/prescriptions/templates"
      ),
    pdfUrl: (id: string) => {
      const token = getToken()
      const base = BASE.replace(/\/$/, "")
      const q = token ? `?token=${encodeURIComponent(token)}` : ""
      return `${base}/prescriptions/${id}/pdf${q}`
    },
    fetchPdfHtml: async (id: string) => {
      const token = getToken()
      const res = await fetch(`${BASE}/prescriptions/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new ApiError((data as { error?: string }).error || "Erro ao carregar PDF")
      }
      return res.text()
    },
  },

  medicamentos: {
    search: (q: string) =>
      request<import("@/types/medicamento").MedicamentoSearchResponse>(
        `/medicamentos/search?q=${encodeURIComponent(q)}`
      ),
    getProduct: (id: string) =>
      request<import("@/types/medicamento").MedicamentoProduto>(
        `/medicamentos/products/${encodeURIComponent(id)}`
      ),
  },

  exames: {
    search: (q: string) =>
      request<import("@/types/tuss").TussSearchResponse>(
        `/exames/search?q=${encodeURIComponent(q)}`
      ),
    getByCode: (code: string) =>
      request<import("@/types/tuss").TussTerm>(`/exames/${encodeURIComponent(code)}`),
  },

  vacinas: {
    search: (q: string) =>
      request<import("@/types/vacina").VacinaSearchResponse>(
        `/vacinas/search?q=${encodeURIComponent(q)}`
      ),
  },

  outros: {
    searchBulas: (params?: { q?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.q) q.set("q", params.q)
      if (params?.page) q.set("page", String(params.page))
      if (params?.limit) q.set("limit", String(params.limit))
      return request<{
        source: "anvisa" | "bulapi"
        items: Array<{
          id: string
          name: string
          substanceName?: string
          manufacturerName?: string
          regulatoryCategory?: string
          therapeuticClass?: string
          variantCount?: number
        }>
        page: number
        limit: number
        total: number
        totalPages: number
      }>(`/outros/bulas/search?${q}`)
    },
    getBulaDetail: (id: string) =>
      request<{
        id: string
        nome: string
        classes: string[]
        fonte: string
        registro_ms?: string
        informacoes_legais?: string
        laboratorio?: string
        secoes: {
          indicacao?: string
          farmacocinetica?: string
          contraindicacoes?: string
          posologia?: {
            texto_completo?: string
            gotas?: string
            xarope?: string
            injetavel?: string
            supositorio?: string
            casos_especiais?: string
          }
          efeitos_colaterais?: string
          advertencias_precaucoes?: string
          interacoes_medicamentosas?: string
          superdosagem?: string
          composicao?: string
          apresentacoes?: string
          armazenamento?: string
        }
        url_pdf?: string
        atualizado_em: string
      }>(`/outros/bulas/${encodeURIComponent(id)}`),
    /** @deprecated Use getBulaDetail */
    getBula: (id: string) => request<Record<string, unknown>>(`/outros/bulas/${encodeURIComponent(id)}`),
    cid10Chapters: () => request<Array<{ id: string; romanNumber: string; name: string; codeRange: string }>>("/outros/cid10/chapters"),
    searchCid10: (q: string) =>
      request<Array<{ id: string; code: string; description: string; chapter: { name: string } }>>(
        `/outros/cid10/search?q=${encodeURIComponent(q)}`
      ),
    getCid10: (code: string) =>
      request<{ code: string; description: string; chapter: { name: string; romanNumber: string } }>(
        `/outros/cid10/code/${encodeURIComponent(code)}`
      ),
    contacts: (params?: { search?: string; type?: string }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set("search", params.search)
      if (params?.type) q.set("type", params.type)
      return request<Array<{ id: string; name: string; type: string; phone: string | null; email: string | null; subtitle?: string }>>(
        `/outros/contacts?${q}`
      )
    },
    logs: (params?: { search?: string; module?: string; page?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set("search", params.search)
      if (params?.module) q.set("module", params.module)
      if (params?.page) q.set("page", String(params.page))
      return request<{
        data: Array<{
          id: string
          module: string
          action: string
          description: string
          createdAt: string
          userId: string | null
        }>
        total: number
        page: number
        totalPages: number
      }>(`/outros/logs?${q}`)
    },
  },
}
