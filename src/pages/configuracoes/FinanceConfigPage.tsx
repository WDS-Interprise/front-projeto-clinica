import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  Building2,
  ChevronRight,
  CreditCard,
  Landmark,
  Layers,
  List,
  Pencil,
  Plus,
  QrCode,
  SlidersHorizontal,
  Tags,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import SettingsLayout, { SettingsPageHeader } from "@/components/layout/SettingsLayout"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import ClinmaxPaySettingsCard from "@/components/settings/ClinmaxPaySettingsCard"
import { api, type FinanceLookup } from "@/services/api"
import { useToast } from "@/context/ToastContext"
import { toastMessageFromApiError } from "@/lib/api-errors"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "recebimentos", label: "Recebimentos", icon: QrCode },
  { id: "padroes", label: "Padrões", icon: SlidersHorizontal },
  { id: "contas", label: "Contas bancárias", icon: Landmark },
  { id: "categorias", label: "Categorias", icon: Tags },
  { id: "centros", label: "Centros de custo", icon: Layers },
  { id: "formas", label: "Formas de pagamento", icon: CreditCard },
] as const

type TabId = (typeof TABS)[number]["id"]

const TAB_IDS = new Set<string>(TABS.map((tab) => tab.id))

const card = "rounded-[14px] border border-[#E4EBE6] bg-white p-5"

function isTabId(value: string | null): value is TabId {
  return Boolean(value && TAB_IDS.has(value))
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function nameById(items: Array<{ id: string; name: string }>, id: string) {
  return items.find((item) => item.id === id)?.name ?? ""
}

function ValueChip({ children, empty }: { children: ReactNode; empty?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded-full px-3 py-1 text-[13px] font-medium",
        empty ? "bg-[#F4F7F5] text-[#6B7C74]" : "bg-[#E8F6EE] text-[#006B4D]"
      )}
    >
      {children}
    </span>
  )
}

