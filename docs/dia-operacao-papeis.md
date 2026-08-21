# Operação ClinMax. cadastro de usuários e um dia inteiro

Há **dois cadastros** no ClinMax e eles não se misturam. Este documento descreve o fluxo de **usuário** (login da equipe), o de **paciente** (quem aparece na agenda) e uma simulação de **um dia inteiro** com três pessoas da operação.

---

## 1. Não confundir: usuário × paciente

| | **Usuário** | **Paciente** |
|---|---|---|
| Quem é | Quem entra no sistema (recepção, médico, dono, financeiro) | Quem consulta |
| Tem login? | Sim (e-mail + senha / Google) | Não |
| Onde nasce | Onboarding, convite por e-mail ou código da clínica | Agenda (“+ Cadastrar paciente”) ou página Pacientes |
| Papel | `ADMIN`, `DOCTOR`, `RECEPTION`, `FINANCE`, `CONSULTANT` | Ficha cadastral da clínica |
| Duplicidade | E-mail de conta | CPF / telefone / e-mail **nesta clínica** |

Um médico da plataforma **pode** ser paciente da clínica. O e-mail do `User` **não** bloqueia o cadastro de `Patient`.

---

## 2. Fluxo para cadastrar um usuário (equipe)

Há três portas. Todas acabam no mesmo lugar: uma conta com **cargo** e, se for profissional, um perfil clínico.

### Porta A. Dono cria a clínica (primeiro usuário)

1. Cadastro público (nome, e-mail, senha).
2. Onboarding: **Criar uma clínica**.
3. Escolhe o próprio papel (proprietário, profissional, admin+profissional, consultor).
4. Preenche nome da clínica, modelo, horários da agenda, recebimento.
5. Se também atende: CRM/conselho, especialidade.
6. Convites da equipe (opcional neste momento).
7. Entra no sistema. Esse usuário vira `ADMIN` (ou `DOCTOR` se só profissional).

### Porta B. Convite por e-mail (o dia a dia)

1. Admin vai em **Configurações → Convites / Usuários**.
2. Informa nome, e-mail e **cargo já definido** (Recepção, Profissional, Admin, Financeiro, Consultor).
3. O sistema gera o convite (`ClinicInvite`) com aquele `role`.
4. A pessoa abre o link `/convite/:token`.
5. Cria senha (ou aceita já logada).
6. **Não escolhe o cargo de novo**. já veio no convite.
7. Se o cargo for profissional: preenche CRM/especialidade.
8. Entra. Recepção provisionada pela clínica cai direto na **Agenda**; os demais no **Painel**.

### Porta C. Código da clínica (pedido, não entrada)

1. A pessoa se cadastra e escolhe **Entrar em uma clínica**.
2. Digita o código. Se o código **já tem cargo**, o passo de cargo some. Se **não tem**, ela **não escolhe** cargo (nem Admin).
3. Envia a solicitação. Fica em **Aguardando acesso**.
4. O admin aprova em Convites. Sem cargo no código, o admin **seta o cargo** na hora de aprovar.

Ninguém vira Administrador só por ter o código.

### O que cada cargo pode fazer depois de cadastrado

- **Admin sem perfil clínico:** operação (usuários, convites, agenda, financeiro, cadastro básico). Não prescreve nem altera prontuário.
- **Admin que também atende:** o mesmo + perfil `Doctor` (clínico).
- **Profissional (`DOCTOR`):** agenda, pacientes, prontuário, prescrição. Sem gerir usuários.
- **Recepção:** agenda, espera, notas, cadastro básico, WhatsApp, caixa. Sem clínico.
- **Financeiro:** pacientes (cadastro básico / cobrança) e financeiro. Sem alergia, diagnóstico ou evolução.
- **Consultor:** configuração e painel. Sem paciente e sem clínico por padrão.

Detalhe do onboarding ramificado: `docs/onboarding-logica.md`.

O que cada cargo **vê no menu e nas telas**: `docs/cargos-ui.md`.

---

## 3. Fluxo para cadastrar um paciente (o que a recepção faz o dia todo)

Não é “ir para Pacientes e voltar”. O caminho principal é **dentro do agendamento**:

