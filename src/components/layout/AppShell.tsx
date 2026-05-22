import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import AppHeader from "./AppHeader"
import OnboardingPage from "@/pages/onboarding/OnboardingPage"
import {
  ONBOARDING_KEY,
  markOnboardingDoneIfProvisioned,
  shouldShowOnboarding,
} from "@/lib/onboarding"

export default function AppShell() {
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const showOnboarding = !onboardingDismissed && shouldShowOnboarding()

  useEffect(() => {
    markOnboardingDoneIfProvisioned()
  }, [])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-alt">
      <AppHeader />
      <main className="min-h-0 flex-1 overflow-hidden pt-16">
        <Outlet />
      </main>
      {showOnboarding && (
        <OnboardingPage onComplete={() => setOnboardingDismissed(true)} />
      )}
    </div>
  )
}

export { ONBOARDING_KEY }
