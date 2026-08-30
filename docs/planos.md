# Planos ClinMax

Documentação dos planos comerciais da plataforma ClinMax, seus benefícios, limites, regras de acesso e cobrança.

**Última revisão:** 30/08/2026

Esta página separa o que já está no código (`IMPLEMENTADO`) do que ainda é intenção de produto (`PLANEJADO`).

## 1. Resumo

Os planos são assinaturas SaaS pagas pela clínica para usar o ClinMax. Esse pagamento é separado:

- do livro-caixa da clínica;
- do ClinMax Pay, usado para o paciente pagar uma consulta;
- das permissões internas dos usuários da clínica.

O catálogo comercial default vive em `back-projeto-clinica/src/lib/plan-catalog.ts`. O banco (`Plan`) é a autoridade em runtime. A landing consome `GET /api/public/plans`. O seed reaplica o pacote oficial quando `PlatformSettings.settingsJson.catalogVersion` está abaixo de `PLAN_CATALOG_VERSION`.

## 2. Planos comerciais (IMPLEMENTADO)

| Plano | Mensal | Anual | Equivalente mensal no anual | Indicado para |
|---|---:|---:|---:|---|
| Essencial | R$ 99 | R$ 990 | R$ 82,50/mês (cobrado anualmente) | Profissional individual ou consultório pequeno |
| Profissional | R$ 199 | R$ 1.990 | R$ 165,83/mês (cobrado anualmente) | Clínicas em crescimento. Primeiro upgrade pago |
| Premium | R$ 349 | R$ 3.490 | R$ 290,83/mês (cobrado anualmente) | Automação, IA operacional e escala |

O anual equivale a dez mensalidades (dois meses de economia). **Não há trial gratuito.** Cadastro novo entra no **Essencial**, status `ACTIVE`, com primeira fatura PENDING e ciclo mensal. O slug da landing vira intenção (`requestedPlanSlug`) e segue para o checkout. Para subir, só vale o próximo plano, e só depois do pagamento (Essencial → Profissional → Premium).

## 3. Benefícios e limites (IMPLEMENTADO)

### Essencial

Objetivo: operação clínica básica.

Inclui: painel, agenda, pacientes, prontuário, prescrições, medicamentos, bulas e CID.

Não inclui: WhatsApp, financeiro, ClinMax Pay, IA, TISS, estoque, automações.

| Recurso | Limite |
|---|---:|
| Usuários | 3 |
| Profissionais | 1 |
| WhatsApps | 0 |
| IA assistiva / mês | 0 |
| Ações automáticas IA / mês | 0 |
| Armazenamento | 2 GB |

### Profissional

Inclui o Essencial, mais financeiro, ClinMax Pay, WhatsApp, relatórios, pesquisa de satisfação, multi-profissional e IA assistiva (feature `AI_ASSISTANT`). Não inclui WhatsApp com IA.

| Recurso | Limite |
|---|---:|
| Usuários | 10 |
| Profissionais | 3 |
| WhatsApps | 1 |
| IA assistiva / mês | 300 |
| Ações automáticas IA / mês | 0 |
| Armazenamento | 10 GB |

### Premium

Inclui o Profissional, mais WhatsApp com IA, automações, estoque, TISS, relatórios avançados e maior capacidade.

| Recurso | Limite |
|---|---:|
| Usuários | 30 |
| Profissionais | 5 |
| WhatsApps | 3 |
| IA assistiva / mês | 5.000 |
| Ações automáticas IA / mês | 2.000 |
| Armazenamento | 50 GB |

Premium não é ilimitado. Legacy continua ilimitado.

`Suporte prioritário` aparece na landing como texto comercial. Não existe fila de suporte no backend (`PLANEJADO`).

## 4. IA assistiva vs operacional (IMPLEMENTADO conceitualmente)

| Tipo | Feature | Limite | Onde existe hoje |
|---|---|---|---|
| IA assistiva | `AI_ASSISTANT` | `maxAiAssistantMessagesPerMonth` | Profissional e Premium. Ainda não há produto interno de resumo/sugestão ligado a esse consumo |
| IA operacional | `WHATSAPP_AI` + `AUTOMATIONS` | `maxAiAutomationActionsPerMonth` + mensagens | WhatsApp com IA no Premium |

Colunas antigas no JSON (`maxAiMessagesPerMonth`, `maxAiActionsPerMonth`) e no banco (`aiMessagesCount`, `aiActionsCount`) foram mantidas. Não houve rename destrutivo.

## 5. ClinMax Pay e TISS

**IMPLEMENTADO:** ClinMax Pay (`CLINMAX_PAY`) está no Profissional e no Premium. O módulo operacional de Pix do paciente não mudou. A diferença de taxa entre planos é `PLANEJADO`.

**IMPLEMENTADO (temporário):** TISS continua só no Premium, porque o módulo já está gated por essa feature.

**PLANEJADO:** TISS como add-on, independente do tamanho do plano.

## 6. Cadastro e trial