1. Agenda → clica no `+` do horário (ou Novo agendamento).
2. Tipo **Agendar**.
3. Procedimento + quantidade.
4. Campo Paciente: digita **3 letras**.
5. **Não achou** → **+ Cadastrar paciente** (mesmo fluxo, modal por cima).
6. Obrigatório: **nome + nascimento + CPF ou telefone**. Sem alergia, sem medicamentos.
7. Se CPF/telefone/e-mail já existir **nesta clínica**: “Encontramos Maria Souza. Usar este paciente?”
8. Salva → volta no agendamento **já selecionado**, com celular/e-mail/convênio preenchidos.
9. Data/hora, repetição, observações → **Salvar agendamento**.

Paciente já existente: busca → seleciona → salva. Sem cadastro novo.

Regras de domínio (unicidade, arquivar, permissões): `docs/pacientes-logica.md`.

---

## 4. Simulação de um dia. três pessoas

**Clínica:** ClinMax Centro  
**Horário da operação:** 08:00-18:00, slots de 30 min  
**Data:** segunda, 17/08/2026

| Pessoa | Papel no sistema | Função no dia |
|---|---|---|
| **Ana Ribeiro** | `ADMIN` (dona; às vezes atende) | Abre a casa, convites, visão do painel, decide exceções |
| **Marina Costa** | `RECEPTION` | Agenda, cadastro de paciente, espera, WhatsApp, caixa do balcão |
| **Dr. Rafael Mendes** | `DOCTOR` | Consultas, prontuário, prescrição; **não** cadastra equipe |

Pacientes do enredo: **João Lima** (retorno, já cadastrado), **Carla Nunes** (primeira vez), **Pedro Alves** (encaixe / espera).

---

## 5. Relatório do dia inteiro

### 07:40. Ana (antes da abertura)

Liga o sistema, olha o **Painel**: quantos confirmados, faltas de ontem, receita da semana. Confere se o horário de almoço da grade está bloqueado. Não mexe em prontuário. Se precisa de mais um recepcionista, o lugar dela é **Convites**, não a Agenda.

### 07:50. Marina chega

Login de recepção → cai na **Agenda**. Vê a grade da semana, pacientes do dia na lateral, notas da recepção. Imprime o dia se a clínica usa papel. WhatsApp: lembretes automáticos já saíram; ela só trata quem respondeu “não vou”.

### 08:00. Abertura

Primeiro slot do Dr. Rafael: **João Lima**, retorno. Marina não cadastra ninguém: busca “João”, seleciona, já tinha Unimed e celular. O card está na grade. João chega; Marina marca presença / “em espera” conforme o fluxo da clínica.

### 08:00-08:25. Dr. Rafael

Abre o **atendimento** a partir do agendamento (não inventa consulta solta). Lê histórico, preenche o que for clínico (que a recepção **não** preencheu no cadastro), prescreve se precisar, encerra. O prontuário nasce/atualiza **porque houve atendimento**, não porque alguém “criou prontuário”.

### 08:25. Marina, telefone

Liga uma pessoa nova: **Carla Nunes**, quer hoje 09:00. Marina: Novo agendamento → busca “Car” → vazio → **+ Cadastrar paciente** → nome, nascimento, CPF, celular → salva → volta no modal já com Carla → procedimento “Primeira consulta”, 09:00-09:30 → **Salvar agendamento**.

Se o CPF já existisse na **mesma** clínica, o sistema perguntaria “usar este paciente?” em vez de duplicar.

### 08:30. Encaixe

**Pedro Alves** aparece sem hora. Marina não “fura” o médico na marra: coloca na **lista de espera** ou no próximo `+` livre. **Próximo horário livre** no modal acha o buraco depois das 10:00.

### 08:30-09:00. Dr. Rafael

Próximo paciente da grade. Entre um e outro, **não** gerencia usuários nem convênios. Se faltar dado cadastral (telefone errado), pede para a Marina corrigir o cadastro básico; alergia ele lança no prontuário.

### 09:00-09:30. Carla (primeira vez)

Marina confirma chegada. Rafael atende. Primeiro preenchimento clínico da vida dela no sistema. Ana, se estiver no mesmo prédio, **não precisa** entrar nessa ficha.

### 09:40. Ana, gestão

