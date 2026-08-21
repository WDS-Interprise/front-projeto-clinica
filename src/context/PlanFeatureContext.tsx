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
import type { PlanFeature, PlanLimitKey, PlanUsageItem } from "@/lib/plan-features"
import { useAuth } from "@/context/AuthContext"

type PlanFeatureState = {
  features: PlanFeature[]
  usage: PlanUsageItem[]
  loading: boolean
  isActive: boolean
  hasFeature: (feature: PlanFeature) => boolean
  getLimit: (key: PlanLimitKey) => PlanUsageItem
  refresh: () => void
}

const PlanFeatureContext = createContext<PlanFeatureState | null>(null)

export function PlanFeatureProvider({ children }: { children: ReactNode }) {
  const { clinicId, loading: authLoading } = useAuth()
  const [features, setFeatures] = useState<PlanFeature[]>([])
  const [usage, setUsage] = useState<PlanUsageItem[]>([])
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    if (!localStorage.getItem("token") || !clinicId) {
      setFeatures([])
      setUsage([])
      setIsActive(true)
      setLoading(false)
      return
    }
    setLoading(true)
    api.subscription
      .usage()
      .then((res) => {
        setFeatures(res.features)
        setUsage(res.usage)
        setIsActive(res.isActive !== false)
      })
      .catch(() => {
        setFeatures([])
        setUsage([])
      })
      .finally(() => setLoading(false))
  }, [clinicId])

  useEffect(() => {
    if (authLoading) return
    refresh()
  }, [authLoading, refresh])

  const hasFeature = useCallback(
    (feature: PlanFeature) => features.includes(feature),
    [features]
  )

  const getLimit = useCallback(
    (key: PlanLimitKey) => usage.find((u) => u.key === key) ?? { key, current: 0, max: null },
    [usage]
  )

  const value = useMemo(
    () => ({ features, usage, loading, isActive, hasFeature, getLimit, refresh }),
    [features, usage, loading, isActive, hasFeature, getLimit, refresh]
  )

  return <PlanFeatureContext.Provider value={value}>{children}</PlanFeatureContext.Provider>
}

export function usePlanFeatures() {
  const ctx = useContext(PlanFeatureContext)
  if (!ctx) {
    throw new Error("usePlanFeatures must be used within PlanFeatureProvider")
  }
  return ctx
}

export function useOptionalPlanFeatures() {
  return useContext(PlanFeatureContext)
}
