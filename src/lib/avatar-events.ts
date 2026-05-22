export const AVATAR_UPDATED_EVENT = "avatar-updated"

export type AvatarUpdatedDetail = { imageUrl: string | null }

export function withAvatarCacheBuster(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith("blob:") || url.startsWith("data:")) return url
  // URLs assinadas (S3/MinIO) quebram se adicionarmos query params extras.
  if (url.includes("X-Amz-Signature=") || url.includes("X-Amz-Algorithm=")) return url
  const sep = url.includes("?") ? "&" : "?"
  return `${url}${sep}v=${Date.now()}`
}

export function dispatchAvatarUpdated(imageUrl: string | null) {
  window.dispatchEvent(
    new CustomEvent<AvatarUpdatedDetail>(AVATAR_UPDATED_EVENT, {
      detail: { imageUrl: withAvatarCacheBuster(imageUrl) },
    })
  )
}
