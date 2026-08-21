import { useEffect, useState } from "react"
import { Link, Outlet } from "react-router-dom"
import AppHeader from "./AppHeader"
import OnboardingPage from "@/pages/onboarding/OnboardingPage"
import {
  ONBOARDING_KEY,
  markOnboardingDoneIfProvisioned,
  shouldShowOnboarding,
} from "@/lib/onboarding"

import { PlanFeatureProvider, usePlanFeatures } from "@/context/PlanFeatureContext"

function PaymentRequiredBanner() {
  const { loading, isActive } = usePlanFeatures()
  if (loading || isActive) return null
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
      Pague o plano da clínica para usar o ClinMax.{" "}
      <Link to="/configuracoes/plano" className="font-semibold underline">
        Ver Pix e cobrança
      </Link>
    </div>
  )
}

export default function AppShell() {
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const showOnboarding = !onboardingDismissed && shouldShowOnboarding()

  useEffect(() => {
    markOnboardingDoneIfProvisioned()
  }, [])

  return (
    <PlanFeatureProvider>
      <div className="flex h-full min-h-0 flex-col bg-surface-alt">
      <AppHeader />
      <PaymentRequiredBanner />
      <main className="min-h-0 flex-1 overflow-hidden pt-16">
        <Outlet />
      </main>
      {showOnboarding && (
        <OnboardingPage onComplete={() => setOnboardingDismissed(true)} />
      )}
    </div>
    </PlanFeatureProvider>
  )
}

export { ONBOARDING_KEY }
