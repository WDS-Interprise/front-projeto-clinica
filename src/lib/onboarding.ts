export const ONBOARDING_KEY = "clinichub_onboarding_done"
export const SELF_REGISTER_KEY = "clinichub_self_register"
export const AUTH_HOME_KEY = "clinichub_auth_home"

export function isSelfRegisteredUser(): boolean {
  return localStorage.getItem(SELF_REGISTER_KEY) === "1"
}

export function setAuthHome(path: string) {
  localStorage.setItem(AUTH_HOME_KEY, path)
}

export function getAuthHome(): string {
  const stored = localStorage.getItem(AUTH_HOME_KEY)
  if (stored) return stored

  if (isSelfRegisteredUser()) {
    return "/dashboard"
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}") as { role?: string }
  const clinicId = localStorage.getItem("clinicId")

  if (clinicId && clinicId !== "none" && user.role === "RECEPTION") {
    return "/agenda"
  }

  return "/dashboard"
}

export function shouldSkipOnboarding(): boolean {
  if (localStorage.getItem(ONBOARDING_KEY) === "1") {
    return true
  }

  if (isSelfRegisteredUser()) {
    return false
  }

  const clinicId = localStorage.getItem("clinicId")
  if (clinicId && clinicId !== "none") {
    return true
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}") as { role?: string }
  if (user.role === "RECEPTION" || user.role === "DOCTOR") {
    return true
  }

  return false
}

export function markProvisionedUser(redirectPath?: string) {
  localStorage.removeItem(SELF_REGISTER_KEY)
  localStorage.setItem(ONBOARDING_KEY, "1")
  if (redirectPath) setAuthHome(redirectPath)
  else if (localStorage.getItem("clinicId")) {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as { role?: string }
    setAuthHome(user.role === "RECEPTION" ? "/agenda" : "/dashboard")
  }
}

export function markSelfRegisteredUser() {
  localStorage.removeItem(ONBOARDING_KEY)
  localStorage.setItem(SELF_REGISTER_KEY, "1")
  setAuthHome("/dashboard")
}

export function markSelfRegisteredOnboardingDone() {
  localStorage.setItem(SELF_REGISTER_KEY, "1")
  localStorage.setItem(ONBOARDING_KEY, "1")
  setAuthHome("/dashboard")
}

export function markOnboardingDoneIfProvisioned() {
  if (isSelfRegisteredUser()) return
  if (shouldSkipOnboarding()) {
    markProvisionedUser()
  }
}

export function applyAuthRedirectFlags(data: {
  redirectPath?: string
  provisionedByClinic?: boolean
  needsOnboarding?: boolean
}) {
  const home = data.redirectPath || "/dashboard"
  setAuthHome(home)
  if (data.provisionedByClinic) {
    markProvisionedUser(home)
  } else if (data.needsOnboarding) {
    markSelfRegisteredUser()
  } else {
    markSelfRegisteredOnboardingDone()
  }
}

export function clearOnboardingFlags() {
  localStorage.removeItem(ONBOARDING_KEY)
  localStorage.removeItem(SELF_REGISTER_KEY)
  localStorage.removeItem(AUTH_HOME_KEY)
}

export function getPostLoginPath(): string {
  return getAuthHome()
}
