import { useRef } from "react"
import { Camera, Loader2 } from "lucide-react"
import UserAvatar from "@/components/user/UserAvatar"
import { cn } from "@/lib/utils"

type Props = {
  name: string
  imageUrl?: string | null
  uploading?: boolean
  disabled?: boolean
  onSelectFile: (file: File) => void
  className?: string
}

const ACCEPT = "image/jpeg,image/png,image/webp"

export default function ProfileAvatarUpload({
  name,
  imageUrl,
  uploading = false,
  disabled = false,
  onSelectFile,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!ACCEPT.split(",").includes(file.type)) return
    onSelectFile(file)
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          (disabled || uploading) && "cursor-not-allowed opacity-70"
        )}
        aria-label="Alterar foto de perfil"
      >
        <UserAvatar name={name} imageUrl={imageUrl} size="lg" className="h-24 w-24 text-xl" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/35 group-disabled:group-hover:bg-black/0">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white opacity-100" />
          ) : (
            <Camera className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={handleChange}
        disabled={disabled || uploading}
      />
      <p className="text-xs text-text-secondary text-center max-w-[220px]">
        Clique no círculo para enviar sua foto (JPEG, PNG ou WebP, até 5 MB).
      </p>
    </div>
  )
}
