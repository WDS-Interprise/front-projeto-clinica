# Dia do médico. vários casos, um destino: atendido

Este documento descreve **um dia inteiro** do profissional clínico no ClinMax. A narrativa está em **terceira pessoa**. Cada paciente nasce em uma situação diferente (retorno, primeira vez, encaixe, teleconsulta, atraso, falta recuperada, bloqueio). **Ninguém fica pendente.** No fim do expediente, todos os casos abaixo estão com status `COMPLETED` e evolução no prontuário.

Complementa `docs/dia-operacao-papeis.md` (recepção + admin). Aqui o foco é o **médico**.

---

## 1. Quem é o médico neste dia

**Profissional:** Dr. Rafael Mendes  
**Papel:** `DOCTOR` (perfil `Doctor` vinculado ao `User`)  
**Clínica ativa:** Vida e Saúde (`clinicId` no JWT)  
**O que ele vê no menu:** Agenda, Pacientes, Ferramentas clínicas (Bulas e CID). Sem Configurações de equipe, sem convites, sem caixa.  
**O que ele não vê:** consultas de outro médico da mesma clínica. A listagem de agenda no backend aplica `appointmentDoctorFilter`: só `doctorId` dele.

Horário da grade: 08:00-18:00, slots de 30 min, almoço 12:00-13:00.

---

## 2. Onde o médico olha no site (mapa rápido)

| Onde | Rota | O que aparece |
|---|---|---|
| Grade da semana | `/agenda` | Cards por horário. Nome do paciente, horário, tipo (consulta, retorno, exame, tele). Lateral: “Pacientes do dia” e resumo. |
| Detalhe do slot | drawer no mesmo `/agenda` | Status, convênio, observações, botão de atendimento. |
| Atendimento | `/atendimento/:appointmentId` | Cronômetro, queixa, HMA, exame, antecedentes, CID, conduta, prescrição resumida. Autosave. |
| Prontuário | `/prontuario/:patientId` | Linha do tempo: cards de atendimento e de receita. |
| Prescrição | `/prescricoes/...` (hub a partir do atendimento) | Medicamentos, exames, vacinas, assinar, PDF. |
| Pacientes | `/pacientes` | Lista da **clínica ativa**. Ele usa pouco: o caminho natural é a agenda. |
| Medicamentos / CID | `/outros/bulas`, `/outros/cid10` | Consulta de bula e código. Não substitui o prontuário. |

No **front**, a Agenda chama `GET /appointments?startDate=&endDate=` e, se o usuário for médico, trava o filtro no `user.doctorId`.  
No **back**, cada consulta tem `clinicId` + `doctorId` + `patientId`. Sem isso, o card não nasce na grade dele.

---

## 3. Ciclo de um atendimento (sempre o mesmo motor)

Não importa o caso. O sistema trata todos assim:

1. **Agendado** (`SCHEDULED` ou `CONFIRMED`). Card verde/cinza na grade.
2. Médico abre o detalhe e entra em **Iniciar atendimento**. Front: `PATCH /appointments/:id` com `status: IN_PROGRESS`. Back: grava `startedAt` na primeira transição.
3. Tela `/atendimento/:id` carrega o agendamento e o paciente. Campos clínicos salvam com debounce (~700 ms) via `PATCH` (`mainComplaint`, `physicalExam`, CID, etc.).
4. Se prescrever: hub de prescrição, PDF, histórico no prontuário.
5. **Finalizar.** Front: `status: COMPLETED`. Back: grava `endedAt`. Depois disso, CID e evolução clínica **não** editam (`APPOINTMENT_CLOSED`).
6. O mesmo registro vira card na timeline do prontuário (`PatientHistory`).

Final obrigatório deste documento: **todos os seis pacientes abaixo passam pelo passo 5 no mesmo dia.**

---

## 4. Pacientes do dia (elenco)

| Horário | Paciente | Situação de entrada | Como entra na grade | Final do dia |
|---|---|---|---|---|
| 08:00 | João Lima | Retorno já cadastrado | Card na coluna de quarta | Atendido, receita renovada |
| 08:30 | Carla Nunes | Primeira consulta | Recepção cadastrou no modal | Atendida, CID + conduta |
| 09:00 | Pedro Alves | Encaixe da lista de espera | Slot livre 09:00 | Atendido, encaixe virado consulta |
| 10:00 | Beatriz Souza | Teleconsulta | Tipo tele na grade | Atendida online, evolução salva |
| 11:00 | Marcos Oliveira | Atrasou 20 min | Card remarcado para 11:00 | Atendido no horário novo |
| 14:00 | Mia Santos | Falta de manhã, reencaixe à tarde | Falta + novo slot 14:00 | Atendida no segundo horário |
| (bloco) | (agenda do médico) | Almoço / reunião | `BLOCK` 12:00-13:00 e 13:00-13:30 | Sem paciente. Não é atendimento |

