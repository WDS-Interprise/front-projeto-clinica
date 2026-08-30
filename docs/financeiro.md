# Financeiro ClinMax: inventário completo

Documentação ponta a ponta do módulo financeiro: lógicas, funções, telas, APIs, modelos de dados, permissões, fluxos reais em terceira pessoa e o que ainda é placeholder.

**Última revisão:** 30/08/2026

---

## Estado atual (resumo)

Há **três dinheiros** distintos. Não misturar.

| Fluxo | Quem paga | Onde a clínica vê | Status hoje |
|-------|-----------|-------------------|-------------|
| Livro-caixa da operação | Paciente / convênio para a clínica | Gestão → Finanças | **Funciona** (lançamento manual, transferência, Pix ClinMax Pay e receipt da agenda) |
| ClinMax Pay | Paciente paga consulta via Pix | Config → Recebimentos + detalhe da consulta | **Funciona** (charge, QR real, taxa 5% no líquido, repasse automático) |
| Assinatura SaaS | Clínica paga para usar o ClinMax | Config → Plano e assinatura | **Implementado** (Essencial com fatura, checkout de upgrade, recorrência no primeiro PAID, job a cada 15 min) |

**Cobrança do usuário (clínica):** cadastro novo entra no Essencial, `ACTIVE`, com `currentPeriodEnd` e primeira `SubscriptionInvoice` PENDING. Sem pagamento: `PAST_DUE`, grace de 3 dias, depois `SUSPENDED` (núcleo clínico permanece). Upgrade self-serve só para o próximo plano, com Pix ou cartão no `/checkout`. O plano novo entra depois do pagamento. Recorrência Asaas nasce no primeiro pagamento confirmado. O backoffice ainda pode gerar fatura (`Gerar cobrança`). Estado ponta a ponta: `docs/asaas-estado-atual.md`.

**Clínicas antigas** entram no plano interno **Legacy** (grátis, todos os recursos, sem cobrança).

---

## Índice

