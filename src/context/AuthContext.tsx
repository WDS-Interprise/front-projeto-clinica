import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { ApiError, api } from "@/services/api"
import { can, type Permission } from "@/lib/permissions"
import { applyAuthRedirectFlags, clearOnboardingFlags } from "@/lib/onboarding"

export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  isAccountAdmin?: boolean
  doctorId?: string
}

type AuthState = {
  user: AuthUser | null
  clinicId: string | null
  clinicName: string | null
  clinics: { id: string; name: string }[]
  permissions: string[]
  linkedDoctorIds?: string[]
  loading: boolean
  refresh: () => Promise<void>
  switchClinic: (clinicId: string) => Promise<void>
  setSession: (data: {
    token: string
    user: AuthUser
    clinicId?: string
    permissions: string[]
    clinicName?: string
    clinics?: { id: string; name: string }[]
  }) => void
  logout: () => void
  hasPermission: (perm: Permission) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

function isInvalidSessionError(err: unknown) {
  if (err instanceof ApiError && err.status === 401) return true
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return (
    msg.includes("token inválido") ||
    msg.includes("token invalido") ||
    msg.includes("jwt") ||
    msg.includes("não autenticado") ||
    msg.includes("nao autenticado")
  )
}

function readJsonStorage<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readJsonStorage<AuthUser | null>("user", null))
  const [clinicId, setClinicId] = useState<string | null>(
    () => localStorage.getItem("clinicId")
  )
  const [clinicName, setClinicName] = useState<string | null>(
    () => localStorage.getItem("clinicName")
  )
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>(() =>
    readJsonStorage<{ id: string; name: string }[]>("clinics", [])
  )
  const [permissions, setPermissions] = useState<string[]>(() => readJsonStorage<string[]>("permissions", []))
  const [linkedDoctorIds, setLinkedDoctorIds] = useState<string[] | undefined>()
  const [loading, setLoading] = useState(!!localStorage.getItem("token"))

  const refresh = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setLoading(false)
      return
    }
    try {
      const me = await api.auth.me()
      if (me.token) localStorage.setItem("token", me.token)
      setUser({
        id: me.id,
        name: me.name,
        email: me.email,
        role: me.role,
        isAccountAdmin: me.isAccountAdmin,
        doctorId: me.doctorId,
      })
      setClinicId(me.clinicId)
      setClinicName(me.clinicName ?? null)
      setClinics(me.clinics ?? [])
      setPermissions(me.permissions ?? [])
      setLinkedDoctorIds(me.linkedDoctorIds)
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: me.id,
          name: me.name,
          email: me.email,
          role: me.role,
          doctorId: me.doctorId,
        })
      )
      if (me.clinicId) localStorage.setItem("clinicId", me.clinicId)
      if (me.clinicName) localStorage.setItem("clinicName", me.clinicName)
      localStorage.setItem("clinics", JSON.stringify(me.clinics ?? []))
      localStorage.setItem("permissions", JSON.stringify(me.permissions ?? []))
      applyAuthRedirectFlags({
        redirectPath: me.redirectPath,
        provisionedByClinic: me.provisionedByClinic,
        needsOnboarding: me.needsOnboarding,
      })
    } catch (err: unknown) {
      if (isInvalidSessionError(err)) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        localStorage.removeItem("clinicId")
        localStorage.removeItem("clinicName")
        localStorage.removeItem("clinics")
        localStorage.removeItem("permissions")
        setUser(null)
        setClinicId(null)
        setClinicName(null)
        setPermissions([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const switchClinic = useCallback(async (nextClinicId: string) => {
    const result = await api.auth.switchClinic(nextClinicId)
    localStorage.setItem("token", result.token)
    setClinicId(result.clinicId)
    setClinicName(result.clinicName ?? null)
    setClinics(result.clinics ?? [])
    setPermissions(result.permissions ?? [])
    setLinkedDoctorIds(result.linkedDoctorIds)
    localStorage.setItem("clinicId", result.clinicId)
    if (result.clinicName) localStorage.setItem("clinicName", result.clinicName)
    localStorage.setItem("clinics", JSON.stringify(result.clinics ?? []))
    localStorage.setItem("permissions", JSON.stringify(result.permissions ?? []))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setSession = useCallback(
    (data: {
      token: string
      user: AuthUser
      clinicId?: string
      permissions: string[]
      clinicName?: string
      clinics?: { id: string; name: string }[]
    }) => {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("permissions", JSON.stringify(data.permissions))
      if (data.clinicId) {
        localStorage.setItem("clinicId", data.clinicId)
        setClinicId(data.clinicId)
      } else {
        localStorage.removeItem("clinicId")
        setClinicId(null)
      }
      if (data.clinicName) {
        localStorage.setItem("clinicName", data.clinicName)
        setClinicName(data.clinicName)
      } else {
        localStorage.removeItem("clinicName")
        setClinicName(null)
      }
      if (data.clinics?.length) {
        localStorage.setItem("clinics", JSON.stringify(data.clinics))
        setClinics(data.clinics)
      }
      setUser(data.user)
      setPermissions(data.permissions)
      setLoading(false)
    },
    []
  )

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("clinicId")
    localStorage.removeItem("clinicName")
    localStorage.removeItem("clinics")
    localStorage.removeItem("permissions")
    clearOnboardingFlags()
    setUser(null)
    setClinicId(null)
    setClinicName(null)
    setClinics([])
    setPermissions([])
    setLinkedDoctorIds(undefined)
    setLoading(false)
  }, [])

  const value = useMemo(
    () => ({
      user,
      clinicId,
      clinicName,
      clinics,
      permissions,
      linkedDoctorIds,
      loading,
      refresh,
      switchClinic,
      setSession,
      logout,
      hasPermission: (perm: Permission) => can(permissions, perm),
    }),
    [user, clinicId, clinicName, clinics, permissions, linkedDoctorIds, loading, refresh, switchClinic, setSession, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
