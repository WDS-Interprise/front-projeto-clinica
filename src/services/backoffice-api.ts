import { ApiError } from "@/services/api"

const BASE = import.meta.env.VITE_API_BASE ?? "/api"
const TOKEN_KEY = "backoffice_token"
const USER_KEY = "backoffice_user"

export function getBackofficeToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearBackofficeSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getBackofficeToken()
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
      "Não foi possível conectar à API. Inicie o backend (npm run dev na pasta back-projeto-clinica, porta 3002)."
    )
  }

  if (res.status === 204) return undefined as T

  let data: { error?: string; fields?: Record<string, string> } = {}
  const contentType = res.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      data = await res.json()
    } catch {
      data = {}
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearBackofficeSession()
      throw new ApiError("Sessão expirada. Faça login novamente no backoffice.")
    }
    if (res.status === 403) {
      throw new ApiError(
        data.error ||
          "Acesso negado. Somente donos da plataforma (isAccountAdmin) entram no backoffice."
      )
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new ApiError(
        "Servidor indisponível (502). Verifique se o backend está rodando em http://localhost:3002. Apenas uma instância por vez."
      )
    }
    throw new ApiError(data.error || `Erro na requisição (${res.status})`, data.fields)
  }

  return data as T
}

export interface BackofficeMetrics {
  overview: {
    totalPatients: number
    totalAppointments: number
    appointmentsToday: number
    doctorsAvailable: number
    totalDoctors: number
    totalRecords: number
    totalUsers: number
  }
  saas?: {
    activeClinics: number
    totalClinics: number
    inactiveClinics: number
    whatsappConnected: number
    clinicsWithWhatsapp: number
    offlineIntegrations: number
    pendingJoinRequests: number
    pendingInvites: number
    platformRevenueTotal: number
    platformRevenueMonth: number
    subscriptionMrr?: number
    subscriptionArr?: number
    subscriptionRevenueMonth?: number
    subscriptionReceivable?: number
    subscriptionOverdue?: number
    trialSubscriptions?: number
    pastDueSubscriptions?: number
    activeSubscriptions?: number
    clinicsGrowthTrend: Array<{ month: string; value: number }>
    patientsGrowthTrend: Array<{ month: string; value: number }>
    revenueTrend: Array<{ month: string; value: number }>
    subscriptionRevenueTrend?: Array<{ month: string; value: number }>
    clinicDistribution: Array<{ name: string; count: number; percent: number }>
    recentClinics: Array<{
      id: string
      name: string
      status: string
      users: number
      patients: number
      appointments: number
      whatsapp: string
      createdAt: string
    }>
    platformActivities: Array<{ text: string; detail: string; time: string }>
    paymentStatusDistribution: Array<{ name: string; count: number; percent: number; value: number }>
    kpiTrends: {
      activeClinics: number[]
      patients: number[]
      users: number[]
      whatsappConnected: number[]
      joinRequests: number[]
    }
  }
  usersByRole: Array<{ role: string; count: number }>
  appointmentsByStatus: Array<{ status: string; count: number }>
  upcomingAppointments: Array<{
    id: string
    date: string
    time: string
    status: string
    patient: { id: string; name: string }
    doctor: { id: string; name: string; specialty: string }
  }>
  recentPatients: Array<{
    id: string
    name: string
    phone: string
    createdAt: string
  }>
  generatedAt: string
}

export type BackofficeClinic = {
  id: string
  name: string
  phone: string | null
  email: string | null
  active: boolean
  _count: { users: number; patients: number; appointments: number }
  subscription?: {
    planId: string
    planName: string
    planSlug: string
    status: string
  } | null
}

export type BackofficeUser = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  isAccountAdmin: boolean
  phone?: string | null
  clinics: Array<{ id: string; name: string; isClinicAdmin: boolean }>
  doctorProfile?: { id: string; specialty: string; crm: string } | null
}