O bloqueio **não** é paciente. Não precisa “atender”. Os **seis nomes** acima, sim.

---

## 5. Relato do dia, caso a caso

### 07:50. Rafael entra

Ele faz login. O JWT carrega `role: DOCTOR`, `clinicId` da Vida e Saúde, `doctorId` do perfil. O front guarda isso no `AuthContext`. Ele cai na **Agenda** (ou no Painel, conforme `redirectPath` do cargo; no dia a dia clínico ele vai em **Agenda** no header).

Na lateral esquerda, “Pacientes do dia” ainda está zerado se ele abrir o domingo. Ele avança a semana até **quarta 19/08** (ou o dia operacional desta simulação). Aparecem os cards. Só os dele.

**Front:** `AgendaPage` lista a semana, `selectedDoctorId = user.doctorId`.  
**Back:** `appointment.service.list` filtra `clinicId` + `doctorId`.

---

### Caso 1. João Lima, 08:00. retorno

**Situação.** João já é paciente da clínica. A recepção confirmou a vinda. O card na grade mostra o nome, `08:00`, selo “Retorno”.

**Onde o médico vê.** `/agenda`, coluna do dia, linha 08:00. Na lista “Pacientes do dia”, João é o primeiro botão (iniciais JL, horário, status Agendado/Confirmado).

**O que ele faz.** Clica no card. Abre o detalhe (`AppointmentDetailView`). Botão de atender leva a `/atendimento/{id}`. Ele clica **Iniciar**. O cronômetro sobe. Lê o histórico à esquerda (sidebar “Histórico de consulta”). Preenche queixa (“retorno de HAS”), exame, conduta. Renova a receita no hub de prescrição. Finaliza.

**Front.** Status vira “Em atendimento” no card. Depois “Concluído”. Toast de sucesso ao salvar receita. Timeline do prontuário ganha um card de atendimento e um de prescrição.

**Back.** `IN_PROGRESS` + `startedAt`. Campos clínicos no `Appointment`. `Prescription` ligada ao paciente e ao profissional. `COMPLETED` + `endedAt`. Audit log se CID foi usado.

**Final.** João sai com receita. Slot 08:00 fechado. Não volta para a fila.

---

### Caso 2. Carla Nunes, 08:30. primeira vez

**Situação.** Carla ligou de manhã. A recepção não achou “Car” na busca (mínimo 3 letras). Clicou **+ Cadastrar paciente** no próprio modal de agendamento: nome, nascimento, CPF, celular. Salvou. O agendamento nasceu já com ela selecionada, procedimento “Primeira consulta”.

**Onde o médico vê.** Mesma grade, 08:30. Ele **não** cadastrou Carla. Só vê o nome novo. Se abrir Pacientes, a ficha já existe nesta clínica (`Patient.clinicId`). Sem alergia no cadastro rápido: isso ele lança no atendimento.

**O que ele faz.** Inicia atendimento. Primeiro preenchimento clínico da vida dela no sistema. Busca CID na tela (`CidSearchField` → API CID-10). Conduta e “Prescrevo”. Finaliza.

**Front.** Tela de atendimento vazia no começo (sem histórico). Autosave enquanto ele digita. CID aparece no campo hipótese diagnóstica.

**Back.** `Patient` criado no `POST /patients` da recepção. `Appointment` com `patientId` dela. `PATCH` clínico. `COMPLETED`. O prontuário passa a ter **um** evento.

**Final.** Carla atendida. Cadastro + primeira evolução no mesmo dia.

---

### Caso 3. Pedro Alves, 09:00. encaixe da espera

**Situação.** Pedro chegou sem hora. A recepção colocou na **lista de espera** (`WaitingListDrawer` na Agenda). Quando o 09:00 ficou livre (cancelamento ou buraco), ela usou “Agendar a partir da espera”. O modal abriu com `patientId` e `waitingListEntryId`. Salvou no slot 09:00.