export default function FinanceConfigPage() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("aba")
  const tab: TabId = isTabId(tabParam) ? tabParam : "recebimentos"

  const [lookup, setLookup] = useState<FinanceLookup | null>(null)
  const [settings, setSettings] = useState({
    defaultAccountId: "",
    defaultCostCenterId: "",
    defaultPaymentMethodId: "",
    autoGenerateOnAppointment: false,
  })
  const [editingDefaults, setEditingDefaults] = useState(false)
  const [savingDefaults, setSavingDefaults] = useState(false)
  const [newAccount, setNewAccount] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [categoryKind, setCategoryKind] = useState<"INCOME" | "EXPENSE">("INCOME")
  const [newCostCenter, setNewCostCenter] = useState("")
  const [newPaymentMethod, setNewPaymentMethod] = useState("")
  const [adding, setAdding] = useState(false)
  const [showAllAccounts, setShowAllAccounts] = useState(false)
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false)

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

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setEditingDefaults(false)
    setShowAllAccounts(false)
    setShowAddPaymentMethod(false)
  }, [tab])

  const setTab = (id: TabId) => {
    setSearchParams(id === "recebimentos" ? {} : { aba: id }, { replace: true })
  }

  const saveSettings = async () => {
    setSavingDefaults(true)
    try {
      await api.finance.updateSettings({
        defaultAccountId: settings.defaultAccountId || null,
        defaultCostCenterId: settings.defaultCostCenterId || null,
        defaultPaymentMethodId: settings.defaultPaymentMethodId || null,
        autoGenerateOnAppointment: settings.autoGenerateOnAppointment,
      })
      toast("Padrões financeiros salvos")
      setEditingDefaults(false)
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Erro ao salvar padrões"), "error")
    } finally {
      setSavingDefaults(false)
    }
  }

  const addItem = async (action: () => Promise<unknown>, reset: () => void, success: string) => {
    setAdding(true)
    try {
      await action()
      reset()
      load()
      toast(success)
    } catch (e: unknown) {
      toast(toastMessageFromApiError(e, "Não foi possível adicionar"), "error")
    } finally {
      setAdding(false)
    }
  }

  const accountName = nameById(lookup?.accounts ?? [], settings.defaultAccountId)
  const costCenterName = nameById(lookup?.costCenters ?? [], settings.defaultCostCenterId)
  const paymentName = nameById(lookup?.paymentMethods ?? [], settings.defaultPaymentMethodId)

  const expenseCategories = useMemo(
    () => (lookup?.categories ?? []).filter((c) => c.kind === "EXPENSE"),
    [lookup]
  )
  const incomeCategories = useMemo(
    () => (lookup?.categories ?? []).filter((c) => c.kind === "INCOME"),
    [lookup]
  )

  return (
    <SettingsLayout className="flex w-full flex-col">
      <SettingsPageHeader
        title="Financeiro (cadastros)"
        description="Contas, categorias, centros de custo, formas de pagamento e padrões usados no caixa da clínica."
      />

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Seções financeiras">
        {TABS.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-lg px-3.5 text-[13px] font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B4D]/30 focus-visible:ring-offset-2",
                active
                  ? "bg-[#006B4D] text-white shadow-sm"
                  : "border border-[#D5DED8] bg-white text-[#1B2E26] hover:bg-[#F4F7F5]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === "recebimentos" && <ClinmaxPaySettingsCard />}

      {tab !== "recebimentos" && !lookup && (
        <section className={card}>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-10 w-full" />
          <Skeleton className="mt-3 h-10 w-2/3" />
        </section>
      )}

      {tab === "padroes" && lookup && (
        <section className={card}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F6EE] text-[#006B4D]">
                <Wallet className="h-4 w-4" />
              </span>
              <h2 className="text-[16px] font-semibold text-[#12261E]">Padrões financeiros</h2>
            </div>
            <button
              type="button"
              onClick={() => setEditingDefaults((v) => !v)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-[#006B4D] hover:bg-[#E8F6EE]"
            >
              <Pencil className="h-4 w-4" />
              {editingDefaults ? "Cancelar" : "Editar padrões"}
            </button>
          </div>

          {editingDefaults ? (
            <div className="space-y-4">
              <Select
                label="Conta padrão"
                value={settings.defaultAccountId}
                onChange={(defaultAccountId) => setSettings((s) => ({ ...s, defaultAccountId }))}
                placeholder="Selecione..."
                options={[
                  { value: "", label: "Selecione..." },
                  ...lookup.accounts.map((a) => ({ value: a.id, label: a.name })),
                ]}
              />
              <Select
                label="Centro de custo padrão"
                value={settings.defaultCostCenterId}
                onChange={(defaultCostCenterId) => setSettings((s) => ({ ...s, defaultCostCenterId }))}
                placeholder="Selecione..."
                options={[
                  { value: "", label: "Selecione..." },
                  ...lookup.costCenters.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              <Select
                label="Forma de pagamento padrão"
                value={settings.defaultPaymentMethodId}
                onChange={(defaultPaymentMethodId) => setSettings((s) => ({ ...s, defaultPaymentMethodId }))}
                placeholder="Selecione..."
                options={[
                  { value: "", label: "Selecione..." },
                  ...lookup.paymentMethods.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
              <div className="flex items-center gap-2 text-sm text-[#12261E]">
                <Checkbox
                  id="auto-generate-income"
                  checked={settings.autoGenerateOnAppointment}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, autoGenerateOnAppointment: checked }))
                  }
                />
                <label htmlFor="auto-generate-income" className="cursor-pointer">
                  Gerar receita automaticamente ao concluir atendimento
                </label>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={() => void saveSettings()} disabled={savingDefaults}>
                  {savingDefaults ? "Salvando..." : "Salvar padrões"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
              <DefaultField label="Conta padrão" value={accountName} />
              <DefaultField label="Centro de custo padrão" value={costCenterName} />
              <DefaultField label="Forma de pagamento padrão" value={paymentName} />
              <DefaultField
                label="Receita automática"
                value={settings.autoGenerateOnAppointment ? "Ativa" : "Inativa"}
                empty={!settings.autoGenerateOnAppointment}
              />
            </div>
          )}
        </section>
      )}

      {tab === "contas" && lookup && (
        <section className={card}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F6EE] text-[#006B4D]">
                <Landmark className="h-4 w-4" />
              </span>
              <h2 className="text-[16px] font-semibold text-[#12261E]">Contas bancárias</h2>
            </div>
            {lookup.accounts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllAccounts((v) => !v)}
                aria-expanded={showAllAccounts}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-[#006B4D] hover:bg-[#E8F6EE]"
              >
                <List className="h-4 w-4" />
                {showAllAccounts ? "Ver resumo" : "Ver todas"}
              </button>
            )}
          </div>

          {lookup.accounts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E4EBE6] px-4 py-6 text-sm text-[#6B7C74]">
              Nenhuma conta cadastrada. Adicione a primeira para lançar no caixa.
            </p>
          ) : (
            <AccountsSummary
              accounts={lookup.accounts}
              defaultAccountId={settings.defaultAccountId}
              expanded={showAllAccounts}
            />
          )}

          {(showAllAccounts || lookup.accounts.length === 0) && (
            <AddRow
              onSubmit={() =>
                addItem(
                  () => api.finance.createAccount({ name: newAccount.trim() }),
                  () => setNewAccount(""),
                  "Conta adicionada"
                )
              }
              disabled={adding || !newAccount.trim()}
              adding={adding}
            >
              <div className="min-w-0 flex-1">
                <Input
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  placeholder="Nome da nova conta"
                  aria-label="Nome da nova conta"
                />
              </div>
            </AddRow>
          )}
        </section>
      )}

      {tab === "categorias" && lookup && (
        <section className={card}>
          <div className="mb-4">
            <h2 className="text-[16px] font-semibold text-[#12261E]">Categorias financeiras</h2>
            <p className="mt-1 text-[13px] text-[#6B7C74]">
              Classifique cada lançamento. Receita e despesa não se misturam.
            </p>
          </div>

          {lookup.categories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E4EBE6] px-4 py-6 text-sm text-[#6B7C74]">
              Nenhuma categoria cadastrada. Crie receitas e despesas para organizar o extrato.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <CategoryColumn
                title="Despesas"
                items={expenseCategories}
                icon={ArrowDownRight}
                iconClass="bg-red-50 text-red-600"
              />
              <CategoryColumn
                title="Receitas"
                items={incomeCategories}
                icon={ArrowUpRight}
                iconClass="bg-[#E8F6EE] text-[#006B4D]"
              />
            </div>
          )}

          <AddRow
            onSubmit={() =>
              addItem(
                () => api.finance.createCategory({ name: newCategory.trim(), kind: categoryKind }),
                () => setNewCategory(""),
                "Categoria adicionada"
              )
            }
            disabled={adding || !newCategory.trim()}
            adding={adding}
          >
            <div className="min-w-0 flex-1">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nome da nova categoria"
                aria-label="Nome da nova categoria"
              />
            </div>
            <Select
              value={categoryKind}
              onChange={(value) => setCategoryKind(value as "INCOME" | "EXPENSE")}
              aria-label="Tipo da categoria"
              className="w-full sm:w-44"
              options={[
                { value: "INCOME", label: "Receita" },
                { value: "EXPENSE", label: "Despesa" },
              ]}
            />
          </AddRow>
        </section>
      )}

      {tab === "centros" && lookup && (
        <section className={cn(card, "w-full")}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F6EE] text-[#006B4D]">
                <Layers className="h-4 w-4" />
              </span>
              <h2 className="text-[16px] font-semibold text-[#12261E]">Centros de custo</h2>
            </div>
          </div>

          {lookup.costCenters.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E4EBE6] px-4 py-6 text-sm text-[#6B7C74]">
              Nenhum centro de custo. Cadastre áreas como Geral, Consultórios ou Administrativo.
            </p>
          ) : (
            <ul className="w-full overflow-hidden rounded-xl border border-[#E4EBE6]">
              {lookup.costCenters.map((center, index) => {
                const isDefault = center.id === settings.defaultCostCenterId
                return (
                  <li
                    key={center.id}
                    className={cn(
                      "flex w-full min-h-[64px] items-center gap-3 px-4 py-3",
                      index > 0 && "border-t border-[#E4EBE6]"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        COST_CENTER_ICON_STYLES[index % COST_CENTER_ICON_STYLES.length]
                      )}
                    >
                      <Building2 className="h-4 w-4" />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#12261E]">
                      {center.name}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      {isDefault ? (
                        <span className="text-[13px] font-medium text-[#006B4D]">Principal</span>
                      ) : !center.active ? (
                        <span className="text-[13px] text-[#6B7C74]">Inativo</span>
                      ) : null}
                      <ChevronRight className="h-4 w-4 text-[#C5D0CA]" aria-hidden />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <AddRow
            onSubmit={() =>
              addItem(
                () => api.finance.createCostCenter({ name: newCostCenter.trim() }),
                () => setNewCostCenter(""),
                "Centro de custo adicionado"
              )
            }
            disabled={adding || !newCostCenter.trim()}
            adding={adding}
          >
            <div className="min-w-0 flex-1">
              <Input
                value={newCostCenter}
                onChange={(e) => setNewCostCenter(e.target.value)}
                placeholder="Nome do novo centro de custo"
                aria-label="Nome do novo centro de custo"
              />
            </div>
          </AddRow>
        </section>
      )}

      {tab === "formas" && lookup && (
        <section className={cn(card, "w-full")}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F6EE] text-[#006B4D]">
                <Wallet className="h-4 w-4" />
              </span>
              <h2 className="text-[16px] font-semibold text-[#12261E]">Formas de pagamento</h2>
            </div>
          </div>

          {lookup.paymentMethods.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E4EBE6] px-4 py-6 text-sm text-[#6B7C74]">
              Nenhuma forma de pagamento. Cadastre Pix, cartão, dinheiro e as demais formas usadas na clínica.
            </p>
          ) : (
            <ul className="w-full overflow-hidden rounded-xl border border-[#E4EBE6]">
              {lookup.paymentMethods.map((method, index) => {
                const Icon = paymentMethodIcon(method.name)
                return (
                  <li
                    key={method.id}
                    className={cn(
                      "flex w-full min-h-[64px] items-center gap-3 px-4 py-3",
                      index > 0 && "border-t border-[#E4EBE6]"
                    )}
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F1F8] text-[#3D6A8A]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#12261E]">
                      {method.name}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 text-[13px] font-medium",
                        method.active ? "text-[#006B4D]" : "text-[#6B7C74]"
                      )}
                    >
                      {method.active ? "Ativa" : "Inativa"}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}

          {showAddPaymentMethod || lookup.paymentMethods.length === 0 ? (
            <AddRow
              onSubmit={() =>
                addItem(
                  () => api.finance.createPaymentMethod({ name: newPaymentMethod.trim() }),
                  () => {
                    setNewPaymentMethod("")
                    setShowAddPaymentMethod(false)
                  },
                  "Forma de pagamento adicionada"
                )
              }
              disabled={adding || !newPaymentMethod.trim()}
              adding={adding}
              label="Adicionar forma de pagamento"
            >
              <div className="min-w-0 flex-1">
                <Input
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  placeholder="Nome da nova forma de pagamento"
                  aria-label="Nome da nova forma de pagamento"
                />
              </div>
            </AddRow>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddPaymentMethod(true)}
              className="mt-4 inline-flex h-10 items-center gap-1.5 text-[13px] font-semibold text-[#006B4D] hover:underline"
            >
              <Plus className="h-4 w-4" />
              Adicionar forma de pagamento
            </button>
          )}
        </section>
      )}
    </SettingsLayout>
  )
}

function paymentMethodIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes("pix")) return QrCode
  if (n.includes("dinheiro")) return Banknote
  if (n.includes("transfer")) return ArrowLeftRight
  if (
    n.includes("crédito") ||
    n.includes("credito") ||
    n.includes("débito") ||
    n.includes("debito") ||
    n.includes("cartão") ||
    n.includes("cartao")
  ) {
    return CreditCard
  }
  return Wallet
}

function accountInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

const ACCOUNT_TILE_STYLES = [
  "bg-[#E8F6EE] text-[#006B4D]",
  "bg-[#EEF2F6] text-[#1E3A4C]",
  "bg-[#F6EEE8] text-[#8A4B2A]",
  "bg-[#F1EDF6] text-[#4C3A6B]",
]

function AccountsSummary({
  accounts,
  defaultAccountId,
  expanded,
}: {
  accounts: FinanceLookup["accounts"]
  defaultAccountId: string
  expanded: boolean
}) {
  const featured = accounts.find((account) => account.id === defaultAccountId) ?? accounts[0]
  const others = accounts.filter((account) => account.id !== featured.id)
  const visibleTiles = others.slice(0, 4)
  const extraCount = others.length - visibleTiles.length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 rounded-xl border border-[#E4EBE6] px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold text-[#12261E]">{featured.name}</p>
            {featured.id === defaultAccountId && (
              <span className="rounded-md bg-[#E8F6EE] px-2 py-0.5 text-[11px] font-semibold text-[#006B4D]">
                Padrão
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] text-[#6B7C74]">
            Saldo inicial {formatBRL(featured.initialBalance)}
            {featured.active ? "" : " · Inativa"}
          </p>
        </div>

        {others.length > 0 && (
          <div className="flex shrink-0 items-center gap-2" aria-label="Outras contas">
            {visibleTiles.map((account, index) => (
              <span
                key={account.id}
                title={account.name}
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-xl text-[12px] font-semibold",
                  ACCOUNT_TILE_STYLES[index % ACCOUNT_TILE_STYLES.length]
                )}
              >
                {accountInitials(account.name)}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F7F5] text-[12px] font-semibold text-[#6B7C74]">
                +{extraCount}
              </span>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <ul className="divide-y divide-[#E4EBE6] rounded-xl border border-[#E4EBE6]">
          {accounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-medium text-[#12261E]">{account.name}</p>
                  {account.id === defaultAccountId && (
                    <span className="rounded-md bg-[#E8F6EE] px-2 py-0.5 text-[11px] font-semibold text-[#006B4D]">
                      Padrão
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#6B7C74]">Saldo inicial {formatBRL(account.initialBalance)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const COST_CENTER_ICON_STYLES = [
  "bg-[#EDE7F6] text-[#6D4C9A]",
  "bg-[#E8F1F8] text-[#3D6A8A]",
  "bg-[#E8F6EE] text-[#006B4D]",
]

function DefaultField({
  label,
  value,
  empty,
}: {
  label: string
  value: string
  empty?: boolean
}) {
  const isEmpty = empty || !value
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-semibold text-[#12261E]">{label}</p>
      <div className="mt-2">
        <ValueChip empty={isEmpty}>{isEmpty ? "Não definido" : value}</ValueChip>
      </div>
    </div>
  )
}

function CategoryColumn({
  title,
  items,
  icon: Icon,
  iconClass,
}: {
  title: string
  items: FinanceLookup["categories"]
  icon: LucideIcon
  iconClass: string
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-[#12261E]">{title}</p>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#E4EBE6] px-4 py-6 text-sm text-[#6B7C74]">
          Nenhuma categoria nesta coluna.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-xl border border-[#E4EBE6] px-3 py-2.5">
              <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full", iconClass)}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-[#12261E]">{item.name}</p>
                <p className="text-[12px] text-[#6B7C74]">{item.kind === "INCOME" ? "Receita" : "Despesa"}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AddRow({
  children,
  onSubmit,
  disabled,
  adding,
  label = "Adicionar",
}: {
  children: ReactNode
  onSubmit: () => void
  disabled: boolean
  adding: boolean
  label?: string
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!disabled) onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 border-t border-[#E4EBE6] pt-4 sm:flex-row sm:items-end">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">{children}</div>
      <Button type="submit" variant="outline" disabled={disabled} className="shrink-0">
        <Plus className="h-4 w-4" />
        {adding ? "Adicionando..." : label}
      </Button>
    </form>
  )
}
