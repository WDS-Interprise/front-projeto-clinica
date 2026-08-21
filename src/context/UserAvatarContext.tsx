import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "@/context/AuthContext"
import {
  readCachedAvatarUrl,
  withAvatarCacheBuster,
  writeCachedAvatarUrl,
} from "@/lib/avatar-events"
import { fetchUserAvatarUrl } from "@/services/avatar-service"

type UserAvatarContextValue = {
  imageUrl: string | null
  loading: boolean
  name: string
  setPreviewUrl: (url: string | null) => void
  refreshAvatar: (directUrl?: string | null) => Promise<void>
}

const UserAvatarContext = createContext<UserAvatarContextValue | null>(null)

export function UserAvatarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [imageUrl, setImageUrl] = useState<string | null>(() => readCachedAvatarUrl(user?.id))
  const [loading, setLoading] = useState(!readCachedAvatarUrl(user?.id))

  const applyUrl = useCallback(
    (url: string | null) => {
      const next = withAvatarCacheBuster(url)
      setImageUrl(next)
      writeCachedAvatarUrl(user?.id, next)
    },
    [user?.id]
  )

  const setPreviewUrl = useCallback((url: string | null) => {
    setImageUrl(url)
  }, [])

  const refreshAvatar = useCallback(
    async (directUrl?: string | null) => {
      if (directUrl !== undefined && directUrl !== null) {
        applyUrl(directUrl)
        return
      }
      if (!user?.id) {
        applyUrl(null)
        return
      }
      const url = await fetchUserAvatarUrl()
      applyUrl(url)
    },
    [user?.id, applyUrl]
  )

  useEffect(() => {
    if (!user?.id) {
      setImageUrl(null)
      setLoading(false)
      return
    }
    const cached = readCachedAvatarUrl(user.id)
    if (cached) {
      setImageUrl(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }
    let cancelled = false
    fetchUserAvatarUrl()
      .then((url) => {
        if (!cancelled) applyUrl(url)
      })
      .catch(() => {
        if (!cancelled && !cached) applyUrl(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, applyUrl])

  const value = useMemo(
    () => ({
      imageUrl,
      loading,
      name: user?.name ?? "Usuário",
      setPreviewUrl,
      refreshAvatar,
    }),
    [imageUrl, loading, user?.name, setPreviewUrl, applyUrl, refreshAvatar]
  )

  return <UserAvatarContext.Provider value={value}>{children}</UserAvatarContext.Provider>
}

export function useUserAvatarContext() {
  const ctx = useContext(UserAvatarContext)
  if (!ctx) throw new Error("useUserAvatarContext must be used within UserAvatarProvider")
  return ctx
}
