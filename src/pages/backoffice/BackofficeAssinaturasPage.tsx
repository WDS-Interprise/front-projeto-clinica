import { useEffect, useState } from "react"

import { Link } from "react-router-dom"

import { CreditCard, Search } from "lucide-react"

import { backofficeApi } from "@/services/backoffice-api"

import { useToast } from "@/context/ToastContext"

import { toastMessageFromApiError } from "@/lib/api-errors"

import { SubscriptionStatusBadge } from "@/components/billing/PlanBadges"

import { Button } from "@/components/ui/button"

import { Modal } from "@/components/ui/modal"



const filters = [

  { id: "ALL", label: "Todos" },

  { id: "TRIAL", label: "Trial" },

  { id: "ACTIVE", label: "Ativos" },

  { id: "PAST_DUE", label: "Em atraso" },

  { id: "SUSPENDED", label: "Suspensos" },

  { id: "CANCELLED", label: "Cancelados" },

]



function formatMoney(v: number) {

  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

}



function formatDate(iso: string | null) {

  if (!iso) return "-"

  return new Date(iso).toLocaleDateString("pt-BR")

}



export default function BackofficeAssinaturasPage() {

  const { toast } = useToast()

  const [rows, setRows] = useState<any[]>([])

  const [plans, setPlans] = useState<any[]>([])

  const [status, setStatus] = useState("ALL")

  const [search, setSearch] = useState("")

  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState<any | null>(null)

  const [planModalOpen, setPlanModalOpen] = useState(false)

  const [newPlanId, setNewPlanId] = useState("")

  const [newCycle, setNewCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY")

  const [courtesyDays, setCourtesyDays] = useState(30)



  const load = () => {

    setLoading(true)

    backofficeApi.subscriptions

      .list({ status, search: search || undefined })

      .then(setRows)

      .catch((err: unknown) => toast(toastMessageFromApiError(err, "Erro ao carregar assinaturas"), "error"))

      .finally(() => setLoading(false))

  }



  useEffect(() => {

    load()

  }, [status])



  useEffect(() => {

    backofficeApi.plans.list().then(setPlans).catch(() => setPlans([]))

  }, [])



  const action = async (fn: () => Promise<unknown>, msg: string) => {

    try {

      await fn()

      toast(msg)

      load()

      if (selected) {

        const updated = await backofficeApi.subscriptions.get(selected.id)

        setSelected(updated)

      }

    } catch (err: unknown) {

      toast(toastMessageFromApiError(err, "Erro na operação"), "error")

    }

  }



  const openChangePlan = () => {

    if (!selected) return

    setNewPlanId(selected.planId)

    setNewCycle(selected.billingCycle ?? "MONTHLY")

    setPlanModalOpen(true)

  }



  const confirmChangePlan = async () => {

    if (!selected || !newPlanId) return

    await action(

      () => backofficeApi.subscriptions.changePlan(selected.id, { planId: newPlanId, billingCycle: newCycle }),

      "Plano alterado"

    )

    setPlanModalOpen(false)

  }



  const grantCourtesy = async () => {

    if (!selected) return

    const until = new Date()

    until.setDate(until.getDate() + courtesyDays)

    await action(

      () => backofficeApi.subscriptions.grantCourtesy(selected.id, until.toISOString()),

      `Cortesia concedida por ${courtesyDays} dias`

    )

  }



  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-2xl font-bold text-[#12261E]">Assinaturas</h1>

        <p className="mt-1 text-sm text-[#6B7C74]">Planos, trials e renovações das clínicas.</p>

      </div>



      <div className="flex flex-wrap items-center gap-3">

        <div className="relative flex-1 min-w-[200px] max-w-md">

          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9A90]" />

          <input

            className="h-10 w-full rounded-lg border border-[#E4EBE6] pl-10 pr-3 text-sm"

            placeholder="Buscar clínica..."

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            onKeyDown={(e) => e.key === "Enter" && load()}

          />

        </div>

        <div className="flex flex-wrap gap-1">

          {filters.map((f) => (

            <button

              key={f.id}

              type="button"

              onClick={() => setStatus(f.id)}

              className={`rounded-full px-3 py-1.5 text-xs font-medium ${status === f.id ? "bg-[#E8F6EE] text-[#006B4D]" : "bg-white text-[#6B7C74] border border-[#E4EBE6]"}`}

            >

              {f.label}

            </button>

          ))}

        </div>

      </div>



      <div className="grid gap-4 lg:grid-cols-3">

        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-[#E4EBE6] bg-white">

          {loading ? (

            <p className="p-6 text-sm text-[#6B7C74]">Carregando...</p>

          ) : rows.length === 0 ? (

            <div className="p-8 text-center">

              <CreditCard className="mx-auto h-10 w-10 text-[#8A9A90]" />

              <p className="mt-2 text-sm text-[#6B7C74]">Nenhuma assinatura encontrada.</p>

            </div>

          ) : (

            <table className="w-full text-sm">

              <thead className="bg-[#F4F7F5] text-left text-xs uppercase text-[#8A9A90]">

                <tr>

                  <th className="px-4 py-3">Clínica</th>

                  <th className="px-4 py-3">Plano</th>

                  <th className="px-4 py-3">Status</th>

                  <th className="px-4 py-3">Valor</th>

                </tr>

              </thead>

              <tbody>

                {rows.map((row) => (

                  <tr

                    key={row.id}

                    className="cursor-pointer border-t border-[#E4EBE6] hover:bg-[#FAFCFB]"

                    onClick={() => setSelected(row)}

                  >

                    <td className="px-4 py-3 font-medium text-[#12261E]">

                      <Link to={`/backoffice/clinicas/${row.clinicId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>

                        {row.clinicName ?? row.clinicId}

                      </Link>

                    </td>

                    <td className="px-4 py-3">{row.planName}</td>

                    <td className="px-4 py-3">

                      <SubscriptionStatusBadge status={row.status} />

                    </td>

                    <td className="px-4 py-3">{formatMoney(row.price)}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>



        <div className="rounded-xl border border-[#E4EBE6] bg-white p-5">

          {!selected ? (

            <p className="text-sm text-[#6B7C74]">Selecione uma assinatura para ver detalhes e ações.</p>

          ) : (

            <div className="space-y-4">

              <div>

                <h2 className="font-bold text-[#12261E]">{selected.clinicName}</h2>

                <p className="text-sm text-[#6B7C74]">{selected.planName}</p>

                <div className="mt-2">

                  <SubscriptionStatusBadge status={selected.status} />

                </div>

              </div>

              <dl className="space-y-2 text-sm">

                <div className="flex justify-between">

                  <dt className="text-[#8A9A90]">Ciclo</dt>

                  <dd>{selected.billingCycle === "ANNUAL" ? "Anual" : "Mensal"}</dd>

                </div>

                <div className="flex justify-between">

                  <dt className="text-[#8A9A90]">Trial até</dt>

                  <dd>{formatDate(selected.trialEndsAt)}</dd>

                </div>

                <div className="flex justify-between">

                  <dt className="text-[#8A9A90]">Próxima cobrança</dt>

                  <dd>{formatDate(selected.nextBillingAt)}</dd>

                </div>

                <div className="flex justify-between">

                  <dt className="text-[#8A9A90]">Último pagamento</dt>

                  <dd>{formatDate(selected.lastPaymentAt)}</dd>

                </div>

              </dl>

              <div className="flex flex-wrap gap-2">

                <Button size="sm" variant="outline" onClick={openChangePlan}>

                  Alterar plano

                </Button>

                <Button size="sm" variant="outline" onClick={() => action(() => backofficeApi.subscriptions.extendTrial(selected.id, 7), "Trial estendido 7 dias")}>

                  +7 dias trial

                </Button>

                <Button size="sm" variant="outline" onClick={grantCourtesy}>

                  Cortesia {courtesyDays}d

                </Button>

                <Button size="sm" variant="outline" onClick={() => action(() => backofficeApi.subscriptions.createInvoice(selected.id), "Cobrança gerada")}>

                  Gerar cobrança

                </Button>

                <Button size="sm" variant="outline" onClick={() => action(() => backofficeApi.subscriptions.suspend(selected.id), "Assinatura suspensa")}>

                  Suspender

                </Button>

                <Button size="sm" variant="outline" onClick={() => action(() => backofficeApi.subscriptions.reactivate(selected.id), "Assinatura reativada")}>

                  Reativar

                </Button>

                <Button size="sm" variant="outline" className="text-red-600" onClick={() => action(() => backofficeApi.subscriptions.cancel(selected.id, true), "Cancelamento agendado")}>

                  Cancelar

                </Button>

              </div>

              <div className="pt-2 border-t border-[#E4EBE6]">

                <label className="text-xs text-[#8A9A90]">Dias de cortesia</label>

                <input

                  type="number"

                  min={1}

                  max={365}

                  value={courtesyDays}

                  onChange={(e) => setCourtesyDays(Number(e.target.value) || 30)}

                  className="mt-1 h-9 w-full rounded-lg border border-[#E4EBE6] px-3 text-sm"

                />

              </div>

            </div>

          )}

        </div>

      </div>



      <Modal open={planModalOpen} onClose={() => setPlanModalOpen(false)} title="Alterar plano">

        <div className="space-y-4">

          <div>

            <label className="text-sm font-medium text-[#12261E]">Plano</label>

            <select

              className="mt-1 h-10 w-full rounded-lg border border-[#E4EBE6] px-3 text-sm"

              value={newPlanId}

              onChange={(e) => setNewPlanId(e.target.value)}

            >

              {plans.map((p) => (

                <option key={p.id} value={p.id}>

                  {p.name} ({formatMoney(p.monthlyPrice)}/mês)

                </option>

              ))}

            </select>

          </div>

          <div>

            <label className="text-sm font-medium text-[#12261E]">Ciclo</label>

            <select

              className="mt-1 h-10 w-full rounded-lg border border-[#E4EBE6] px-3 text-sm"

              value={newCycle}

              onChange={(e) => setNewCycle(e.target.value as "MONTHLY" | "ANNUAL")}

            >

              <option value="MONTHLY">Mensal</option>

              <option value="ANNUAL">Anual</option>

            </select>

          </div>

          <div className="flex justify-end gap-2">

            <Button variant="outline" onClick={() => setPlanModalOpen(false)}>

              Cancelar

            </Button>

            <Button onClick={confirmChangePlan}>Confirmar</Button>

          </div>

        </div>

      </Modal>

    </div>

  )

}

