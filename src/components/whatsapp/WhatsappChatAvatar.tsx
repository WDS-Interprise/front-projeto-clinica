import { useEffect, useRef, useState } from "react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"
import { whatsappChatInitials } from "@/lib/whatsapp-display"
import { api } from "@/services/api"

type Props = {
  chatId: string
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
  eager?: boolean
}

const sizeMap = {
  sm: "h-12 w-12 text-sm",
  md: "h-14 w-14 text-base",
  lg: "h-16 w-16 text-lg",
}

export default function WhatsappChatAvatar({
  chatId,
  name,
  size = "md",
  className,
  eager = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [visible, setVisible] = useState(eager)

  useEffect(() => {
    if (eager) {
      setVisible(true)
      return
    }
    const el = rootRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "80px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [eager, chatId])

  useEffect(() => {
    if (!visible) return

    let cancelled = false

    const load = async () => {
      setFailed(false)
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(api.whatsapp.chatAvatarUrl(chatId), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) {
          if (!cancelled) setFailed(true)
          return
        }
        const blob = await res.blob()
        if (cancelled) return
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        const objectUrl = URL.createObjectURL(blob)
        objectUrlRef.current = objectUrl
        setSrc(objectUrl)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    void load()

    return () => {
      cancelled = true
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [chatId, visible])

  const initials = whatsappChatInitials(name)

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-[#dfe5e7] flex items-center justify-center",
        sizeMap[size],
        className
      )}
    >
      {src && !failed ? (
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <span className="font-medium text-[#54656f] select-none">{initials}</span>
      )}
      {failed && !src && initials === "?" && (
        <User className="absolute h-1/2 w-1/2 text-[#8696a0]" aria-hidden />
      )}
    </div>
  )
}