1. [Três dinheiros no produto](#1-três-dinheiros-no-produto)
2. [Mapa de telas e rotas (frontend)](#2-mapa-de-telas-e-rotas-frontend)
3. [Permissões e cargos](#3-permissões-e-cargos)
4. [Livro-caixa da clínica](#4-livro-caixa-da-clínica)
5. [Configurações financeiras](#5-configurações-financeiras)
6. [ClinMax Pay (Pix da consulta)](#6-clinmax-pay-pix-da-consulta)
7. [Agenda e cobrança de consultas](#7-agenda-e-cobrança-de-consultas)
8. [Estoque, TISS e relatórios relacionados](#8-estoque-tiss-e-relatórios-relacionados)
9. [Cobrança do usuário: assinatura SaaS](#9-cobrança-do-usuário-assinatura-saas)
10. [API completa do backend](#10-api-completa-do-backend)
11. [Serviços e funções (backend)](#11-serviços-e-funções-backend)
12. [Modelos Prisma](#12-modelos-prisma)
13. [Variáveis de ambiente](#13-variáveis-de-ambiente)
14. [Exemplos em terceira pessoa (fluxos reais)](#14-exemplos-em-terceira-pessoa-fluxos-reais)
15. [Matriz: funciona vs placeholder](#15-matriz-funciona-vs-placeholder)
16. [Lacunas conhecidas](#16-lacunas-conhecidas)
17. [Arquivos do projeto](#17-arquivos-do-projeto)
18. [Checklist mental](#18-checklist-mental)

---

## 1. Três dinheiros no produto

Não misturar estes três fluxos na documentação nem na implementação.

| | **Caixa da clínica** | **ClinMax Pay** | **Assinatura SaaS** |
|---|---|---|---|
| Quem paga | Paciente ou convênio para a clínica | Paciente paga consulta via Pix | Clínica paga para usar o ClinMax |
| Onde no front | Gestão (`/gestao/financas...`) | Config → Recebimentos + agenda | Config → Plano, `/checkout`; backoffice Assinaturas/Cobranças |
| O que é | Receitas, despesas, extrato, fluxo | Pix → Asaas → taxa 5% → repasse à chave Pix da clínica | Essencial no cadastro, upgrade pago, fatura Pix/cartão, limites |
| Status | **Implementado** | **Implementado** (QR e receipt no detalhe da consulta) | **Implementado** (fatura no cadastro, recorrência no primeiro PAID) |

```
Paciente paga consulta (Pix ClinMax Pay ou dinheiro)
        ↓
Financeiro da clínica (Gestão: extrato, fluxo, resumo)
        ↓
Clínica usa o software ClinMax
        ↓
Financeiro da plataforma (Config → Plano; Backoffice: assinaturas e faturas)
        ↓
Pix da mensalidade (Asaas) entra na conta da plataforma, não no extrato da clínica
```

A mensalidade do software **não** aparece no extrato de Gestão. O extrato é o P&L da operação de saúde. A fatura SaaS vive em `SubscriptionInvoice`.

---

## 2. Mapa de telas e rotas (frontend)

### 2.1 Gestão: caixa da clínica

Todas protegidas por `PermissionRoute` dentro do `AppShell`.

| Rota | Componente | Permissão | Função |
|------|------------|-----------|--------|
| `/gestao` | redirect | - | → `/gestao/financas` |
| `/gestao/financas` | `FinancasPage` | `finance:view` | Resumo: KPIs, gráficos, transações recentes |
| `/gestao/financas/extrato` | `ExtratoPage` | `finance:view` | Lista de lançamentos com busca |
| `/gestao/financas/receitas` | `ExtratoPage` (`fixedType=INCOME`) | `finance:view` | Só receitas |
| `/gestao/financas/despesas` | `ExtratoPage` (`fixedType=EXPENSE`) | `finance:view` | Só despesas |
| `/gestao/financas/fluxo-de-caixa` | `FluxoCaixaPage` | `finance:view` | Fluxo diário ou mensal |
| `/gestao/estoque` | `EstoquePage` | `finance:view` | Produtos e movimentações (sem R$) |
| `/gestao/tiss` | `TissPage` | `finance:view` | Guias TISS (sem ledger) |
| `/gestao/relatorios` | `RelatoriosPage` | `reports:view` | Análises + repasse profissional |
| `/gestao/pesquisa-satisfacao` | `PesquisaSatisfacaoPage` | `reports:view` | NPS (não é caixa) |

**Rotas legadas** (redirect automático):

| Antiga | Nova |
|--------|------|
| `/financas/*` | `/gestao/financas/*` |
| `/finance` | `/gestao/financas` |
| `/relatorios/*` | `/gestao/relatorios/*` |

### 2.2 Configurações: cadastros (não é extrato)

| Rota | Componente | Permissão |
|------|------------|-----------|
| `/configuracoes/financeiro` | `FinanceConfigPage` | `clinics:manage` |
| `?aba=padroes` | Padrões financeiros | idem |
| `?aba=contas` | Contas | idem |
| `?aba=categorias` | Categorias | idem |
| `?aba=centros` | Centros de custo | idem |
| `?aba=formas` | Formas de pagamento | idem |
| (default) | Recebimentos (ClinMax Pay) | idem |

Entrada: **Configurações → Financeiro (cadastros)** na sidebar.

**Plano da clínica** (não é caixa): `/configuracoes/plano` → `PlanoAssinaturaPage`, permissão `clinics:manage`. Checkout: `/checkout` → `CheckoutPage`. Grupo **Conta e plano** na sidebar.

### 2.3 Navegação

- **Header:** dropdown Gestão (`GestaoNavDropdown`) se `finance:view` ou `reports:view`
- **Sidebar Gestão:** grupos **Caixa** e **Operação** (`GestaoPageShell`)
- **Home por cargo:** Financeiro → `/gestao/financas`; Admin → `/dashboard`

### 2.4 Outras telas com impacto financeiro

| Local | O que faz | Status |
|-------|-----------|--------|
| `PainelPage` | Card "Receita recebida" (INCOME PAID) + link para Finanças | Funcional |
| `OnboardingPage` | `billingModel` (particular/convênio) | Modelo de atendimento, não SaaS |
| `AppointmentFormModal` | Agenda da consulta | Sem link fake de pagamento |
| `AppointmentDetailView` | Detalhe + cobrar / receber / QR Pix real | Funcional |
| `LandingPage` | Planos R$ 99/199/349 | Catálogo oficial |
| `PlanoAssinaturaPage` | Plano, uso, faturas Pix | Funcional |
| `BackofficeAssinaturasPage` | Trial, cortesia, gerar cobrança | Funcional |
| `BackofficeCobrancasPage` | MRR e lista de faturas | Funcional |
| `BackofficePlanosPage` | CRUD de planos | Funcional |

---

## 3. Permissões e cargos

Definidas em `permissions.ts` e configuráveis por cargo customizado (`ClinicRole`).

| Permissão | Uso |
|-----------|-----|
| `finance:view` | Ver resumo, extrato, fluxo, estoque, TISS |
| `finance:manage` | Criar/editar/cancelar lançamentos, estoque write, TISS write |
| `finance:operational` | Cobrar e receber na agenda |
| `clinics:manage` | Cadastros em Configurações → Financeiro e Plano e assinatura |
| `reports:view` | Relatórios e pesquisa de satisfação |

### Quem vê o quê

| Cargo | Gestão financeira | Config cadastros | Cobrança agenda |
|-------|-------------------|------------------|-----------------|
| Admin | Sim (tudo) | Sim | Sim |
| Financeiro | Sim (home aqui) | Não | Sim |
| Consultor | Só relatórios | Sim (cadastros) | Não |
| Recepção | Não | Não | Sim (operacional) |
| Profissional | Não | Não | Não |

Detalhe por cargo: `docs/cargos-ui.md`.

---

## 4. Livro-caixa da clínica

### 4.1 Kit padrão (seed lazy)

Na primeira chamada financeira da clínica, `ensureDefaultFinanceSetup()` cria:

| Tipo | Itens |
|------|-------|
| Conta | Conta principal (saldo inicial 0) |
| Receitas | Consulta, Procedimento, Retorno, Outras receitas |
| Despesas | Aluguel, Salários, Material, Impostos, Outras despesas |
| Centro | Geral |
| Formas | Dinheiro, PIX, Cartão crédito, Cartão débito, Transferência |

### 4.2 Conceitos

**Conta (`FinancialAccount`):** onde o dinheiro está (caixa, banco).

**Categoria (`FinancialCategory`):** classificação `INCOME` ou `EXPENSE`. Não mistura tipos.

**Centro de custo (`CostCenter`):** área responsável (ex.: Geral).

**Forma de pagamento (`PaymentMethod`):** PIX, cartão, dinheiro, etc.

**Lançamento (`FinancialTransaction`):**

| Campo | Significado |
|-------|-------------|
| `type` | `INCOME`, `EXPENSE`, `TRANSFER` |
| `status` | `PAID`, `PENDING`, `CANCELLED` |
| `amount` | Valor > 0 |
| `date` | Data do movimento |
| `dueDate` | Vencimento (opcional) |
| `accountId` | Conta (receita/despesa) |
| `transferFromId` / `transferToId` | Só transferência |
| `categoryId`, `costCenterId`, `paymentMethodId` | Classificação |
| `patientId`, `doctorId`, `procedureId`, `appointmentId` | Vínculo clínico |
| `insurancePlan` | Convênio; vazio vira "Particular" |
| `notes` | Observação |

### 4.3 Regras de cálculo

**Saldo por conta:**
```
saldo = initialBalance
      + Σ receitas PAID
      - Σ despesas PAID
      ± transferências PAID (origem -, destino +)
```
Histórico completo, não limitado ao filtro de datas.

**Resumo do período:**
- `incomePaid`, `expensePaid`, `balancePeriod = incomePaid - expensePaid`
- Só lançamentos não cancelados no intervalo
- `TRANSFER` não entra em receitas nem despesas
- Pendentes aparecem no rodapé, não nos cards "pagas"

**Fluxo de caixa:**
- Só `PAID`
- Modo `daily` (mês corrente) ou `monthly`
- `endingBalance` = saldo acumulado no período filtrado (não inclui saldo inicial)

**Análise (`GET /finance/analysis`):**
- Agrupa por categoria, conta ou convênio
- Tipo obrigatório: `INCOME` ou `EXPENSE`

### 4.4 Telas de Gestão (detalhe)

**FinancasPage:**
- 4 cards: saldo geral, receitas pagas, despesas pagas, balanço do período
- Donuts: receitas por convênio e por categoria
- Tabela transações recentes
- Filtro de datas (padrão: últimos 30 dias)

**ExtratoPage:**
- Busca por texto, filtro por tipo
- Botões Nova receita / Nova despesa (`finance:manage`)
- Reutilizada em `/receitas` e `/despesas`

**FluxoCaixaPage:**
- Toggle diário/mensal
- Card saldo final do período
- Tabela: período × receitas × despesas × saldo acumulado

**TransactionFormModal:**
- Tipos: receita, despesa, transferência
- Campos: descrição, valor, data, status, conta, categoria, convênio (receita), forma, observações

**Lacunas na UI:**
- Transferência no modal, mas sem botão "Nova transferência" no extrato
- Sem edição de lançamento existente
- Sem alteração de status na tabela
- Sem exclusão/cancelamento na UI (backend suporta)

---

## 5. Configurações financeiras

Rota: `/configuracoes/financeiro`  
Permissão: `clinics:manage`

### 5.1 Abas

| Aba | Conteúdo |
|-----|----------|
| Recebimentos | ClinMax Pay (`ClinmaxPaySettingsCard`) |
| Padrões | Conta, centro e forma padrão; checkbox receita automática |
| Contas | Criar conta (nome + saldo inicial) |
| Categorias | Criar categoria (Receita ou Despesa) |
| Centros | Criar centro de custo |
| Formas | Criar forma de pagamento |

### 5.2 Padrões (`ClinicFinanceSettings`)

- `defaultAccountId`
- `defaultCostCenterId`
- `defaultPaymentMethodId`
- `autoGenerateOnAppointment` (grava, mas **não dispara** lançamento ao concluir atendimento)

### 5.3 ClinMax Pay settings (`ClinmaxPaySettingsCard`)

- Toggle ativo/inativo
- Chave Pix, tipo, titular, documento
- Taxa da plataforma (%)
- Débito pendente (`outstandingDebit`)
- Aviso se Asaas não configurado no servidor

Cadastros são **somente criação** (sem editar/desativar na UI).

---

## 6. ClinMax Pay (Pix da consulta)

Produto de **processamento de pagamento do paciente**. Conta Asaas da **plataforma** ClinMax.

### 6.1 Fluxo completo

```
Paciente paga Pix
      ↓
Cobrança na conta Asaas ClinMax (PlatformPayment)
      ↓
Webhook PAYMENT_CONFIRMED → status CONFIRMED (sem repasse)
      ↓
Webhook PAYMENT_RECEIVED → cálculo de taxas
      ↓
Ledger: bruto, tarifa gateway, líquido, taxa 5% plataforma, repasse
      ↓
POST /v3/transfers (Pix para chave da clínica)
      ↓
Webhook TRANSFER_DONE → PlatformPayout PAID
      ↓
recordClinicIncome → FinancialTransaction INCOME no extrato
```

**Regra crítica:** repasse só em `PAYMENT_RECEIVED`, nunca em `PAYMENT_CONFIRMED`.

### 6.2 Fórmulas

```
gatewayFee = amountGross - netAmount (netValue Asaas)
platformFee = round(netAmount × platformFeePercent / 100)
clinicShare = netAmount - platformFee
compensation = min(outstandingDebit, clinicShare)
clinicPayoutAmount = clinicShare - compensation
```

Taxa padrão: **5%** (`CLINMAX_PAY_FEE_PERCENT`).

### 6.3 Estorno

- Repasse não enviado: cancela transferência, payout `CANCELLED`
- Repasse já pago: incrementa `outstandingDebit` da clínica; desconta no próximo repasse

### 6.4 Idempotência

- `PlatformPayment` unique por `asaasPaymentId`
- `PlatformPayout` unique por `paymentId`
- `AsaasWebhookEvent.eventKey` unique (webhook duplicado ignorado)

### 6.5 Integração com extrato

`recordClinicIncome()` cria receita:
- Descrição: "Recebimento ClinMax Pay"
- Conta padrão ou primeira conta
- Categoria "Consulta" se existir
- Forma PIX se existir
- `notes: clinmax-pay:{paymentId}` evita duplicata

### 6.6 Webhook

- URL: `POST /api/webhooks/asaas`
- Header: `asaas-access-token` ou `access_token` = `ASAAS_WEBHOOK_TOKEN`
- Sem JWT

---

## 7. Agenda e cobrança de consultas

### 7.1 Ao criar consulta

- Calcula `totalAmount` dos procedimentos (`computeTotal`)
- Cria `AppointmentBilling` com `billingStatus: PENDING`
- Não grava URL fake de pagamento. A cobrança real nasce em `POST /appointments/:id/charge`

### 7.2 Cobrar (`POST /appointments/:id/charge`)

Permissão: `finance:operational` ou `finance:manage`

1. Atualiza billing → `CHARGED`
2. Se ClinMax Pay **desligado** ou Pix não verificado → `{ mode: "local", pay: null }`
3. Se ClinMax Pay **ligado** e Asaas configurado:
   - Cria/reutiliza customer Asaas no paciente
   - Gera cobrança Pix + QR
   - Persiste `PlatformPayment`
   - Retorna `{ mode: "pix", pay: { pixPayload, pixEncodedImage, ... } }`

### 7.3 Receber manualmente (`POST /appointments/:id/receipt`)

- Marca `AppointmentBilling.billingStatus = RECEIVED`
- Cria `FinancialTransaction` INCOME PAID com `originKey = appointment-income:{appointmentId}`
- Se o ClinMax Pay já lançou a mesma consulta, não duplica a receita

### 7.4 Consultar pagamento (`GET /appointments/:id/pay`)

- Retorna último `PlatformPayment` da consulta
- Front: `AppointmentDetailView` mostra QR real, Pix copia e cola, Cobrar e Receber

---

## 8. Estoque, TISS e relatórios relacionados

### 8.1 Estoque (`/gestao/estoque`)

- CRUD produtos, movimentos IN/OUT/ADJUST
- Filtros: estoque baixo, vencendo, vencidos
- **Sem campos de preço/custo**
- **Sem integração** com livro-caixa (despesa de material é manual)

API: `/api/inventory/*` com permissões financeiras.

### 8.2 TISS (`/gestao/tiss`)

- CRUD guias com convênio, procedimento, valor
- Status: DRAFT → SENT → APPROVED / REJECTED / CANCELLED
- Campo `amount` é informativo
- **Não gera** `FinancialTransaction`

API: `/api/tiss/*`

### 8.3 Relatórios (`/gestao/relatorios`)

| Aba | API | Relevância financeira |
|-----|-----|----------------------|
| Análise receitas | `GET /finance/analysis?type=INCOME` | Agrupamento real |
| Análise despesas | `GET /finance/analysis?type=EXPENSE` | Agrupamento real |
| Repasse profissional | `GET /reports/repasse` | Soma receitas PAID por `doctorId` |
| Atendimentos | `GET /reports/attendance` | `billingTotal`, `billingStatus` por consulta |

Repasse é **indicador**, não mecanismo de pagamento ao profissional.

### 8.4 Dashboard (`PainelPage`)

- Campo `revenue` (label **Receita recebida**) soma só `INCOME` + `status: PAID` no período
- PENDING e CANCELLED ficam de fora. Mesma regra do resumo financeiro (`incomePaid`)

---

## 9. Cobrança do usuário: assinatura SaaS

A clínica (não o paciente) paga a ClinMax para usar o software. Isso é **independente** do livro-caixa e do ClinMax Pay.

Quem opera no CRM: admin da clínica (`clinics:manage`).
Quem opera na plataforma: dono do backoffice.

### 9.1 Planos reais (seed no boot da API)

`ensurePlatformPlansAndSettings()` roda ao subir o backend.

| Slug | Nome | Mensal | Anual | Público | Papel |
|------|------|--------|-------|---------|-------|
| `essencial` | Essencial | R$ 99 | R$ 990 | Sim | Agenda, pacientes, prontuário, prescrições, CID/bulas. 3 usuários, 1 profissional |
| `profissional` | Profissional | R$ 199 | R$ 1.990 | Sim (destaque) | + WhatsApp, financeiro, ClinMax Pay, relatórios, NPS, IA assistiva. 10 usuários, 3 profissionais, 1 WhatsApp |
| `premium` | Premium | R$ 349 | R$ 3.490 | Sim | + WhatsApp com IA, automações, estoque, TISS. Limites finitos (30 usuários, 5 profissionais, 3 WhatsApps) |
| `legacy` | Legacy | R$ 0 | R$ 0 | Não | Plano interno: todos os recursos, limites ilimitados |

Trial padrão comercial: **0 dias**. Grace period de inadimplência: **3 dias**. Plano padrão de signup: **Essencial**.

A landing lê `GET /api/public/plans` (Essencial R$ 99, Profissional R$ 199, Premium R$ 349). Detalhes em `docs/planos.md`.

### 9.2 Como a clínica ganha uma assinatura

1. **Cadastro novo** (`auth.service`): após criar a clínica, chama `ensureClinicSubscription` → Essencial `ACTIVE`, `currentPeriodEnd` de 1 mês e primeira fatura PENDING. O slug da landing vira `requestedPlanSlug` e o onboarding manda para `/checkout` se não for Essencial.
2. **Clínica criada no backoffice:** igual (Essencial, com ciclo e fatura).
3. **Clínica antiga sem assinatura:** no boot, `migrateExistingClinicsToLegacy()` coloca no plano Legacy `ACTIVE` (não cobra). Clínicas Essencial já existentes recebem backfill de ciclo a partir de agora, sem cobrar o passado.

Checkout self-serve em `/checkout` (Pix e cartão). Self-serve só sobe um degrau por vez.

### 9.3 Tela da clínica: Plano e assinatura

Rota: `/configuracoes/plano`
Permissão: `clinics:manage`

O admin vê:

- Nome do plano, ciclo (mensal/anual), preço, status (`TRIAL`, `ACTIVE`, `PAST_DUE`, etc.)
- Dias restantes de trial
- Próxima cobrança
- Uso vs limites (usuários, profissionais, WhatsApp, IA, storage)
- Recursos incluídos vs bloqueados
- Histórico de faturas: atualizar Pix, copiar Pix, link da fatura
- Modal **Ver outros planos**: só o próximo plano tem botão Assinar. Premium no Essencial pede o Profissional primeiro. Checkout em `/checkout`.
- Upgrade pendente: aviso + continuar no checkout ou cancelar a cobrança.

Aviso se `PAST_DUE`: "Pagamento pendente. Regularize para evitar interrupções."

A clínica gera a própria cobrança de **upgrade** no checkout. Renovação recorrente ainda depende do backoffice ou de recorrência Asaas que não dispara sozinha.

### 9.4 Tela do backoffice

| Rota | O que faz |
|------|-----------|
| `/backoffice/planos` | CRUD de planos (preço, features JSON, limites, duplicar, ativar/desativar) |
| `/backoffice/assinaturas` | Lista por status, detalhe, alterar plano, +7 dias trial, cortesia, **gerar cobrança**, suspender, reativar, cancelar |
| `/backoffice/cobrancas` | MRR, a receber, em atraso, recebido no mês + tabela de faturas |
| `/backoffice/clinicas/:id` | Detalhe com assinatura, uso e faturas recentes |

**Gerar cobrança** chama `createManualInvoice`:

- Se Asaas está configurado: cria customer da clínica, cobrança Pix, QR, grava `SubscriptionInvoice` `PENDING`
- Se Asaas não está: fatura `MANUAL` só no banco (sem Pix)

### 9.5 Status da assinatura e o que a clínica consegue usar

| Status | Acesso aos recursos do plano |
|--------|------------------------------|
| `TRIAL` | Sim, até `trialEndsAt` |
| `ACTIVE` | Sim |
| `PAST_DUE` | Sim até vencimento + `gracePeriodDays` (3) |
| Cortesia (`courtesyUntil` no futuro) | Sim, mesmo se o status for outro |
| `EXPIRED` | Não (features vazias) |
| `SUSPENDED` / `CANCELLED` | Não |
| Plano `legacy` | Sempre todos os recursos |

`runSubscriptionLifecycle()` no boot:

- Trial vencido (sem cortesia) → `EXPIRED`
- `PAST_DUE` com fatura vencida além do grace → `SUSPENDED`

Não há job periódico depois do boot. O status só reavalia quando a API sobe de novo.

### 9.6 Como a clínica paga de verdade

```
Backoffice clica em Gerar cobrança
        ↓
Asaas: customer da clínica + payment Pix
        ↓
SubscriptionInvoice PENDING (QR + copia-e-cola)
        ↓
Admin da clínica em Config → Plano → Copiar Pix
        ↓
Webhook PAYMENT_CONFIRMED ou PAYMENT_RECEIVED
        ↓
Fatura PAID, assinatura ACTIVE, período +1 mês (ou +1 ano)
```

Webhook: o mesmo `POST /api/webhooks/asaas`. O roteador (`asaas-webhook.service`) separa:

- `SubscriptionInvoice` / `subscription:` → billing SaaS
- `PlatformPayment` / `TRANSFER_*` → ClinMax Pay (consulta do paciente)

IDs Asaas dos dois fluxos **não podem coincidir**.

Se a fatura vence: status `OVERDUE` e assinatura `PAST_DUE`.

### 9.7 Recorrência Asaas (IMPLEMENTADO)

`syncAsaasSubscription` cria/atualiza `POST /v3/subscriptions` (Pix mensal ou anual).

Gatilhos:

- primeiro webhook PAID de fatura comercial (depois de aplicar o plano localmente);
- `changePlan` se a clínica já tiver `asaasSubscriptionId`.

Fallback: o job a cada 15 minutos emite renovação local se não houver `asaasSubscriptionId` e não houver fatura aberta. Legacy (R$ 0) nunca entra na recorrência.

### 9.8 Gate de recursos

**Front:** `PlanFeatureProvider` + `PlanFeatureRoute`. Rotas de Gestão (FINANCE, REPORTS, INVENTORY, TISS, SATISFACTION), WhatsApp e ferramentas clínicas exigem a feature do plano. Sem feature: tela "Recurso não incluído no plano" com link para `/configuracoes/plano`.

**Back:** `requirePlanFeature` nas rotas de finance (`FINANCE` / `CLINMAX_PAY`). Também `assertClinicFeature` / `assertClinicLimit` em WhatsApp, IA e criação de usuários.

Limites checados no write:

- `maxUsers` / `maxDoctors` ao criar usuário e ao aceitar convite
- `maxWhatsappConnections` ao conectar WhatsApp
- `maxAiAutomationActionsPerMonth` na IA operacional do WhatsApp (não a quota assistiva)

### 9.9 Ciclo de cobrança SaaS (IMPLEMENTADO)

- Checkout de upgrade em `/checkout` (Pix e cartão). Cadastro continua no Essencial.
- Intenção da landing (`requestedPlanSlug`) segue para o checkout após o onboarding.
- Primeira fatura no cadastro Essencial. Sem pagamento: `PAST_DUE` + grace 3 dias + `SUSPENDED` comercial.
- Recorrência Asaas inicia no primeiro pagamento confirmado.
- Lifecycle no boot e a cada 15 minutos.
- Login nunca é bloqueado por inadimplência. Agenda, pacientes e prontuário permanecem.

Ver também: `docs/backoffice-estrutura.md` e `docs/configuracoes.md`.

---

## 10. API completa do backend

Prefixo: `/api` (autenticado com JWT, exceto webhook).

### 10.1 `/api/finance`

| Método | Caminho | Permissão | Descrição |
|--------|---------|-----------|-----------|
| GET | `/summary` | `finance:view` | KPIs + saldos + recentes |
| GET | `/cash-flow` | `finance:view` | Fluxo diário/mensal |
| GET | `/analysis` | `finance:view` | Agrupamento (type obrigatório) |
| GET | `/transactions` | `finance:view` | Lista com filtros |
| POST | `/transactions` | `finance:manage` | Cria lançamento |
| PATCH | `/transactions/:id/status` | `finance:manage` | Altera status |
| DELETE | `/transactions/:id` | `finance:manage` | Soft delete (CANCELLED) |
| GET | `/accounts` | `finance:view` | Lista contas |
| POST | `/accounts` | `clinics:manage` | Cria conta |
| GET | `/categories` | `finance:view` | Lista categorias |
| POST | `/categories` | `clinics:manage` | Cria categoria |
| GET | `/cost-centers` | `finance:view` | Lista centros |
| POST | `/cost-centers` | `clinics:manage` | Cria centro |
| GET | `/payment-methods` | `finance:view` | Lista formas |
| POST | `/payment-methods` | `clinics:manage` | Cria forma |
| GET | `/settings` | `clinics:manage` | Padrões financeiros |
| PUT | `/settings` | `clinics:manage` | Atualiza padrões |
| GET | `/pay/settings` | `clinics:manage` | Config ClinMax Pay |
| PUT | `/pay/settings` | `clinics:manage` | Cadastra chave Pix |
| PATCH | `/pay/enabled` | `clinics:manage` | Liga/desliga Pay |

**Query params úteis:**
- `/summary`: `dateFrom`, `dateTo` (default 30 dias)
- `/cash-flow`: `mode=daily|monthly`, `accountId`
- `/analysis`: `type=INCOME|EXPENSE`, `groupBy=category|account|insurance`
- `/transactions`: `type`, `status`, `search`, `limit` (default 200)

### 10.2 `/api/appointments` (cobrança)

| Método | Caminho | Permissão |
|--------|---------|-----------|
| POST | `/:id/charge` | `finance:operational` ou `finance:manage` |
| POST | `/:id/receipt` | idem |
| GET | `/:id/pay` | idem |

### 10.3 `/api/webhooks`

| Método | Caminho | Auth |
|--------|---------|------|
| POST | `/asaas` | Token header (`ASAAS_WEBHOOK_TOKEN`) |

### 10.4 `/api/inventory`

| Método | Caminho | Permissão |
|--------|---------|-----------|
| GET | `/products` | `finance:view` |
| POST | `/products` | `finance:manage` |
| POST | `/movements` | `finance:manage` |
| GET | `/movements` | `finance:view` |

### 10.5 `/api/tiss`

| Método | Caminho | Permissão |
|--------|---------|-----------|
| GET | `/guides` | `finance:view` |
| POST | `/guides` | `finance:manage` |
| PATCH | `/guides/:id/status` | `finance:manage` |

### 10.6 `/api/subscription` (clínica autenticada)

Permissão: `clinics:manage`.

| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET | `/current` | Assinatura da clínica logada |
| GET | `/usage` | Uso vs limites + features |
| GET | `/plans` | Planos públicos |
| GET | `/invoices` | Faturas da clínica |
| POST | `/change-plan` | Upgrade (só o próximo plano) ou downgrade |
| POST | `/invoices/:id/refresh-pix` | Atualiza QR Pix |

### 10.7 `/api/backoffice` (SaaS, dono da plataforma)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET/POST | `/plans` | Lista / cria plano |
| GET/PUT | `/plans/:id` | Lê / atualiza |
| POST | `/plans/:id/duplicate` | Duplica |
| GET | `/subscriptions` | Lista assinaturas |
| GET | `/subscriptions/:id` | Detalhe |
| PUT | `/subscriptions/:id/plan` | Altera plano |
| POST | `/subscriptions/:id/extend-trial` | Estende trial |
| POST | `/subscriptions/:id/courtesy` | Cortesia |
| POST | `/subscriptions/:id/cancel` | Cancela |
| POST | `/subscriptions/:id/reactivate` | Reativa |
| POST | `/subscriptions/:id/suspend` | Suspende |
| POST | `/subscriptions/:id/invoices` | Gera cobrança Pix/manual |
| GET | `/billing` | Faturas + summary MRR |
| GET | `/clinics/:id` | Detalhe da clínica com billing |
| GET | `/clinics/:id/usage` | Uso |
| GET/PUT | `/platform-settings` | Trial days, grace, plano padrão |

### 10.8 `/api/reports`

| Método | Caminho | Permissão |
|--------|---------|-----------|
| GET | `/repasse` | `reports:view` |
| GET | `/attendance` | `reports:view` |

---

## 11. Serviços e funções (backend)

### 11.1 `finance.service.ts`

| Função | Responsabilidade |
|--------|------------------|
| `ensureDefaultFinanceSetup` | Seed lazy de contas/categorias/formas |
| `listAccounts`, `listCategories`, `listCostCenters`, `listPaymentMethods` | Listagens |
| `listTransactions` | Filtros; exclui CANCELLED |
| `getSummary` | KPIs do período + saldos |
| `createTransaction` | Valida valor, transferência, conta padrão |
| `updateTransactionStatus` | Atualiza `paidAt` quando PAID |
| `deleteTransaction` | Soft delete |
| `getCashFlow` | Buckets diários/mensais |
| `getFinanceSettings`, `updateFinanceSettings` | Padrões da clínica |
| `createAccount`, `createCategory`, `createCostCenter`, `createPaymentMethod` | Cadastros |
| `updateAccount`, `updateCategory`, etc. | **Existem, sem rota HTTP** |
| `financialAnalysis` | Agrupamento por dimensão |

### 11.2 `clinmax-pay.service.ts`

| Função | Responsabilidade |
|--------|------------------|
| `getPaySettings`, `upsertPixRecipient`, `setPayEnabled` | Config Pix da clínica |
| `chargeAppointment` | Fluxo principal de cobrança |
| `getAppointmentPay`, `presentCharge` | Consulta estado |
| `receiptAppointment` | Recebimento manual billing |
| `ensureAsaasCustomer` | Customer Asaas no paciente |
| `handleAsaasWebhook` | Roteamento de eventos |
| `markPaymentConfirmed` | CONFIRMED sem repasse |
| `processPaymentReceived` | Cálculo taxas + cria payout |
| `dispatchTransfer` | POST transfer Asaas |
| `processTransferEvent` | Atualiza payout |
| `processPaymentRefund` | Estorno + outstandingDebit |
| `recordClinicIncome` | Receita no extrato após repasse |

### 11.3 `asaas.client.ts`

| Função | Endpoint Asaas |
|--------|----------------|
| `createCustomer` | POST /v3/customers |
| `createPixPayment` | POST /v3/payments |
| `getPixQrCode` | GET /v3/payments/:id/pixQrCode |
| `getPayment` | GET /v3/payments/:id |
| `createPixTransfer` | POST /v3/transfers |
| `cancelTransfer` | DELETE /v3/transfers/:id/cancel |

### 11.4 Assinatura SaaS

| Arquivo | Função |
|---------|--------|
| `plan.service.ts` | CRUD de planos, lista pública |
| `subscription.service.ts` | Lista, troca plano, trial, cortesia, cancelar, MRR |
| `subscription-billing.service.ts` | Customer Asaas, fatura Pix, webhook de pagamento |
| `subscription-lifecycle.service.ts` | Trial, PAST_DUE, grace, SUSPENDED, renovação local (boot + job 15 min) |
| `saas-billing-seed.ts` | Seed de planos + `ensureClinicSubscription` (fatura + periodEnd) |
| `plan-entitlements.ts` | Gate de feature/limite |
| `asaas-webhook.service.ts` | Roteia webhook Pay vs SaaS |
| `billing.scheduler.ts` | Intervalo de 15 minutos |

`asaas.client.ts` extra SaaS: `createSubscription`, `updateSubscription`, `deleteSubscription`, `listSubscriptionPayments`.

### 11.5 Utilitários

| Arquivo | Função |
|---------|--------|
| `lib/money.ts` | `toCents`, `fromCents`, `roundMoney`, `moneyFromUnknown` |
| `lib/pix-key.ts` | `detectPixKeyType`, `normalizePixKey`, `maskPixKey`, validação documento |
| `lib/clinmax-pay-ledger.ts` | Taxa 5% no líquido e chave `appointment-income:{id}` |
| `lib/finance-ledger.ts` | P&L vs saldo (TRANSFER no saldo, fora do resultado) |
| `lib/asaas-webhook-auth.ts` | Token obrigatório em production, `timingSafeEqual` |
| `lib/subscription-lifecycle-rules.ts` | ACCESS / PAST_DUE / SUSPEND / repair ghost |

---

## 12. Modelos Prisma

### 12.1 Enums financeiros

```
FinancialTransactionType: INCOME | EXPENSE | TRANSFER
FinancialCategoryKind: INCOME | EXPENSE
FinancialTransactionStatus: PENDING | PAID | CANCELLED
BillingStatus: PENDING | CHARGED | RECEIVED
PaymentStatus: NONE | PENDING | PAID (legado agenda)
PixKeyType: CPF | CNPJ | EMAIL | PHONE | EVP
PixRecipientStatus: PENDING | VERIFIED | DISABLED
PlatformPaymentStatus: PENDING | CONFIRMED | RECEIVED | REFUNDED | CANCELLED | FAILED
PlatformPayoutStatus: PENDING | PROCESSING | PAID | FAILED | CANCELLED
```

### 12.2 Modelos principais

| Model | Papel |
|-------|-------|
| `FinancialAccount` | Conta bancária/caixa |
| `FinancialCategory` | Categoria receita/despesa |
| `CostCenter` | Centro de custo |
| `PaymentMethod` | Forma de pagamento |
| `FinancialTransaction` | Lançamento do livro-caixa. `originKey` único para receita de consulta |
| `ClinicFinanceSettings` | Padrões e autoGenerate |
| `ClinicPixRecipient` | Chave Pix para repasse |
| `PlatformPayment` | Cobrança Asaas por consulta |
| `PlatformPayout` | Repasse Pix à clínica |
| `AsaasWebhookEvent` | Idempotência webhook |
| `AppointmentBilling` | Total/cobrança da consulta |
| `Patient.asaasCustomerId` | Cache customer Asaas |
| `ClinicSubscription.requestedPlanSlug` | Intenção da landing, separado do plano ativo |

### 12.4 Modelos SaaS (cobrança da clínica)

```
SubscriptionStatus: TRIAL | ACTIVE | PAST_DUE | SUSPENDED | CANCELLED | EXPIRED
BillingCycle: MONTHLY | ANNUAL
SubscriptionInvoiceStatus: PENDING | PAID | OVERDUE | REFUNDED | CANCELLED | FAILED
```

| Model | Papel |
|-------|-------|
| `Plan` | Catálogo (preço, featuresJson, limitsJson) |
| `ClinicSubscription` | 1 assinatura por clínica; IDs Asaas customer/subscription |
| `SubscriptionInvoice` | Fatura da mensalidade (não misturar com `PlatformPayment`) |
| `ClinicUsagePeriod` | Contadores mensais de IA/storage |
| `PlatformSettings` | Trial padrão, grace, plano default |

### 12.3 Modelos relacionados sem ledger

| Model | Observação |
|-------|------------|
| `InventoryProduct` | Sem preço |
| `TissGuide` | `amount` informativo |
| `Appointment.paymentLinkUrl` | Campo legado no schema. Fluxo real não grava URL fake |

---

## 13. Variáveis de ambiente

| Variável | Obrigatória | Uso |
|----------|-------------|-----|
| `ASAAS_API_KEY_BASE64` | Para ClinMax Pay | Preferida (evita `$` no dotenv) |
| `ASAAS_API_KEY` | Alternativa | Fallback |
| `ASAAS_BASE_URL` | Não | Default `https://api.asaas.com` |
| `ASAAS_WEBHOOK_TOKEN` | Recomendada | Valida webhook |
| `CLINMAX_PAY_FEE_PERCENT` | Não | Default `5` |
| `ASAAS_PIX_KEY` | Não | **Declarada, não usada** |
| `ASAAS_CUSTOMER_ID` | Não | **Declarada, não usada** |
| `ASAAS_WEBHOOK_EMAIL` | Nó | **Declarada, não usada** |

`isAsaasConfigured()` = `Boolean(ASAAS_API_KEY)`.

---

## 14. Exemplos em terceira pessoa (fluxos reais)

### 14.1 Setup inicial da clínica

A administradora **Marina** entra em Configurações → Financeiro. Na aba Recebimentos, ela cadastra a chave Pix da clínica, confirma titular e CNPJ, e ativa o ClinMax Pay. Em seguida, ela revisa as categorias padrão criadas automaticamente pelo sistema e define a Conta principal como padrão na aba Padrões.

### 14.2 Lançamento manual de receita

O financeiro **Ricardo** abre Gestão → Finanças → Extrato e clica em Nova receita. Ele registra "Consulta particular - Ana Silva", R$ 250,00, status Pago, categoria Consulta, convênio Particular, forma PIX. O saldo geral da clínica aumenta imediatamente no card da home de Finanças.

### 14.3 Despesa fixa mensal

**Ricardo** acessa Gestão → Despesas e lança "Aluguel março", R$ 4.500,00, categoria Aluguel, status Pago. O balanço do período passa a refletir a saída.

### 14.4 Transferência entre contas

O administrador **Pedro** lança uma transferência de R$ 1.000,00 da Conta principal para o Caixa físico. O sistema exige contas de origem e destino diferentes. A transferência não aparece como receita ou despesa no resumo, mas altera o saldo de cada conta.

### 14.5 Cobrança Pix na consulta (ClinMax Pay)

A recepcionista **Carla** abre a consulta de **Maria** e aciona Cobrar. O backend calcula R$ 350,00 a partir dos procedimentos, gera QR Code Pix via Asaas e exibe na tela. **Maria** paga pelo app do banco. O webhook `PAYMENT_RECEIVED` dispara o repasse para a chave Pix da clínica. Quando a transferência conclui, o sistema registra automaticamente "Recebimento ClinMax Pay" no extrato.

### 14.6 Cobrança local sem Pix

A clínica desativou o ClinMax Pay. **Carla** cobra a consulta na agenda; o sistema marca o billing como CHARGED e retorna `mode: "local"` sem QR. Depois ela confirma recebimento em dinheiro via receipt. O billing fica RECEIVED e a receita entra no extrato com a mesma chave de origem da consulta.

### 14.7 Estorno após repasse

Um paciente solicita estorno depois que a clínica já recebeu o repasse Pix. O Asaas envia `PAYMENT_REFUNDED`. O sistema incrementa o `outstandingDebit` da clínica. Na próxima consulta paga via ClinMax Pay, o débito é descontado antes do novo repasse.

### 14.8 Guia TISS sem impacto no caixa

**Ricardo** cria uma guia TISS para convênio Unimed, valor R$ 280,00, e marca como Enviada. Mesmo após aprovação pelo convênio, o valor **não** entra no livro-caixa. Se a clínica quiser registrar o recebimento, **Ricardo** deve criar receita manual no extrato.

### 14.9 Consultor configura, financeiro opera

O consultor **Paulo** (sem acesso ao extrato) cria a categoria "Procedimento estético" em Configurações. **Ricardo** usa essa categoria ao lançar receitas. **Paulo** consulta Relatórios → Análise receitas, mas não vê saldo nem extrato.

### 14.10 Contratação e pagamento do software

O dono **João** cria conta na landing escolhendo Premium. O sistema coloca a clínica no plano **Essencial**, `ACTIVE`, com fatura PENDING de R$ 99 e encaminha o checkout do Premium após o onboarding. Agenda e prontuário funcionam na hora.

Se a fatura do Essencial não for paga, após o vencimento a assinatura vai para `PAST_DUE` e, depois do grace de 3 dias, `SUSPENDED`. Módulos comerciais somem. Login, agenda, pacientes e prontuário permanecem.

Para o upgrade, **João** paga o Pix no `/checkout`. O webhook marca a fatura `PAID`, aplica o Profissional e cria a recorrência Asaas.

Clínicas que já existiam antes do billing ficam no plano **Legacy** e não são cobradas.

---

## 15. Matriz: funciona vs placeholder

| Feature | Front | Back | Dados |
|---------|-------|------|-------|
| Resumo financeiro | Sim | Sim | Real |
| Extrato receitas/despesas | Sim | Sim | Real |
| Fluxo de caixa | Sim | Sim | Real |
| Criação lançamentos | Sim | Sim | Real |
| Edição/cancelamento UI | Sim (status e cancelar) | Sim | Real |
| Cadastros (create) | Sim | Sim | Real |
| Cadastros (edit/delete) | Não | Parcial | - |
| ClinMax Pay config | Sim | Sim | Real |
| ClinMax Pay cobrança agenda | Sim (Cobrar, Receber, QR) | Sim | Real |
| Receita automática atendimento | Checkbox | Não ligado | - |
| Estoque | Sim | Sim | Real (sem R$) |
| TISS | Sim | Sim | Real (sem ledger) |
| Repasse profissional | Sim | Sim | Real |
| Assinatura SaaS (Essencial, checkout, fatura) | Sim | Sim | Real |
| Gerar cobrança Pix da mensalidade | Clínica no upgrade; backoffice na renovação | Sim | Real se Asaas |
| Recorrência Asaas automática | Primeiro PAID | Sim | Real se Asaas |
| Checkout na landing | `/checkout` | Sim (change-plan) | Real se Asaas |
| paymentLinkUrl | Não usado na UI | Campo legado | - |

---

## 16. Lacunas conhecidas (PLANEJADO / P2)

1. `autoGenerateOnAppointment` não conectado ao encerramento de atendimento
2. Cadastros financeiros sem editar/desativar na UI
3. TISS aprovada não gera receita
4. Estoque OUT não gera despesa
5. Proration e downgrade só no fim do ciclo
6. Validação Pix sem consulta externa (DICT)
7. Sem botão de saque. Só repasse Pix automático após `PAYMENT_RECEIVED`
8. Login não é bloqueado por inadimplência (só some feature gated). Regra de produto.

---

## 17. Arquivos do projeto

### Frontend

```
src/pages/gestao/
  FinancasPage.tsx
  ExtratoPage.tsx
  FluxoCaixaPage.tsx
  EstoquePage.tsx
  TissPage.tsx
  RelatoriosPage.tsx
  RelatoriosAtendimentoPage.tsx

src/pages/configuracoes/
  FinanceConfigPage.tsx
  PlanoAssinaturaPage.tsx

src/pages/checkout/
  CheckoutPage.tsx

src/pages/backoffice/
  BackofficeAssinaturasPage.tsx
  BackofficeCobrancasPage.tsx
  BackofficePlanosPage.tsx

src/components/
  gestao/GestaoPageShell.tsx
  gestao/GestaoNavDropdown.tsx
  gestao/TransactionFormModal.tsx
  settings/ClinmaxPaySettingsCard.tsx
  billing/PlanBadges.tsx
  billing/PlanUsage.tsx
  routing/PlanFeatureRoute.tsx
  agenda/AppointmentFormModal.tsx
  agenda/AppointmentDetailView.tsx
  agenda/AppointmentDetailDrawer.tsx

src/context/PlanFeatureContext.tsx
src/hooks/useClinicPlan.ts
src/lib/plan-features.ts
src/services/api.ts          # api.finance, api.subscription, inventory, tiss, appointments
src/lib/gestao-nav.ts
src/lib/permissions.ts
src/lib/landing-content.ts   # LANDING_PLANS (marketing)
```

### Backend

```
src/routes/
  finance.routes.ts
  webhooks.routes.ts
  appointments.routes.ts
  inventory.routes.ts
  tiss.routes.ts
  reports.routes.ts
  subscription.routes.ts
  backoffice-saas.routes.ts

src/services/
  finance.service.ts
  clinmax-pay.service.ts
  subscription.service.ts
  subscription-billing.service.ts
  subscription-lifecycle.service.ts
  plan.service.ts
  asaas-webhook.service.ts
  inventory.service.ts
  tiss.service.ts
  reports.service.ts
  appointment.service.ts

src/controllers/
  finance.controller.ts
  clinmax-pay.controller.ts
  saas-billing.controller.ts

src/lib/
  asaas.client.ts
  money.ts
  pix-key.ts
  plan-features.ts
  plan-entitlements.ts
  saas-billing-seed.ts
  env.ts

prisma/schema.prisma
```

### Documentação relacionada

- `docs/configuracoes.md` (seção Financeiro e Plano)
- `docs/cargos-ui.md` (permissões)
- `docs/onboarding-logica.md` (`billingModel`)
- `docs/backoffice-estrutura.md` (assinaturas e cobranças)

---

## 18. Checklist mental

| Situação | Onde ir |
|----------|---------|
| Paciente pagou consulta via Pix ClinMax Pay | Agenda (QR) + extrato após repasse |
| Paciente pagou em dinheiro | Gestão → Extrato → Receita (manual) |
| Clínica pagou aluguel | Gestão → Extrato → Despesa |
| Mover caixa para banco | Transferência (não é receita) |
| Criar conta/categoria PIX | Configurações → Financeiro |
| Cadastrar chave Pix repasse | Config → Financeiro → Recebimentos |
| Ver repasse por profissional | Gestão → Relatórios → Repasse |
| Guia convênio | Gestão → TISS (sem caixa automático) |
| Contratar plano ClinMax | Landing (preço marketing) + Config → Plano |
| Pagar mensalidade | Config → Plano (Copiar Pix) depois que o backoffice gerou a fatura |
| Clínica inadimplente no SaaS | Features somem após grace; login continua |
| Clínica antiga (pré-billing) | Plano Legacy, sem cobrança |

---

## Cliente HTTP do front (`api.finance`)

```typescript
api.finance.summary({ dateFrom, dateTo })
api.finance.listTransactions({ type, status, search, ... })
api.finance.createTransaction(data)
api.finance.lookup()  // accounts, categories, costCenters, paymentMethods
api.finance.cashFlow({ mode, dateFrom, dateTo, accountId })
api.finance.analysis({ type, dateFrom, dateTo, groupBy })
api.finance.getSettings() / updateSettings(data)
api.finance.createAccount / createCategory / createCostCenter / createPaymentMethod
api.finance.getPaySettings() / savePaySettings() / setPayEnabled()
```

**Lançamentos no front:**
```typescript
api.finance.updateTransactionStatus(id, status)
api.finance.cancelTransaction(id)
```

**Cobrança agenda:**
```typescript
api.appointments.charge(id, amount?)
api.appointments.getPay(id)
api.appointments.receipt(id)
```

**Assinatura SaaS (clínica):**
```typescript
api.subscription.current()
api.subscription.usage()
api.subscription.plans()
api.subscription.invoices()
api.subscription.changePlan({ planId, billingCycle })
api.subscription.refreshInvoicePix(invoiceId)
```
