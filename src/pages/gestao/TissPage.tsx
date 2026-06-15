import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { GestaoPageShell } from "@/components/gestao/GestaoPageShell"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { api } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { useAuth } from "@/context/AuthContext"

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviada",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  CANCELLED: "Cancelada",
}

export default function TissPage() {
  const { toast } = useToast()
  const { hasPermission } = useAuth()
  const canManage = hasPermission("finance:manage")
  const [guides, setGuides] = useState<Array<{ id: string; guideNumber: string | null; status: string; insurancePlan: string; procedureName: string | null; amount: number | null; patient: { name: string } | null; doctor: { name: string } | null }>>([])
  const [open, setOpen] = useState(false)
  const [insurancePlan, setInsurancePlan] = useState("Particular")
  const [procedureName, setProcedureName] = useState("")
  const [amount, setAmount] = useState("")

  const load = () => {
    api.tiss.listGuides().then(setGuides).catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao carregar guias"), "error"))
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    try {
      await api.tiss.createGuide({
        insurancePlan,
        procedureName: procedureName || undefined,
        amount: amount ? Number(amount) : undefined,
      })
      toast("Guia criada!")
      setOpen(false)
      load()
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao criar guia"), "error")
    }
  }

  const markSent = async (id: string) => {
    try {
      await api.tiss.updateStatus(id, "SENT")
      toast("Guia marcada como enviada")
      load()
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao atualizar guia"), "error")
    }
  }

  return (
    <GestaoPageShell title="Faturamento TISS" description="Guias de consulta para faturamento de convênios.">
      {canManage && (
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nova guia
        </Button>
      )}

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt/80 text-text-secondary">
            <tr>
              <th className="text-left p-3">Guia</th>
              <th className="text-left p-3">Paciente</th>
              <th className="text-left p-3">Profissional</th>
              <th className="text-left p-3">Convênio</th>
              <th className="text-left p-3">Procedimento</th>
              <th className="text-left p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {!guides.length && <tr><td colSpan={7} className="p-8 text-center text-text-secondary">Nenhuma guia cadastrada.</td></tr>}
            {guides.map((g) => (
              <tr key={g.id} className="border-t border-border">
                <td className="p-3 font-mono">{g.guideNumber ?? "—"}</td>
                <td className="p-3">{g.patient?.name ?? "—"}</td>
                <td className="p-3">{g.doctor?.name ?? "—"}</td>
                <td className="p-3">{g.insurancePlan}</td>
                <td className="p-3">{g.procedureName ?? "—"}</td>
                <td className="p-3">{statusLabels[g.status] ?? g.status}</td>
                <td className="p-3 text-right">
                  {canManage && g.status === "DRAFT" && (
                    <Button type="button" size="sm" variant="outline" onClick={() => markSent(g.id)}>Enviar</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova guia TISS" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={create}>Criar</Button></>}>
        <div className="px-6 py-4 space-y-3">
          <input value={insurancePlan} onChange={(e) => setInsurancePlan(e.target.value)} placeholder="Convênio" className="w-full h-10 rounded-lg border border-border px-3" />
          <input value={procedureName} onChange={(e) => setProcedureName(e.target.value)} placeholder="Procedimento" className="w-full h-10 rounded-lg border border-border px-3" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor (R$)" className="w-full h-10 rounded-lg border border-border px-3" />
        </div>
      </Modal>
    </GestaoPageShell>
  )
}
