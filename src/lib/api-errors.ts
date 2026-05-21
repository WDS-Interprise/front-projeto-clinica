import { ApiError, type ApiFieldErrors } from "@/services/api"

export function messageFromApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}

/** Mensagem pronta para toast (erros de API + campos duplicados). */
export function toastMessageFromApiError(err: unknown, fallback: string): string {
  const fields = fieldsFromApiError(err)
  const extra = Object.values(fields).filter(Boolean).join(" — ")
  return extra || messageFromApiError(err, fallback)
}

export function fieldsFromApiError(err: unknown): ApiFieldErrors {
  if (err instanceof ApiError && err.fields) return err.fields
  return {}
}
