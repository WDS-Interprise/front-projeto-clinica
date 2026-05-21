import { useCallback, useRef, useState } from "react"
import { ConfirmModal, type ConfirmModalProps } from "@/components/ui/confirm-modal"

type ConfirmOptions = Omit<ConfirmModalProps, "open" | "onClose" | "onConfirm" | "loading">

export function useConfirm() {
  const resolveRef = useRef<((value: boolean) => void) | null>(null)
  const [state, setState] = useState<{
    open: boolean
    options: ConfirmOptions
  }>({
    open: false,
    options: { message: "" },
  })

  const close = useCallback((result: boolean) => {
    resolveRef.current?.(result)
    resolveRef.current = null
    setState((s) => ({ ...s, open: false }))
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
      setState({ open: true, options })
    })
  }, [])

  const ConfirmDialog = useCallback(
    () => (
      <ConfirmModal
        open={state.open}
        onClose={() => close(false)}
        onConfirm={() => close(true)}
        {...state.options}
      />
    ),
    [state, close]
  )

  return { confirm, ConfirmDialog }
}
