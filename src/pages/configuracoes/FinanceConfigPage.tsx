import { useEffect, useState } from "react"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import { Button } from "@/components/ui/button"
import { api, type FinanceLookup } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"

export default function FinanceConfigPage() {
  const { toast } = useToast()
  const [lookup, setLookup] = useState<FinanceLookup | null>(null)
  const [settings, setSettings] = useState({
    defaultAccountId: "",
    defaultCostCenterId: "",
    defaultPaymentMethodId: "",
    autoGenerateOnAppointment: false,
  })
  const [newAccount, setNewAccount] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [categoryKind, setCategoryKind] = useState<"INCOME" | "EXPENSE">("INCOME")
  const [newCostCenter, setNewCostCenter] = useState("")
  const [newPaymentMethod, setNewPaymentMethod] = useState("")

  const load = () => {
    Promise.all([api.finance.lookup(), api.finance.getSettings()])
      .then(([lk, s]) => {
        setLookup(lk)
        setSettings({
          defaultAccountId: s.defaultAccountId ?? "",
          defaultCostCenterId: s.defaultCostCenterId ?? "",
          defaultPaymentMethodId: s.defaultPaymentMethodId ?? "",
          autoGenerateOnAppointment: s.autoGenerateOnAppointment,
        })
      })
      .catch((e: unknown) => toast(toastMessageFromApiError(e, "Erro ao carregar configurações"), "error"))
  }

  useEffect(() => { load() }, [])

  const saveSettings = async () => {
    try {
      await api.finance.updateSettings({
        defaultAccountId: settings.defaultAccountId || null,
        defaultCostCenterId: settings.defaultCostCenterId || null,
        defaultPaymentMethodId: settings.defaultPaymentMethodId || null,
        autoGenerateOnAppointment: settings.autoGenerateOnAppointment,
      })
      toast("Configurações salvas!")
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao salvar"), "error")
    }
  }

  if (!lookup) {
    return (
      <SettingsLayout>
        <SettingsPageHeader title="Financeiro" description="Contas, categorias, centros de custo e padrões." />
        <p className="text-sm text-text-secondary">Carregando...</p>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout className="max-w-3xl">
      <SettingsPageHeader title="Financeiro" description="Contas bancárias, categorias, centros de custo e configurações padrão." />

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-text">Padrões financeiros</h2>
        <label className="block text-sm">
          <span className="text-text-secondary">Conta padrão</span>
          <select value={settings.defaultAccountId} onChange={(e) => setSettings((s) => ({ ...s, defaultAccountId: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-border px-3">
            <option value="">Selecione...</option>
            {lookup.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-text-secondary">Centro de custo padrão</span>
          <select value={settings.defaultCostCenterId} onChange={(e) => setSettings((s) => ({ ...s, defaultCostCenterId: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-border px-3">
            <option value="">Selecione...</option>
            {lookup.costCenters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-text-secondary">Forma de pagamento padrão</span>
          <select value={settings.defaultPaymentMethodId} onChange={(e) => setSettings((s) => ({ ...s, defaultPaymentMethodId: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-border px-3">
            <option value="">Selecione...</option>
            {lookup.paymentMethods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.autoGenerateOnAppointment} onChange={(e) => setSettings((s) => ({ ...s, autoGenerateOnAppointment: e.target.checked }))} />
          Gerar receita automaticamente ao concluir atendimento
        </label>
        <Button type="button" onClick={saveSettings}>Salvar padrões</Button>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-text">Contas bancárias</h2>
        <ul className="text-sm space-y-1">{lookup.accounts.map((a) => <li key={a.id}>{a.name}</li>)}</ul>
        <div className="flex gap-2">
          <input value={newAccount} onChange={(e) => setNewAccount(e.target.value)} placeholder="Nova conta" className="flex-1 h-10 rounded-lg border border-border px-3" />
          <Button type="button" variant="outline" onClick={async () => {
            try { await api.finance.createAccount({ name: newAccount }); setNewAccount(""); load(); toast("Conta adicionada") } catch (e: unknown) { toast(toastMessageFromApiError(e, "Erro"), "error") }
          }}>Adicionar</Button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-text">Categorias financeiras</h2>
        <ul className="text-sm space-y-1">{lookup.categories.map((c) => <li key={c.id}>{c.name} <span className="text-text-secondary">({c.kind === "INCOME" ? "Receita" : "Despesa"})</span></li>)}</ul>
        <div className="flex flex-wrap gap-2">
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nova categoria" className="flex-1 min-w-[160px] h-10 rounded-lg border border-border px-3" />
          <select value={categoryKind} onChange={(e) => setCategoryKind(e.target.value as "INCOME" | "EXPENSE")} className="h-10 rounded-lg border border-border px-3">
            <option value="INCOME">Receita</option>
            <option value="EXPENSE">Despesa</option>
          </select>
          <Button type="button" variant="outline" onClick={async () => {
            try { await api.finance.createCategory({ name: newCategory, kind: categoryKind }); setNewCategory(""); load(); toast("Categoria adicionada") } catch (e: unknown) { toast(toastMessageFromApiError(e, "Erro"), "error") }
          }}>Adicionar</Button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-text">Centros de custo</h2>
        <ul className="text-sm space-y-1">{lookup.costCenters.map((c) => <li key={c.id}>{c.name}</li>)}</ul>
        <div className="flex gap-2">
          <input value={newCostCenter} onChange={(e) => setNewCostCenter(e.target.value)} placeholder="Novo centro de custo" className="flex-1 h-10 rounded-lg border border-border px-3" />
          <Button type="button" variant="outline" onClick={async () => {
            try { await api.finance.createCostCenter({ name: newCostCenter }); setNewCostCenter(""); load(); toast("Centro de custo adicionado") } catch (e: unknown) { toast(toastMessageFromApiError(e, "Erro"), "error") }
          }}>Adicionar</Button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-text">Formas de pagamento</h2>
        <ul className="text-sm space-y-1">{lookup.paymentMethods.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
        <div className="flex gap-2">
          <input value={newPaymentMethod} onChange={(e) => setNewPaymentMethod(e.target.value)} placeholder="Nova forma" className="flex-1 h-10 rounded-lg border border-border px-3" />
          <Button type="button" variant="outline" onClick={async () => {
            try { await api.finance.createPaymentMethod({ name: newPaymentMethod }); setNewPaymentMethod(""); load(); toast("Forma de pagamento adicionada") } catch (e: unknown) { toast(toastMessageFromApiError(e, "Erro"), "error") }
          }}>Adicionar</Button>
        </div>
      </section>
    </SettingsLayout>
  )
}
