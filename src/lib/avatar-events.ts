export const AVATAR_UPDATED_EVENT = "avatar-updated"

export type AvatarUpdatedDetail = { imageUrl: string | null }

const AVATAR_CACHE_KEY = "clinichub_avatar_by_user"

function isEphemeralUrl(url: string) {
  return url.startsWith("blob:") || url.startsWith("data:")
}

function isSignedOrQueryUrl(url: string) {
  return (
    url.includes("?") ||
    url.includes("X-Amz-") ||
    url.includes("X-Goog-") ||
    url.includes("Signature=") ||
    /geninfra\.com\.br/i.test(url)
  )
}

export function withAvatarCacheBuster(url: string | null): string | null {
  if (!url) return null
  if (isEphemeralUrl(url) || isSignedOrQueryUrl(url)) return url
  const sep = url.includes("?") ? "&" : "?"
  return `${url}${sep}v=${Date.now()}`
}

export function readCachedAvatarUrl(userId: string | null | undefined): string | null {
  if (!userId) return null
  try {
    const raw = localStorage.getItem(AVATAR_CACHE_KEY)
    if (!raw) return null
    const map = JSON.parse(raw) as Record<string, string>
    const url = map[userId]
    return typeof url === "string" && url && !isEphemeralUrl(url) ? url : null
  } catch {
    return null
  }
}

export function writeCachedAvatarUrl(userId: string | null | undefined, url: string | null) {
  if (!userId) return
  try {
    const raw = localStorage.getItem(AVATAR_CACHE_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    if (!url || isEphemeralUrl(url)) {
      delete map[userId]
    } else {
      map[userId] = url
    }
    localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(map))
  } catch {
    /* ignore quota */
  }
}

export function dispatchAvatarUpdated(imageUrl: string | null) {
  window.dispatchEvent(
    new CustomEvent<AvatarUpdatedDetail>(AVATAR_UPDATED_EVENT, {
      detail: { imageUrl: withAvatarCacheBuster(imageUrl) },
    })
  )
}
