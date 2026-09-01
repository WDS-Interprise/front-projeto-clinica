import { useCallback, useEffect, useState } from "react"
import { api } from "@/services/api"
import { LANDING_PLAN_FALLBACK } from "@/lib/landing-content"
import type {
  ClinicSubscriptionView,
  PlanFeature,
  PlanLimitKey,
  PlanUsageItem,
  PublicCatalogPlan,
  PublicPlan,
} from "@/lib/plan-features"

function catalogToPublicPlan(plan: PublicCatalogPlan): PublicPlan {
  return {
    id: plan.slug,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    monthlyPrice: plan.monthlyPrice,
    annualPrice: plan.annualPrice,
    trialDays: plan.trialDays,
    highlighted: plan.highlighted,
    features: [],
    limits: plan.limits,
  }
}

function normalizePlans(value: unknown): PublicPlan[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is PublicPlan => Boolean(item && typeof item === "object" && "slug" in item))
  }
  if (value && typeof value === "object" && "plans" in value && Array.isArray((value as { plans: unknown }).plans)) {
    return (value as { plans: PublicCatalogPlan[] }).plans.map(catalogToPublicPlan)
  }
  return []
}

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
    Promise.allSettled([api.subscription.current(), api.subscription.usage()])
      .then(([subRes, usageRes]) => {
        const sub = subRes.status === "fulfilled" ? subRes.value : null
        const usageValue = usageRes.status === "fulfilled" ? usageRes.value : null
        setSubscription(sub ?? usageValue?.subscription ?? null)
        setUsage(
          (usageValue?.usage ?? []).map((item) => {
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
        setFeatures(usageValue?.features ?? [])
        if (sub || usageValue?.subscription) {
          setError(null)
        } else {
          const failed = [subRes, usageRes].find((r) => r.status === "rejected") as PromiseRejectedResult | undefined
          setError(failed?.reason instanceof Error ? failed.reason.message : "Erro ao carregar plano")
        }
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
  const [plans, setPlans] = useState<PublicPlan[]>(LANDING_PLAN_FALLBACK.plans.map(catalogToPublicPlan))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const apply = (rows: PublicPlan[]) => {
      if (!cancelled && rows.length) {
        setPlans(rows.filter((plan) => plan.slug !== "teste-webhook"))
      }
    }

    api.subscription
      .plans()
      .then((rows) => apply(normalizePlans(rows)))
      .catch(() =>
        api.public
          .plans()
          .then((catalog) => apply(normalizePlans(catalog)))
          .catch(() => apply(LANDING_PLAN_FALLBACK.plans.map(catalogToPublicPlan)))
      )
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { plans, loading }
}