**Onde o médico vê.** Card novo na grade 09:00, mesmo visual dos outros. Ele não abre a gaveta de espera (permissão `waiting_list:manage` é da recepção). Ele só vê o resultado: Pedro na coluna.

**O que ele faz.** Atende como consulta normal. Observação do agendamento pode trazer o texto “Agendamento criado a partir da lista de espera.”

**Front.** `AppointmentFormModal` com `waitingListEntryId`. Depois o card entra no `GET` da semana.

**Back.** `createOne` grava `waitingListEntryId` e marca a entrada `SCHEDULED`. Médico não precisa saber o ID. Encerrar o atendimento é o mesmo `COMPLETED`.

**Final.** Pedro atendido. Saiu da espera porque foi agendado e, em seguida, concluído.

---

### Caso 4. Beatriz Souza, 10:00. teleconsulta

**Situação.** Beatriz está em casa. O agendamento foi marcado com procedimento/tipo que a UI classifica como tele (`classifyAppointment` → `tele`). No resumo do dia, o contador “Teleconsultas” sobe.

**Onde o médico vê.** Grade 10:00, ícone/label de teleconsulta no card e no resumo da lateral. Detalhe do agendamento mostra o mesmo paciente; não há sala de vídeo nativa neste fluxo. O atendimento clínico é a **mesma página** `/atendimento/:id`.

**O que ele faz.** Inicia, registra queixa à distância, exame limitado ao relato, conduta, receita se couber (PDF para enviar). Finaliza.

**Front.** Card na grade, badge no resumo. Fluxo clínico idêntico. Prescrição igual.

**Back.** Mesmo `Appointment`. Não há tabela separada de tele. O tipo/procedimento diferencia a UI. `COMPLETED` fecha o caso.

**Final.** Beatriz atendida. Evolução no prontuário como qualquer consulta.

---

### Caso 5. Marcos Oliveira, 11:00. atraso e remarcação

**Situação.** Marcos era 10:30. Ligou atrasado. A recepção **arrastou** o card (ou editou hora) para 11:00. O médico, entre Beatriz e o almoço, recarrega a agenda (ou já vê após o próximo `load`).

**Onde o médico vê.** O card some das 10:30 e aparece nas 11:00, mesma coluna do dia. “Pacientes do dia” reordena pelo `startTime`. Ele não precisa de WhatsApp interno: a grade é a fonte.

**O que ele faz.** Às 11:00 inicia o atendimento. Mesmo paciente, mesmo `appointmentId` (se foi update) ou novo ID (se cancelou e recriou). Na prática da tela, ele clica no card das 11:00 e atende até o fim.

**Front.** `PATCH` de data/hora ou drag na `AgendaWeekGrid` (slots não `occupancyOnly`). Lista relê `GET /appointments`.

**Back.** `update` respeita `clinicId` e o filtro do médico. Não deixa o médico ser trocado para outro profissional. `IN_PROGRESS` → `COMPLETED` no horário efetivo.

**Final.** Marcos atendido às 11:00. Não fica “atrasado eterno” na grade.

---

### 12:00-13:30. Bloqueios. não são pacientes

Almoço da clínica: faixa cinza, sem `+`. Rafael ainda tem uma reunião 13:00-13:30. A recepção (ou ele, se tiver `agenda:manage`) cria tipo **Bloquear horário** (`type: BLOCK`, sem `patientId`).

Na grade: bloco, sem nome de paciente. “Pacientes do dia” **não** conta bloco. Não há `/atendimento` nesse ID.

Isso **não** quebra a regra deste documento: bloqueio não é caso clínico.

---

### Caso 6. Mia Santos, 14:00. falta de manhã, atendida à tarde

**Situação.** Mia estava marcada de manhã (ex.: 09:30). Não veio. A recepção marcou **falta** (`NO_SHOW`). O card da manhã fica com status Faltou. Mia liga às 13:40. A recepção abre **Novo agendamento** no mesmo paciente, médico Rafael, 14:00. Dois registros no dia: um `NO_SHOW` (manhã) e um novo `SCHEDULED` (14:00).

**Onde o médico vê.** De manhã, o card da Mia na grade com “Faltou”. À tarde, um **segundo** card 14:00 com o nome dela, status Agendado. Na lista do dia aparecem os dois, horários diferentes. Ele atende **só o da tarde**.

