# ClinMax Backoffice: estrutura atual

Documentação do **console do proprietário da plataforma** como está hoje no código (agosto/2026).

| Item | Valor |
|------|-------|
| URL do front | `/backoffice` |
| Login | `/backoffice/login` |
| API | `http://localhost:3001/api/backoffice` |
| Público-alvo | Dono da plataforma (`isAccountAdmin`), não admin de clínica |

---

## Índice

1. [Resumo executivo](#1-resumo-executivo)
2. [Arquitetura](#2-arquitetura)
3. [Autenticação](#3-autenticação)
4. [Shell: layout, menu e scroll](#4-shell-layout-menu-e-scroll)
5. [Seções do menu](#5-seções-do-menu)
6. [Visão geral (dashboard)](#6-visão-geral-dashboard)
7. [API backend](#7-api-backend)
8. [Dados e modelos Prisma](#8-dados-e-modelos-prisma)
9. [Arquivos principais](#9-arquivos-principais)
10. [O que ainda não existe](#10-o-que-ainda-não-existe)

---

## 1. Resumo executivo

O backoffice é um app **separado** do CRM das clínicas. Tem login próprio, token próprio no `localStorage` e layout próprio (verde `#006B4D`, sidebar fixa).

### Funcional hoje

| Seção | Status |
|-------|--------|
| Login | Funcional |
| Visão geral | Funcional, **dados reais** do banco |
| Clínicas | Funcional (listar, criar, ativar/desativar) |
| Usuários | Funcional (CRUD global) |
| Pacientes | Funcional (somente leitura, **sem item no menu**) |

### Placeholder (menu existe, tela não implementada)

| Seção | Status |
|-------|--------|
| Assinaturas | Placeholder |
| Cobranças | Placeholder |
| Integrações | Placeholder |
| IA e Automação | Placeholder |
| Relatórios | Placeholder |
| Configurações da plataforma | Cards "em breve" |

---

## 2. Arquitetura

```
Browser
  └── React Router (/backoffice/*)
        ├── BackofficeLogin          (público)
        └── BackofficeProtectedRoute (exige backoffice_token)
              └── BackofficeLayout
                    └── <Outlet />   (página da seção)
                          └── backofficeApi → fetch /api/backoffice/*
                                └── Fastify + JWT + requirePlatformOwner
                                      └── backoffice.service.ts → Prisma
```

### Separação do CRM

| Aspecto | CRM (`/dashboard`, etc.) | Backoffice |
|---------|--------------------------|------------|
| Token | `localStorage.token` | `localStorage.backoffice_token` |
| Usuário | `AuthContext` | `localStorage.backoffice_user` |
| Layout | `AppShell` + `AppHeader` | `BackofficeLayout` |
| Permissões | `PermissionRoute` por clínica | Só dono da plataforma |
| Login | `/login` | `/backoffice/login` |

---

## 3. Autenticação

### Quem pode entrar

Usuário com `User.isAccountAdmin === true`, ou e-mail igual a `ADMIN_EMAIL` no `.env` do backend.

### Fluxo de login

1. Front chama `POST /api/backoffice/login` com `{ email, password }`.
2. Backend (`adminLogin`):
   - **Caminho A:** credenciais batem com `ADMIN_EMAIL` + `ADMIN_PASSWORD` → cria/atualiza admin e emite JWT.
   - **Caminho B:** usuário no banco com `isAccountAdmin` e senha válida.
3. Front salva `backoffice_token` e `backoffice_user` e redireciona para `/backoffice`.

### JWT

```json
{
  "userId": "...",
  "email": "...",
  "role": "ADMIN",
  "clinicId": "...",
  "isPlatformOwner": true
}
```

### Proteção das rotas

- **Front:** `BackofficeProtectedRoute` verifica só se existe token.
- **API:** middleware `auth` + `requirePlatformOwner` em todas as rotas exceto `/status` e `/login`.
- **401 na API:** front limpa sessão e pede login de novo.

### Credenciais de dev

| Origem | E-mail | Senha |
|--------|--------|-------|
| Seed | `admin@clinicare.com` | `admin123` |
| `.env` backend | `ADMIN_EMAIL` | `ADMIN_PASSWORD` |

---

## 4. Shell: layout, menu e scroll

**Arquivo:** `src/components/layout/BackofficeLayout.tsx`

### Estrutura visual

```
┌─────────────────────────────────────────────────────────────┐
│ SIDEBAR (248px, fixa)  │  HEADER (sticky, busca decorativa) │
│  Logo ClinMax          ├─────────────────────────────────────┤
│  Nav (9 itens)         │                                     │
│  Card "Ambiente        │  MAIN (scroll vertical)             │
│   privado"             │    <Outlet /> = página da seção     │
│                        ├─────────────────────────────────────┤
│                        │  FOOTER (versão, copyright)         │
└─────────────────────────────────────────────────────────────┘
```

### Menu lateral (ordem exata)

| # | Label | Rota | Ícone |
|---|-------|------|-------|
| 1 | Visão geral | `/backoffice` | LayoutDashboard |
| 2 | Clínicas | `/backoffice/clinicas` | Building2 |
| 3 | Assinaturas | `/backoffice/assinaturas` | CreditCard |
| 4 | Cobranças | `/backoffice/cobrancas` | Receipt |
| 5 | Usuários | `/backoffice/usuarios` | Users |
| 6 | Integrações | `/backoffice/integracoes` | Plug |
| 7 | IA e Automação | `/backoffice/ia-automacao` | Bot |
| 8 | Relatórios | `/backoffice/relatorios` | BarChart3 |
| 9 | Configurações da plataforma | `/backoffice/plataforma` | Settings |

### Header (elementos)

- Breadcrumb: "Backoffice privado / Console do proprietário"
- Campo de busca global (**decorativo**, sem ação)
- Sino de notificações (**decorativo**, badge fixo "3")
- Badge "Ambiente seguro"
- Nome do usuário + avatar + logout

### Scroll

O `body` do site tem `overflow: hidden`. O backoffice usa:

- Container: `h-screen overflow-hidden`
- `<main>`: `min-h-0 flex-1 overflow-y-auto`

Assim a visão geral e demais páginas longas rolam dentro da área central, com sidebar e header fixos.

### Rotas extras (fora do menu)

| Rota | Página |
|------|--------|
| `/backoffice/pacientes` | Pacientes global |
| `/backoffice/usuarios/novo` | Formulário novo usuário |
| `/backoffice/usuarios/:id` | Formulário editar usuário |

---

## 5. Seções do menu

### 5.1 Login (`BackofficeLogin.tsx`)

- Rota: `/backoffice/login`
- Formulário e-mail + senha
- Erro inline (sem toast)
- Link voltar para landing/login do CRM

---

### 5.2 Visão geral (`BackofficeDashboard.tsx`)

- Rota: `/backoffice` (index)
- API: `GET /backoffice/metrics`
- Detalhes na [seção 6](#6-visão-geral-dashboard)

---

### 5.3 Clínicas (`BackofficeClinicsPage.tsx`)

- Rota: `/backoffice/clinicas`
- **Status:** funcional

| Ação | API |
|------|-----|
| Listar | `GET /backoffice/clinics` |
| Criar | `POST /backoffice/clinics` |
| Ativar/desativar | `PUT /backoffice/clinics/:id` |

**Tela:**
- Botão "Nova clínica" (form inline: nome, telefone, e-mail)
- Tabela: nome/e-mail, usuários, pacientes, consultas, status, toggle ativo

**Limitações:**
- Não edita nome/e-mail na tabela
- Erros inline (sem toast)
- Criação não gera `inviteCode` nem cargos padrão

---

### 5.4 Assinaturas (`BackofficeAssinaturasPage.tsx`)

- Rota: `/backoffice/assinaturas`
- **Status:** placeholder (`BackofficePlaceholderPage`)
- Copy: "Planos, trials e renovações das clínicas na plataforma."

---

### 5.5 Cobranças (`BackofficeCobrancasPage.tsx`)

- Rota: `/backoffice/cobrancas`
- **Status:** placeholder
- Copy: "Faturas, inadimplência e histórico de pagamentos das clínicas."

---

### 5.6 Usuários (`BackofficeUsersPage.tsx` + `BackofficeUserFormPage.tsx`)

- Rotas: `/backoffice/usuarios`, `/novo`, `/:id`
- **Status:** funcional

| Ação | API |
|------|-----|
| Listar (filtros) | `GET /backoffice/users` |
| Detalhe | `GET /backoffice/users/:id` |
| Criar | `POST /backoffice/users` |
| Editar | `PUT /backoffice/users/:id` |
| Excluir (soft) | `DELETE /backoffice/users/:id` |

**Lista:**
- Filtros: busca (debounce 300ms), perfil, clínica
- Tabela: nome, e-mail, perfil, clínicas, dono plataforma, ativo
- Modal de confirmação + toasts

**Formulário:**
- Perfis: Recepcionista, Médico, Admin clínica
- Campos: clínica, nome, e-mail, senha, telefone, CRM/especialidade (médico), médicos vinculados (recepção), admin clínica, **dono da plataforma**, ativo (só edição)

---

### 5.7 Integrações (`BackofficeIntegracoesPage.tsx`)

- Rota: `/backoffice/integracoes`
- **Status:** placeholder

---

### 5.8 IA e Automação (`BackofficeIaPage.tsx`)

- Rota: `/backoffice/ia-automacao`
- **Status:** placeholder

---

### 5.9 Relatórios (`BackofficeRelatoriosPage.tsx`)

- Rota: `/backoffice/relatorios`
- **Status:** placeholder

---

### 5.10 Configurações da plataforma (`BackofficePlatformPage.tsx`)

- Rota: `/backoffice/plataforma`
- **Status:** cards informativos "em breve"

Cards exibidos:
- Assinatura, Cobrança, Permissões de envio, SMS enviados, Teleconsultas, Exportar dados, Migrar

---

### 5.11 Pacientes (`BackofficePatientsPage.tsx`)

- Rota: `/backoffice/pacientes`
- **Status:** funcional, **ausente do menu lateral**
- API: `GET /backoffice/patients` (paginação, filtro clínica, busca)
- Somente leitura, 20 por página, toasts em erro

---

## 6. Visão geral (dashboard)

**Arquivo:** `BackofficeDashboard.tsx`  
**API:** `GET /backoffice/metrics`  
**Dados:** 100% reais do Prisma (sem MRR/planos/trials simulados)

### 6.1 Cabeçalho da página

- Saudação com primeiro nome de `backoffice_user`
- Subtítulo: "Dados reais da plataforma ClinMax"
- Botão atualizar (recarrega métricas)

### 6.2 KPIs (6 cards)

| KPI | Fonte |
|-----|-------|
| Clínicas ativas | `clinic.count({ active: true })` |
| Pacientes | `patient.count()` |
| Usuários | `user.count()` |
| Consultas hoje | agendamentos `SCHEDULE` de hoje |
| WhatsApp conectados | `whatsappConnection` com status `CONNECTED` |
| Solicitações pendentes | `clinicJoinRequest` com status `PENDING` |

Cada card (exceto "Consultas hoje") tem:
- Sparkline dos últimos 6 meses
- Variação % vs mês anterior (calculada dos trends reais)

### 6.3 Segunda linha (3 blocos)

| Bloco | Conteúdo | Fonte |
|-------|----------|-------|
| Novas clínicas por mês | Gráfico de área, 6 meses | `clinic.createdAt` |
| Clínicas por porte | Donut | `Clinic.teamSizeLabel` (onboarding) |
| Atividades da plataforma | Timeline | Eventos reais recentes |

**Atividades** montadas a partir de:
- Clínicas criadas
- Pacientes criados
- Usuários criados
- Solicitações de acesso pendentes
- Pagamentos ClinMax Pay recebidos

Horário relativo real ("Há 2h", "Há 3d", etc.).

### 6.4 Terceira linha (3 blocos)

| Bloco | Conteúdo |
|-------|----------|
| Clínicas recentes (tabela) | 8 clínicas mais recentes |
| ClinMax Pay (donut) | Status dos pagamentos + receita |
| Ações pendentes | 3 cards de alerta |

**Tabela clínicas recentes**

| Coluna | Dado |
|--------|------|
| Clínica | Nome |
| Status | Ativa / Inativa (`clinic.active`) |
| Usuários | `_count.users` |
| Pacientes | `_count.patients` |
| Consultas | `_count.appointments` |
| WhatsApp | Conectado / Offline |
| Cadastro | `createdAt` |

Link "Ver todas" → `/backoffice/clinicas`

**ClinMax Pay**
- Receita do mês e total (`PlatformPayment.platformFee`)
- Donut por status: Pendentes, Confirmados, Recebidos, Estornados, etc.

**Ações pendentes**
- Solicitações de acesso pendentes
- Clínicas sem WhatsApp conectado
- Convites pendentes (`ClinicInvite` status `PENDING`)

### 6.5 Payload `overview` (API, não exibido no dashboard hoje)

A API também retorna blocos usáveis no futuro:

- `overview`: totais operacionais
- `usersByRole`: usuários por perfil
- `appointmentsByStatus`: consultas por status
- `upcomingAppointments`: próximas 10 consultas
- `recentPatients`: últimos 5 pacientes
- `generatedAt`: timestamp ISO

---

## 7. API backend

**Prefixo:** `/api/backoffice`  
**Registro:** `back-projeto-clinica/src/index.ts`  
**Rotas:** `src/routes/backoffice.routes.ts`  
**Service:** `src/services/backoffice.service.ts`  
**Controller:** `src/controllers/backoffice.controller.ts`  
**Cliente front:** `src/services/backoffice-api.ts`

### Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/status` | Não | Health check |
| POST | `/login` | Não | Login proprietário |
| GET | `/me` | Sim | Perfil do logado (não usado no front) |
| GET | `/metrics` | Sim | Dashboard completo |
| GET | `/clinics` | Sim | Lista clínicas |
| POST | `/clinics` | Sim | Cria clínica |
| PUT | `/clinics/:id` | Sim | Atualiza clínica |
| GET | `/users` | Sim | Lista usuários |
| GET | `/users/:id` | Sim | Detalhe usuário |
| POST | `/users` | Sim | Cria usuário |
| PUT | `/users/:id` | Sim | Atualiza usuário |
| DELETE | `/users/:id` | Sim | Soft delete usuário |
| GET | `/patients` | Sim | Lista pacientes paginada |

### Objeto `saas` em `/metrics` (campos atuais)

```typescript
{
  activeClinics, totalClinics, inactiveClinics,
  whatsappConnected, clinicsWithWhatsapp, offlineIntegrations,
  pendingJoinRequests, pendingInvites,
  platformRevenueTotal, platformRevenueMonth,
  clinicsGrowthTrend, patientsGrowthTrend, revenueTrend,
  clinicDistribution,
  recentClinics[],
  platformActivities[],
  paymentStatusDistribution[],
  kpiTrends: { activeClinics, patients, users, whatsappConnected, joinRequests }
}
```

---

## 8. Dados e modelos Prisma

### Usados pelo backoffice

| Model | Uso |
|-------|-----|
| `User` | Login, CRUD, `isAccountAdmin` |
| `UserClinic` | Vínculo usuário-clínica |
| `Clinic` | CRUD, métricas, porte (`teamSizeLabel`) |
| `Patient` | Listagem global |
| `Appointment` | Contagens e status |
| `Doctor` | Contagem |
| `MedicalRecord` | Contagem |
| `WhatsappConnection` | Integrações conectadas/offline |
| `ClinicJoinRequest` | Solicitações pendentes |
| `ClinicInvite` | Convites pendentes |
| `PlatformPayment` | Receita ClinMax Pay |
| `ReceptionistDoctor` | Vínculo recepção-médico na criação de usuário |

### Não existe ainda (impede assinaturas/MRR real)

- Model de **plano** / **assinatura** / **fatura** de clínica na plataforma
- Por isso Assinaturas e Cobranças no menu são placeholders

---

## 9. Arquivos principais

### Frontend (`front-projeto-clinica`)

```
src/
├── App.tsx                          # Rotas /backoffice/*
├── components/layout/
│   └── BackofficeLayout.tsx         # Shell sidebar + header + scroll
├── pages/backoffice/
│   ├── BackofficeLogin.tsx
│   ├── BackofficeDashboard.tsx      # Visão geral
│   ├── BackofficeClinicsPage.tsx
│   ├── BackofficeUsersPage.tsx
│   ├── BackofficeUserFormPage.tsx
│   ├── BackofficePatientsPage.tsx
│   ├── BackofficePlatformPage.tsx
│   ├── BackofficePlaceholderPage.tsx
│   ├── BackofficeAssinaturasPage.tsx
│   ├── BackofficeCobrancasPage.tsx
│   ├── BackofficeIntegracoesPage.tsx
│   ├── BackofficeIaPage.tsx
│   └── BackofficeRelatoriosPage.tsx
└── services/
    └── backoffice-api.ts            # Cliente HTTP + tipos
```

### Backend (`back-projeto-clinica`)

```
src/
├── routes/backoffice.routes.ts
├── controllers/backoffice.controller.ts
└── services/backoffice.service.ts   # Login, métricas, CRUD
```

### Documentação relacionada

- `docs/backoffice.md`: inventário histórico mais longo (pode estar parcialmente desatualizado)
- Este arquivo: **estrutura atual** (preferir este para visão de hoje)

---

## 10. O que ainda não existe

### UI decorativa (sem backend)

- Busca global no header
- Notificações (badge "3" fixo)
- Seletor de período (removido da visão geral)

### Funcionalidades de produto

- Módulo de assinaturas e cobranças de clínicas
- MRR/churn/trials reais
- Relatórios exportáveis
- Gestão centralizada de integrações
- Configurações globais de IA
- Link de Pacientes no menu lateral
- Invalidação de JWT no logout
- Redirect automático se já logado em `/backoffice/login`

### Melhorias técnicas sugeridas

1. Model Prisma `ClinicSubscription` + telas Assinaturas/Cobranças
2. Exibir `overview` / `upcomingAppointments` no dashboard ou em Relatórios
3. Toasts na página de Clínicas (alinhar com Usuários/Pacientes)
4. `GET /me` no front para validar sessão ao abrir o layout
5. Item "Pacientes" no menu lateral

---

*Gerado com base no código em agosto/2026. Para inventário ponta a ponta do site inteiro, ver `docs/site-inventario-ponta-a-ponta.md`.*
