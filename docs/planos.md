# Planos ClinMax

Documentação dos planos comerciais da plataforma ClinMax, seus benefícios, limites, regras de acesso e cobrança.

**Última revisão:** 21/08/2026

## 1. Resumo

Os planos são assinaturas SaaS pagas pela clínica para usar o ClinMax. O pagamento da clínica é separado:

- do livro-caixa da clínica;
- do ClinMax Pay, usado para o paciente pagar uma consulta;
- das permissões internas dos usuários da clínica.

O catálogo comercial real é criado no boot do backend. A landing page ainda exibe nomes e preços antigos.

## 2. Planos comerciais

| Plano | Mensal | Anual | Indicado para |
|---|---:|---:|---|
| Essencial | R$ 99 | R$ 990 | Consultórios pequenos e profissionais em início de operação |
| Profissional | R$ 199 | R$ 1.990 | Clínicas em crescimento que precisam de WhatsApp, financeiro e relatórios |
| Premium | R$ 349 | R$ 3.490 | Clínicas que precisam de IA, pagamentos e módulos avançados |

Os valores anuais correspondem a dez mensalidades, representando dois meses de economia.

Todos os planos públicos têm trial padrão de 14 dias. O plano Profissional é o plano padrão para novos cadastros.

## 3. Benefícios por plano

### Essencial

Recursos incluídos:

- Painel;
- agenda;
- pacientes;
- prontuário eletrônico;
- prescrições;
- medicamentos, bulas e CID.

Limites:

| Recurso | Limite |
|---|---:|
| Usuários | 3 |
| Profissionais | 1 |
| WhatsApps conectados | 0 |
| Mensagens de IA por mês | 0 |
| Ações de IA por mês | 0 |
| Armazenamento | 1.024 MB |

### Profissional

Inclui todos os recursos do Essencial, mais:

- WhatsApp;
- financeiro;
- relatórios;
- pesquisa de satisfação;
- operação multi-profissional.

Limites:

| Recurso | Limite |
|---|---:|
| Usuários | 8 |
| Profissionais | 3 |
| WhatsApps conectados | 1 |
| Mensagens de IA por mês | 200 |
| Ações de IA por mês | 100 |
| Armazenamento | 5.120 MB |

### Premium

Inclui todos os recursos do Profissional, mais:

- WhatsApp com IA;
- automações;
- ClinMax Pay;
- estoque;
- TISS;
- relatórios avançados.

Limites:

| Recurso | Limite |
|---|---:|
| Usuários | Ilimitado |
| Profissionais | Ilimitado |
| WhatsApps conectados | 3 |
| Mensagens de IA por mês | Ilimitado |
| Ações de IA por mês | Ilimitado |
| Armazenamento | Ilimitado |

## 4. Comparação de recursos

| Recurso | Essencial | Profissional | Premium |
|---|:---:|:---:|:---:|
| Painel | Sim | Sim | Sim |
| Agenda | Sim | Sim | Sim |
| Pacientes | Sim | Sim | Sim |
| Prontuário | Sim | Sim | Sim |
| Prescrições | Sim | Sim | Sim |
| Medicamentos, bulas e CID | Sim | Sim | Sim |
| WhatsApp | Não | Sim | Sim |
| Financeiro | Não | Sim | Sim |
| Relatórios | Não | Sim | Sim |
| Pesquisa de satisfação | Não | Sim | Sim |
| Multi-profissional | Não | Sim | Sim |
| WhatsApp com IA | Não | Não | Sim |
| Automações | Não | Não | Sim |
| ClinMax Pay | Não | Não | Sim |
| Estoque | Não | Não | Sim |
| TISS | Não | Não | Sim |
| Relatórios avançados | Não | Não | Sim |

## 5. Trial e criação da assinatura

Quando uma nova clínica é criada:

1. o backend cria uma assinatura para a clínica;
2. associa o plano Profissional padrão;
3. define o status como `TRIAL`;
4. define o término do trial para 14 dias depois;
5. libera os recursos do plano durante o período.

Clínicas antigas que ainda não tinham assinatura são associadas ao plano interno `Legacy`.

## 6. Plano Legacy

O plano `Legacy` não é público e não é vendido. Ele existe para manter o acesso das clínicas cadastradas antes da implantação do billing SaaS.

Características:

- preço mensal: R$ 0;
- preço anual: R$ 0;
- todos os recursos liberados;
- todos os limites ilimitados;
- status ativo;
- nenhuma cobrança de assinatura.

## 7. Status e acesso

| Status | Regra de acesso |
|---|---|
| `TRIAL` | Acesso até o término do trial |
| `ACTIVE` | Acesso normal |
| `PAST_DUE` | Acesso durante o período de tolerância |
| `SUSPENDED` | Recursos do plano bloqueados |
| `CANCELLED` | Recursos do plano bloqueados |
| `EXPIRED` | Recursos do plano bloqueados |

O período de tolerância padrão para inadimplência é de 3 dias após o vencimento da fatura.

