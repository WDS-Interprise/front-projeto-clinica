import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export type UserAvatarSize = "sm" | "md" | "lg"

export type UserAvatarProps = {
  name: string
  imageUrl?: string | null
  size?: UserAvatarSize
  className?: string
}

const sizeClasses: Record<UserAvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

export default function UserAvatar({
  name,
  imageUrl,
  size = "sm",
  className,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(imageUrl) && !failed

  useEffect(() => {
    setFailed(false)
  }, [imageUrl])

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-primary/25 bg-gradient-to-br from-accent to-primary font-bold text-white shadow-sm",
        sizeClasses[size],
        className
      )}
      aria-hidden={!name}
    >
      {showImage ? (
        <img
          key={imageUrl}
          src={imageUrl!}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {initialsFromName(name)}
        </span>
      )}
    </div>
  )
}
