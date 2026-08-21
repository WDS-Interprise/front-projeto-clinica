# Inventario ponta a ponta do site (frontend + backend)

Documento mestre do monorepo ClinMax. Cobre frontend, backend, banco, integracoes, permissoes, telas, APIs, fluxos e debitos tecnicos conhecidos.

## Indice

1. [Visao geral](#1-visao-geral-do-que-e-este-sistema)
2. [Rotas frontend](#2-como-o-site-navega-frontend)
3. [Integracoes externas](#3-integrações-e-sistemas-relacionados-o-que-e-e-pra-que-serve)
4. [Endpoints HTTP backend](#4-endpoints-http-do-backend-o-que-existe-e-como-se-usa)
5. [Modelo de dados Prisma](#5-modelo-de-dados-prisma-alto-nivel)
6. [Fluxos principais](#6-fluxos-principais-ponta-a-ponta)
7. [O que funciona e o que nao](#7-o-que-funciona-o-que-e-parcial-e-o-que-nao-funciona)
8. [Navegacao layout permissoes](#8-navegacao-layout-e-permissoes)
9. [Catalogo de telas](#9-catalogo-detalhado-de-telas)
10. [Drawers e modais](#10-drawers-modais-e-overlays)
11. [Jornadas ponta a ponta](#11-fluxos-ponta-a-ponta-jornadas)
12. [Status por modulo](#12-status-funcional-por-modulo-resumo)
13. [Docs relacionados](#13-documentos-relacionados-no-repo)
14. [Resultado deste documento](#14-resultado-deste-documento)
15. [Como rodar localmente](#15-como-rodar-localmente)
16. [Variaveis de ambiente](#16-variaveis-de-ambiente)
17. [Estrutura de pastas](#17-estrutura-de-pastas)
18. [Services backend](#18-catalogo-de-services-backend)
19. [Controllers backend](#19-catalogo-de-controllers-backend)
20. [Modelo Prisma detalhado](#20-modelo-prisma-detalhado-todas-as-tabelas)
21. [Matriz de permissoes](#21-matriz-de-permissoes-completa)
22. [Ferramentas WhatsApp AI](#22-ferramentas-whatsapp-ai-detalhadas)
23. [Onboarding ramificado](#23-onboarding-ramificado-completo)
24. [Pacientes e duplicidade](#24-pacientes-e-duplicidade)
25. [Financeiro e Clinmax Pay](#25-financeiro-da-clinica-e-clinmax-pay)
26. [Bot WhatsApp](#26-bot-whatsapp-arquitetura-e-regras)
27. [Configuracoes da clinica](#27-configuracoes-da-clinica)
28. [Contexts hooks estado global](#28-contexts-hooks-e-estado-global-frontend)
29. [Componentes por pasta](#29-componentes-por-pasta-frontend)
30. [Seed e dados de dev](#30-seed-e-dados-de-desenvolvimento)
31. [Prescricoes e validacao](#31-prescricoes-e-validacao-publica)
32. [Agenda regras de negocio](#32-agenda-regras-de-negocio)
33. [Backoffice plataforma](#33-backoffice-plataforma)
34. [Erros de build e debitos](#34-erros-de-build-e-debitos-tecnicos)
35. [Glossario](#35-glossario)

---

## 1. Visao geral do que e este sistema

Este repositorio implementa um CRM clinico para a `ClinMax` com:

1. **Frontend (SPA)**: `React` + `react-router-dom` (rotas por URL) + `Vite` + `Tailwind` (estilo) e `shadcn/ui`.
2. **Backend (API HTTP)**: `Fastify` com autenticação via `JWT` e protecao por `permissoes` (decorators).
3. **Banco de dados**: `Prisma` usando `SQLite` em ambiente de desenvolvimento.
4. **Integrações principais**:
   - **WhatsApp** via **Baileys** + fila de mensagens.
   - **WhatsApp AI** usando **OpenRouter (NineRouter)**.
   - **Pagamento Clinmax Pay** via **Asaas** (pagamentos e webhook).
   - **Prescricoes**: gera conteudo em HTML e PDF (com `qrcode` para validacao).
   - **Bulas, TUSS e CID**: integrações com bases externas (Bulapi, Brasil API TUSS, Anvisa e afins).
   - **Armazenamento de arquivos/avatars** via GenInfra (bucket).
   - **OAuth do Google**.

## 2. Como o site navega (Frontend)

### 2.1 Autenticacao e protecoes

- O frontend usa `localStorage.getItem("token")` para detectar autenticacao.
- Rotas protegidas usam:
  - `ProtectedRoute`: exige token para qualquer tela dentro do `AppShell`.
  - `PermissionRoute`: exige permissao especifica (ex.: `agenda:view`, `patients:view`, etc).
- O backend exige o `Bearer token` em `Authorization`.

### 2.2 Estrutura de rotas do frontend (`src/App.tsx`)

Rotas publicas:
- `/` - `LandingPage`
  - Se autenticado, redireciona para a rota de home do onboarding (funcoes de `src/lib/onboarding` + `src/lib/permissions`).
  - Se nao autenticado, exibe a landing.
- `/login` - `Login`
- `/register` - `Register`
- `/auth/google/callback` - `GoogleCallbackPage`
- `/convite/:token` - `AcceptInvitePage`
- `/aguardando-acesso` - `AguardandoAcessoPage` (protegida por `ProtectedRoute`)

Rotas de backoffice:
- `/backoffice/login` - `BackofficeLogin`
- `/backoffice` - `BackofficeLayout` (protegida por `getBackofficeToken()`)
  - `index` - `BackofficeDashboard`
  - `clinicas` - `BackofficeClinicsPage`
  - `usuarios` - `BackofficeUsersPage`
  - `usuarios/novo` - `BackofficeUserFormPage`
  - `usuarios/:id` - `BackofficeUserFormPage`
  - `pacientes` - `BackofficePatientsPage`
  - `plataforma` - `BackofficePlatformPage`

Rotas do app principal (dentro do `AppShell`):
- `dashboard` - `PainelPage` (permissao `dashboard:view`)
- `agenda` - `AgendaPage` (permissao `agenda:view`)
- `mensagens` - `MensagensPage` (permissao `whatsapp:send`)
- `pacientes` - `Patients` (permissao `patients:view`)
- `pacientes/:id` - `Patients` (mesma tela, filtro por id)
- `prontuario/:pacienteId` - `ProntuarioPage` (permissao `records:view`)
- `atendimento/:id` - `AtendimentoPage` (permissao `records:write`)
- `prescricoes/:atendimentoId` - `PrescricoesPage` (permissao `prescriptions:write`)
- `outros`:
  - `outros/bulas` - `BulasPage` (permissao `clinical_tools:view`)
  - `outros/bulas/:bulaId` - `BulaDetailPage` (permissao `clinical_tools:view`)
  - `outros/contatos` - `ContatosPage` (permissao `patients:view`)
  - `outros/cid-10` - `Cid10Page` (permissao `clinical_tools:view`)
  - `outros/cid-11` - `Cid11Page` (permissao `clinical_tools:view`)
  - `outros/logs` - `LogsPage` (permissao `users:manage`)
- `gestao`:
  - `gestao/financas` - `FinancasPage` (permissao `finance:view`)
  - `gestao/financas/extrato` - `ExtratoPage` (permissao `finance:view`)
  - `gestao/financas/receitas` - `ExtratoPage` (mesma tela com props fixas)
  - `gestao/financas/despesas` - `ExtratoPage` (mesma tela com props fixas)
  - `gestao/financas/fluxo-de-caixa` - `FluxoCaixaPage` (permissao `finance:view`)
  - `gestao/relatorios` - `RelatoriosPage` (permissao `reports:view`)
  - `gestao/relatorios/atendimento` - redireciona para `gestao/relatorios`
  - `gestao/estoque` - `EstoquePage` (permissao `finance:view`)
  - `gestao/tiss` - `TissPage` (permissao `finance:view`)
  - `gestao/pesquisa-satisfacao` - `PesquisaSatisfacaoPage` (permissao `reports:view`)

Rotas legadas (redirecionamentos):
- `patients` -> `/pacientes`
- `appointments` -> `/agenda`
- `doctors` -> `Doctors` (tela separada do AppShell)
- `records` -> `/pacientes` (redirecionamento)
- `settings` -> redireciona para configuracao apropriada (`/configuracoes/clinicas`)
- `configuracoes/*` em geral usa `ModuleUnavailablePage` ou redireciona conforme implementado.

Fallback:
- `*` - `ModuleUnavailablePage` (tela informando indisponibilidade)

## 3. Integrações e sistemas relacionados (o que e e pra que serve)

### 3.1 API e controle de acesso

- Backend: Fastify com rotas em `src/routes/*`.
- Autenticacao via `JWT`.
- Autorizacao via lista de permissões calculadas em `buildAuthContext(userId, clinicId)`.
- O frontend envia `Authorization: Bearer <token>` nas chamadas via `src/services/api.ts`.

### 3.2 WhatsApp (Baileys)

O sistema permite:
- Criar e gerenciar conexoes WhatsApp por clinica (`/api/whatsapp/connections`).
- Listar chats e mensagens persistidas (`/api/whatsapp/chats`).
- Criar templates e enviar mensagens (`/api/whatsapp/templates` + envio de mensagens).
- Configurar settings (reminders e assistente).

Banco e persistencia:
- A persistencia de sessão e mensagens fica no banco via modelos do Prisma (`WhatsappConnection`, `WhatsappChat`, `WhatsappMessage`, `WhatsappOutbox`).

### 3.3 WhatsApp AI (OpenRouter via NineRouter)

Funcao:
- Gerar respostas automatizadas ao paciente no WhatsApp.
- Quando aplicavel, orquestrar fluxo de agendamento (chamadas a ferramentas e validações no backend).

Como funciona no backend:
- `src/services/whatsapp-ai.service.ts`:
  - Monta prompt do sistema com base no nome da clinica e “tools doc”.
  - Mantem historico curto de mensagens no contexto (limite por `MAX_HISTORY`).
  - Faz chamadas a LLM via `chatCompletionWithFallback` no `src/lib/openrouter.ts`.
  - Executa ferramentas (tools) no backend e valida os passos.

Dependencias:
- Requer `OPENROUTER_API_KEY` (ou `NINEROUTER_KEY`) e configuracao de modelo.

### 3.4 Clinmax Pay (Asaas)

Funcao:
- Criar cobrancas e links de pagamento para consultas/atendimentos.
- Receber status por webhook Asaas.
- Configurar chaves Pix e status do “pix recipient”.

Como e feito:
- Rotas de settings e habilitacao:
  - `/api/finance/pay/settings`
  - `/api/finance/pay/enabled`
- Webhook:
  - `/api/webhooks/asaas` (consome headers do webhook do Asaas)

Dependencias:
- Requer `ASAAS_API_KEY` e variaveis webhook.
- O backend mapeia erros comuns (PIX nao configurado, webhook nao autorizado, etc).

### 3.5 Prescricoes e validacao publica

Funcao:
- Gerar prescricoes para paciente e profissional.
- Renderizar conteudo em HTML para gerar PDF no backend.
- Oferecer validacao publica com `validationCode` e `accessCode`.
- Inserir QR Code com URL de validacao.

Rotas:
- APIs autenticadas em `/api/prescriptions/*`.
- Validacao publica:
  - `/api/public/prescriptions/validate/:code`

### 3.6 Bula, CID e bases clinicas

O sistema inclui ferramentas de busca:
- Bula (Anvisa/Bulapi e cache).
- CID-10 e CID-11 (busca, capitulo/grupo/bloco, e retorno por codigo).
- Contatos e logs (para area “outros”).
- INSS (CID_INSS) via `cid/inss/:codigo`.

Dependencias externas (via env do backend):
- `BULAPI_*`
- `TUSS_*`
- `ANVISA_*`
- outras chaves e endpoints externas para bulas/TUSS.

### 3.7 TISS e satisfacao

TISS:
- Criar e enviar guias TISS por consulta/procedimento e acompanhar status.

Pesquisa de satisfacao:
- Listar surveys
- Criar survey
- Marcar como enviada
- Receber resposta e atualizar estado

### 3.8 Armazenamento de arquivos (GenInfra)

O projeto usa GenInfra para:
- Upload de imagens (ex.: avatar).
- Bucket e endpoints para upload, lista e download.

Dependencias:
- Configurar `STORAGE_ENDPOINT`, `STORAGE_BUCKETS_API_BASE`, `STORAGE_CONNECTION_TOKEN` e prefixos.

## 4. Endpoints HTTP do backend (o que existe e como se usa)

Formato:
- Paths abaixo ja consideram o prefixo registrado em `back-projeto-clinica/src/index.ts`.
- Permissoes em geral ficam protegidas por `app.requirePermission(...)` e variam por rota.

### 4.1 Health
- `GET /api/health`

### 4.2 Autenticacao e perfil (`/api/auth`)
- `POST /api/auth/login` (email, password)
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `POST /api/auth/register` (name, email, cpf, password, role opcional)
- `POST /api/auth/complete-onboarding` (proximo passo do onboarding)
- `GET /api/auth/me`
- `GET /api/auth/me/avatar`
- `POST /api/auth/me/avatar` (upload multipart)
- `PATCH /api/auth/me`

### 4.3 Pacientes (`/api/patients`)
- `GET /api/patients` (lista)
- `GET /api/patients/lookup` (cpf/email/phone)
- `GET /api/patients/:id/history` (historico de registros)
- `GET /api/patients/:id`
- `POST /api/patients`
- `PUT /api/patients/:id`
- `PATCH /api/patients/:id/archive`

### 4.4 Profissionais/Medicos (`/api/doctors`)
- `GET /api/doctors`
- `GET /api/doctors/:id`
- `POST /api/doctors`
- `PUT /api/doctors/:id`
- `DELETE /api/doctors/:id`

### 4.5 Agenda e atendimento (`/api/appointments`)
- `GET /api/appointments`
- `GET /api/appointments/next-slot`
- `GET /api/appointments/:id`
- `POST /api/appointments` (cria agendamento)
- `PUT /api/appointments/:id`
- `DELETE /api/appointments/:id`
- `POST /api/appointments/:id/charge` (cobranca)
- `POST /api/appointments/:id/receipt` (recebimento)
- `POST /api/appointments/:id/reminder` (lembrete WhatsApp)
- `POST /api/appointments/:id/ai-draft` (rascunho com IA)
- `GET /api/appointments/:id/pay` (consulta pagamento)

### 4.6 Registros (`/api/records`)
- `GET /api/records`
- `GET /api/records/:id`
- `POST /api/records`
- `PUT /api/records/:id`
- `DELETE /api/records/:id`

### 4.7 Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats`
- `GET /api/dashboard/panel-metrics`
- `GET /api/dashboard/today-patients`
- `GET /api/dashboard/upcoming`
- `GET /api/dashboard/recent-patients`

### 4.8 Procedimentos (`/api/procedures`)
- `GET /api/procedures`

### 4.9 Backoffice (`/api/backoffice`)
- `GET /api/backoffice/status`
- `POST /api/backoffice/login`
- `GET /api/backoffice/me`
- `GET /api/backoffice/metrics`
- `GET /api/backoffice/clinics`
- `POST /api/backoffice/clinics`
- `PUT /api/backoffice/clinics/:id`
- `GET /api/backoffice/users`
- `GET /api/backoffice/users/:id`
- `POST /api/backoffice/users`
- `PUT /api/backoffice/users/:id`
- `DELETE /api/backoffice/users/:id`
- `GET /api/backoffice/patients`

### 4.10 Usuarios (`/api/users`)
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `PUT /api/users/:id/linked-doctors`

### 4.11 Clinicas (`/api/clinics`)
- `GET /api/clinics`
- `GET /api/clinics/:id`
- `PUT /api/clinics/:id`

### 4.12 Convites e ingressos (`/api/invites` e rotas dentro de `/api/clinics/:id/*`)
Em `/api/invites`:
- `GET /api/invites/preview/:token`
- `GET /api/invites/clinic-code/:code`
- `POST /api/invites/accept/:token`
- `POST /api/invites/accept/:token/authenticated`
- `POST /api/invites/join-by-code`

Em `/api/clinics/:id/*` (clinicInviteRoutes):
- `GET /api/clinics/:id/invites`
- `POST /api/clinics/:id/invites`
- `DELETE /api/clinics/:id/invites/:inviteId`
- `POST /api/clinics/:id/join-requests/:requestId/approve`
- `POST /api/clinics/:id/join-requests/:requestId/reject`
- `POST /api/clinics/:id/invites/code-role`
- `POST /api/clinics/:id/invites/regenerate-code`

### 4.13 Lista de espera (`/api/waiting-list`)
- `GET /api/waiting-list`
- `POST /api/waiting-list`
- `PUT /api/waiting-list/:id`
- `DELETE /api/waiting-list/:id`

### 4.14 Notas de agenda (`/api/agenda-notes`)
- `GET /api/agenda-notes`
- `POST /api/agenda-notes`
- `PUT /api/agenda-notes/:id`
- `DELETE /api/agenda-notes/:id`

### 4.15 Outros (`/api/outros`)
- `GET /api/outros/bulas/search`
- `GET /api/outros/bulas/:id`
- `GET /api/outros/cid10/chapters`
- `GET /api/outros/cid10/search`
- `GET /api/outros/cid10/code/:code`
- `GET /api/outros/contacts`
- `GET /api/outros/logs`

### 4.16 CID (`/api/cid`, `/api/cid10`, `/api/cid11`)
`/api/cid`:
- `GET /api/cid/inss/:codigo`

`/api/cid10`:
- `GET /api/cid10`
- `GET /api/cid10/capitulos`
- `GET /api/cid10/grupos`
- `GET /api/cid10/:codigo`

`/api/cid11`:
- `GET /api/cid11`
- `GET /api/cid11/capitulos`
- `GET /api/cid11/blocos`
- `GET /api/cid11/:codigo`

### 4.17 WhatsApp (`/api/whatsapp`)
- `GET /api/whatsapp/connections`
- `GET /api/whatsapp/connections/:id/status`
- `POST /api/whatsapp/connections`
- `POST /api/whatsapp/connections/:id/qr`
- `POST /api/whatsapp/connections/:id/pairing-code`
- `POST /api/whatsapp/connections/:id/disconnect`
- `POST /api/whatsapp/connections/:id/logout`
- `DELETE /api/whatsapp/connections/:id`
- `GET /api/whatsapp/chats`
- `POST /api/whatsapp/chats`
- `GET /api/whatsapp/chats/:chatId/avatar`
- `GET /api/whatsapp/chats/:chatId/messages`
- `PATCH /api/whatsapp/chats/:chatId/ai`
- `POST /api/whatsapp/chats/:chatId/composing`
- `POST /api/whatsapp/connections/:id/messages`
- Templates:
  - `GET /api/whatsapp/templates`
  - `POST /api/whatsapp/templates`
  - `PUT /api/whatsapp/templates/:id`
  - `DELETE /api/whatsapp/templates/:id`
  - `POST /api/whatsapp/templates/preview`
- Settings:
  - `GET /api/whatsapp/settings`
  - `PUT /api/whatsapp/settings`

### 4.18 Prescricoes (`/api/prescriptions` e validação publica em `/api/public`)
Autenticado:
- `GET /api/prescriptions/context/:routeId`
- `GET /api/prescriptions/templates`
- `GET /api/prescriptions`
- `GET /api/prescriptions/:id`
- `GET /api/prescriptions/:id/pdf`
- `POST /api/prescriptions`
- `PATCH /api/prescriptions/:id`
- `POST /api/prescriptions/:id/items`
- `DELETE /api/prescriptions/:id/items/:itemId`
- `POST /api/prescriptions/:id/finalize`
- `POST /api/prescriptions/:id/resend-whatsapp`
- `POST /api/prescriptions/:id/renew`

Public:
- `GET /api/public/prescriptions/validate/:code`

### 4.19 Medicamentos (`/api/medicamentos`)
- `GET /api/medicamentos/search?q=...`
- `GET /api/medicamentos/products/:id`

### 4.20 Exames (`/api/exames`)
- `GET /api/exames/search?q=...`
- `GET /api/exames/:code`

### 4.21 Vacinas (`/api/vacinas`)
- `GET /api/vacinas/search?q=...`

### 4.22 Financeiro (`/api/finance`)
- `GET /api/finance/summary`
- `GET /api/finance/cash-flow`
- `GET /api/finance/analysis`
- `GET /api/finance/transactions`
- `POST /api/finance/transactions`
- `PATCH /api/finance/transactions/:id/status`
- `DELETE /api/finance/transactions/:id`
- Lookups:
  - `GET /api/finance/accounts`
  - `POST /api/finance/accounts`
  - `GET /api/finance/categories`
  - `POST /api/finance/categories`
  - `GET /api/finance/cost-centers`
  - `POST /api/finance/cost-centers`
  - `GET /api/finance/payment-methods`
  - `POST /api/finance/payment-methods`
- Config:
  - `GET /api/finance/settings`
  - `PUT /api/finance/settings`
- Clinmax Pay:
  - `GET /api/finance/pay/settings`
  - `PUT /api/finance/pay/settings`
  - `PATCH /api/finance/pay/enabled`

### 4.23 Relatorios (`/api/reports`)
- `GET /api/reports/attendance`
- `GET /api/reports/no-shows`
- `GET /api/reports/birthdays`
- `GET /api/reports/cid`
- `GET /api/reports/repasse`

### 4.24 Estoque (`/api/inventory`)
- `GET /api/inventory/products`
- `POST /api/inventory/products`
- `POST /api/inventory/movements`
- `GET /api/inventory/movements`

### 4.25 TISS (`/api/tiss`)
- `GET /api/tiss/guides`
- `POST /api/tiss/guides`
- `PATCH /api/tiss/guides/:id/status`

### 4.26 Satisfacao (`/api/satisfaction`)
- `GET /api/satisfaction`
- `GET /api/satisfaction/summary`
- `POST /api/satisfaction`
- `POST /api/satisfaction/:id/send`
- `POST /api/satisfaction/:id/answer`

### 4.27 Webhooks (`/api/webhooks`)
- `POST /api/webhooks/asaas`

## 5. Modelo de dados (Prisma)

O `schema.prisma` define entidades principais como:

- `Clinic` (clinica e parametros de agenda)
- `User` e `UserClinic` (usuarios e relacao multi-clinica)
- `Patient` (dados do paciente)
- `Doctor` e `ReceptionistDoctor` (profissionais)
- `Appointment` e `AppointmentProcedure` (agendamentos e procedimentos)
- `MedicalRecord` (registro de atendimento)
- `WaitingListEntry`
- `AgendaNote`
- WhatsApp:
  - `WhatsappConnection` (conexao Baileys)
  - `WhatsappChat` (chat do whatsapp)
  - `WhatsappMessage` (mensagens persistidas)
  - `WhatsappMessageTemplate` e `WhatsappOutbox` (templates e fila)
  - `ClinicWhatsappSettings`
- Prescricoes:
  - `Prescription`, `PrescriptionItem`, `PrescriptionTemplate` e itens
  - `PrescriptionShare` (compartilhamento)
  - `PrescriptionSignature` (stub de assinatura digital)
- Financeiro:
  - `FinancialAccount`, `FinancialCategory`, `CostCenter`, `PaymentMethod`
  - `FinancialTransaction`
  - `ClinicFinanceSettings` e `ClinicPixRecipient`
  - `PlatformPayment` e `PlatformPayout`
- Estoque:
  - `InventoryProduct` e `InventoryMovement`
- TISS:
  - `TissGuide`
- Satisfacao:
  - `SatisfactionSurvey`

Tambem existem enums (status e tipos) como `AppointmentStatus`, `Role`, `PrescriptionStatus`, `FinancialTransactionType` etc.

## 6. Fluxos principais (como o produto funciona)

### 6.1 Onboarding e acesso
- Usuario faz login ou cadastro.
- Conclui onboarding no backend (`/api/auth/complete-onboarding`).
- O frontend redireciona para a rota adequada (depende de role e permissões).

### 6.2 Agenda e atendimento
- `AgendaPage` usa rotas de agenda do frontend e chama endpoints de `/api/appointments`.
- Criar consulta exige permissao de `agenda:manage`.
- Durante ou apos atendimento:
  - CID (opcional) pode ser vinculado via update em `appointments/:id`.
  - O backend valida regras como intervalo de agenda e almoco.

### 6.3 Leitura e envio via WhatsApp
- `MensagensPage` chama:
  - endpoints de conexao, chats, templates e settings.
- Para lembretes de consulta:
  - `POST /api/appointments/:id/reminder`.
- Para IA automatica:
  - o backend processa eventos inbound de WhatsApp (conforme implementado na camada de manager/whatsapp).

### 6.4 Prescricoes
- `PrescricoesPage` cria e atualiza prescricoes via `/api/prescriptions`.
- Ao finalizar:
  - gera PDF e disponibiliza validacao publica.
  - pode redirecionar compartilhamento (ex.: WhatsApp via `resend-whatsapp`).

### 6.5 Financeiro, pagos e relatórios
- `FinancasPage` e telas de extrato e fluxo:
  - chamam `/api/finance/*` (summary, transactions, cash-flow, analysis).
- Pagamento:
  - configuracoes em `/api/finance/pay/settings`.
  - webhook do Asaas em `/api/webhooks/asaas`.
- Relatorios:
  - chamam `/api/reports/*`.

### 6.6 Estoque e TISS
- `EstoquePage` usa `/api/inventory/*`.
- `TissPage` usa `/api/tiss/*`.

### 6.7 Pesquisa de satisfacao
- `PesquisaSatisfacaoPage` usa:
  - `/api/satisfaction`
  - `/api/satisfaction/summary`
  - envio e respostas.

## 7. O que nao funciona (checagem tecnica feita aqui)

### 7.1 Frontend: `npm run build` falha

Ao rodar `npm run build` em `front-projeto-clinica`, o `tsc -b` falha com erros TypeScript, incluindo:

- Problema de tipo em `AgendaWeekGrid.tsx` (um valor do tipo `string | (() => void)` foi parar como `ReactNode`).
- Erros `TS6133` por variaveis/imports declarados e nao usados em:
  - `AppointmentDetailDrawer.tsx`
  - `AppointmentDetailView.tsx`
  - `AppointmentFormModal.tsx`
  - `AuthLayout.tsx`
  - `PainelPage.tsx`
  - outros trechos
- Erro de tipo em options do componente de confirmacao:
  - `AppointmentDetailView.tsx` com `onConfirm` nao existente em `ConfirmOptions`.
- Erro de compatibilidade de target:
  - uso de `string[].at` em `ClinicasPage.tsx`.
- Erro de identificador duplicado:
  - `src/services/api.ts` possui `clinicName` duplicado.

Implicacao pratica:
- `npm run dev` pode continuar funcionando (dependendo de how dev transpile),
- mas **build de producao esta bloqueado** enquanto esses erros existirem.

### 7.2 Backend: `npm run build` falha

Ao rodar `npm run build` em `back-projeto-clinica`, o `tsc` falha com:
- `TS5103`: valor invalido para `--ignoreDeprecations` no `tsconfig.json`.

Implicacao pratica:
- o build para `dist/` pode estar indisponivel.
- o `dev` pode rodar via `tsx --watch`, mas build estara quebrado.

### 7.3 Pontos de falha dependentes de configuracao externa (provaveis)

Mesmo quando compila, o sistema pode falhar se:

- **Backend estiver fora do ar**:
  - O frontend proxy do Vite intercepta rotas `/api` e retorna `502` com mensagem de “API indisponivel”.
- **Token invalido / sessão expirada**:
  - `src/services/api.ts` envia token via localStorage.
  - se o token expirar, o backend retorna `401` e o frontend trata erro como mensagem de API.
- **Google OAuth nao configurado**:
  - Requires `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
- **WhatsApp conectado offline**:
  - o endpoint de reminder valida status do socket e retorna erros especificos se offline.
- **WhatsApp AI sem OpenRouter configurado**:
  - `aiDraft` e assistente dependem de `OPENROUTER_API_KEY`.
  - se ausente, o backend retorna erros como indisponibilidade (503).
- **Clinmax Pay (Asaas) sem configuracao**:
  - endpoints de pagamento e webhook falham se `ASAAS_API_KEY` ou tokens de webhook estiverem ausentes.
- **Bulas e bases clinicas sem chaves ou fora do ar**:
  - endpoints de bulas, TUSS, Anvisa e correlatos dependem de URLs e chaves.
- **Storage GenInfra sem tokens**:
  - upload/download de imagens e arquivos falham se `STORAGE_CONNECTION_TOKEN` e endpoints nao estiverem corretos.

## 8. Navegacao, layout e permissoes

### 8.1 Shell do app autenticado

- `AppShell`: header fixo (`AppHeader`) + area de conteudo (`Outlet`).
- Onboarding em overlay: se o usuario se cadastrou sozinho e ainda nao concluiu setup, `OnboardingPage` abre por cima do app ate finalizar.
- Configuracoes usam `SettingsLayout` com sidebar (`SettingsSidebar`).

### 8.2 Menu principal (navbar)

| Item | Rota | Permissao |
|---|---|---|
| Painel | `/dashboard` | `dashboard:view` |
| Agenda | `/agenda` | `agenda:view` |
| Pacientes | `/pacientes` (+ prontuario/atendimento) | `patients:view` |
| Mensagens | `/mensagens` | `whatsapp:send` |
| Configuracoes | `/configuracoes/*` | `clinics:manage` ou itens de Outros |
| Gestao | dropdown | `finance:view` ou `reports:view` |

Acoes rapidas (+) na navbar:
- Novo agendamento: `agenda:manage`
- Novo paciente: `patients:create`
- Novo profissional/usuario: `users:manage`

### 8.3 Home pos-login por cargo

| Cargo | Destino |
|---|---|
| Admin / Consultor | `/dashboard` |
| Profissional / Recepcao | `/agenda` |
| Financeiro | `/gestao/financas` |

Detalhe completo de permissoes: `docs/cargos-ui.md`.

---

## 9. Catalogo detalhado de telas

Legenda de status:
- **OK**: implementado e ligado a API.
- **Parcial**: UI existe, mas depende de config externa ou tem lacunas.
- **Legado**: rota antiga ou redireciona.
- **Quebrado**: build ou TypeScript falhando no momento.

---

### 9.1 Area publica e autenticacao

#### `/` - LandingPage
- **O que e**: pagina de marketing do ClinMax (hero, features, planos, FAQ, CTA).
- **Para que serve**: captar leads e direcionar para login/cadastro.
- **API**: nenhuma (conteudo estatico em `lib/landing-content.ts`).
- **Status**: OK.

#### `/login` - Login
- **O que e**: formulario email/senha + Google OAuth.
- **Fluxo**: autentica, salva token no `localStorage`, define home por cargo e flags de onboarding.
- **API**: `POST /api/auth/login`, redirect para `/api/auth/google`.
- **Status**: OK (Google depende de `GOOGLE_CLIENT_ID`).

#### `/register` - Register
- **O que e**: cadastro de novo usuario (nome, email, CPF, senha).
- **Fluxo**: cria conta e abre onboarding overlay no primeiro acesso.
- **API**: `POST /api/auth/register`.
- **Status**: OK.

#### `/auth/google/callback` - GoogleCallbackPage
- **O que e**: retorno do OAuth Google.
- **API**: backend processa em `GET /api/auth/google/callback`.
- **Status**: Parcial (precisa credenciais Google).

#### `/convite/:token` - AcceptInvitePage
- **O que e**: aceitar convite por link (criar senha ou vincular conta logada).
- **Fluxo**: preview do convite, formulario com CRM/especialidade se medico, entra na clinica.
- **API**: `GET /api/invites/preview/:token`, `POST /api/invites/accept/:token`.
- **Status**: OK.

#### `/aguardando-acesso` - AguardandoAcessoPage
- **O que e**: tela de espera quando usuario entrou por codigo e admin ainda nao aprovou.
- **Fluxo**: polling a cada 4s em `/api/auth/me` ate `clinicId` aparecer ou pedido ser rejeitado.
- **API**: `GET /api/auth/me`.
- **Status**: OK.

---

### 9.2 App principal (pos-login)

#### `/dashboard` - PainelPage
- **O que e**: painel operacional do dia (metricas, pacientes de hoje, proximas consultas).
- **Para que serve**: visao rapida para admin/consultor.
- **API**: `GET /api/dashboard/panel-metrics`, `GET /api/dashboard/today-patients`, `GET /api/dashboard/upcoming`.
- **Status**: OK.

#### `/agenda` - AgendaPage
- **O que e**: grade semanal de consultas por profissional, com busca e filtros.
- **Para que serve**: operacao diaria da clinica (agendar, ver detalhes, lista de espera, notas, impressao).
- **Componentes internos**:
  - `AgendaWeekGrid`: grade visual da semana.
  - `AppointmentDetailView`: painel lateral de detalhe do agendamento.
  - `AppointmentFormModal`: criar/editar consulta ou bloqueio.
  - `WaitingListDrawer`: lista de espera.
  - `AgendaNotesDrawer`: anotacoes da agenda.
  - `AgendaPrintPreview`: impressao da agenda.
- **API principais**:
  - `GET /api/appointments` (intervalo da semana)
  - `GET /api/doctors`
  - `GET /api/clinics/:id` (horarios da clinica)
  - `GET/POST/PUT/DELETE /api/waiting-list`
  - `GET/POST/PUT/DELETE /api/agenda-notes`
- **Acoes no detalhe do agendamento** (conforme cargo):
  - mudar status, iniciar atendimento, abrir prontuario
  - cobrar (`POST /api/appointments/:id/charge`)
  - recebimento (`POST /api/appointments/:id/receipt`)
  - lembrete WhatsApp (`POST /api/appointments/:id/reminder`)
  - ver Pix Clinmax Pay (`GET /api/appointments/:id/pay`)
- **Status**: OK na operacao; **Quebrado** no build (`AgendaWeekGrid`, `AppointmentDetailView`).

#### `/pacientes` - Patients
- **O que e**: lista paginada de pacientes com busca.
- **Para que serve**: cadastro e acesso ao prontuario.
- **API**: `GET /api/patients`, `POST /api/patients` (via modal).
- **Acoes**: abrir prontuario, editar (se permissao), arquivar.
- **Status**: OK.

#### `/prontuario/:pacienteId` - ProntuarioPage
- **O que e**: visao longitudinal do paciente (historico, acompanhamentos, prescricoes).
- **Abas**: Historico de consulta, Tabela de acompanhamentos, Prescricoes.
- **API**: `GET /api/patients/:id`, `GET /api/patients/:id/history`, prescricoes via `PrescricaoPanel`.
- **Acoes**: retomar atendimento em andamento, ir para `/atendimento/:id`.
- **Status**: OK.

#### `/atendimento/:id` - AtendimentoPage
- **O que e**: tela de consulta em andamento (SOAP simplificado).
- **Para que serve**: registrar queixa, exame, CID, conduta e prescrever.
- **Campos**: queixa principal, HMA, exame fisico, antecedentes, CID, condutas, prescrevo, observacoes.
- **API**:
  - `GET /api/appointments/:id`
  - `GET /api/patients/:id`
  - `PUT /api/appointments/:id` (salvar campos clinicos e CID)
  - `POST /api/appointments/:id/ai-draft` (rascunho com IA)
  - busca CID: `GET /api/cid10`, `GET /api/cid11`
- **Status**: OK (IA depende de OpenRouter).

#### `/prescricoes/:atendimentoId` - PrescricoesPage
- **O que e**: rota legada; redireciona para `/prontuario/:id?tab=prescricoes`.
- **API**: `GET /api/prescriptions/context/:routeId`.
- **Status**: Legado (redirect).

#### `/mensagens` - MensagensPage
- **O que e**: inbox WhatsApp estilo chat (lista + conversa).
- **Para que serve**: atendimento humano, templates, pausar IA por conversa.
- **API**:
  - `GET /api/whatsapp/chats`, `GET /api/whatsapp/chats/:id/messages`
  - `POST /api/whatsapp/connections/:id/messages`
  - `GET /api/whatsapp/templates`
  - `PATCH /api/whatsapp/chats/:id/ai` (pausar/retomar bot)
  - `POST /api/whatsapp/chats/:id/composing`
- **Status**: OK (requer conexao WhatsApp ativa).

#### OnboardingPage (overlay, nao e rota `/onboarding`)
- **O que e**: wizard pos-cadastro (criar clinica ou entrar por codigo).
- **Etapas**: papel, dados da clinica, horarios, convites iniciais, codigo de entrada.
- **API**: `POST /api/auth/complete-onboarding`, `GET /api/invites/clinic-code/:code`.
- **Status**: OK. Rota `/onboarding` redireciona para `/dashboard`.

#### `ModuleUnavailablePage`
- **O que e**: fallback 404 amigavel dentro do app.
- **Status**: OK.

---

### 9.3 Gestao (`/gestao/*`)

Todas usam `GestaoPageShell` + menu lateral (`lib/gestao-nav.ts`).

#### `/gestao/financas` - FinancasPage
- **O que e**: resumo financeiro (saldo, receitas, despesas, graficos por convenio/categoria).
- **API**: `GET /api/finance/summary`.
- **Status**: OK.

#### `/gestao/financas/extrato` (+ receitas/despesas) - ExtratoPage
- **O que e**: lista de lancamentos com filtros; mesma pagina com `fixedType` para receitas/despesas.
- **API**: `GET /api/finance/transactions`, `POST /api/finance/transactions`, lookup de contas/categorias.
- **Status**: OK.

#### `/gestao/financas/fluxo-de-caixa` - FluxoCaixaPage
- **O que e**: fluxo diario/mensal de entradas e saidas.
- **API**: `GET /api/finance/cash-flow`.
- **Status**: OK.

#### `/gestao/relatorios` - RelatoriosPage
- **O que e**: hub de relatorios com abas.
- **Abas e APIs**:
  - Atendimentos: componente `RelatoriosAtendimentoPage` + `GET /api/reports/attendance`
  - Faltas: `GET /api/reports/no-shows`
  - CID: `GET /api/reports/cid`
  - Aniversariantes: `GET /api/reports/birthdays`
  - Repasse: `GET /api/reports/repasse`
  - Analise receitas/despesas: `GET /api/finance/analysis`
- **Status**: OK.

#### `/gestao/estoque` - EstoquePage
- **O que e**: produtos, estoque minimo, validade, movimentacoes.
- **API**: `GET/POST /api/inventory/products`, `POST /api/inventory/movements`.
- **Status**: OK.

#### `/gestao/tiss` - TissPage
- **O que e**: guias TISS (rascunho, enviada, aprovada, rejeitada).
- **API**: `GET/POST /api/tiss/guides`, `PATCH /api/tiss/guides/:id/status`.
- **Status**: Parcial (CRUD basico; sem XML TISS real).

#### `/gestao/pesquisa-satisfacao` - PesquisaSatisfacaoPage
- **O que e**: pesquisas pos-atendimento (criar, marcar enviada, registrar nota).
- **API**: `GET /api/satisfaction`, `GET /api/satisfaction/summary`, `POST /api/satisfaction`, etc.
- **Status**: Parcial (envio real por WhatsApp nao automatizado na UI).

---

### 9.4 Outros (`/outros/*`)

Menu em `SettingsSidebar` > accordion Outros (`lib/outros-nav.ts`).

#### `/outros/bulas` - BulasPage
- **O que e**: busca de medicamentos/bulas (Anvisa Bulapi).
- **API**: `GET /api/outros/bulas/search`.
- **Status**: Parcial (depende de APIs externas e cache).

#### `/outros/bulas/:id` - BulaDetailPage
- **O que e**: detalhe com secoes (indicacao, posologia, contraindicacoes, etc.).
- **API**: `GET /api/outros/bulas/:id`.
- **Status**: Parcial.

#### `/outros/cid-10` - Cid10Page
- **O que e**: busca CID-10 por capitulo/grupo/codigo.
- **API**: `GET /api/cid10/*` e rotas legadas em `/api/outros/cid10/*`.
- **Status**: OK (requer seed/import CID no banco).

#### `/outros/cid-11` - Cid11Page
- **O que e**: busca CID-11 por bloco/capitulo/codigo.
- **API**: `GET /api/cid11/*`.
- **Status**: OK (requer seed/import).

#### `/outros/contatos` - ContatosPage
- **O que e**: lista unificada de contatos (pacientes, profissionais, fornecedores).
- **API**: `GET /api/outros/contacts`.
- **Status**: OK.

#### `/outros/logs` - LogsPage
- **O que e**: auditoria de acoes (agenda, pacientes, atendimento, etc.).
- **API**: `GET /api/outros/logs`.
- **Status**: OK (so admin).

---

### 9.5 Configuracoes (`/configuracoes/*`)

Layout: sidebar fixa + conteudo. Itens visiveis por permissao.

| Rota | Pagina | O que faz | API principal | Status |
|---|---|---|---|---|
| `/configuracoes/clinicas` | ClinicasPage | Nome, CNPJ, endereco, logo, dias de operacao | `GET/PUT /api/clinics/:id` | OK (build TS quebrado em `.at()`) |
| `/configuracoes/agenda` | AgendaConfigPage | Horario expediente, almoco, intervalo slots | `PUT /api/clinics/:id` | OK |
| `/configuracoes/financeiro` | FinanceConfigPage | Contas, categorias, centros, formas, Clinmax Pay | `/api/finance/*`, `/api/finance/pay/*` | OK |
| `/configuracoes/whatsapp` | WhatsappPage | Conexoes QR/pairing, templates, lembretes, IA | `/api/whatsapp/*` | OK |
| `/configuracoes/convites` | ConvitesConfigPage | Convites email, codigo da clinica, aprovar entrada | `/api/clinics/:id/invites`, `/api/invites/*` | OK |
| `/configuracoes/usuarios` | UsuariosPage | Lista usuarios, ativar/desativar, pedidos pendentes | `/api/users` | OK |
| `/configuracoes/usuarios/novo` | UsuarioFormPage | Criar usuario admin/recepcao/financeiro | `POST /api/users` | OK |
| `/configuracoes/usuarios/:id` | UsuarioFormPage | Editar usuario | `PUT /api/users/:id` | OK |
| `/configuracoes/usuarios/profissional/novo` | ProfissionalFormPage | Criar medico vinculado | `POST /api/users` + perfil doctor | OK |
| `/configuracoes/aparencia` | AparenciaPage | Tema claro/escuro (localStorage) | nenhuma | OK |
| `/configuracoes/conta` | MinhaContaPage | Nome, email, senha, avatar | `PATCH /api/auth/me`, upload avatar | Parcial (storage GenInfra) |

Subsecoes dentro de WhatsappPage:
- `WhatsappTemplatesSection`: CRUD templates.
- `WhatsappRemindersSection`: offsets de lembrete e auto-reminder.

`ClinmaxPaySettingsCard` (em FinanceConfigPage):
- Cadastro chave Pix, titular, habilitar Clinmax Pay.
- **API**: `PUT /api/finance/pay/settings`, `PATCH /api/finance/pay/enabled`.

---

### 9.6 Backoffice (`/backoffice/*`)

Area separada para donos da plataforma (`isAccountAdmin`). Token proprio em `backoffice_token`.

| Rota | Pagina | O que faz | API |
|---|---|---|---|
| `/backoffice/login` | BackofficeLogin | Login platform owner | `POST /api/backoffice/login` |
| `/backoffice` | BackofficeDashboard | Metricas globais | `GET /api/backoffice/metrics` |
| `/backoffice/clinicas` | BackofficeClinicsPage | CRUD clinicas | `/api/backoffice/clinics` |
| `/backoffice/usuarios` | BackofficeUsersPage | Usuarios de todas clinicas | `/api/backoffice/users` |
| `/backoffice/usuarios/novo` | BackofficeUserFormPage | Criar usuario plataforma | `POST /api/backoffice/users` |
| `/backoffice/usuarios/:id` | BackofficeUserFormPage | Editar usuario | `PUT /api/backoffice/users/:id` |
| `/backoffice/pacientes` | BackofficePatientsPage | Pacientes cross-clinica | `GET /api/backoffice/patients` |
| `/backoffice/plataforma` | BackofficePlatformPage | Config plataforma (placeholder) | nenhuma dedicada |

**Status**: OK (requer usuario platform owner no seed).

---

### 9.7 Telas legadas (nao usar)

| Rota | Arquivo | Destino atual |
|---|---|---|
| `/doctors` | Doctors.tsx | Tela antiga de medicos (fora do shell padrao) |
| `/appointments` | Appointments.tsx | redirect `/agenda` |
| `/records` | Records.tsx | redirect `/pacientes` |
| `/dashboard` (antigo) | Dashboard.tsx | substituido por PainelPage |
| `/settings` | Settings.tsx | redirect configuracoes |
| `/financas/*`, `/relatorios/*` | LegacyRouteRedirect | novas rotas em `/gestao/*` |

---

## 10. Drawers, modais e componentes flutuantes

| Componente | Onde abre | O que faz | API |
|---|---|---|---|
| `AppointmentFormModal` | Agenda (+), slot vazio | Criar consulta/bloqueio, paciente inline, procedimentos, Pix | `POST /api/appointments`, `GET /api/patients`, `GET /api/procedures` |
| `AppointmentDetailView` | Clique na consulta | Status, cobranca, atendimento, WhatsApp | `GET/PUT /api/appointments/:id`, charge, receipt, reminder |
| `AppointmentDetailDrawer` | (legado/substituto parcial) | Versao drawer do detalhe | mesmas APIs |
| `WaitingListDrawer` | Agenda | Fila de espera por especialidade | `/api/waiting-list` |
| `AgendaNotesDrawer` | Agenda | Notas do dia/profissional/paciente | `/api/agenda-notes` |
| `AgendaPrintPreview` | Agenda | Impressao da semana | dados ja carregados |
| `PatientFormModal` | Pacientes | Cadastro/edicao paciente | `POST/PUT /api/patients`, lookup duplicados |
| `WhatsappSendDrawer` | Agenda/detalhe | Enviar msg rapida ao paciente | `POST /api/whatsapp/connections/:id/messages` |
| `NewWhatsappChatModal` | Mensagens | Iniciar conversa por telefone | `POST /api/whatsapp/chats` |
| `TransactionFormModal` | Extrato | Lancamento receita/despesa/transferencia | `POST /api/finance/transactions` |
| `MedicationFormModal` | Prescricao | Item medicamento (busca Bulas/Pharmadb) | `/api/medicamentos/search` |
| `VaccineFormModal` | Prescricao | Item vacina | `/api/vacinas/search` |
| `PrescriptionHistoryModal` | Prescricao | Historico de receitas do paciente | `/api/prescriptions` |
| `SignatureStubModal` | Prescricao | Assinatura digital (stub/futuro) | nenhuma real |
| `ClinicalFieldModal` | Prontuario | Editar campo clinico longo | via appointment update |
| `confirm-modal` | Global | Confirmacao de acoes destrutivas | nenhuma |

---

## 11. Fluxos ponta a ponta (jornadas)

### 11.1 Novo usuario cria clinica

```
Landing → Register → Login automatico → Onboarding overlay
  → complete-onboarding (cria clinica + admin)
  → Dashboard ou Agenda
```

### 11.2 Funcionario entra por convite

```
Email com link → /convite/:token → preview → accept
  → login automatico → home por cargo
```

### 11.3 Funcionario entra por codigo

```
Onboarding ou Register → join-by-code
  → /aguardando-acesso (polling)
  → admin aprova em Configuracoes > Usuarios
  → usuario entra no app
```

### 11.4 Dia de consulta (recepcao)

```
Agenda → selecionar consulta → detalhe
  → confirmar presenca / marcar falta
  → cobrar (local ou Pix Clinmax Pay)
  → lembrete WhatsApp (opcional)
```

### 11.5 Atendimento medico

```
Agenda → iniciar atendimento (status IN_PROGRESS)
  → /atendimento/:id → preencher SOAP + CID
  → (opcional) IA draft
  → prescrever via prontuario
  → finalizar consulta (COMPLETED)
```

### 11.6 Prescricao digital

```
Prontuario > Prescricoes → criar rascunho
  → adicionar itens (med/exame/vacina)
  → finalizar → PDF + codigo validacao
  → (opcional) enviar WhatsApp
```

Paciente valida em: `/api/public/prescriptions/validate/:code?accessCode=...`

### 11.7 WhatsApp com IA

```
Configuracoes > WhatsApp → conectar numero (QR)
  → habilitar assistente + auto-resposta
  → paciente manda msg → backend (Baileys) recebe
  → whatsapp-ai.service processa → OpenRouter + tools
  → resposta automatica ou handoff humano (pausar IA)
```

Tools da IA: listar medicos, buscar horarios, resolver paciente, agendar consulta, enviar lembrete, enviar prescricao.

### 11.8 Pagamento Clinmax Pay

```
Config > Financeiro > Clinmax Pay → cadastrar Pix
  → habilitar
  → Agenda > cobrar consulta → gera QR Pix (Asaas)
  → paciente paga → webhook Asaas confirma
  → repasse Pix para clinica (menos taxa plataforma)
```

---

## 12. Status funcional por modulo (resumo)

| Modulo | Funciona | Observacoes |
|---|---|---|
| Auth (email/senha) | Sim | OK |
| Google OAuth | Parcial | Precisa env |
| Onboarding | Sim | Overlay pos-register |
| Convites / codigo clinica | Sim | Email depende SMTP |
| Dashboard / Painel | Sim | OK |
| Agenda (CRUD) | Sim | Build TS quebrado |
| Lista espera / notas agenda | Sim | OK |
| Pacientes | Sim | OK |
| Prontuario / historico | Sim | OK |
| Atendimento clinico | Sim | OK |
| Prescricoes + PDF | Sim | Assinatura digital e stub |
| Bulas / CID | Parcial | Depende seed + APIs externas |
| WhatsApp manual | Sim | Precisa conexao ativa |
| WhatsApp IA / bot | Parcial | OpenRouter + Baileys |
| Lembretes automaticos | Parcial | Scheduler no boot do backend |
| Financeiro (lancamentos) | Sim | OK |
| Clinmax Pay / Pix | Parcial | Asaas + webhook |
| Relatorios | Sim | OK |
| Estoque | Sim | CRUD basico |
| TISS | Parcial | Sem geracao XML |
| Pesquisa satisfacao | Parcial | Sem link publico automatizado |
| Backoffice plataforma | Sim | OK |
| Build producao frontend | Nao | Erros TypeScript |
| Build producao backend | Nao | tsconfig invalido |

---

## 13. Documentos relacionados no repo

| Arquivo | Conteudo |
|---|---|
| `docs/cargos-ui.md` | Permissoes por cargo na UI |
| `docs/onboarding-logica.md` | Fluxo de onboarding |
| `docs/pacientes-logica.md` | Regras de pacientes |
| `docs/financeiro.md` | Modulo financeiro |
| `docs/whatsapp-bot.md` | Bot WhatsApp e IA |
| `docs/configuracoes.md` | Telas de config |
| `docs/bulas-e-cid.md` | Ferramentas clinicas |
| `docs/dia-operacao-papeis.md` | Operacao por papel |

---

## 14. Resultado deste documento

Este inventario cobre o monorepo ClinMax de ponta a ponta. As secoes 1 a 13 descrevem rotas, telas, APIs e integracoes. As secoes 15 a 35 aprofundam arquitetura, servicos, banco, permissoes, fluxos de negocio e debitos tecnicos.

---

## 15. Como rodar localmente

### 15.1 Estrutura do monorepo

```
mono-repo-projeto-clinica/
├── front-projeto-clinica/   React + Vite (porta 5173)
├── back-projeto-clinica/    Fastify + Prisma (porta 3001)
├── package.json             npm run dev sobe os dois
└── scripts/wait-api.cjs     front espera API antes de subir
```

Cada pasta (`front` e `back`) e um repositorio git proprio dentro do mono-repo.

### 15.2 Pre-requisitos

- Node.js 20+ recomendado
- npm
- SQLite (embutido via Prisma em dev)

### 15.3 Primeira vez (backend)

```bash
cd back-projeto-clinica
npm install
cp .env.example .env   # se existir; ou criar .env manualmente
npm run db:push        # cria/atualiza schema SQLite
npm run db:seed        # dados demo (admin, medico, recepcao, pacientes)
npm run dev            # API em http://localhost:3001
```

### 15.4 Primeira vez (frontend)

```bash
cd front-projeto-clinica
npm install
cp .env.example .env
npm run dev            # SPA em http://localhost:5173
```

### 15.5 Subir tudo de uma vez (raiz)

```bash
cd mono-repo-projeto-clinica
npm install
npm run dev
```

O script `dev` usa `concurrently` para subir backend e frontend. O front so inicia depois que a API responde (`wait-api.cjs`).

### 15.6 Proxy de API no Vite

O frontend chama `/api/*`. O Vite faz proxy para `VITE_API_TARGET` (padrao `http://127.0.0.1:3001`). Em producao, o mesmo path deve apontar para o backend real.

### 15.7 Integracoes opcionais para testar

| Integracao | O que precisa |
|---|---|
| WhatsApp | Conectar QR em Configuracoes. Baileys roda no backend. |
| WhatsApp IA | `OPENROUTER_API_KEY` ou NineRouter em `localhost:20128` |
| E-mail convites | SMTP (`MAIL_SMTP_*`) |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Clinmax Pay | `ASAAS_API_KEY_BASE64`, webhook, chave Pix |
| Bulas externas | `BULAPI_*`, `ANVISA_*` |
| Avatars bucket | GenInfra (`STORAGE_*`) |

Sem essas variaveis, o core (agenda, pacientes, prontuario, financeiro manual) funciona com seed local.

---

## 16. Variaveis de ambiente

### 16.1 Frontend (`front-projeto-clinica/.env`)

| Variavel | Padrao | Funcao |
|---|---|---|
| `VITE_PORT` | 5173 | Porta do dev server |
| `VITE_API_BASE` | `/api` | Prefixo das chamadas HTTP |
| `VITE_API_ORIGIN` | `http://127.0.0.1:3001` | Origem absoluta (quando necessario) |
| `VITE_API_TARGET` | `http://127.0.0.1:3001` | Alvo do proxy Vite |

### 16.2 Backend (`back-projeto-clinica/.env`)

Lidas em `src/lib/env.ts` e outros modulos.

| Variavel | Funcao |
|---|---|
| `JWT_SECRET` | Assinatura do token JWT (padrao dev: `clinicare-dev-secret`) |
| `JWT_EXPIRES` | Expiracao do token (padrao `7d`) |
| `PORT` | Porta da API (padrao 3001) |
| `PUBLIC_APP_URL` | URL publica da API (OAuth callback) |
| `FRONTEND_URL` | URL do SPA (redirects pos-login/OAuth) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `GOOGLE_REDIRECT_URI` | Callback OAuth (default derivado de PUBLIC_APP_URL) |
| `MAIL_SMTP_HOST/PORT/USER/PASS` | Envio de convites por e-mail |
| `MAIL_FROM` | Remetente dos e-mails |
| `ASAAS_API_KEY_BASE64` | Chave Asaas em Base64 (evita `$` no dotenv) |
| `ASAAS_API_KEY` | Alternativa direta (menos recomendada) |
| `ASAAS_BASE_URL` | API Asaas (prod: `https://api.asaas.com`) |
| `ASAAS_WEBHOOK_TOKEN` | Token do header `asaas-access-token` |
| `ASAAS_WEBHOOK_EMAIL` | E-mail configurado no webhook Asaas |
| `ASAAS_PIX_KEY` | Chave Pix da conta plataforma |
| `ASAAS_CUSTOMER_ID` | Customer Asaas da plataforma |
| `CLINMAX_PAY_FEE_PERCENT` | Taxa ClinMax Pay (padrao 5%) |
| `OPENROUTER_API_KEY` | IA WhatsApp via OpenRouter |
| `NINEROUTER_KEY` | Alternativa NineRouter local |
| `WHATSAPP_AI_HANDOFF_TIMEOUT_MS` | Tempo para IA retomar apos humano (padrao 30 min) |
| `STORAGE_*` | GenInfra bucket (avatars, logos) |
| `BULAPI_*` | API de bulas |
| `ANVISA_*` | Bulário Anvisa |
| `TUSS_*` | Exames TUSS Brasil API |

### 16.3 localStorage no browser

| Chave | Conteudo |
|---|---|
| `token` | JWT da sessao do app |
| `clinichub_theme` | Tema claro/escuro |
| `backoffice_token` | JWT separado do backoffice plataforma |

---

## 17. Estrutura de pastas

### 17.1 Frontend (`front-projeto-clinica/src`)

| Pasta | Conteudo |
|---|---|
| `pages/` | Uma pagina por rota principal (Agenda, Pacientes, Gestao, Config, Backoffice, Onboarding) |
| `components/` | UI reutilizavel por dominio (agenda, prontuario, layout, ui) |
| `services/` | `api.ts` (cliente HTTP autenticado), `backoffice-api.ts` |
| `context/` | Auth, Toast, Theme |
| `hooks/` | Hooks custom (ex.: `useUnreadMessages`, `useInView`) |
| `lib/` | Helpers puros: permissoes, agenda, onboarding, formatacao, navegacao |
| `types/` | Tipos TypeScript compartilhados |

Contagem aproximada: **196 arquivos** `.ts`/`.tsx` no `src/`.

### 17.2 Backend (`back-projeto-clinica/src`)

| Pasta | Conteudo |
|---|---|
| `routes/` | Registro Fastify de rotas + validacao Zod |
| `controllers/` | Handlers HTTP finos (parse, chama service, responde) |
| `services/` | Regras de negocio e acesso Prisma |
| `lib/` | Permissoes, env, clients externos, helpers |
| `whatsapp/` | Manager Baileys, scheduler lembretes, phone utils |
| `types/` | JwtPayload, AuthContext, etc. |

Contagem aproximada: **147 arquivos** `.ts` no `src/`.

### 17.3 Prisma

| Arquivo | Funcao |
|---|---|
| `prisma/schema.prisma` | Modelos e enums |
| `prisma/seed.ts` | Dados demo + CID seed |
| `prisma/seed-cid10.ts` | Import CID-10 |
| `prisma/seed-cid11.ts` | Import CID-11 |
| `prisma/seed-cid-inss.ts` | Metadados INSS por CID |

---

## 18. Catalogo de services backend

Cada service concentra regra de negocio. Controllers so orquestram HTTP.

| Service | Responsabilidade principal |
|---|---|
| `agenda-note.service.ts` | CRUD notas da agenda (dia, profissional, paciente, recepcao) |
| `appointment.service.ts` | CRUD consultas/bloqueios, slots, conflitos, expediente, almoco, status |
| `attendance-ai.service.ts` | Rascunho SOAP/CID com IA no atendimento |
| `auth.service.ts` | Login, register, JWT, Google OAuth, complete onboarding, perfil |
| `avatar.service.ts` | Upload avatar usuario via GenInfra |
| `backoffice.service.ts` | Login/metricas donos da plataforma, CRUD clinicas/usuarios globais |
| `bula-cache.service.ts` | Cache local de bulas completas |
| `bulas.service.ts` | Busca bulas (Bulapi/Anvisa), detalhe, cache |
| `cid-inss.service.ts` | Metadados INSS (carencia, IRPF, NTEP) por codigo CID |
| `cid10.service.ts` | Busca CID-10 (capitulo, grupo, codigo) |
| `cid11.service.ts` | Busca CID-11 (bloco, capitulo, equivalencia CID-10) |
| `clinic.service.ts` | Dados da clinica, logo, horarios agenda, finance settings |
| `clinmax-pay.service.ts` | Cobranca Pix Asaas, ledger, repasse, webhook, estorno |
| `contacts.service.ts` | Lista contatos agregados (pacientes + WhatsApp) |
| `dashboard.service.ts` | Metricas painel, pacientes do dia, proximos agendamentos |
| `doctor.service.ts` | CRUD medicos/profissionais, visibilidade na agenda |
| `exames.service.ts` | Busca exames TUSS |
| `finance.service.ts` | Livro-caixa: contas, categorias, lancamentos, fluxo, analise |
| `google-oauth.service.ts` | Fluxo OAuth Google (token, perfil) |
| `inventory.service.ts` | Estoque: produtos, movimentos IN/OUT/ADJUST |
| `invite.service.ts` | Convites e-mail, codigo clinica, join requests, aprovacao |
| `logs.service.ts` | AuditLog consulta para tela Logs |
| `mail.service.ts` | Envio SMTP (convites) |
| `medicamentos.service.ts` | Busca medicamentos (Bulapi/Anvisa) |
| `patient-history.service.ts` | Timeline clinica do paciente |
| `patient.service.ts` | CRUD paciente, lookup, duplicidade, strip clinico por permissao |
| `prescription.service.ts` | Prescricoes, itens, PDF, QR, share WhatsApp/e-mail |
| `procedure.service.ts` | Lista procedimentos e precos |
| `record.service.ts` | Registros medicos legados (MedicalRecord) |
| `reports.service.ts` | Relatorios atendimento, repasse, receitas/despesas agrupadas |
| `satisfaction.service.ts` | Pesquisa NPS vinculada a consulta |
| `tiss.service.ts` | Guias TISS (draft, envio simulado, status) |
| `user.service.ts` | Usuarios da clinica, vinculo recepcionista-medico |
| `vacinas.service.ts` | Busca vacinas |
| `waiting-list.service.ts` | Lista de espera, prioridade, status |
| `whatsapp.service.ts` | Conexoes Baileys, QR, pareamento, lifecycle sessao |
| `whatsapp-ai.service.ts` | Loop IA: prompt, historico, tool calls, handoff |
| `whatsapp-ai-tools.service.ts` | Execucao deterministica das ferramentas da IA |
| `whatsapp-booking-orchestrator.ts` | Estado maquina agendamento (confirmacao sem IA) |
| `whatsapp-contact-profile.service.ts` | Foto/nome contato WhatsApp |
| `whatsapp-messaging.service.ts` | Envio imediato de mensagem |
| `whatsapp-patient-phone.service.ts` | Match telefone WhatsApp com paciente |
| `whatsapp-reminder.service.ts` | Lembrete manual/automatico por template |
| `whatsapp-template.service.ts` | CRUD templates com placeholders |

---

## 19. Catalogo de controllers backend

| Controller | Rotas associadas |
|---|---|
| `auth.controller.ts` | `/api/auth/*` |
| `patients.controller.ts` | `/api/patients/*` |
| `doctors.controller.ts` | `/api/doctors/*` |
| `appointments.controller.ts` | `/api/appointments/*` |
| `clinmax-pay.controller.ts` | Pay dentro de appointments e finance |
| `records.controller.ts` | `/api/records/*` |
| `dashboard.controller.ts` | `/api/dashboard/*` |
| `backoffice.controller.ts` | `/api/backoffice/*` |
| `users.controller.ts` | `/api/users/*` |
| `clinics.controller.ts` | `/api/clinics/*` |
| `invite.controller.ts` | `/api/invites/*` + join em clinics |
| `waiting-list.controller.ts` | `/api/waiting-list/*` |
| `agenda-notes.controller.ts` | `/api/agenda-notes/*` |
| `whatsapp.controller.ts` | `/api/whatsapp/*` |
| `prescriptions.controller.ts` | `/api/prescriptions/*` + public validate |
| `medicamentos.controller.ts` | `/api/medicamentos/*` |
| `exames.controller.ts` | `/api/exames/*` |
| `vacinas.controller.ts` | `/api/vacinas/*` |
| `finance.controller.ts` | `/api/finance/*` |
| `reports.controller.ts` | `/api/reports/*` |
| `inventory.controller.ts` | `/api/inventory/*` |
| `tiss.controller.ts` | `/api/tiss/*` |
| `satisfaction.controller.ts` | `/api/satisfaction/*` |
| `cid.controller.ts` | `/api/cid/*` (INSS) |
| `outros.controller.ts` | `/api/outros/*` (contatos, logs wrapper) |

Webhooks Asaas ficam em `routes/webhooks.routes.ts` (sem controller separado).

---

## 20. Modelo Prisma detalhado (todas as tabelas)

### 20.1 Enums principais

| Enum | Valores | Uso |
|---|---|---|
| `Role` | ADMIN, DOCTOR, RECEPTION, CONSULTANT, FINANCE | Cargo do usuario |
| `AppointmentStatus` | SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED | Status consulta |
| `AppointmentType` | SCHEDULE, BLOCK | Consulta ou bloqueio de agenda |
| `PrescriptionStatus` | DRAFT, FINALIZED, CANCELLED | Prescricao |
| `FinancialTransactionType` | INCOME, EXPENSE, TRANSFER | Lancamento caixa |
| `PlatformPaymentStatus` | PENDING, CONFIRMED, RECEIVED, REFUNDED, CANCELLED, FAILED | Pix Clinmax Pay |
| `PlatformPayoutStatus` | PENDING, PROCESSING, PAID, FAILED, CANCELLED | Repasse Pix |
| `WaitingListStatus` | WAITING, CONTACTED, SCHEDULED, CANCELLED, NO_ANSWER | Lista espera |
| `TissGuideStatus` | DRAFT, SENT, APPROVED, REJECTED, CANCELLED | Guia TISS |
| `InviteStatus` | PENDING, ACCEPTED, REVOKED, EXPIRED | Convite e-mail |
| `JoinRequestStatus` | PENDING, APPROVED, REJECTED | Pedido codigo clinica |

### 20.2 Operacao e acesso

**Clinic**: entidade central da operacao. Nome, contatos, horarios (`agendaStartTime`, `agendaEndTime`, `lunchStartTime`, `lunchEndTime`, `slotIntervalMinutes`, `operatingDays`), modelo negocio (`billingModel`, `careMode`, `spaceType`, `teamSizeLabel`), codigo convite (`inviteCode`, `inviteCodeRole`), dados fiscais/endereco, logo, cabecalho documentos.

**User**: conta de login. `email` unico, `password` hash, `role`, `googleId` opcional, `isAccountAdmin`, perfil (`gender`, `phone`, `cpf`, `profileImage`).

**UserClinic**: N:N usuario-clinica. `isClinicAdmin`, `active`. Um usuario pode pertencer a varias clinicas (futuro multi-clinica).

**Doctor**: perfil clinico. CRM unico, especialidade, `professionalType`, `hasOwnAgenda`, `available`. Ligado a `User` via `userId` opcional.

**ReceptionistDoctor**: quais medicos a recepcionista gerencia na agenda.

**ClinicInvite**: convite por e-mail com `role`, `token`, expiracao, status.

**ClinicJoinRequest**: pedido via codigo. `requestedRole` pode vir do codigo ou ser definido na aprovacao.

### 20.3 Pacientes e clinico

**Patient**: cadastro por clinica. Identificacao (nome, CPF, nascimento, sexo), contatos, convenio, campos clinicos (alergias, medicamentos, historico). `@@unique([clinicId, cpf])`. `active` para arquivar.

**Appointment**: consulta ou bloqueio. Paciente opcional (bloqueio), medico obrigatorio, data/hora, status, procedimentos via `AppointmentProcedure`, campos SOAP/CID quando em atendimento, billing link, pagamento.

**AppointmentProcedure**: linha procedimento x quantidade x preco unitario.

**AppointmentBilling**: total, cobrado, status faturamento consulta.

**MedicalRecord**: registro legado (diagnostico + prescricao texto). Historico novo usa campos em Appointment + Prescription.

**Prescription** + **PrescriptionItem**: receita digital com itens (medicamento, exame, vacina, texto livre). `validationCode`, `accessCode`, PDF, assinatura stub.

**PrescriptionTemplate** + items: modelos reutilizaveis por profissional.

**PrescriptionShare**: canal WhatsApp/e-mail, status envio.

### 20.4 Agenda operacional

**WaitingListEntry**: fila de espera com prioridade, medico desejado, status.

**AgendaNote**: lembrete operacional (recepcao, dia, profissional, paciente). Visibilidade controlada.

**AppointmentReminderLog**: idempotencia lembrete (consulta + offset horas).

### 20.5 WhatsApp

**WhatsappConnection**: sessao Baileys por clinica/usuario. Status, QR, pairing code.

**WhatsappAuthState**: credenciais Baileys persistidas.

**ClinicWhatsappSettings**: conexao padrao, offsets lembrete JSON, flags IA e auto-resposta.

**WhatsappMessageTemplate**: templates com placeholders.

**WhatsappChat**: conversa. `aiContextJson` guarda estado booking. `aiPaused` para handoff humano.

**WhatsappMessage**: mensagens persistidas.

**WhatsappOutbox**: fila envio (lembrete, manual, agendado).

### 20.6 Financeiro clinica

**FinancialAccount**, **FinancialCategory**, **CostCenter**, **PaymentMethod**: cadastros.

**ClinicFinanceSettings**: defaults e flag `autoGenerateOnAppointment`.

**FinancialTransaction**: lancamento. Vinculos opcionais paciente, medico, procedimento, consulta.

### 20.7 Clinmax Pay (Asaas)

**ClinicPixRecipient**: chave Pix da clinica para repasse, taxa, debito pendente estorno.

**PlatformPayment**: cobranca Asaas por consulta. Bruto, taxa gateway, liquido, taxa plataforma, repasse.

**PlatformPayout**: transferencia Pix para clinica. Idempotente por payment.

**AsaasWebhookEvent**: deduplicacao eventos webhook.

### 20.8 Outros modulos

**InventoryProduct** + **InventoryMovement**: estoque.

**TissGuide**: guia convenio por consulta.

**SatisfactionSurvey**: NPS pos-atendimento.

**Cid10**, **Cid11**, **CidInss**: bases CID seedadas.

**BulaCache**: cache bulas externas.

**AuditLog**: auditoria (modulo whatsapp, prescricao, etc.).

---

## 21. Matriz de permissoes completa

Fonte unica: `back-projeto-clinica/src/lib/permissions.ts`. Frontend espelha via `AuthContext` (`permissions[]` no JWT payload enriquecido por `/auth/me`).

### 21.1 Lista de permissoes

| Permissao | Significado |
|---|---|
| `dashboard:view` | Painel / metricas |
| `agenda:view` | Ver agenda |
| `agenda:manage` | Criar/editar/cancelar consultas e bloqueios |
| `agenda:print` | Imprimir agenda |
| `waiting_list:manage` | Lista de espera |
| `agenda_notes:manage` | Notas da agenda |
| `patients:view` | Ver pacientes (basico) |
| `patients:create` | Criar paciente |
| `patients:edit_basic` | Editar cadastro administrativo |
| `patients:edit_clinical` | Editar campos clinicos |
| `records:view` | Ver prontuario/historico |
| `records:write` | Atendimento, evolucao |
| `prescriptions:write` | Prescrever |
| `clinical_tools:view` | Bulas, CID-10, CID-11 |
| `users:manage` | Usuarios, aprovar pedidos |
| `clinics:manage` | Dados clinica, horarios, financeiro config, WhatsApp |
| `invites:manage` | Convites e codigo (so Admin) |
| `whatsapp:send` | Mensagens WhatsApp |
| `finance:operational` | Cobrar na agenda (drawer) |
| `finance:view` | Ver extrato, fluxo, estoque, TISS |
| `finance:manage` | Lancar receita/despesa |
| `reports:view` | Relatorios e pesquisa satisfacao |

### 21.2 Por cargo (base)

| Cargo | Permissoes |
|---|---|
| **ADMIN** | Operacao completa exceto clinico (sem `records:*`, `prescriptions:write`, `clinical_tools:view` por padrao) |
| **ADMIN + Doctor** | ADMIN + todas permissoes clinicas |
| **DOCTOR** | Agenda propria, pacientes, prontuario, prescricao, bulas/CID |
| **RECEPTION** | Agenda todas, pacientes basicos, WhatsApp, lista espera, notas, caixa operacional |
| **CONSULTANT** | Painel, agenda visao, config clinica, relatorios. Sem pacientes |
| **FINANCE** | Pacientes view, financeiro completo, relatorios |

### 21.3 Home pos-login

| Cargo | Rota inicial |
|---|---|
| ADMIN, CONSULTANT | `/dashboard` |
| DOCTOR, RECEPTION | `/agenda` |
| FINANCE | `/gestao/financas` |

Detalhe visual menu: `docs/cargos-ui.md`.

---

## 22. Ferramentas WhatsApp AI (detalhadas)

Implementadas em `whatsapp-ai-tools.service.ts`, executadas via `executeAiTool(name, args, ctx)`. A IA **sugere** a ferramenta; o backend **valida** e grava.

| Ferramenta | O que faz | Regras importantes |
|---|---|---|
| `buscar_paciente` | Localiza por telefone WhatsApp | Prioriza numero da conversa |
| `buscar_paciente_cpf` | Busca por CPF | Mascara CPF nas respostas |
| `buscar_paciente_nome` | Busca por nome | Ambiguo: pede CPF/nascimento, nao escolhe sozinho |
| `criar_paciente` | Cadastra paciente | Valida duplicidade CPF |
| `resolver_paciente` | Fluxo unificado criar/localizar | Usado no onboarding WhatsApp |
| `listar_medicos` | Medicos visiveis ao paciente | Filtra por `doctor-display-filter` |
| `listar_procedimentos` | Procedimentos ativos | |
| `buscar_horarios` | Slots livres data + medico | Respeita expediente, almoco, bloqueios |
| `verificar_horario` | Slot especifico ainda livre? | Revalidacao antes de confirmar |
| `listar_consultas_paciente` | Proximas consultas do paciente | |
| `listar_consultas_medico` | Agenda do medico | |
| `agendar_consulta` | Cria appointment | So apos confirmacao explicita ou orquestrador |
| `enviar_lembrete_consulta` | Dispara template lembrete | |
| `notificar_medico` | Aviso interno (limitado) | |
| `listar_prescricoes_paciente` | Receitas finalizadas | |
| `enviar_prescricao_whatsapp` | PDF no chat | Telefone conversa = telefone paciente |
| `info_clinica` | Nome, endereco, contatos | |

### 22.1 Orquestrador (sem IA)

`whatsapp-booking-orchestrator.ts` trata:

- Estado `BOOKING_AWAITING_CONFIRMATION`: "sim"/"pode" confirma sem passar pela LLM.
- Escolha numerica de medico em `BOOKING_SELECT_DOCTOR`.
- Retry `BOOKING_RETRY` apos falha tecnica.
- Pos `BOOKING_CONFIRMED`: evita consulta duplicada.

Estado persiste em `WhatsappChat.aiContextJson` (`bookingState`, `patientId`, `selectedDoctor`, `selectedDate`, `selectedTime`, `awaitingConfirmation`).

### 22.2 Handoff humano

Quando atendente humano responde pelo chat interno, IA pausa (`aiPaused` ou modo handoff). Retoma apos timeout configuravel.

---

## 23. Onboarding ramificado (completo)

O onboarding **nao e trilha unica**. Primeira pergunta: **criar clinica** ou **entrar com codigo**.

### 23.1 Conceitos separados

| Conceito | Exemplos |
|---|---|
| Como entrou | Criou clinica / Entrou com codigo |
| Cargo sistema | ADMIN, DOCTOR, RECEPTION, CONSULTANT, FINANCE |
| Profissao clinica | Medico, Psicologo, Nutricionista |
| Especialidade | Pediatria, Cardiologia |
| Permissoes | Derivadas do cargo + perfil Doctor |

### 23.2 Caminho A: Criar clinica

1. Como vai usar? Criar clinica
2. Papel: Proprietario / Profissional / Admin+profissional / Consultor
3. Clinica: nome, modelo, tamanho equipe
4. Tambem atende? (so Proprietario/Admin)
5. Perfil profissional (se atende): profissao, conselho+UF, especialidade
6. Funcionamento: dias, horario, duracao slot
7. Recebimento: particular/convênio, presencial/online
8. Equipe: convites com cargo
9. Resumo e entrar

### 23.3 Caminho B: Codigo clinica

1. Entrar em clinica existente
2. Digitar codigo (`GET /invites/clinic-code/:code`)
3. Se codigo tem cargo: nao pergunta cargo de novo
4. Se codigo sem cargo: pessoa **nao escolhe** Admin
5. Solicita entrada (`ClinicJoinRequest`)
6. Tela **Aguardando acesso**
7. Admin aprova em Configuracoes > Convites (define cargo se necessario)

Convite por e-mail (`/convite/:token`) continua imediato com cargo predefinido.

### 23.4 Persistencia

| Escolha | Campo |
|---|---|
| Papel | `User.role`, flags admin |
| Profissional | `DOCTOR` + `Doctor.*` |
| Dono que atende | `ADMIN` + `Doctor` |
| Agenda operacao | `Clinic.agenda*`, `operatingDays` |
| Modelo recebimento | `billingModel`, `careMode` |
| Convites equipe | `ClinicInvite.role` |

Arquivos: `OnboardingPage.tsx`, `onboarding-flow.ts`, `auth.service completeOnboarding`.

---

## 24. Pacientes e duplicidade

### 24.1 Modelo mental

Paciente e centro da operacao. Prontuario nasce com paciente (mesmo vazio). Cadeia: **Paciente > Agendamento > Atendimento > Registro**.

Usuario (login) e paciente (ficha) sao entidades **diferentes**.

### 24.2 Fluxo principal (recepcao)

Agenda > Novo agendamento > buscar paciente > nao encontrou > **Cadastrar agora** (modal troca) > paciente criado > volta selecionado > salvar.

### 24.3 Cadastro minimo

Obrigatorio: **nome + nascimento + (CPF ou telefone)**. Sem dados clinicos no cadastro rapido.

### 24.4 Duplicidade

| Campo | Comportamento |
|---|---|
| CPF | 409 `PATIENT_EXISTS`. Oferece usar existente |
| Telefone/e-mail | 409 `PATIENT_POSSIBLE_DUPLICATE`. Pode `force: true` |

Unicidade: `clinicId + cpf`. Telefone nao e unique global.

### 24.5 Arquivar

`PATCH /patients/:id/archive`. Lista mostra so ativos.

### 24.6 Strip clinico por permissao

GET paciente sem `records:view` omite alergias, habitos, evolucoes.

---

## 25. Financeiro da clinica e Clinmax Pay

### 25.1 Dois dinheiros (nao misturar)

| | Financeiro clinica | Financeiro plataforma |
|---|---|---|
| Quem paga | Paciente para clinica | Clinica para usar ClinMax |
| Onde | Gestao `/gestao/financas` | Backoffice `/backoffice/plataforma` |
| Status | Implementado (manual) | Placeholder (planos so landing) |

### 25.2 Telas financeiro clinica

- `/gestao/financas`: resumo saldo, receitas/despesas pagas, balanco
- `/gestao/financas/extrato`: lancamentos filtraveis
- Receitas/despesas: mesmo extrato com filtro tipo
- `/gestao/financas/fluxo-de-caixa`: agrupado dia/mes
- `/configuracoes/financeiro`: cadastros e padroes

Kit padrao auto-criado: Conta principal, categorias Consulta/Aluguel/etc., formas PIX/cartao.

### 25.3 Clinmax Pay (Pix consulta)

Fluxo:

```
Paciente paga Pix
  -> Cobranca conta Asaas plataforma
  -> PAYMENT_RECEIVED
  -> Ledger (bruto, taxa gateway, liquido, taxa 5% plataforma)
  -> POST transfer Pix para chave clinica
  -> TRANSFER_DONE
```

Regras:

- Repasse so em `PAYMENT_RECEIVED`, nao em `CONFIRMED`
- Taxa 5% sobre liquido (`CLINMAX_PAY_FEE_PERCENT`)
- Idempotencia: um payment por `asaasPaymentId`
- Estorno: cancela payout ou acumula `outstandingDebit`

Config: `ClinmaxPaySettingsCard` em Configuracoes > Financeiro.

Cobranca na UI: drawer agenda (`AppointmentDetailDrawer`).

Webhook: `POST /api/webhooks/asaas` header `asaas-access-token`.

---

## 26. Bot WhatsApp (arquitetura e regras)

### 26.1 Pipeline

```
Mensagem paciente
  -> Debounce + dedup waMessageId
  -> Orquestrador (estado booking?)
     SIM: acao deterministica
     NAO: NineRouter/OpenRouter + tools
  -> Resposta texto curto (max ~1200 chars)
```

### 26.2 Fluxo agendamento (obrigatorio)

Identificar paciente > listar medicos reais > data > horarios livres > escolha > **"Posso confirmar?"** > SIM explicito > criar > resumo.

Consulta **nunca** criada sem confirmacao. Numeros ("2") so escolhem medico em estado correto.

### 26.3 O que o bot pode

Localizar/criar cadastro, listar medicos, horarios, agendar com confirmacao, enviar prescricao PDF (match telefone), lembrete template, info clinica.

### 26.4 O que o bot nao faz

Inventar horario, enviar e-mail confirmacao, expor telefone medico, CPF completo, falar de ferramentas/API, comparar medicos.

### 26.5 Configuracao

Configuracoes > WhatsApp: Conexoes (QR), Templates, Lembretes (IA + offsets horas).

Depende NineRouter `localhost:20128` modelo `combini` ou OpenRouter.

Arquivos: `whatsapp-ai.service.ts`, `whatsapp-booking-orchestrator.ts`, `whatsapp-ai-prompt.ts`, `whatsapp-ai-context.ts`.

---

## 27. Configuracoes da clinica

Layout: `SettingsSidebar` + conteudo. Sem permissao: item some e URL redireciona.

### 27.1 Grupos sidebar

1. **Clinica**: Dados, Horarios agenda, Financeiro cadastros
2. **Equipe**: Convites (Admin), Usuarios (Admin)
3. **Integracoes**: WhatsApp
4. **Preferencias**: Aparencia

Acordeao **Bulas e CID** (atalho Outros) se `clinical_tools:view`.

Rodape avisa: assinatura plataforma fica no backoffice.

### 27.2 Telas principais

| Rota | Quem | Funcao |
|---|---|---|
| `/configuracoes/clinicas` | Admin, Consultor | Dados, logo, documento padrao |
| `/configuracoes/agenda` | Admin, Consultor | Expediente, almoco, intervalo slot |
| `/configuracoes/financeiro` | Admin, Consultor | Contas, categorias, Clinmax Pay |
| `/configuracoes/convites` | Admin | Codigo, e-mail, aprovacoes |
| `/configuracoes/usuarios` | Admin | Equipe, desativar, fichas |
| `/configuracoes/whatsapp` | Admin, Consultor | QR, templates, IA, lembretes |
| `/configuracoes/aparencia` | Todos | Info tema (toggle no header) |
| `/configuracoes/conta` | Todos | Perfil, senha, avatar |

Detalhe completo: `docs/configuracoes.md`.

---

## 28. Contexts, hooks e estado global (frontend)

### 28.1 AuthContext

- Carrega `/auth/me` com token
- Expoe: `user`, `clinic`, `permissions`, `clinicalProfile`, `login`, `logout`, `refresh`
- Decide redirects pos-login e onboarding overlay

### 28.2 ToastContext

- `useToast()` para feedback (sucesso, erro, aviso)
- Proibido `alert()` nativo (regra UI)

### 28.3 ThemeProvider

- Tema claro/escuro via `clinichub_theme`
- Toggle em `AppHeader` e backoffice

### 28.4 Hooks relevantes

| Hook | Funcao |
|---|---|
| `useUnreadMessages` | Badge mensagens WhatsApp nao lidas |
| `useInView` | Animacoes landing (Intersection Observer) |

### 28.5 Cliente HTTP

`services/api.ts`: wrapper fetch com token, tipos, metodos por dominio (`api.patients`, `api.appointments`, etc.).

`services/backoffice-api.ts`: cliente separado backoffice plataforma.

---

## 29. Componentes por pasta (frontend)

| Pasta | Componentes chave |
|---|---|
| `layout/` | AppHeader, BackofficeLayout, SettingsSidebar, UserMenu |
| `agenda/` | AgendaWeekGrid, AppointmentFormModal, AppointmentDetailDrawer, WaitingListDrawer, AgendaNotesDrawer |
| `patients/` | PatientFormModal |
| `prontuario/` | History cards, timeline |
| `atendimento/` | Formulario SOAP, CID |
| `prescricoes/` | PrescricaoHub, modais itens |
| `gestao/` | TransactionFormModal, GestaoNavDropdown |
| `settings/` | ClinmaxPaySettingsCard |
| `onboarding/` | OnboardingShell, OptionCard, ProgressBar |
| `landing/` | LandingReveal, LandingMarquee |
| `whatsapp/` | Componentes chat (se houver) |
| `ui/` | modal, drawer, date-picker, select, empty-state, ThemeToggle |
| `auth/` | AuthLayout (login/register) |
| `cid/` | CidDetailCard |

Paginas em `pages/` consomem esses componentes. Logica pesada fica em `lib/` e `services/`.

---

## 30. Seed e dados de desenvolvimento

Comando: `npm run db:seed` no backend.

### 30.1 Clinica demo

- Nome: `ClinMax. Clinica Geral`
- ID fixo: `clinic-default`
- Codigo convite gerado automaticamente

### 30.2 Usuarios (senhas em texto no seed, so dev)

| E-mail | Senha | Cargo |
|---|---|---|
| admin@clinicare.com | admin123 | ADMIN (account admin) |
| ana.costa@clinicare.com | doctor123 | DOCTOR (Dra. Ana Costa, CRM 123456-SP) |
| recepcao@clinicare.com | recep123 | RECEPTION (Maria Recepcao) |

### 30.3 Pacientes demo

3 pacientes com CPF, convenio Particular/Unimed, agendamentos no dia seed.

### 30.4 Procedimentos

- Consulta (R$ 150)
- Retorno (R$ 100)

### 30.5 WhatsApp seed

Templates: Lembrete, Confirmacao, Mensagem livre. Settings lembretes 24h e 2h.

### 30.6 CID

Seed importa CID-10, CID-11 e metadados INSS (pode demorar na primeira execucao).

---

## 31. Prescricoes e validacao publica

### 31.1 Fluxo profissional

Prontuario ou Atendimento > Prescrever > rascunho > adicionar itens (med/exame/vacina) > finalizar > PDF gerado backend (`prescription-pdf.ts`) > codigo validacao + QR.

### 31.2 Tipos receita

`SIMPLE` ou `SPECIAL` (controle especial stub).

### 31.3 Compartilhamento

- WhatsApp: via bot ou UI interna. Exige telefone match.
- E-mail: `PrescriptionShare` com status PENDING/SENT/FAILED.

### 31.4 Validacao publica

URL: `/api/public/prescriptions/validate/:code?accessCode=...`

Pagina publica (se existir no front) ou API JSON para terceiros verificarem autenticidade.

Assinatura digital: campo `signedAt` existe; integracao ICP e stub.

---

## 32. Agenda: regras de negocio

### 32.1 Horarios

- Expediente: `Clinic.agendaStartTime` a `agendaEndTime`
- Almoco: `lunchStartTime` a `lunchEndTime` (consultas nao entram)
- Slot: `slotIntervalMinutes` (15-120, passo 15 na UI config)
- Dias: `operatingDays` (string JSON dias semana)

### 32.2 Tipos evento

- `SCHEDULE`: consulta com paciente
- `BLOCK`: bloqueio sem paciente

### 32.3 Status consulta

| Status | Significado UI |
|---|---|
| SCHEDULED | Agendada |
| CONFIRMED | Confirmada |
| IN_PROGRESS | Em atendimento |
| COMPLETED | Finalizada |
| CANCELLED | Cancelada |
| NO_SHOW | Faltou |
| RESCHEDULED | Remarcada |

### 32.4 Conflitos

Backend valida sobreposicao mesmo medico/data, expediente, almoco. Erros: `OUTSIDE_WORK_HOURS`, `LUNCH_HOURS`, conflito P2002.

### 32.5 Visibilidade medico

Recepcionista ve medicos vinculados (`ReceptionistDoctor`). Medico ve propria agenda. Admin ve todos.

### 32.6 Recursos agenda

- Lista espera (`WaitingListDrawer`)
- Notas (`AgendaNotesDrawer`)
- Impressao (`AgendaPrintPreview`)
- Cobranca Clinmax Pay no drawer detalhe

---

## 33. Backoffice plataforma

Area separada para **donos da ClinMax** (nao admin da clinica cliente).

### 33.1 Rotas

- `/backoffice/login`
- `/backoffice` dashboard metricas
- `/backoffice/clinicas` CRUD clinicas
- `/backoffice/usuarios` usuarios globais
- `/backoffice/pacientes` visao pacientes cross-clinica
- `/backoffice/plataforma` cards Assinatura/Cobranca "em breve"

### 33.2 Auth

Token separado `backoffice_token`. Decorator `requirePlatformOwner` ou flag `isPlatformOwner` no JWT.

### 33.3 API

Prefixo `/api/backoffice/*`. Login proprio, nao usa permissoes de clinica.

---

## 34. Erros de build e debitos tecnicos

### 34.1 Frontend (`npm run build` falha no tsc)

| Arquivo | Problema |
|---|---|
| `AgendaWeekGrid.tsx` | Tipo `ReactNode` incompatible |
| `AppointmentDetailDrawer.tsx` | Imports/variaveis nao usados |
| `AppointmentDetailView.tsx` | `onConfirm` em `ConfirmOptions`, vars nao usadas |
| `AppointmentFormModal.tsx` | Vars nao usadas |
| `AuthLayout.tsx` | Vars nao usadas |
| `PainelPage.tsx` | Vars nao usadas |
| `ClinicasPage.tsx` | `string[].at` (target lib ES) |
| `services/api.ts` | Identificador `clinicName` duplicado |

Impacto: dev funciona (`vite`), producao typecheck quebra.

### 34.2 Backend (`npm run build`)

- `tsconfig.json`: valor invalido `--ignoreDeprecations` (TS5103)

### 34.3 Funcionalidades parciais (runtime)

| Item | Estado |
|---|---|
| Google OAuth | Precisa env configurado |
| E-mail convites | Precisa SMTP |
| WhatsApp IA | Precisa OpenRouter/NineRouter |
| Clinmax Pay | Precisa Asaas + webhook |
| Assinatura SaaS plataforma | Nao implementado (so landing) |
| Geração auto receita ao concluir atendimento | Flag existe, hook nao ligado |
| TISS XML | CRUD guia, sem XML real |
| Pesquisa satisfacao | Sem link publico automatizado |
| Assinatura digital prescricao | Stub |
| Historico alteracoes clinica | Botao UI sem backend |
| Tema escuro Config Aparência | Toggle so no header |

### 34.4 Banco producao

Schema comentado para trocar SQLite por PostgreSQL. Migracao nao documentada no repo.

---

## 35. Glossario

| Termo | Significado |
|---|---|
| **ClinMax** | Marca do produto CRM clinico |
| **AppShell** | Layout autenticado com navbar |
| **Baileys** | Lib Node WhatsApp Web multi-device |
| **NineRouter / OpenRouter** | Gateway LLM para IA WhatsApp |
| **Clinmax Pay** | Pix consulta via Asaas com repasse |
| **Orquestrador** | Maquina de estados booking WhatsApp |
| **Handoff** | Humano assume chat, IA pausa |
| **SOAP** | Subjetivo, Objetivo, Avaliacao, Plano (atendimento) |
| **TISS** | Padrao guias convenio saude |
| **TUSS** | Terminologia exames procedimentos |
| **Backoffice** | Area operadores plataforma ClinMax |
| **Join request** | Pedido entrada via codigo clinica |
| **Strip clinico** | Remover campos sensiveis por permissao |
| **Ledger** | Registro PlatformPayment/Payout |
| **GenInfra** | Storage S3-compatible para arquivos |

---

*Ultima atualizacao deste inventario: agosto 2026. Monorepo: front-projeto-clinica + back-projeto-clinica.*