Nova clínica:

1. cria assinatura no **Essencial**;
2. guarda `requestedPlanSlug` da landing (não ativa esse plano);
3. status `ACTIVE`, `trialDays: 0`, primeira fatura PENDING, `currentPeriodEnd` em 1 mês.

Trial de 14 dias **não** está ativo nos planos comerciais. O status `TRIAL` ainda existe no modelo para cortesia/legado.

**IMPLEMENTADO:** se a fatura vencer, `PAST_DUE`, grace de 3 dias, depois `SUSPENDED` comercial. Recorrência Asaas no primeiro pagamento. Job a cada 15 minutos.

## 7. Legacy (IMPLEMENTADO)

Interno, não público, R$ 0, todos os recursos, limites ilimitados. Clínicas antigas sem assinatura continuam Legacy. Não há migração automática para plano pago.

## 8. Status e acesso (IMPLEMENTADO)

| Status | Regra |
|---|---|
| `TRIAL` | Acesso até o fim do trial |
| `ACTIVE` | Acesso normal |
| `PAST_DUE` | Acesso no grace de 3 dias |
| `SUSPENDED` / `CANCELLED` / `EXPIRED` | Features gated bloqueadas |

Cortesia (`courtesyUntil`) prevalece. Login nunca é bloqueado. `/configuracoes/plano` não usa `PlanFeatureRoute`. Agenda, pacientes e prontuário não são gated por plano (só módulos como WhatsApp, financeiro, TISS, etc.).

## 9. Cobrança (IMPLEMENTADO)

Upgrade self-serve gera Pix ou cartão no checkout (`/checkout`). O plano novo só entra no webhook pago. O backoffice ainda pode gerar Pix via Asaas ou cobrança `MANUAL`.

A fatura grava `amount` no momento da emissão. Preço atual do plano não reescreve faturas antigas. Snapshot de nome/ciclo/período na fatura é `PLANEJADO`.

`syncAsaasSubscription` é chamado no primeiro pagamento PAID. Recorrência Asaas passa a existir depois disso.

Estado ponta a ponta do Asaas: `docs/asaas-estado-atual.md`.

## 10. Troca de plano

**ESTADO ATUAL:** self-serve só sobe um degrau por vez, com pagamento. Downgrade aplica na hora, sem reembolso. Backoffice pode pular a escada.

**DESEJADO (PLANEJADO):** proration; downgrade só no fim do ciclo; excesso de profissionais gera aviso, sem exclusão.

## 11. Add-ons (PLANEJADO)

Modelo conceitual já previsto no código via `mergeEntitlementLimits(plano, addons, overrides)`:

```
entitlement base + add-ons + cortesias = entitlement efetivo
```

Exemplos futuros: profissional adicional (+R$ 49/mês), WhatsApp extra, pacote de IA, armazenamento, TISS, módulos. Não há tabelas de add-on nem cobrança de extra nesta entrega.

## 12. Landing (IMPLEMENTADO)

Cards no visual original da landing, com catálogo oficial:

- Essencial R$ 99/mês
- Profissional R$ 199/mês (Mais escolhido)
- Premium R$ 349/mês

Toggle mensal/anual, equivalente mensal só como referência quando anual, tabela "Comparar todos os recursos" derivada dos entitlements reais.

## 13. Lifecycle (IMPLEMENTADO)

`runSubscriptionLifecycle()` roda no boot da API e no scheduler a cada 15 minutos (trials, vencimentos, grace, suspensão, renovação local se não houver assinatura Asaas).

## 14. O que já funciona

- catálogo único no backend;
- API pública de planos;
- landing alinhada a preços e benefícios oficiais;
- cadastro no Essencial, com primeira fatura;
- upgrade self-serve só para o próximo plano, com Pix ou cartão;
- checkout em `/checkout`;
- limites finitos no Premium;
- ClinMax Pay no Profissional;
- tela da clínica com uso em linguagem clara;
- backoffice de planos, assinaturas e cobranças;
- Legacy preservado.

## 15. Pendências (PLANEJADO)

- proration e downgrade só no fim do ciclo;
- marketplace de add-ons e profissional adicional cobrado;
- TISS como módulo avulso;
- produto de IA assistiva interno consumindo o limite do Profissional;
- snapshot completo na fatura.

## 16. Arquivos relacionados

### Frontend

- `src/pages/LandingPage.tsx`
- `src/pages/checkout/CheckoutPage.tsx`
- `src/lib/landing-content.ts`
- `src/pages/configuracoes/PlanoAssinaturaPage.tsx`
- `src/lib/plan-features.ts`
- `src/hooks/useClinicPlan.ts`

### Backend

- `src/lib/plan-catalog.ts`
- `src/lib/saas-billing-seed.ts`
- `src/lib/plan-features.ts`
- `src/lib/plan-entitlements.ts`
- `src/services/plan.service.ts`
- `src/routes/public-plans.routes.ts`
- `prisma/schema.prisma`
