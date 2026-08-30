# Asaas no ClinMax: estado atual

**Última revisão:** 30/08/2026

Este texto descreve o que o código faz hoje, o que a clínica vê na tela e o que ainda não foi testado em suite. Não mistura os dois Asaas.

Há **dois fluxos Asaas separados**, na **mesma conta da plataforma**:

1. **Assinatura SaaS:** a clínica paga o ClinMax para usar o software.
2. **ClinMax Pay:** o paciente paga a consulta. A plataforma retém taxa e transfere o resto para a chave Pix da clínica.

A mensalidade **não** entra no extrato de Gestão. O Pix da consulta **não** paga o plano do software.

---

## 1. Assinatura SaaS (clínica paga o ClinMax)

### 1.1 Planos

| Plano | Mensal | Anual | Papel |
|---|---:|---:|---|
| Essencial | R$ 99 | R$ 990 | Plano inicial. Agenda, pacientes, prontuário, prescrições. |
| Profissional | R$ 199 | R$ 1.990 | Primeiro upgrade pago. Financeiro, WhatsApp, ClinMax Pay, IA assistiva. |
| Premium | R$ 349 | R$ 3.490 | Segundo upgrade pago. WhatsApp com IA, automações, estoque, TISS. |
| Legacy | R$ 0 | R$ 0 | Interno. Clínicas antigas. Todos os recursos, sem cobrança. |

Catálogo: `back-projeto-clinica/src/lib/plan-catalog.ts`. Autoridade em runtime: tabela `Plan`. Seed reaplica quando `catalogVersion` está abaixo de `PLAN_CATALOG_VERSION` (hoje 4).

### 1.2 Cadastro

Toda clínica nova entra no **Essencial**, status `ACTIVE`, com primeira fatura PENDING e `currentPeriodEnd`. O slug da landing (`?plan=` / `planSlug`) vira `requestedPlanSlug` e segue para o checkout após o onboarding.

A clínica usa na hora: agenda, pacientes, prontuário e prescrições. WhatsApp, financeiro e ClinMax Pay ficam no Profissional.

Não há trial de 14 dias nos planos comerciais (`trialDays: 0`).

Clínica criada no backoffice também nasce no Essencial. Clínica antiga sem assinatura continua Legacy.

### 1.3 Escada de upgrade (self-serve)

Só vale o **próximo** plano, e só depois de pagar:

- Essencial → Profissional (Pix ou cartão). O plano novo entra no webhook de pagamento. O Essencial segue ativo até lá.
- Profissional → Premium (igual).
- Essencial → Premium: **bloqueado** no backend (`PLAN_UPGRADE_NOT_SEQUENTIAL`) e na UI.

Downgrade aplica na hora. A diferença já paga não é reembolsada.

O backoffice pode pular a escada (`allowNonSequential: true`).

Checkout: `/checkout?plan=...&cycle=...`. Tela da clínica: Configurações → Plano e assinatura.

### 1.4 Como a clínica paga o plano

- **Upgrade:** gera `SubscriptionInvoice` com referência `upgrade:{planId}:{ciclo}`. Pix mostra QR no checkout. Cartão de crédito tenta cobrar na hora. Débito abre a fatura Asaas.
- **Renovação mensal/anual:** no primeiro pagamento PAID o backend chama `syncAsaasSubscription` e cria a recorrência Asaas. Fallback local no job se não houver `asaasSubscriptionId`.
- Lifecycle de trial/suspensão roda no **boot** e a cada 15 minutos.
- Login nunca é bloqueado por inadimplência. Some feature gated.

### 1.5 O que não está pronto no SaaS

- Proration e downgrade só no fim do ciclo.
- Snapshot rico da fatura (nome/ciclo/período).
- Testes de integração com banco Asaas sandbox.

---

## 2. ClinMax Pay (paciente paga a consulta)

Produto de processamento. A cobrança Pix nasce na **conta Asaas da plataforma**, não numa wallet da clínica.

### 2.1 Taxa da plataforma (não é Split API)

**Sim: a plataforma fica com uma porcentagem.** Padrão **5%** (`CLINMAX_PAY_FEE_PERCENT` e `ClinicPixRecipient.platformFeePercent`).

Isso **não** usa a Split API do Asaas. Não há `walletId` nem campo `split` no pagamento. O fluxo é:

1. Paciente paga Pix na conta ClinMax.
2. Asaas avisa `PAYMENT_RECEIVED`.
3. O backend calcula:

