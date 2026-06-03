import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { api } from "@/services/api"
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
  permissions: string[]
  linkedDoctorIds?: string[]
  loading: boolean
  refresh: () => Promise<void>
  setSession: (data: {
    token: string
    user: AuthUser
    clinicId?: string
    permissions: string[]
    clinicName?: string
  }) => void
  logout: () => void
  hasPermission: (perm: Permission) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

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
      localStorage.setItem("permissions", JSON.stringify(me.permissions ?? []))
      applyAuthRedirectFlags({
        redirectPath: me.redirectPath,
        provisionedByClinic: me.provisionedByClinic,
        needsOnboarding: me.needsOnboarding,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ""
      if (msg.toLowerCase().includes("token")) {
        /* JWT inválido após troca de secret ou backend reiniciado */
      }
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem("clinicId")
      localStorage.removeItem("clinicName")
      localStorage.removeItem("permissions")
      setUser(null)
      setClinicId(null)
      setClinicName(null)
      setPermissions([])
    } finally {
      setLoading(false)
    }
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
    localStorage.removeItem("permissions")
    clearOnboardingFlags()
    setUser(null)
    setClinicId(null)
    setClinicName(null)
    setPermissions([])
    setLinkedDoctorIds(undefined)
  }, [])

  const value = useMemo(
    () => ({
      user,
      clinicId,
      clinicName,
      permissions,
      linkedDoctorIds,
      loading,
      refresh,
      setSession,
      logout,
      hasPermission: (perm: Permission) => can(permissions, perm),
    }),
    [user, clinicId, clinicName, permissions, linkedDoctorIds, loading, refresh, setSession, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