export const backofficeApi = {
  status: () =>
    request<{ service: string; status: string; timestamp: string }>("/backoffice/status"),

  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; name: string; email: string; role: string } }>(
      "/backoffice/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ).then((result) => {
      localStorage.setItem(TOKEN_KEY, result.token)
      localStorage.setItem(USER_KEY, JSON.stringify(result.user))
      return result
    }),

  metrics: () => request<BackofficeMetrics>("/backoffice/metrics"),

  clinics: {
    list: () => request<BackofficeClinic[]>("/backoffice/clinics"),
    create: (data: { name: string; phone?: string; email?: string; active?: boolean }) =>
      request<BackofficeClinic>("/backoffice/clinics", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{ name: string; phone: string; email: string; active: boolean }>) =>
      request<BackofficeClinic>(`/backoffice/clinics/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  users: {
    list: (params?: { role?: string; clinicId?: string; search?: string }) => {
      const q = new URLSearchParams()
      if (params?.role) q.set("role", params.role)
      if (params?.clinicId) q.set("clinicId", params.clinicId)
      if (params?.search) q.set("search", params.search)
      return request<BackofficeUser[]>(`/backoffice/users?${q}`)
    },
    getById: (id: string) => request<any>(`/backoffice/users/${id}`),
    create: (data: Record<string, unknown>) =>
      request<any>("/backoffice/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request<any>(`/backoffice/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<void>(`/backoffice/users/${id}`, { method: "DELETE" }),
  },

  patients: {
    list: (params?: { clinicId?: string; search?: string; page?: number }) => {
      const q = new URLSearchParams()
      if (params?.clinicId) q.set("clinicId", params.clinicId)
      if (params?.search) q.set("search", params.search)
      if (params?.page) q.set("page", String(params.page))
      return request<{ data: any[]; total: number; page: number; totalPages: number }>(
        `/backoffice/patients?${q}`
      )
    },
  },

  getStoredUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "{}") as {
        name?: string
        email?: string
      }
    } catch {
      return {}
    }
  },

  plans: {
    list: () => request<any[]>("/backoffice/plans"),
    get: (id: string) => request<any>(`/backoffice/plans/${id}`),
    create: (data: Record<string, unknown>) =>
      request("/backoffice/plans", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/backoffice/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    duplicate: (id: string) => request(`/backoffice/plans/${id}/duplicate`, { method: "POST", body: "{}" }),
  },

  subscriptions: {
    list: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set("status", params.status)
      if (params?.search) q.set("search", params.search)
      return request<any[]>(`/backoffice/subscriptions?${q}`)
    },
    get: (id: string) => request<any>(`/backoffice/subscriptions/${id}`),
    changePlan: (id: string, data: { planId: string; billingCycle?: string }) =>
      request(`/backoffice/subscriptions/${id}/plan`, { method: "PUT", body: JSON.stringify(data) }),
    extendTrial: (id: string, days: number) =>
      request(`/backoffice/subscriptions/${id}/extend-trial`, { method: "POST", body: JSON.stringify({ days }) }),
    grantCourtesy: (id: string, until: string) =>
      request(`/backoffice/subscriptions/${id}/courtesy`, { method: "POST", body: JSON.stringify({ until }) }),
    cancel: (id: string, atPeriodEnd = true) =>
      request(`/backoffice/subscriptions/${id}/cancel`, { method: "POST", body: JSON.stringify({ atPeriodEnd }) }),
    reactivate: (id: string) =>
      request(`/backoffice/subscriptions/${id}/reactivate`, { method: "POST", body: "{}" }),
    suspend: (id: string) => request(`/backoffice/subscriptions/${id}/suspend`, { method: "POST", body: "{}" }),
    createInvoice: (id: string) =>
      request(`/backoffice/subscriptions/${id}/invoices`, { method: "POST", body: "{}" }),
  },

  billing: {
    list: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set("status", params.status)
      if (params?.search) q.set("search", params.search)
      return request<{ invoices: any[]; summary: any }>(`/backoffice/billing?${q}`)
    },
  },

  clinicDetail: {
    get: (id: string) => request<any>(`/backoffice/clinics/${id}`),
    usage: (id: string) => request<any>(`/backoffice/clinics/${id}/usage`),
  },

  platformSettings: {
    get: () => request<any>("/backoffice/platform-settings"),
    update: (data: Record<string, unknown>) =>
      request("/backoffice/platform-settings", { method: "PUT", body: JSON.stringify(data) }),
  },
}