```
gatewayFee = bruto - líquido Asaas (netValue)
platformFee = round(líquido × taxa% / 100)
clinicShare = líquido - platformFee
compensation = min(débito pendente de estorno, clinicShare)
clinicPayoutAmount = clinicShare - compensation
```

4. `POST /v3/transfers` com `operationType: PIX` para a chave cadastrada da clínica.
5. Webhook `TRANSFER_*` marca `PlatformPayout` como pago e lança receita no extrato (`recordClinicIncome`).

Regra crítica: repasse **só** em `PAYMENT_RECEIVED`, nunca em `PAYMENT_CONFIRMED`.

Estorno depois do repasse aumenta `outstandingDebit` e desconta no próximo Pix.

Cartão **não** existe no ClinMax Pay. Cartão no Asaas é só checkout SaaS.

### 2.2 Foi testado?

Há testes unitários de taxa 5% no líquido, compensação de débito, chave `originKey`, token do webhook e roteamento Pay vs SaaS (`npm test` no backend). Não há suite ponta a ponta documentada contra o Asaas sandbox/produção.

### 2.3 Saque

**Não há botão de saque.** Não há wallet Asaas da clínica.

O “saque” do produto é o **repasse automático** depois do Pix do paciente. A clínica cadastra a chave em Configurações → Financeiro → Recebimentos (`ClinmaxPaySettingsCard`).

A transferência do livro-caixa (tipo `TRANSFER`) é só entre contas internas da clínica. Não mexe no Asaas.

---

## 3. Fluxo diário: clínica cobrando o paciente

### 3.1 O que o backend espera

1. Consulta criada → `AppointmentBilling` `PENDING` com o valor dos procedimentos.
2. Clínica ativa ClinMax Pay e informa chave Pix (tipo, titular, documento).
3. Alguém com `finance:operational` ou `finance:manage` chama `POST /api/appointments/:id/charge`.
4. Se o Pay estiver desligado ou o Pix não verificado: `{ mode: "local" }` (sem QR).
5. Se o Pay estiver ligado: customer Asaas + Pix + QR + `PlatformPayment`.
6. Paciente paga → webhook → taxa 5% → Pix de repasse → extrato.

Recebimento manual: `POST /api/appointments/:id/receipt` marca a consulta como recebida e cria receita no extrato (idempotente via `originKey`).

### 3.2 O que a clínica consegue fazer na UI hoje

- Configurar Pix e ver a taxa em Recebimentos.
- Lançar receita, despesa e transferência no livro-caixa. Alterar status e cancelar lançamento.
- No detalhe da consulta: valor, status, Cobrar, Receber, QR Pix real e Pix copia e cola.

### 3.3 Agenda

Cobrança real vive no detalhe da consulta. Não há URL fake `pay.clinichub.local`.

---

## 4. Mapa rápido de arquivos

### SaaS

- `back-projeto-clinica/src/lib/plan-catalog.ts`
- `back-projeto-clinica/src/lib/saas-billing-seed.ts`
- `back-projeto-clinica/src/services/subscription.service.ts`
- `back-projeto-clinica/src/services/subscription-billing.service.ts`
- `back-projeto-clinica/src/lib/asaas.client.ts`
- `front-projeto-clinica/src/pages/checkout/CheckoutPage.tsx`
- `front-projeto-clinica/src/pages/configuracoes/PlanoAssinaturaPage.tsx`

### ClinMax Pay

- `back-projeto-clinica/src/services/clinmax-pay.service.ts`
- `back-projeto-clinica/src/controllers/clinmax-pay.controller.ts`
- `front-projeto-clinica/src/components/settings/ClinmaxPaySettingsCard.tsx`
- Webhook único: `POST /api/webhooks/asaas` (roteia Pay vs SaaS)

Inventário mais longo do livro-caixa: `docs/financeiro.md`. Catálogo comercial: `docs/planos.md`.

---

## 5. Checklist mental

- Dois dinheiros Asaas. Não misturar.
- Cadastro = Essencial, na hora, com fatura PENDING.
- Subir de plano = só o próximo, só depois de pagar.
- 5% da consulta fica com a plataforma, sobre o líquido. Não é Split API.
- Sem saque manual. Só repasse Pix automático.
- Agenda mostra QR real e recebimento manual no extrato.
- Recorrência da mensalidade nasce no primeiro pagamento.
