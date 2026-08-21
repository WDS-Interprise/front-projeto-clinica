import type { CSSProperties, ElementType, ReactNode } from "react"
import { useEffect, useState } from "react"
import { useInView } from "@/hooks/useInView"

export type LandingRevealVariant =
  | "fade-up"
  | "fade-in"
  | "fade-left"
  | "fade-right"
  | "scale-in"

type LandingRevealProps = {
  children: ReactNode
  className?: string
  variant?: LandingRevealVariant
  delay?: number
  as?: ElementType
  /** Conteúdo acima da dobra. anima na montagem sem esperar scroll */
  immediate?: boolean
}

export default function LandingReveal({
  children,
  className = "",
  variant = "fade-up",
  delay = 0,
  as: Tag = "div",
  immediate = false,
}: LandingRevealProps) {
  const { ref, inView } = useInView<HTMLElement>()
  const [immediateReady, setImmediateReady] = useState(false)

  useEffect(() => {
    if (!immediate) return
    const frame = requestAnimationFrame(() => setImmediateReady(true))
    return () => cancelAnimationFrame(frame)
  }, [immediate])

  const visible = immediate ? immediateReady : inView

  const style: CSSProperties | undefined =
    delay > 0 ? { "--landing-reveal-delay": `${delay}ms` } as CSSProperties : undefined

  return (
    <Tag
      ref={ref}
      className={[
        "landing-reveal",
        `landing-reveal-${variant}`,
        visible ? "landing-reveal-visible" : "",
        delay > 0 ? "landing-reveal-delay" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {children}
    </Tag>
  )
}
