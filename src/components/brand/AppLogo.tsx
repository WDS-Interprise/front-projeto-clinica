import { cn } from "@/lib/utils"
import { APP_LOGO_ALT, APP_LOGO_SRC } from "@/lib/brand"

export type AppLogoSize = "xs" | "sm" | "md" | "lg" | "xl"

const sizeClass: Record<AppLogoSize, string> = {
  xs: "h-8",
  sm: "h-10",
  md: "h-12",
  lg: "h-14",
  xl: "h-[5.5rem]",
}

type Props = {
  size?: AppLogoSize
  className?: string
  rounded?: boolean
}

export default function AppLogo({ size = "md", className, rounded = true }: Props) {
  return (
    <img
      src={APP_LOGO_SRC}
      alt={APP_LOGO_ALT}
      width={320}
      height={120}
      decoding="async"
      className={cn(
        "w-auto max-w-full object-contain object-left",
        sizeClass[size],
        rounded && "rounded-lg",
        className
      )}
    />
  )
}
