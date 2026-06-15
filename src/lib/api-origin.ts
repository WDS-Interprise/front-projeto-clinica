/** URL absoluta da API (OAuth redireciona direto ao backend, fora do proxy do Vite). */
export function getApiOrigin(): string {
  const fromEnv = import.meta.env.VITE_API_ORIGIN?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, "")

  if (import.meta.env.DEV) {
    return "http://localhost:3001"
  }

  return window.location.origin.replace(/\/$/, "")
}

export function getGoogleAuthStartUrl(): string {
  return `${getApiOrigin()}/api/auth/google`
}
