import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react"

type Align = "left" | "right"

type AnchoredDropdown = {
  anchorRef: RefObject<HTMLButtonElement | null>
  menuRef: RefObject<HTMLDivElement | null>
  open: boolean
  setOpen: (value: boolean) => void
  toggle: () => void
  close: () => void
  menuStyle: CSSProperties
}

export function useAnchoredDropdown(align: Align = "right"): AnchoredDropdown {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})

  const updatePosition = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (align === "right") {
      setMenuStyle({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    } else {
      setMenuStyle({ top: rect.bottom + 6, left: rect.left })
    }
  }, [align])

  const toggle = useCallback(() => {
    setOpen((current) => {
      if (!current) updatePosition()
      return !current
    })
  }, [updatePosition])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener("mousedown", onDoc)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", updatePosition)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [open, updatePosition])

  return { anchorRef, menuRef, open, setOpen, toggle, close, menuStyle }
}