**O que ele faz.** 14:00: inicia atendimento no agendamento novo. Evolução, CID se precisar, finaliza. O `NO_SHOW` da manhã permanece no histórico (relatórios de falta). O que importa para “foi atendida” é o segundo slot.

**Front.** Status `NO_SHOW` no card da manhã. Novo POST de appointment para 14:00. Página de atendimento só do ID da tarde.

**Back.** Dois `Appointment` no mesmo `patientId` + `doctorId` + `clinicId`. Um `NO_SHOW`, um `COMPLETED`. Relatório de faltas continua vendo o da manhã. Prontuário ganha o evento do atendimento das 14:00.

**Final.** Mia foi atendida. A falta da manhã não cancela o dever do dia: o segundo horário fecha o caso.

---

## 6. Encerramento clínico (17:00)

Rafael volta na Agenda. “Pacientes do dia” mostra seis nomes. Status esperado:

| Paciente | Status final no card |
|---|---|
| João Lima | Concluído |
| Carla Nunes | Concluído |
| Pedro Alves | Concluído |
| Beatriz Souza | Concluído |
| Marcos Oliveira | Concluído |
| Mia Santos (14:00) | Concluído |
| Mia Santos (manhã, se ainda visível) | Faltou (não é o atendimento; o da tarde cobre o caso) |

Ele abre **Prontuário** de cada um (pela ficha ou pelo histórico do atendimento) e confere a timeline: card de atendimento com horário, queixa, CID, conduta. Onde houve receita, card de prescrição.

**Front.** `PatientHistorySection` lista atendimentos e receitas.  
**Back.** `patient-history.service` lê `Appointment` concluídos e `Prescription` do paciente na clínica.

Nenhum `IN_PROGRESS` órfão. Se alguém tivesse ficado “em atendimento” sem finalizar, o cronômetro continuaria no `localStorage` (`clinichub_attendance_started_*`) e o status no banco seguiria `IN_PROGRESS`. Neste dia, todos os seis fluxos de consulta ativa foram a `COMPLETED`.

Logout. Sem tela de caixa, sem convite.

---

## 7. O que o front faz vs o que o back faz (resumo)

| Momento | Front | Back |
|---|---|---|
| Abrir agenda | `GET /appointments` da semana, filtro médico | `clinicId` + `doctorId` obrigatórios para `DOCTOR` |
| Ver nome no card | Renderiza `patient.name` | `canViewAppointmentPatient`: médico vê o próprio paciente mesmo sem extra de permissão |
| Iniciar | `PATCH status IN_PROGRESS`, navega `/atendimento/:id` | `startedAt` na primeira vez |
| Digitar evolução | Debounce 700 ms, toast se falhar | `update` nos campos clínicos; bloqueia se já `COMPLETED` |
| CID | `CidSearchField` + `PATCH` cid* | Grava código/descrição; audit `CID_USADO` |
| Prescrever | Hub, busca medicamentos, assinar | `Prescription` + PDF; bula via busca de medicamentos |
| Finalizar | `PATCH COMPLETED`, drawer de assinatura local/nuvem (stub) | `endedAt`; clínica fecha edição clínica |
| Lista do dia | Filtra a resposta pelo dia de hoje | Não há endpoint separado; é recorte da lista da semana |

---

## 8. Regras que explicam “sumiu da agenda”

Se um admin marca paciente e o médico **não vê**:

1. **Outra clínica.** O JWT do admin pode estar em clínica diferente da do médico. O seletor de clínica no header troca o token (`POST /auth/switch-clinic`).
2. **Outro médico.** `doctorId` do appointment diferente do `Doctor` do usuário logado. A lista de médicos agora só traz quem é membro da clínica ativa.
3. **Recepção sem vínculo.** Se a recepção tiver `linkedDoctorIds`, ela só agenda (e às vezes só lista) esses profissionais.

Nenhum desses três impede o **final** dos casos deste roteiro: todos os seis foram agendados no `doctorId` do Rafael, na mesma clínica, e concluídos por ele.

---

## 9. Sequência mental do médico

**Abre a grade da própria coluna → clica o card → inicia atendimento → escreve (autosave) → prescreve se precisar → finaliza → o prontuário ganha o fato → próximo card.**

A recepção coloca gente na grade. O médico **esvazia** a grade transformando cada consulta viva em `COMPLETED`. Bloqueio não se atende. Falta se recupera com novo slot. No fim, todo paciente deste elenco foi atendido.
