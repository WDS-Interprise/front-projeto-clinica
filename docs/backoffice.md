# ClinMax Backoffice: inventário completo

> **Estado atual (agosto/2026):** para visão rápida de seções, menu, dashboard e o que funciona hoje, use [`backoffice-estrutura.md`](./backoffice-estrutura.md). Este arquivo mantém o inventário histórico detalhado.

Documentação ponta a ponta do **console do proprietário da plataforma** (backoffice). Cobre frontend, backend, autenticação, telas, APIs, dados reais vs simulados, scripts e lacunas conhecidas.

**Última revisão:** agosto/2026  
**Prefixo da API:** `/api/backoffice`  
**URL base do front:** `/backoffice`

---

## Índice

1. [O que é e para quem serve](#1-o-que-é-e-para-quem-serve)
2. [Como acessar](#2-como-acessar)
3. [Autenticação e segurança](#3-autenticação-e-segurança)
4. [Arquitetura técnica](#4-arquitetura-técnica)
5. [Rotas do frontend](#5-rotas-do-frontend)
6. [Layout e navegação](#6-layout-e-navegação)
7. [Telas: o que cada uma faz](#7-telas-o-que-cada-uma-faz)
8. [API do backend: todos os endpoints](#8-api-do-backend-todos-os-endpoints)
9. [Métricas do dashboard: real vs simulado](#9-métricas-do-dashboard-real-vs-simulado)
10. [Modelos de banco usados](#10-modelos-de-banco-usados)
11. [Scripts e variáveis de ambiente](#11-scripts-e-variáveis-de-ambiente)
12. [Fluxos de usuário](#12-fluxos-de-usuário)
13. [Matriz funcional vs placeholder](#13-matriz-funcional-vs-placeholder)
14. [Lacunas, bugs e inconsistências](#14-lacunas-bugs-e-inconsistências)
15. [Arquivos do projeto](#15-arquivos-do-projeto)
16. [Próximas fases sugeridas](#16-próximas-fases-sugeridas)

---

## 1. O que é e para quem serve

O **backoffice** é um painel **separado** do CRM das clínicas. Ele existe para o **dono da plataforma ClinMax** (não para o admin de uma clínica individual).

### O que ele permite hoje

| Área | Capacidade |
|------|------------|
| Visão geral | Dashboard com KPIs operacionais e indicadores SaaS (parte simulada) |
| Clínicas | Listar, criar e ativar/desativar clínicas |
| Usuários | CRUD global de usuários de qualquer clínica, incluindo flag de dono da plataforma |
| Pacientes | Listagem global read-only, com filtros e paginação |
| Login | Entrada exclusiva com credenciais de proprietário |

### O que aparece no menu mas ainda não funciona de verdade

| Área | Status |
|------|--------|
| Assinaturas | Placeholder |
| Cobranças | Placeholder |
| Integrações | Placeholder |
| IA e Automação | Placeholder |
| Relatórios | Placeholder |
| Configurações da plataforma | Cards "em breve" |

---

## 2. Como acessar

### URLs

| Destino | URL |
|---------|-----|
| Login do backoffice | `/backoffice/login` |
| Dashboard | `/backoffice` |
| Clínicas | `/backoffice/clinicas` |
| Usuários | `/backoffice/usuarios` |
| Pacientes (sem link no menu) | `/backoffice/pacientes` |

### Pontos de entrada no site

- **Landing page:** link "Acesso backoffice" no footer
- **Login do CRM:** link para o backoffice (`AuthBackofficeLink`)
- **Configurações da clínica:** card informativo com link para `/backoffice/plataforma`

### Credenciais de desenvolvimento

| Origem | E-mail | Senha | Observação |
|--------|--------|-------|------------|
| Seed (`npm run db:seed`) | `admin@clinicare.com` | `admin123` | `isAccountAdmin: true` |
| `.env` do backend | `ADMIN_EMAIL` | `ADMIN_PASSWORD` | Auto-provisiona/atualiza admin no login |
| Script manual | `ADMIN_EMAIL` ou `admin@email.com` | `ADMIN_PASSWORD` | `scripts/upsert-backoffice-admin.ts` |

---

## 3. Autenticação e segurança

### Separação do app principal

| Aspecto | App das clíicas (CRM) | Backoffice |
|---------|----------------------|------------|
| Token no browser | Token principal (`AuthContext`) | `backoffice_token` no `localStorage` |
| Dados do usuário | Contexto de auth | `backoffice_user` no `localStorage` |
| Login | `/api/auth/*` | `POST /api/backoffice/login` |
| Guard de rota | `AuthContext` + permissões | Só verifica se existe token |

### Como o login funciona (backend)

Dois caminhos em `adminLogin()` (`backoffice.service.ts`):

**Caminho A: credenciais do `.env`**
1. Se `ADMIN_EMAIL` + `ADMIN_PASSWORD` batem com o body do login
2. Busca ou cria usuário com esse e-mail
3. Força `role: ADMIN`, `isAccountAdmin: true`, `active: true`
4. Re-hash da senha a cada login (atualiza no banco)
5. Emite JWT com `isPlatformOwner: true`

**Caminho B: usuário no banco**
1. Busca `User` por e-mail
2. Exige `isAccountAdmin === true`
3. Valida senha com bcrypt
4. Emite JWT com `isPlatformOwner: true`

Se nenhum caminho funcionar: **401**.

### JWT emitido

```json
{
  "userId": "...",
  "email": "...",
  "role": "ADMIN",
  "clinicId": "primeira-clinica-ativa-ou-clinic-default",
  "isPlatformOwner": true
}
```

- **Secret:** `JWT_SECRET` (default dev: `clinicare-dev-secret`)
- **Expiração:** `JWT_EXPIRES` (default: `7d`)
- Mesmo secret do auth principal, mas token armazenado separado no front

### Proteção das rotas da API

Todas as rotas (exceto `/status` e `/login`) exigem:

1. `app.auth`: valida Bearer token
2. `app.requirePlatformOwner`: exige dono da plataforma

`assertPlatformOwner(userId)` retorna true se:
- E-mail do usuário === `ADMIN_EMAIL`, **ou**
- `user.isAccountAdmin === true`

### Limitações de segurança atuais

- Guard do **frontend** só checa existência do token (não valida expiração até a API retornar 401)
- Logout só limpa `localStorage` (não invalida JWT no servidor)
- Token backoffice tecnicamente usa o mesmo `JWT_SECRET` do CRM
- `/backoffice/login` não redireciona quem já está logado

---

## 4. Arquitetura técnica

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (front-projeto-clinica)                           │
│  /backoffice/* → BackofficeProtectedRoute → BackofficeLayout│
│  backoffice-api.ts → fetch /api/backoffice/*                │
└──────────────────────────┬──────────────────────────────────┘
                           │ Bearer backoffice_token
┌──────────────────────────▼──────────────────────────────────┐
│  BACKEND (back-projeto-clinica)                             │
│  src/routes/backoffice.routes.ts                            │
│  src/controllers/backoffice.controller.ts                   │
│  src/services/backoffice.service.ts                         │
│  Prisma → SQLite/Postgres                                   │
└─────────────────────────────────────────────────────────────┘
```

### Arquivos principais

| Camada | Arquivo |
|--------|---------|
| Rotas API | `back-projeto-clinica/src/routes/backoffice.routes.ts` |
| Controller | `back-projeto-clinica/src/controllers/backoffice.controller.ts` |
| Service | `back-projeto-clinica/src/services/backoffice.service.ts` |
| Cliente HTTP | `front-projeto-clinica/src/services/backoffice-api.ts` |
| Layout | `front-projeto-clinica/src/components/layout/BackofficeLayout.tsx` |
| Rotas React | `front-projeto-clinica/src/App.tsx` |

---

## 5. Rotas do frontend

Definidas em `App.tsx`.

### Pública

| Rota | Componente |
|------|------------|
| `/backoffice/login` | `BackofficeLogin` |

### Protegidas (exigem `backoffice_token`)

| Rota | Componente | No menu lateral? |
|------|------------|------------------|
| `/backoffice` | `BackofficeDashboard` | Sim (Visão geral) |
| `/backoffice/clinicas` | `BackofficeClinicsPage` | Sim |
| `/backoffice/assinaturas` | `BackofficeAssinaturasPage` | Sim |
| `/backoffice/cobrancas` | `BackofficeCobrancasPage` | Sim |
| `/backoffice/usuarios` | `BackofficeUsersPage` | Sim |
| `/backoffice/usuarios/novo` | `BackofficeUserFormPage` | Não (sub-rota) |
| `/backoffice/usuarios/:id` | `BackofficeUserFormPage` | Não (sub-rota) |
| `/backoffice/integracoes` | `BackofficeIntegracoesPage` | Sim |
| `/backoffice/ia-automacao` | `BackofficeIaPage` | Sim |
| `/backoffice/relatorios` | `BackofficeRelatoriosPage` | Sim |
| `/backoffice/pacientes` | `BackofficePatientsPage` | **Não** (rota órfã) |
| `/backoffice/plataforma` | `BackofficePlatformPage` | Sim |

---

## 6. Layout e navegação

`BackofficeLayout.tsx` envolve todas as páginas protegidas.

### Sidebar (248px, fixa)

Logo ClinMax + 9 links:

1. Visão geral
2. Clínicas
3. Assinaturas
4. Cobranças
5. Usuários
6. Integrações
7. IA e Automação
8. Relatórios
9. Configurações da plataforma

Card inferior: "Ambiente privado".

### Header (sticky)

- Breadcrumb: "Backoffice privado / Console do proprietário"
- Campo de busca global (**decorativo**, sem handler)
- Sino de notificações com badge "3" (**estático**, sem lista)
- Badge "Ambiente seguro"
- Avatar com iniciais do usuário logado
- Botão logout

### Footer

- Versão exibida: "ClinMax Backoffice v2.4.0"
- Copyright 2025

### Visual

Paleta fixa clara (`#006B4D`, `#F4F7F5`, branco). Não segue dark mode global do app.

---

## 7. Telas: o que cada uma faz

### 7.1 Login (`BackofficeLogin.tsx`)

**Rota:** `/backoffice/login`  
**Status:** Funcional

**Campos:**
- E-mail
- Senha (toggle mostrar/ocultar)

**Fluxo:**
1. Submit → `backofficeApi.login(email, password)`
2. Sucesso → salva token + user no `localStorage` → redireciona para `/backoffice`
3. Erro → mensagem inline vermelha (não usa toast)

**Extras:**
- Aviso verde com ícone de cadeado
- Link "Voltar ao site principal" → `/login`

---

### 7.2 Dashboard (`BackofficeDashboard.tsx`)

**Rota:** `/backoffice`  
**Status:** Funcional (API real + SaaS parcialmente simulado)

**API:** `GET /backoffice/metrics`

**Elementos da tela:**

| Bloco | Conteúdo |
|-------|----------|
| Saudação | Primeiro nome do usuário em `backoffice_user` |
| Seletor de período | "Últimos 30 dias" (**sem efeito**, decorativo) |
| Botão refresh | Recarrega métricas |
| 6 KPI cards | Clínicas ativas, trials, MRR, churn, faturas em atraso, integrações offline |
| Sparklines e deltas | "+12%" etc. (**hardcoded** no front) |
| Gráfico MRR | Area chart SVG (dados do backend, parte simulada) |
| Donut planos | Distribuição Essencial/Profissional/Premium/Enterprise |
| Timeline | Atividades recentes da plataforma |
| Tabela clínicas | 8 clínicas mais recentes com plano, status, MRR |
| Donut receita | Assinaturas / Add-ons / Teleconsulta |
| Cards ações pendentes | Faturas, integrações offline, trials expirando |

Link "Ver todas" na tabela → `/backoffice/clinicas`.

---

### 7.3 Clínicas (`BackofficeClinicsPage.tsx`)

**Rota:** `/backoffice/clinicas`  
**Status:** Funcional (CRUD parcial)

**API:**
- `GET /backoffice/clinics`
- `POST /backoffice/clinics`
- `PUT /backoffice/clinics/:id`

**Funcionalidades:**
- Botão "Nova clínica" abre formulário inline
- Campos: nome, telefone, e-mail
- Tabela: nome/e-mail, contagem de usuários, pacientes, consultas, status, ação Ativar/Desativar

**Limitações:**
- Não edita nome/e-mail/telefone na linha da tabela (só toggle `active`)
- Erros inline (sem toast)
- Sem confirmação ao desativar
- Criação não gera `inviteCode` nem cargos padrão (`ClinicRole`)

---

### 7.4 Usuários: lista (`BackofficeUsersPage.tsx`)

**Rota:** `/backoffice/usuarios`  
**Status:** Funcional

**API:**
- `GET /backoffice/users`
- `DELETE /backoffice/users/:id`
- `GET /backoffice/clinics` (filtro)

**Funcionalidades:**
- Botão "Novo usuário" → `/backoffice/usuarios/novo`
- Filtros: busca (debounce 300ms), perfil (ADMIN/DOCTOR/RECEPTION), clínica
- Tabela: nome, e-mail, perfil, clínicas vinculadas, dono plataforma, ativo, editar/excluir
- Modal de confirmação antes de excluir (`useConfirm`)
- Toasts de sucesso/erro

---

### 7.5 Usuários: formulário (`BackofficeUserFormPage.tsx`)

**Rotas:** `/backoffice/usuarios/novo`, `/backoffice/usuarios/:id`  
**Status:** Funcional

**API:**
- `GET /backoffice/clinics`
- `GET /backoffice/users` (lista médicos para recepção)
- `GET /backoffice/users/:id`
- `POST /backoffice/users`
- `PUT /backoffice/users/:id`
- `DELETE /backoffice/users/:id`

**Campos do formulário:**

| Campo | Novo | Edição |
|-------|------|--------|
| Perfil (Recepcionista/Médico/Admin clínica) | Sim | Bloqueado |
| Clínica vinculada | Sim | Sim |
| Nome, e-mail | Sim | Sim |
| Senha | Obrigatória | Opcional |
| Telefone | Sim | Sim |
| CRM, especialidade (médico) | Sim | Sim |
| Médicos vinculados (recepção) | Sim | Sim |
| Administrador da clínica | Sim | Sim |
| Dono da plataforma (`isAccountAdmin`) | Sim | Sim |
| Usuário ativo | Não | Sim |

**Regras de criação no backend:**
- **ADMIN:** cria `User` + `UserClinic` (`isClinicAdmin: true`)
- **RECEPTION:** cria `User` + `UserClinic` + opcional `ReceptionistDoctor`
- **DOCTOR:** cria `User` + `Doctor` + `UserClinic` (CRM default `000000`, specialty `Clínico Geral`)

**Exclusão:** soft delete (desativa `User` e `UserClinic`). Não pode excluir a si mesmo nem o último dono da plataforma.

---

### 7.6 Pacientes (`BackofficePatientsPage.tsx`)

**Rota:** `/backoffice/pacientes`  
**Status:** Funcional (somente leitura)

**API:**
- `GET /backoffice/patients`
- `GET /backoffice/clinics` (filtro)

**Funcionalidades:**
- Contador total de cadastros
- Filtros: busca por nome, clínica
- Tabela: nome, telefone, convênio, clínica, data de cadastro
- Paginação (20 por página, max 100)

**Observação:** rota implementada mas **ausente do menu lateral**. Só acessível digitando a URL.

---

### 7.7 Placeholders (5 telas)

Usam `BackofficePlaceholderPage.tsx` com mensagem: *"Módulo em construção. Os dados reais de assinatura e cobrança serão conectados na próxima fase."*

| Página | Rota | Título |
|--------|------|--------|
| `BackofficeAssinaturasPage` | `/backoffice/assinaturas` | Assinaturas |
| `BackofficeCobrancasPage` | `/backoffice/cobrancas` | Cobranças |
| `BackofficeIntegracoesPage` | `/backoffice/integracoes` | Integrações |
| `BackofficeIaPage` | `/backoffice/ia-automacao` | IA e Automação |
| `BackofficeRelatoriosPage` | `/backoffice/relatorios` | Relatórios |

Nenhuma chama API. Nenhuma ação clicável.

---

### 7.8 Configurações da plataforma (`BackofficePlatformPage.tsx`)

**Rota:** `/backoffice/plataforma`  
**Status:** Placeholder (cards informativos)

Grid de 7 cards "em breve":
- Assinatura
- Cobrança
- Permissões de envio
- SMS enviados
- Teleconsultas
- Exportar dados
- Migrar

Sem API. Sem ações.

---

## 8. API do backend: todos os endpoints

Base: `http://localhost:3001/api/backoffice`

### Públicos

#### `GET /status`
Health check do módulo.

**Resposta:**
```json
{
  "service": "backoffice",
  "status": "ok",
  "timestamp": "2026-08-19T..."
}
```

**Usado no front:** não (existe `backofficeApi.status()` mas nenhuma página chama).

---

#### `POST /login`
Login do proprietário da plataforma.

**Body (Zod):**
```json
{ "email": "string", "password": "string" }
```

**Sucesso 200:**
```json
{
  "token": "JWT",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "ADMIN",
    "isPlatformOwner": true
  }
}
```

**Erros:** 400 (validação), 401 (credenciais inválidas ou sem permissão)

---

### Protegidos (Bearer + `requirePlatformOwner`)

#### `GET /me`
Perfil completo do usuário logado.

**Usado no front:** não.

---

#### `GET /metrics`
Dashboard completo. Ver [seção 9](#9-métricas-do-dashboard-real-vs-simulado).

---

#### `GET /clinics`
Lista todas as clínicas ordenadas por nome.

**Inclui contagens:** `_count.users`, `_count.patients`, `_count.appointments`

---

#### `POST /clinics`
Cria clínica.

**Body (Zod):**
```json
{
  "name": "string (min 2)",
  "phone": "string opcional",
  "email": "string opcional",
  "active": "boolean opcional, default true"
}
```

**Resposta:** 201 + clínica criada

---

#### `PUT /clinics/:id`
Atualiza clínica (body parcial, sem Zod).

**Campos:** `name`, `phone`, `email`, `active`

---

#### `GET /users`
Lista usuários globais.

**Query params:**

| Param | Efeito |
|-------|--------|
| `role` | Filtra por `User.role` |
| `clinicId` | Usuários vinculados à clínica |
| `search` | Busca em name ou email (contains) |
| `includeInactive` | `true` ou `1` inclui inativos |

**Retorno inclui:** clínicas vinculadas, `isAccountAdmin`, perfil médico se houver

---

#### `GET /users/:id`
Detalhe do usuário. 404 se não existir.

**Extras:** `gender`, `linkedDoctors`, `clinicIds`, vínculos com `active`

---

#### `POST /users`
Cria usuário na plataforma.

**Campos obrigatórios:** `role`, `name`, `email`, `password`, `clinicId`

**Opcionais:** `phone`, `gender`, `isAccountAdmin`, `isClinicAdmin`, `linkedDoctorIds`, `crm`, `specialty`, `cpf`

**Erros:** 400 (senha fraca), 404 (clínica), 409 (e-mail/CPF duplicado)

**Regra de senha:** 8+ chars, maiúscula, minúscula, número, caractere especial

---

#### `PUT /users/:id`
Atualiza usuário (body parcial).

**Campos:** `name`, `email`, `password`, `active`, `isAccountAdmin`, `isClinicAdmin`, `clinicId`, `phone`, `linkedDoctorIds`, `crm`, `specialty`

---

#### `DELETE /users/:id`
Soft delete. Resposta **204**.

**Erros:**
- 400 `CANNOT_DELETE_SELF`: não pode excluir a si mesmo
- 400 `LAST_OWNER`: último dono da plataforma
- 404: usuário não encontrado

---

#### `GET /patients`
Listagem global de pacientes (read-only).

**Query params:** `clinicId`, `search`, `page`, `limit` (max 100, default 20)

**Resposta:**
```json
{
  "data": [
    {
      "id": "...",
      "name": "...",
      "phone": "...",
      "email": "...",
      "insurancePlan": "...",
      "createdAt": "...",
      "clinicId": "...",
      "clinic": { "id": "...", "name": "..." }
    }
  ],
  "total": 123,
  "page": 1,
  "totalPages": 7
}
```

---

## 9. Métricas do dashboard: real vs simulado

`GET /metrics` retorna um objeto grande. O front consome tudo em `BackofficeDashboard`.

### 9.1 `overview` (100% real, Prisma)

| Campo | Fonte |
|-------|-------|
| `totalPatients` | `patient.count()` |
| `totalAppointments` | `appointment.count({ type: SCHEDULE })` |
| `appointmentsToday` | agendamentos SCHEDULE de hoje |
| `doctorsAvailable` / `totalDoctors` | `doctor.count()` |
| `totalRecords` | `medicalRecord.count()` |
| `totalUsers` | `user.count()` |

### 9.2 `usersByRole` (real)

`user.groupBy({ by: ["role"] })`

### 9.3 `appointmentsByStatus` (real)

`appointment.groupBy({ by: ["status"] })`

### 9.4 `upcomingAppointments` (real, top 10)

Agendamentos SCHEDULE de hoje em diante com status `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`. Include paciente e médico.

### 9.5 `recentPatients` (real, top 5)

Últimos pacientes cadastrados.

### 9.6 `saas` (misto: real + simulado)

| Campo | Tipo | Como é calculado |
|-------|------|------------------|
| `activeClinics` | Real | `clinic.count({ active: true })` |
| `totalClinics` | Real | `clinic.count()` |
| `whatsappConnected` | Real | `whatsappConnection.count({ status: CONNECTED })` |
| `offlineIntegrations` | Derivado | `totalClinics - whatsappConnected` |
| `activeTrials` | **Simulado** | Conta clínicas com status "Trial" na tabela fake |
| `mrr` | **Simulado** | Soma MRR das clínicas "Ativas" |
| `arr` | **Simulado** | `mrr * 12` |
| `churnPercent` | **Fixo** | `1.42` (hardcoded) |
| `overdueInvoices` | **Simulado** | Conta status "Inadimplente" |
| `planDistribution` | **Simulado** | Planos hardcoded |
| `mrrTrend` | **Simulado** | 5 meses com multiplicadores |
| `recentClinics` | **Misto** | Clínicas reais + plano/status/MRR inventados |
| `platformActivities` | **Simulado** | 4 entradas estáticas |
| `revenueSources` | **Simulado** | 94% / 4% / 2% sobre MRR estimado |

**Planos simulados (ciclicamente atribuídos às 8 clínicas mais recentes):**

| Plano | MRR |
|-------|-----|
| Essencial | R$ 79 |
| Profissional | R$ 149 |
| Premium | R$ 249 |
| Enterprise | R$ 499 |

**Status simulados:** Ativa, Trial, Inadimplente (alternados por índice).

**Importante:** não existe model de assinatura/plano/fatura no banco usado pelo backoffice hoje.

### 9.7 `generatedAt`

ISO timestamp da geração.

---

## 10. Modelos de banco usados

### Usados diretamente pelo backoffice

| Model | Uso |
|-------|-----|
| `User` | Login, CRUD, flag `isAccountAdmin` |
| `UserClinic` | Vínculo usuário-clínica, `isClinicAdmin`, soft delete |
| `Clinic` | CRUD, contagens, métricas |
| `Patient` | Listagem paginada global |
| `Appointment` | Contagens, groupBy, próximos agendamentos |
| `Doctor` | Contagem, perfil na criação de médico |
| `MedicalRecord` | Contagem em métricas |
| `WhatsappConnection` | Contagem CONNECTED |
| `ReceptionistDoctor` | Vínculo recepção-médico |

### Campo-chave de autorização

```prisma
model User {
  isAccountAdmin  Boolean  @default(false)
}
```

### Existem no schema mas o backoffice NÃO usa

| Model | Propósito |
|-------|-----------|
| `PlatformPayment` | Pagamentos ClinMax Pay (Asaas) |
| `PlatformPayout` | Repasse PIX para clínicas |
| `ClinicPixRecipient` | Chave PIX da clínica |
| `AsaasWebhookEvent` | Webhooks de pagamento |
| `ClinicRole` | Cargos customizáveis (só no app das clínicas) |

---

## 11. Scripts e variáveis de ambiente

### Variáveis de ambiente (backend)

| Variável | Obrigatória | Uso |
|----------|-------------|-----|
| `ADMIN_EMAIL` | Não | E-mail bootstrap do dono |
| `ADMIN_PASSWORD` | Sim (script upsert) | Senha bootstrap; login auto-provisiona |
| `JWT_SECRET` | Não | Assinatura do token (default dev) |
| `JWT_EXPIRES` | Não | Expiração (default `7d`) |

### Scripts

#### `scripts/upsert-backoffice-admin.ts`
```bash
cd back-projeto-clinica
npx tsx scripts/upsert-backoffice-admin.ts
```
- Upsert admin com `isAccountAdmin: true`
- Vincula à primeira clínica ativa
- Exige `ADMIN_PASSWORD` no `.env`

#### `scripts/create-admin-user.ts`
```bash
npx tsx scripts/create-admin-user.ts [email] [password] [name]
```
- Defaults: `admin2@clinmax.com.br`, `admin123`, `Admin 2`

#### `prisma/seed.ts`
- Cria `admin@clinicare.com` / `admin123` com `isAccountAdmin: true`

---

## 12. Fluxos de usuário

### 12.1 Primeiro acesso do dono

```
Landing ou Login CRM
  → /backoffice/login
  → POST /api/backoffice/login
  → token salvo em localStorage
  → /backoffice (dashboard)
```

### 12.2 Criar clínica

```
/backoffice/clinicas
  → Nova clínica
  → preenche nome/telefone/e-mail
  → POST /clinics
  → tabela atualiza
```

### 12.3 Criar usuário

```
/backoffice/usuarios
  → Novo usuário
  → /backoffice/usuarios/novo
  → preenche perfil, clínica, dados
  → POST /users
  → volta à lista
```

### 12.4 Conceder acesso ao backoffice a alguém

```
/backoffice/usuarios/:id
  → marcar "Dono da plataforma (isAccountAdmin)"
  → PUT /users/:id
```

### 12.5 Consultar pacientes (rota oculta)

```
/backoffice/pacientes (URL manual)
  → filtros opcionais
  → GET /patients
  → somente leitura
```

### 12.6 Sessão expirada

```
API retorna 401
  → backoffice-api limpa localStorage
  → próxima navegação em rota protegida
  → redirect /backoffice/login
```

---

## 13. Matriz funcional vs placeholder

| Módulo | Front | API | Dados |
|--------|-------|-----|-------|
| Login | Funcional | Sim | Real |
| Dashboard operacional | Funcional | Sim | Real (Prisma) |
| Dashboard SaaS (MRR, planos) | Funcional | Sim | **Simulado** |
| Clínicas | Funcional | Sim | Real |
| Usuários | Funcional | Sim | Real |
| Pacientes | Funcional | Sim | Real (read-only) |
| Assinaturas | Placeholder | Não | N/A |
| Cobranças | Placeholder | Não | N/A |
| Integrações | Placeholder | Não | N/A |
| IA e Automação | Placeholder | Não | N/A |
| Relatórios | Placeholder | Não | N/A |
| Config. plataforma | Placeholder | Não | N/A |
| Busca global (header) | Decorativo | Não | N/A |
| Notificações (header) | Decorativo | Não | N/A |

---

## 14. Lacunas, bugs e inconsistências

1. **`/backoffice/pacientes`** implementada mas ausente do menu lateral
2. **`GET /me`** e **`GET /status`** existem no backend, não usados no front
3. Guard frontend só checa token, não revalida `isAccountAdmin`
4. Dashboard SaaS mistura dados reais com estimativas (MRR, planos, churn 1,42% fixo)
5. Cinco módulos do menu são placeholders puros
6. Página Plataforma duplica intenção de assinaturas/cobrança
7. Feedback inconsistente: login/clínicas usam erro inline; usuários/pacientes usam toast
8. Layout backoffice não respeita dark mode
9. Busca e notificações no header são UI estática
10. `POST/PUT /users` e `PUT /clinics/:id` sem validação Zod completa
11. Login via `.env` re-hash senha a cada login (side effect no banco)
12. Dois admins de dev possíveis: seed vs `ADMIN_EMAIL`
13. Criação de clínica no backoffice não dispara seed de cargos (`ClinicRole`)
14. Scripts de admin não estão no `package.json` (execução manual com `tsx`)
15. Logout não invalida JWT no servidor

---

## 15. Arquivos do projeto

### Frontend (`front-projeto-clinica`)

```
src/
├── App.tsx                          # Rotas /backoffice/*
├── services/backoffice-api.ts       # Cliente HTTP + tipos
├── components/layout/
│   └── BackofficeLayout.tsx         # Shell sidebar + header
└── pages/backoffice/
    ├── BackofficeLogin.tsx
    ├── BackofficeDashboard.tsx
    ├── BackofficeClinicsPage.tsx
    ├── BackofficeUsersPage.tsx
    ├── BackofficeUserFormPage.tsx
    ├── BackofficePatientsPage.tsx
    ├── BackofficePlatformPage.tsx
    ├── BackofficePlaceholderPage.tsx
    ├── BackofficeAssinaturasPage.tsx
    ├── BackofficeCobrancasPage.tsx
    ├── BackofficeIntegracoesPage.tsx
    ├── BackofficeIaPage.tsx
    └── BackofficeRelatoriosPage.tsx
```

### Backend (`back-projeto-clinica`)

```
src/
├── routes/backoffice.routes.ts
├── controllers/backoffice.controller.ts
└── services/backoffice.service.ts

scripts/
├── upsert-backoffice-admin.ts
└── create-admin-user.ts
```

---

## 16. Próximas fases sugeridas

Ordem sugerida para evoluir o backoffice de "console operacional" para "console SaaS completo":

1. **Modelos de billing:** `Subscription`, `Plan`, `Invoice` no Prisma
2. **Assinaturas e cobranças:** conectar placeholders à API real (Asaas ou similar)
3. **MRR/churn reais:** substituir simulação em `getMetrics()`
4. **Menu pacientes:** adicionar link na sidebar
5. **Integrações:** status real de WhatsApp, SMTP, OpenRouter por clínica
6. **IA plataforma:** defaults globais, limites, custos OpenRouter
7. **Relatórios:** export CSV, filtros por período, receita por clínica
8. **Config plataforma:** unificar com assinaturas/cobrança (remover duplicidade)
9. **Segurança:** refresh token, logout server-side, guard frontend com `/me`
10. **UX:** busca global funcional, toasts padronizados, dark mode opcional

---

## Referência rápida: cliente HTTP do front

`backoffice-api.ts` expõe:

```typescript
backofficeApi.status()
backofficeApi.login(email, password)
backofficeApi.metrics()
backofficeApi.clinics.list() | .create() | .update()
backofficeApi.users.list() | .getById() | .create() | .update() | .remove()
backofficeApi.patients.list()
backofficeApi.getStoredUser()
getBackofficeToken()
clearBackofficeSession()
```

Chaves no `localStorage`:
- `backoffice_token`
- `backoffice_user`
