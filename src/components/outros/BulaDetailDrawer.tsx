import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Drawer } from "@/components/ui/drawer"
import { BulaDetailView, type BulaDetail } from "@/components/outros/BulaDetailView"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

type Props = {
  open: boolean
  onClose: () => void
  bulaId?: string | null
  searchTerm?: string
}

async function resolveBulaId(searchTerm: string): Promise<string | null> {
  const res = await api.outros.searchBulas({ q: searchTerm, limit: 1 })
  return res.items[0]?.id ?? null
}

export function BulaDetailDrawer({ open, onClose, bulaId, searchTerm }: Props) {
  const { toast } = useToast()
  const [detail, setDetail] = useState<BulaDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setDetail(null)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setDetail(null)
      try {
        let id = bulaId ?? null
        if (!id && searchTerm?.trim()) {
          id = await resolveBulaId(searchTerm.trim())
        }
        if (!id) {
          toast("Bula não encontrada para este medicamento.", "error")
          return
        }
        const data = await api.outros.getBulaDetail(id)
        if (!cancelled) setDetail(data)
      } catch (err: unknown) {
        if (!cancelled) {
          toast(toastMessageFromApiError(err, "Erro ao carregar bula"), "error")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, bulaId, searchTerm, toast])

  return (
    <Drawer open={open} onClose={onClose} title="Bula do medicamento" width="xl" layer="stack">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-secondary">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando bula…
        </div>
      ) : detail ? (
        <BulaDetailView detail={detail} compact />
      ) : (
        <p className="py-16 text-center text-sm text-text-secondary">
          Não foi possível carregar a bula.
        </p>
      )}
    </Drawer>
  )
}

export { resolveBulaId }
