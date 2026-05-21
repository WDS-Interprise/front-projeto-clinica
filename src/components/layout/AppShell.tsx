import { useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import AppHeader from "./AppHeader"
import {
  ONBOARDING_KEY,
  shouldSkipOnboarding,
  markOnboardingDoneIfProvisioned,
  isSelfRegisteredUser,
} from "@/lib/onboarding"

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    markOnboardingDoneIfProvisioned()

    if (shouldSkipOnboarding()) {
      return
    }

    const needsSetup =
      isSelfRegisteredUser() || !localStorage.getItem(ONBOARDING_KEY)

    if (needsSetup && !location.pathname.startsWith("/onboarding")) {
      navigate("/onboarding", { replace: true })
    }
  }, [location.pathname, navigate])

  return (
    <div className="min-h-screen bg-surface-alt">
      <AppHeader />
      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  )
}

export { ONBOARDING_KEY }
