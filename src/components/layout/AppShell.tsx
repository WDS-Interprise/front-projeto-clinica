import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import AppHeader from "./AppHeader"
import OnboardingPage from "@/pages/onboarding/OnboardingPage"
import {
  ONBOARDING_KEY,
  markOnboardingDoneIfProvisioned,
  shouldShowOnboarding,
} from "@/lib/onboarding"

import { PlanFeatureProvider } from "@/context/PlanFeatureContext"

export default function AppShell() {
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const showOnboarding = !onboardingDismissed && shouldShowOnboarding()

  useEffect(() => {
    markOnboardingDoneIfProvisioned()
  }, [])

  return (
    <PlanFeatureProvider>
      <div className="flex h-screen flex-col bg-surface-alt">
      <AppHeader />
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
