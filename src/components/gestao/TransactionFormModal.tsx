import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { api, type FinanceLookup } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

type Props = {
  open: boolean
  onClose: () => void
  type: "INCOME" | "EXPENSE" | "TRANSFER"
  lookup: FinanceLookup
  onSaved: () => void
}

const titles = {
  INCOME: "Nova receita",
  EXPENSE: "Nova despesa",
  TRANSFER: "Nova transferência",
} as const

export default function TransactionFormModal({ open, onClose, type, lookup, onSaved }: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState<"PAID" | "PENDING">("PAID")
  const [accountId, setAccountId] = useState(lookup.accounts[0]?.id ?? "")
  const [transferFromId, setTransferFromId] = useState(lookup.accounts[0]?.id ?? "")
  const [transferToId, setTransferToId] = useState(lookup.accounts[1]?.id ?? lookup.accounts[0]?.id ?? "")
  const [categoryId, setCategoryId] = useState("")
  const [paymentMethodId, setPaymentMethodId] = useState("")
  const [insurancePlan, setInsurancePlan] = useState("Particular")
  const [notes, setNotes] = useState("")

  const categories =
    type === "INCOME"
      ? lookup.categories.filter((c) => c.kind === "INCOME")
      : type === "EXPENSE"
        ? lookup.categories.filter((c) => c.kind === "EXPENSE")
        : []

  const submit = async () => {
    const parsedAmount = Number(amount.replace(",", "."))
    if (!description.trim()) {
      toast("Informe a descrição", "error")
      return
    }
    if (!parsedAmount || parsedAmount <= 0) {
      toast("Informe um valor válido", "error")
      return
    }

    setSaving(true)
    try {
      await api.finance.createTransaction({
        type,
        description: description.trim(),
        amount: parsedAmount,
        date,
        status,
        accountId: type === "TRANSFER" ? undefined : accountId,
        transferFromId: type === "TRANSFER" ? transferFromId : undefined,
        transferToId: type === "TRANSFER" ? transferToId : undefined,
        categoryId: categoryId || undefined,
        paymentMethodId: paymentMethodId || undefined,
        insurancePlan: type === "INCOME" ? insurancePlan : undefined,
        notes: notes || undefined,
      })
      onSaved()
      setDescription("")
      setAmount("")
      setNotes("")
    } catch (err: unknown) {
      toast(toastMessageFromApiError(err, "Erro ao salvar lançamento"), "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titles[type]}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <label className="block text-sm">
          <span className="text-text-secondary">Descrição</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-border bg-surface px-3"
            placeholder="Ex.: Consulta particular"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-text-secondary">Valor (R$)</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg border border-border bg-surface px-3"
              placeholder="0,00"
            />
          </label>
          <label className="block text-sm">
            <span className="text-text-secondary">Data</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg border border-border bg-surface px-3"
            />
          </label>
        </div>

        {type !== "TRANSFER" && (
          <label className="block text-sm">
            <span className="text-text-secondary">Conta</span>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg border border-border bg-surface px-3"
            >
              {lookup.accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {type === "TRANSFER" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-text-secondary">Conta origem</span>
              <select
                value={transferFromId}
                onChange={(e) => setTransferFromId(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-border bg-surface px-3"
              >
                {lookup.accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-text-secondary">Conta destino</span>
              <select
                value={transferToId}
                onChange={(e) => setTransferToId(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-border bg-surface px-3"
              >
                {lookup.accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {categories.length > 0 && (
          <label className="block text-sm">
            <span className="text-text-secondary">Categoria</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg border border-border bg-surface px-3"
            >
              <option value="">Selecione...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {type === "INCOME" && (
          <label className="block text-sm">
            <span className="text-text-secondary">Convênio / plano</span>
            <input
              value={insurancePlan}
              onChange={(e) => setInsurancePlan(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg border border-border bg-surface px-3"
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="text-text-secondary">Forma de pagamento</span>
          <select
            value={paymentMethodId}
            onChange={(e) => setPaymentMethodId(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-border bg-surface px-3"
          >
            <option value="">Selecione...</option>
            {lookup.paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-text-secondary">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "PAID" | "PENDING")}
            className="mt-1 w-full h-10 rounded-lg border border-border bg-surface px-3"
          >
            <option value="PAID">Pago</option>
            <option value="PENDING">Pendente</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-text-secondary">Observações</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
          />
        </label>
      </div>
    </Modal>
  )
}
