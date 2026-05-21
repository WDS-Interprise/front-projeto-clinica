@echo off
chcp 65001 >nul
title CliniCare — Documentacao do Projeto
cls

echo =================================================================
echo                CLINICARE — CRM HOSPITALAR
echo           Documentacao para Agente Cursor (IA)
echo =================================================================
echo.
echo   Tecnologias Base:
echo   - Vite 8        - Build tool ultra-rapida
echo   - React 19      - Biblioteca UI
echo   - TypeScript 6  - Tipagem estatica
echo   - Tailwind v4   - Utility-first CSS
echo   - React Router 7- Roteamento SPA
echo   - Lucide React  - Icones SVG
echo   - date-fns      - Manipulacao de datas
echo   - clsx + twMerge- Utilitarios de classe CSS
echo.
echo =================================================================
echo   ESTRUTURA DO PROJETO — FRONTEND (clinic-crm/)
echo =================================================================
echo.
echo   clinic-crm/
echo    +-- src/
echo        +-- components/
echo            +-- layout/
echo                +-- Layout.tsx      - Outlet com sidebar fixa
echo                +-- Sidebar.tsx     - Navegacao + user info + logout
echo            +-- ui/
echo                +-- badge.tsx       - Status (scheduled/confirmed/etc)
echo                +-- button.tsx      - Variantes primary/secondary/ghost
echo                +-- card.tsx        - Card + CardHeader + CardTitle
echo                +-- input.tsx       - Input com label
echo        +-- pages/
echo            +-- Login.tsx           - Auth real (POST /api/auth/login)
echo            +-- Register.tsx        - Cadastro com validacao em tempo real
echo            +-- Dashboard.tsx       - Stats + proximas consultas (API)
echo            +-- Patients.tsx        - Tabela com busca (API)
echo            +-- Appointments.tsx    - Calendario + lista do dia (API)
echo            +-- Doctors.tsx         - Cards do corpo clinico (API)
echo            +-- Records.tsx         - Prontuarios (API)
echo            +-- Settings.tsx        - Configs da clinica
echo        +-- services/
echo            +-- api.ts              - Cliente HTTP com JWT Bearer
echo        +-- lib/
echo            +-- utils.ts            - cn(), formatDate(), formatPhone()
echo        +-- types/
echo            +-- index.ts            - Patient, Doctor, Appointment, MedicalRecord
echo        +-- App.tsx                 - Rotas publicas e protegidas via JWT
echo        +-- main.tsx                - Entry point React
echo        +-- index.css               - Tailwind + theme inline
echo        +-- vite-env.d.ts           - Tipos Vite client
echo    +-- vite.config.ts              - Vite + React + Tailwind + @ alias + proxy /api
echo    +-- tsconfig.app.json           - TS config com paths alias
echo    +-- package.json                - Dependencias e scripts
echo.
echo =================================================================
echo   ESTRUTURA DO PROJETO — BACKEND (server/)
echo =================================================================
echo.
echo   server/
echo    +-- src/
echo        +-- index.ts                - Fastify server entry
echo        +-- routes/
echo            +-- auth.routes.ts       (POST /login, POST /register, GET /me)
echo            +-- patients.routes.ts   (CRUD /patients)
echo            +-- doctors.routes.ts    (CRUD /doctors)
echo            +-- appointments.routes.ts (CRUD /appointments)
echo            +-- records.routes.ts    (CRUD /records)
echo            +-- dashboard.routes.ts  (GET /dashboard/stats, /upcoming, /recent-patients)
echo        +-- controllers/
echo            +-- auth.controller.ts
echo            +-- patients.controller.ts
echo            +-- doctors.controller.ts
echo            +-- appointments.controller.ts
echo            +-- records.controller.ts
echo            +-- dashboard.controller.ts
echo        +-- services/
echo            +-- auth.service.ts
echo            +-- patient.service.ts
echo            +-- doctor.service.ts
echo            +-- appointment.service.ts
echo            +-- record.service.ts
echo            +-- dashboard.service.ts
echo        +-- lib/
echo            +-- prisma.ts           - Conexao singleton Prisma
echo    +-- prisma/
echo        +-- schema.prisma           - Modelos: User, Patient, Doctor, Appointment, MedicalRecord
echo        +-- seed.ts                 - Dados iniciais (8 users, 6 doctors, 5 patients, 5 appointments, 3 records)
echo    +-- package.json
echo.
echo =================================================================
echo   ALTERACOES REALIZADAS
echo =================================================================
echo.
echo   ### 1. Criacao do Backend (Fastify + Prisma)
echo   - Servidor Fastify com @fastify/cors, @fastify/jwt
echo   - Prisma ORM com SQLite (dev) / PostgreSQL (prod)
echo   - Arquitetura: Routes - Controllers - Services - Prisma
echo   - Todas as rotas protegidas por JWT (exceto login/register)
echo   - Validacao Zod nos endpoints
echo.
echo   ### 2. Integracao Front-End com Backend
echo   - Criado src/services/api.ts — cliente HTTP com token JWT
echo   - Login real: POST /api/auth/login, token armazenado no localStorage
echo   - Proxy Vite (/api -^ localhost:3001) elimina CORS em dev
echo   - Todas as paginas consomem API real (Dashboard, Patients, Doctors, etc.)
echo   - Sidebar com nome do usuario logado + logout
echo.
echo   ### 3. Tela de Cadastro (Register.tsx)
echo   - Inputs: Nome (so letras, min 5), Email (sem espacos, validacao), CPF (formatacao ###.###.###-##), Senha + Confirmar
echo   - Validacao em tempo real: barra de forca (fraca/media/boa/forte), regras com checkmark
echo   - Confirmacao de senhas conferem
echo   - CTA habilitado apenas quando tudo valido
echo   - Chama POST /api/auth/register
echo.
echo   ### 4. Substituicao de Express por Fastify
echo   - Express removido, Fastify implementado
echo   - @fastify/jwt para autenticacao via decorator + preHandler
echo   - Services layer separa regras de negocios dos controllers
echo.
echo   ### 5. Seed do Banco de Dados
echo   - 8 usuarios com roles: ADMIN, DOCTOR (6), RECEPTION
echo   - 6 medicos, 5 pacientes, 5 consultas, 3 prontuarios
echo.
echo =================================================================
echo   TIPOS E MODELOS (src/types/index.ts)
echo =================================================================
echo.
echo   Patient {
echo     id, name, email, phone, cpf, birthDate
echo     gender, address, bloodType, allergies (string)
echo     medications (string), createdAt, updatedAt
echo   }
echo.
echo   Doctor {
echo     id, name, email, phone, crm
echo     specialty, available, createdAt, updatedAt
echo   }
echo.
echo   Appointment {
echo     id, patientId, doctorId, date, time
echo     status (SCHEDULED/CONFIRMED/IN_PROGRESS/COMPLETED/CANCELLED)
echo     patient: { id, name, phone }
echo     doctor: { id, name, specialty }
echo   }
echo.
echo   MedicalRecord {
echo     id, patientId, doctorId, date
echo     diagnosis, prescription, notes
echo     patient: { id, name }
echo     doctor: { id, name }
echo   }
echo.
echo =================================================================
echo   USUARIOS DO SEED
echo =================================================================
echo.
echo   Email                           Senha       Role
echo   ------------------------------  ----------  ---------
echo   admin@clinicare.com             admin123    ADMIN
echo   ana.costa@clinicare.com         doctor123   DOCTOR
echo   rafael.souza@clinicare.com      doctor123   DOCTOR
echo   pedro.lima@clinicare.com        doctor123   DOCTOR
echo   carla.dias@clinicare.com        doctor123   DOCTOR
echo   marcelo.torres@clinicare.com    doctor123   DOCTOR
echo   juliana.martins@clinicare.com   doctor123   DOCTOR
echo   recepcao@clinicare.com          recep123    RECEPTION
echo.
echo =================================================================
echo   PROXIMOS PASSOS RECOMENDADOS
echo =================================================================
echo.
echo   ### CRUD Completo
echo   - Implementar formularios de criacao/edicao (react-hook-form + zod)
echo   - Modal de confirmacao para exclusao
echo   - Paginacao nas listas (Pacientes, Prontuarios)
echo.
echo   ### UX
echo   - Filtros avancados (por especialidade, data, status)
echo   - Notificacoes toast (react-hot-toast)
echo   - Tema claro/escuro
echo   - Responsividade mobile
echo.
echo   ### Financeiro
echo   - Contas a receber, fluxo de caixa, relatorios
echo.
echo   ### Agenda
echo   - Drag-and-drop para reagendar consultas
echo   - Sala de espera virtual
echo.
echo   ### Infra
echo   - Configurar PostgreSQL em producao
echo   - Docker Compose para ambiente completo
echo   - CI/CD (GitHub Actions)
echo.
echo =================================================================
echo   COMANDOS UTEIS
echo =================================================================
echo.
echo   FRONTEND (clinic-crm/)
echo     npm run dev       - Inicia dev server (porta 5173)
echo     npm run build     - Compila para producao
echo.
echo   BACKEND (server/)
echo     npm run dev       - Inicia servidor (porta 3001)
echo     npm run db:seed   - Popula banco com dados iniciais
echo     npm run db:push   - Sincroniza schema com banco
echo     npm run db:studio - Abre Prisma Studio
echo.
echo =================================================================
echo   PADROES DE CODIGO
echo =================================================================
echo.
echo   - Componentes em PascalCase: export default function Nome()
echo   - Pastas em kebab-case: components/ui/button.tsx
echo   - Props tipadas com interface
echo   - Importacoes com alias @/
echo   - Tailwind utility-first
echo   - Nao adicionar comentarios no codigo
echo   - Cores via theme inline no CSS (--color-primary, etc)
echo   - Backend: controller chama service, service chama Prisma
echo.
echo =================================================================
echo   DOCUMENTACAO GERADA EM: %date% %time%
echo   PROJETO: clinic-crm + server
echo   LOCAIS:
echo     C:\Users\nobru\Desktop\dev\clinic-crm
echo     C:\Users\nobru\Desktop\dev\server
echo =================================================================
echo.
pause
