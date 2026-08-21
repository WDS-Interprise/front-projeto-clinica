# O que cada cargo vê na UI (ClinMax)

Fonte: `back-projeto-clinica/src/lib/permissions.ts`.
Admin com perfil clínico não é outro cargo: `role = ADMIN` + `clinicalProfile = true`. O resolvedor soma permissões administrativas + clínicas.

Quem não tem a permissão não vê o item. URL aberta na mão redireciona para a home do cargo (`defaultHomePath`).

---

## Home pós-login

| Cargo | Destino |
|---|---|
| Admin | `/dashboard` (Painel) |
| Consultor | `/dashboard` (Painel) |
| Profissional | `/agenda` |
| Recepção | `/agenda` |
| Financeiro | `/gestao/financas` |

---

## Navbar

| Item | Permissão | Admin | Admin + clínico | Profissional | Recepção | Financeiro | Consultor |
|---|---|---|---|---|---|---|---|
| Painel | `dashboard:view` | Sim | Sim | Não | Não | Não | Sim |
| Agenda | `agenda:view` | Sim | Sim | Sim (só a própria) | Sim (todas) | Não | Sim (ocupação) |
| Pacientes | `patients:view` | Sim | Sim | Sim | Sim | Sim | Não |
| Mensagens | `whatsapp:send` | Sim | Sim | Não | Sim | Não | Não |
| Configurações | `clinics:manage` | Sim | Sim | Não | Não | Não | Sim |
| Gestão | `finance:view` ou `reports:view` | Sim | Sim | Não | Não | Sim | Só relatórios |
| Outros | varia | Contatos + logs | + Bulas/CID | Bulas/CID + contatos | Contatos | Contatos | Não |

Ações rápidas (+):

- Novo agendamento: `agenda:manage`
- Paciente: `patients:create`
- Profissional / recepcionista: `users:manage` (só admin)

---

## Permissões novas

| Permissão | Para que serve | Quem tem |
|---|---|---|
| `clinical_tools:view` | Bulas, CID-10, CID-11 | Profissional; Admin + clínico |
| `invites:manage` | Criar/revogar convite e código | Só Admin |
| `finance:operational` | Cobrar, recebimento e pendência no drawer | Admin, recepção, financeiro |

`clinics:manage` configura clínica, horários e WhatsApp. Não controla convites.

Aprovar pedido de entrada por código continua `users:manage` (só admin).

---

## Gestão

| Tela | Permissão | Quem vê |
|---|---|---|
| Finanças, extrato, receitas, despesas, fluxo, estoque, TISS | `finance:view` | Admin, financeiro |
| Relatórios, pesquisa | `reports:view` | Admin, financeiro, consultor |

Recepção cobra no drawer da agenda (`finance:operational`). Não entra em extrato, lucro, despesas estratégicas nem TISS.

---

## Outros

| Tela | Permissão |
|---|---|
| Bulas, CID-10, CID-11 | `clinical_tools:view` |
| Contatos | `patients:view` |
| Logs | `users:manage` |

---

## Configurações

| Item | Permissão | Quem vê |
|---|---|---|
| Dados, horários, financeiro da operação, WhatsApp | `clinics:manage` | Admin, consultor |
| Convites | `invites:manage` | Só admin |
| Usuários | `users:manage` | Só admin |
| Aparência / Minha conta | livre | Qualquer logado |

---

## Escopo da agenda (não é só ter/não ter permissão)

| Quem | O que vê | O que altera |
|---|---|---|
| Admin / Recepção | Todas as agendas | `agenda:manage` em todas |
| Profissional | Só a própria (`appointmentDoctorFilter`) | Só a própria |
| Consultor | Ocupação, profissional, horário, blocos. Texto: `Horário ocupado`. Sem nome de paciente na API (`occupancyOnly`) | Não gerencia |

---

## Drawer do agendamento (a mesma tela muda)

| Visão | Vê | Não vê |
|---|---|---|
| Recepção | Cadastro, contato, convênio, cobrança, remarcar, WhatsApp, presença/falta | Abrir prontuário, iniciar atendimento |
| Profissional | Paciente, horário, prontuário, iniciar atendimento | Cobrança completa |
| Admin puro | Operação + financeiro | Prontuário e atendimento |
| Admin + clínico | Tudo | |
| Consultor | Ocupação e horário | Nome, ficha, cobrança, clínico |

---

## Por cargo

### Admin (sem perfil clínico)

Opera a casa: painel, agenda completa, cadastro básico, WhatsApp, gestão, convites e usuários. Sem prontuário, bula ou CID.

### Admin + clínico

Tudo do admin mais prontuário, atendimento, prescrição e ferramentas clínicas.

### Profissional

Agenda e prontuário da própria operação. Sem gestão da casa, convites, WhatsApp da clínica e financeiro.

### Recepção

Agenda de todos, paciente básico, WhatsApp, caixa operacional no agendamento. Sem clínico e sem gestão financeira completa.

### Financeiro

Pacientes para cobrança e gestão financeira. Sem agenda e sem clínico. Home em Finanças.

### Consultor

Painel, ocupação da agenda, configuração da clínica. Sem pacientes, sem convites, sem usuários.

---

## Telas clínicas

| Rota | Permissão |
|---|---|
| `/prontuario/:id` | `records:view` |
| `/atendimento/:id` | `records:write` |
| `/prescricoes/:id` | `prescriptions:write` |

Arquivos: `back/.../permissions.ts`, `front/.../permissions.ts` (`defaultHomePath`), `App.tsx`, `AppointmentDetailDrawer.tsx`, `AgendaWeekGrid.tsx`.