Painel: ocupação da manhã, convênios do dia. **Configurações → Usuários**: a nova secretária da tarde ainda não tem login. Ana dispara convite e-mail com cargo **Recepção**. Essa pessoa **ainda não está no dia**; só entra quando aceitar o convite. Ana **não** cadastra Carla de novo em Pacientes. Carla já nasceu no agendamento.

### 10:00-12:00. Ritmo de agenda

- **Marina:** confirmações, remarcar (arrasta o card + confirma), bloqueia horário se o médico for atrasar (`Bloquear horário`), anota recado na gaveta de notas.
- **Rafael:** consulta → atendimento → registro → prescrição.
- **Ana:** olha financeiro/relatório se precisar; não senta na recepção a não ser que falte gente.

### 12:00-13:00. Almoço

Grade em cinza, sem `+`. Marina pausa WhatsApp operacional. Ninguém agenda em cima do almoço.

### 13:10. Imprevisto

João liga: atraso. Marina reagenda o retorno da tarde. O card muda de coluna/hora. Rafael vê a grade atualizada; não precisa ligar para a recepção para “saber se mudou”.

### 14:00. Financeiro do balcão

Marina gera/cobra o particular da Carla (toggle de link de pagamento no agendamento, se a clínica usar). Papel `FINANCE` puro faria só isso o dia todo; nesta simulação a recepção também tem `finance:manage`. Rafael **não** fecha caixa.

### 15:30. Falta

Paciente não veio. Marina marca falta / coloca de novo na espera. O Painel de Ana amanhã mostra isso em “vs ontem”.

### 16:00. Ana atende? (exceção)

Se Ana também é profissional (`ADMIN` + perfil Doctor), ela só aparece na **própria coluna** da agenda. Cadastro de paciente continua sendo da Marina. Ana não usa o onboarding de novo: a clínica já existe.

### 17:30. Encerramento clínico

Último paciente do Rafael. Ele fecha evoluções pendentes. Sem “excluir paciente”: se alguém pediu para sair da base, Ana/Marina **arquivam** (`inativo`). Histórico, receita e agenda antigos permanecem.

### 18:00. Fechamento

- **Marina:** lista de espera do dia seguinte, impressão se precisar, WhatsApp de lembrete já programado.
- **Rafael:** logout. Sem acesso a convites.
- **Ana:** olha resumo da semana no Painel (atendimentos e receita). Confere se o convite da nova recepção foi aceito. Se não foi, a pessoa **ainda não é usuária**.

### 18:20. Depois do expediente

Nada de cadastro fantasma. Paciente sem CPF verdadeiro não ganha CPF `000…`. Usuário sem convite aceito não entra na Agenda.

---

## 6. O que cada um faz durante o horário

### Marina (recepção). dona da grade

Abrir agenda, buscar/cadastrar paciente no modal, encaixar, espera, remarcar, bloquear, notas, WhatsApp, telefone, chegada, falta, cobrança de balcão. Cadastro = nome, nascimento, documento/telefone. **Não** monta prontuário.

### Dr. Rafael (profissional). dono do atendimento

Seguir a grade, iniciar atendimento a partir do agendamento, escrever clínico, prescrever, encerrar. Pode cadastrar paciente se atender sozinho, **incluindo** dados clínicos. **Não** convida usuários, **não** muda horário da clínica, **não** é o caixa.

### Ana (admin). dona da operação

Painel, horários da clínica, convites/usuários, exceções, visão financeira/relatórios. Só entra na recepção ou no consultório se o dia exigir. Cadastrar **usuário** é trabalho dela (ou de outro admin). Cadastrar **paciente** no volume do dia é da recepção.

---

## 7. Sequência mental do dia

**Ana habilita gente no sistema → Marina encaixa gente na agenda (cadastrando paciente só se não existir) → Rafael atende quem está na grade → o prontuário só anda depois do atendimento → à noite Ana vê o número, Marina fecha a lista, Rafael já saiu.**

---

## Arquivos relacionados

- `docs/onboarding-logica.md`. ramificação criar clínica vs entrar com código
- `docs/pacientes-logica.md`. modelo de paciente, duplicidade, arquivar
- Front: `OnboardingPage.tsx`, `ConvitesConfigPage.tsx`, `AppointmentFormModal.tsx`, `PatientFormModal.tsx`
- Back: convites, `permissions.ts` (`ADMIN` / `DOCTOR` / `RECEPTION` / `FINANCE` / `CONSULTANT`)