Uma cortesia válida em `courtesyUntil` mantém o acesso liberado, mesmo quando o status normal da assinatura não permitiria acesso.

O bloqueio ocorre por recurso. O login da clínica não é bloqueado por inadimplência.

## 8. Onde o usuário vê o plano

### Clínica

Rota: `/configuracoes/plano`

Permissão: `clinics:manage`.

O administrador ou consultor pode ver:

- plano atual;
- ciclo mensal ou anual;
- preço;
- status;
- término do trial;
- próxima cobrança;
- uso atual e limites;
- recursos incluídos;
- histórico de cobranças;
- Pix copia e cola, quando disponível.

Também pode solicitar a troca de plano e ciclo.

### Backoffice

Rotas principais:

| Rota | Finalidade |
|---|---|
| `/backoffice/planos` | Criar e editar planos, preços, recursos e limites |
| `/backoffice/assinaturas` | Administrar trials, planos, cortesias e status |
| `/backoffice/cobrancas` | Acompanhar MRR, faturas, valores pendentes e atrasos |

Somente o dono da plataforma pode acessar essas telas.

## 9. Como funciona a cobrança

O backoffice gera uma cobrança para a assinatura da clínica. Com o Asaas configurado, o sistema:

1. cria ou reutiliza o customer da clínica;
2. cria uma cobrança Pix;
3. grava uma `SubscriptionInvoice` com status `PENDING`;
4. salva o QR Code e o código copia e cola quando disponíveis;
5. mostra a cobrança em Configurações → Plano e assinatura;
6. recebe a confirmação por webhook;
7. altera a fatura para `PAID`;
8. altera a assinatura para `ACTIVE`;
9. atualiza o período da assinatura.

Se o Asaas não estiver configurado, a fatura é criada como `MANUAL`, sem QR Code Pix.

A clínica não gera a própria fatura. Ela apenas paga uma cobrança gerada pelo backoffice.

## 10. Troca de plano

A troca pode ser solicitada na tela da clínica ou executada pelo backoffice.

O sistema permite alterar:

- plano;
- ciclo mensal;
- ciclo anual.

A troca de plano não gera automaticamente uma nova cobrança. A cobrança precisa ser gerada pelo backoffice.

## 11. Diferença entre catálogo real e landing

O catálogo usado pelo backend é:

| Backend | Landing atual |
|---|---|
| Essencial: R$ 99 | Básico: R$ 79 |
| Profissional: R$ 199 | Profissional: R$ 149 |
| Premium: R$ 349 | Avançado: R$ 249 |

A landing é apenas marketing e não está sincronizada com os planos cadastrados no banco. Essa diferença precisa ser corrigida antes de divulgar os preços publicamente.

## 12. O que já funciona

- criação automática da assinatura;
- trial de 14 dias;
- catálogo de planos;
- plano mensal e anual;
- limites por usuários, profissionais, WhatsApp, IA e armazenamento;
- bloqueio de recursos que não pertencem ao plano;
- tela de plano da clínica;
- histórico de faturas;
- cobrança Pix via Asaas;
- webhook de confirmação, vencimento e estorno;
- gestão de planos e assinaturas no backoffice;
- métricas de MRR, valores a receber e valores em atraso.

## 13. Pendências

- sincronizar os preços da landing com o catálogo real;
- criar checkout para novos clientes;
- gerar a primeira cobrança automaticamente ao fim do trial;
- iniciar a recorrência Asaas após o primeiro pagamento;
- executar o lifecycle em job periódico, não apenas no boot da API;
- permitir que a clínica solicite uma cobrança diretamente;
- preencher e disponibilizar o link de fatura quando existir;
- melhorar as mensagens de cobrança e inadimplência;
- criar testes completos para trial, pagamento, estorno e suspensão.

## 14. Arquivos relacionados

### Frontend

- `src/pages/configuracoes/PlanoAssinaturaPage.tsx`
- `src/pages/backoffice/BackofficePlanosPage.tsx`
- `src/pages/backoffice/BackofficeAssinaturasPage.tsx`
- `src/pages/backoffice/BackofficeCobrancasPage.tsx`
- `src/components/billing/PlanBadges.tsx`
- `src/components/billing/PlanUsage.tsx`
- `src/components/routing/PlanFeatureRoute.tsx`
- `src/context/PlanFeatureContext.tsx`
- `src/hooks/useClinicPlan.ts`
- `src/lib/plan-features.ts`
- `src/lib/landing-content.ts`

### Backend

- `src/lib/saas-billing-seed.ts`
- `src/lib/plan-features.ts`
- `src/lib/plan-entitlements.ts`
- `src/services/plan.service.ts`
- `src/services/subscription.service.ts`
- `src/services/subscription-billing.service.ts`
- `src/services/subscription-lifecycle.service.ts`
- `src/services/asaas-webhook.service.ts`
- `src/controllers/saas-billing.controller.ts`
- `src/routes/subscription.routes.ts`
- `src/routes/backoffice-saas.routes.ts`
- `prisma/schema.prisma`
