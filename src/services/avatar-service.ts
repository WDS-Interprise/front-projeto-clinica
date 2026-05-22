import { api } from "@/services/api"

export async function fetchUserAvatarUrl(): Promise<string | null> {
  const data = await api.auth.meAvatar()
  return data.imageUrl ?? null
}
