import { useState } from "react"

import { cn } from "@/lib/utils"

import { PlanUsagePanel } from "@/components/billing/PlanUsage"

import { SubscriptionStatusBadge, BillingStatusBadge } from "@/components/billing/PlanBadges"



const tabs = [

  { id: "overview", label: "Visão geral" },

  { id: "subscription", label: "Assinatura" },

  { id: "usage", label: "Uso e limites" },

  { id: "integrations", label: "Integrações" },

] as const



type TabId = (typeof tabs)[number]["id"]



function formatMoney(v: number) {

  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

}



export default function ClinicDetailTabs({ detail }: { detail: any }) {

  const [tab, setTab] = useState<TabId>("overview")

  const sub = detail.subscription



  return (

    <div>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-[#E4EBE6] pb-2">

        {tabs.map((t) => (

          <button

            key={t.id}

            type="button"

            onClick={() => setTab(t.id)}

            className={cn(

              "rounded-lg px-3 py-1.5 text-sm font-medium",

              tab === t.id ? "bg-[#E8F6EE] text-[#006B4D]" : "text-[#6B7C74] hover:bg-[#F4F7F5]"

            )}

          >

            {t.label}

          </button>

        ))}

      </div>



      {tab === "overview" && (

        <div className="space-y-4">

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {[

              ["Usuários", detail.counts.users],

              ["Pacientes", detail.counts.patients],

              ["Profissionais", detail.counts.doctors],

              ["Consultas", detail.counts.appointments],

            ].map(([label, value]) => (

              <div key={String(label)} className="rounded-xl border border-[#E4EBE6] bg-white p-4">

                <p className="text-xs text-[#8A9A90]">{label}</p>

                <p className="text-2xl font-bold text-[#12261E]">{value}</p>

              </div>

            ))}

          </div>

          {sub && (

            <div className="rounded-xl border border-[#E4EBE6] bg-white p-4 text-sm flex flex-wrap items-center gap-3">

              <span className="text-[#8A9A90]">Plano:</span>

              <span className="font-semibold">{sub.planName}</span>

              <SubscriptionStatusBadge status={sub.status} />

            </div>

          )}

        </div>

      )}



      {tab === "subscription" && (

        !sub ? (

          <p className="text-sm text-[#6B7C74]">Sem assinatura vinculada.</p>

        ) : (

          <div className="space-y-4">

            <div className="rounded-xl border border-[#E4EBE6] bg-white p-5 text-sm space-y-2">

              <p>

                <span className="text-[#8A9A90]">Plano:</span> {sub.planName}

              </p>

              <p>

                <span className="text-[#8A9A90]">Preço:</span> {formatMoney(sub.price)} (

                {sub.billingCycle === "ANNUAL" ? "anual" : "mensal"})

              </p>

              <p>

                <span className="text-[#8A9A90]">Status:</span>{" "}

                <SubscriptionStatusBadge status={sub.status} />

              </p>

              <p>

                <span className="text-[#8A9A90]">Trial até:</span>{" "}

                {sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString("pt-BR") : "-"}

              </p>

              <p>

                <span className="text-[#8A9A90]">Próxima cobrança:</span>{" "}

                {sub.nextBillingAt ? new Date(sub.nextBillingAt).toLocaleDateString("pt-BR") : "-"}

              </p>

            </div>

            {detail.recentInvoices?.length > 0 && (

              <div className="rounded-xl border border-[#E4EBE6] bg-white p-5">

                <h3 className="font-semibold text-[#12261E] mb-3">Histórico de cobranças</h3>

                <table className="w-full text-sm">

                  <thead>

                    <tr className="text-left text-xs text-[#8A9A90]">

                      <th className="pb-2">Vencimento</th>

                      <th className="pb-2">Valor</th>

                      <th className="pb-2">Status</th>

                    </tr>

                  </thead>

                  <tbody>

                    {detail.recentInvoices.map((inv: any) => (

                      <tr key={inv.id} className="border-t border-[#EEF2EF]">

                        <td className="py-2">{new Date(inv.dueDate).toLocaleDateString("pt-BR")}</td>

                        <td className="py-2">{formatMoney(inv.amount)}</td>

                        <td className="py-2">

                          <BillingStatusBadge status={inv.status} />

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        )

      )}



      {tab === "usage" && (

        <div className="rounded-xl border border-[#E4EBE6] bg-white p-5">

          <PlanUsagePanel usage={detail.usage} />

        </div>

      )}



      {tab === "integrations" && (

        <div className="rounded-xl border border-[#E4EBE6] bg-white p-5 space-y-3 text-sm">

          <p>WhatsApp: {detail.integrations.whatsapp.length} conexão(ões)</p>

          <ul className="ml-4 list-disc text-[#6B7C74]">

            {detail.integrations.whatsapp.map((w: any) => (

              <li key={w.id}>{w.name ?? w.id}: {w.status}</li>

            ))}

          </ul>

          <p>

            ClinMax Pay:{" "}

            {detail.integrations.clinmaxPay

              ? detail.integrations.clinmaxPay.enabled

                ? "Ativo"

                : "Cadastrado"

              : "Não configurado"}

          </p>

          <p>IA WhatsApp: {detail.integrations.ai ? "Habilitada" : "Desabilitada"}</p>

        </div>

      )}

    </div>

  )

}


