import { useCallback, useEffect, useState } from "react"
import { api } from "@/services/api"
import type { ClinicSubscriptionView, PlanFeature, PlanLimitKey, PlanUsageItem, PublicPlan } from "@/lib/plan-features"

type ClinicPlanState = {
  subscription: ClinicSubscriptionView | null
  usage: PlanUsageItem[]
  features: PlanFeature[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useClinicPlan(): ClinicPlanState {
  const [subscription, setSubscription] = useState<ClinicSubscriptionView | null>(null)
  const [usage, setUsage] = useState<PlanUsageItem[]>([])
  const [features, setFeatures] = useState<PlanFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    Promise.all([api.subscription.current(), api.subscription.usage()])
      .then(([sub, usageRes]) => {
        setSubscription(sub)
        setUsage(
          usageRes.usage.map((item) => {
            const raw = String(item.key)
            const key: PlanLimitKey =
              raw === "maxAiMessagesPerMonth"
                ? "maxAiAssistantMessagesPerMonth"
                : raw === "maxAiActionsPerMonth"
                  ? "maxAiAutomationActionsPerMonth"
                  : (raw as PlanLimitKey)
            return { ...item, key }
          })
        )
        setFeatures(usageRes.features)
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar plano")
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { subscription, usage, features, loading, error, refresh }
}

export function usePlanFeature(feature: PlanFeature, features: PlanFeature[]) {
  return features.includes(feature)
}

export function usePlanLimit(usage: PlanUsageItem[], key: PlanUsageItem["key"]) {
  return usage.find((u) => u.key === key) ?? { key, current: 0, max: null }
}

export function usePublicPlans() {
  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.subscription
      .plans()
      .then(setPlans)
      .finally(() => setLoading(false))
  }, [])

  return { plans, loading }
}
