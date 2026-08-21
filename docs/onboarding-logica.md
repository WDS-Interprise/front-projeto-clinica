# Onboarding ClinMax. fluxo ramificado

O onboarding **não é mais uma trilha única de 8 passos**. A primeira decisão é: **criar a operação** ou **entrar em uma existente**. Cada pessoa só vê perguntas que alteram a conta dela.

## Conceitos (não misturar)

| Conceito | Exemplos |
|---|---|
| Como entrou | Criou a clínica / Entrou com código |
| Cargo no sistema | Proprietário, Admin, Recepção, Profissional clínico, Consultor, Financeiro |
| Profissão clínica | Médico, Psicólogo, Nutricionista… |
| Especialidade | Pediatria, Cardiologia, área de atuação |
| Permissões | Vêm do cargo (`ADMIN`, `DOCTOR`, `RECEPTION`, `CONSULTANT`, `FINANCE`) |

Administrador **não** vê CRM nem Pediatria. Profissional **não** configura convênios da clínica no fluxo de convite.

---

## Caminho A. Criar clínica

1. **Como vai usar?** → Criar uma clínica  
2. **Papel** → Proprietário / Profissional / Admin+profissional / Consultor  
3. **Clínica** → nome, modelo (consultório, equipe, multidisciplinar, centro), quantidade  
4. **Também atende?** → só se for Proprietário/Administrador  
   - Não → pula perfil clínico  
   - Sim → perfil profissional  
5. **Perfil profissional** (só quem atende) → profissão → conselho (CRM/CRP/CRN…) + UF → especialidade ou área  
6. **Funcionamento** → dias + horário + duração do slot (grava na clínica)  
7. **Recebimento** → presencial/online + particular/convênio/ambos (grava `billingModel` e `careMode`)  
8. **Equipe** → convites com cargo já definido (Admin, Recepção, Profissional, Financeiro, Consultor)  
9. **Resumo** → Entrar na ClinMax  

## Caminho B. Código da clínica (não entra na hora)

1. **Como vai usar?** → Entrar em uma clínica  
2. **Código** → localiza a clínica (`GET /invites/clinic-code/:code`)  
   - Se o código **já tem cargo** (`Clinic.inviteCodeRole`): o passo de cargo **não aparece**. Só pede perfil clínico se o cargo for profissional.  
   - Se o código **não tem cargo**: a pessoa **não escolhe** Admin nem nenhum outro papel. Só solicita entrada.  
3. **Solicitar entrada** → cria `ClinicJoinRequest` (`requestedRole` nulo ou o cargo do código)  
4. A pessoa cai em **Aguardando acesso**  
5. Admin em **Configurações → Convites**  
   - Código com cargo: aprova ou recusa  
   - Código sem cargo: **escolhe o cargo** e aprova  

Ninguém entra como Administrador só por ter o código. Quem gera o código em Convites decide se vincula um cargo ou deixa “admin define na aprovação”.

Quem entra por **e-mail de convite** (`/convite/:token`) continua imediato: o cargo já veio no convite.

---

## O que cada escolha grava

| Escolha | Persistência |
|---|---|
| Papel | `User.role` + `isAccountAdmin` / `isClinicAdmin` |
| Consultor | `CONSULTANT` (não é mais o mesmo `ADMIN` do dono) |
| Financeiro | `FINANCE` |
| Profissional | `DOCTOR` + `Doctor.professionalType`, `crm`, `specialty` |
| Dono que também atende | `ADMIN` + perfil `Doctor` |
| Nome / espaço / tamanho | `Clinic.name`, `spaceType`, `teamSizeLabel` |
| Agenda da operação | `agendaStartTime`, `agendaEndTime`, `slotIntervalMinutes`, `operatingDays` |
| Financeiro / modalidade | `billingModel`, `careMode` |
| Convites da equipe | `ClinicInvite` com `role` no envio |

---

## Permissões

Permissões **compostas**: cargo + perfil clínico (`Doctor`). Admin puro não prescreve nem lê evolução.

- **ADMIN sem Doctor:** operação (usuários, clínicas, agenda, financeiro, paciente básico). Sem `records:*` / `prescriptions:write`.  
- **ADMIN + Doctor:** operação + clínico.  
- **DOCTOR:** agenda, paciente, prontuário, prescrição.  
- **RECEPTION:** agenda, paciente básico, WhatsApp, financeiro operacional. Sem prontuário.  
- **CONSULTANT:** painel, agenda (visão), configurações (`clinics:manage`), relatórios. Sem paciente e sem clínico.  
- **FINANCE:** paciente básico + financeiro + relatórios. Sem prontuário.

---

## Arquivos

- Front: `src/pages/onboarding/OnboardingPage.tsx`, `src/lib/onboarding-flow.ts`  
- Back: `completeOnboarding`, `previewClinicCode`, `Role` no Prisma  
- UI por cargo: `docs/cargos-ui.md`  
