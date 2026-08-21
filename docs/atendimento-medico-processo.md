# Processo: médico atende o paciente

Documento do fluxo ponta a ponta no ClinMax: da consulta na agenda até o atendimento clínico e o que fica no prontuário.

Complementa:

- `docs/dia-medico-casos.md` (cenários do dia)
- `docs/dia-operacao-papeis.md` (recepção + admin)
- `docs/pacientes-logica.md` (cadastro de paciente)

**Não existe hoje:** bater ponto, plantão, check-in formal de presença.

**Modelo alvo:** `Appointment` (compromisso da agenda) e `Encounter` (ato clínico) são domínios separados. Para o usuário a jornada continua a mesma: card da agenda → Iniciar atendimento → evoluir → Finalizar → timeline.

---

## 1. Ideia em uma frase

A recepção enche a grade. O médico transforma cada consulta viva em um **Encounter** clínico. O prontuário, a receita (se houver) e os adendos registram o fato. `COMPLETED` no Encounter significa ato clínico encerrado por profissional autorizado.

---

## 2. Atores

| Quem | Papel | O que faz neste fluxo |
|---|---|---|
| Recepção | `RECEPTION` | Agenda, confirma, remarca, espera, WhatsApp, cobrança de balcão. **Não** inicia atendimento clínico. **Não** marca como atendido. |
| Médico | `DOCTOR` | Vê só a própria agenda. Inicia, evolui, CID, IA, prescreve, encerra, adendo. |
| Admin com perfil clínico | `ADMIN` + Doctor | Pode atender como médico. |
| Admin sem perfil clínico | `ADMIN` | Opera a clínica. **Não** abre prontuário/atendimento. |
| Financeiro | `FINANCE` | Cobrança. Sem evolução clínica. |

Permissões-chave do médico:

- `agenda:view` / `agenda:manage`
- `records:view` / `records:write`
- `prescriptions:write`

A recepção **não** tem `records:*`.

Transições clínicas (`IN_PROGRESS`, `COMPLETED`, adendo) exigem permissão clínica (`records:write` ou equivalente). Ação de “marcar como atendido” fora da tela clínica **não** existe para recepção.

---

## 3. Cadeia de dados (modelo alvo)

```
Patient
  │
  ├── Appointment
  │     médico
  │     data/hora
  │     procedimento
  │     convênio
  │     status operacional
  │
  └── Encounter
        appointmentId (opcional no futuro)
        patientId
        doctorId
        startedAt
        endedAt
        lastSavedAt
        status clínico
        complaint
        hma
        physicalExam
        history
        assessment
        conduct
        notes
        │
        ├── Diagnoses / CID
        ├── Prescriptions
        ├── Attachments
        ├── Addendums
        └── Audit / signatures
```

### Por que separar

O agendamento é o compromisso da agenda. O atendimento é o ato clínico.

Casos que ficam confusos se a evolução ficar presa só no `Appointment`:

- atendimento sem agendamento (futuro)
- médico abre consulta e cancela o ato clínico sem cancelar o slot operacional
- mais de um profissional participar
- adendo posterior
- assinatura e histórico de alterações
- integração TISS
- exportação do prontuário
- migração de agenda
- auditoria jurídica

### O que o usuário vê

Nada muda na superfície:

1. Card da agenda
2. **Iniciar atendimento**
3. Encounter criado/aberto
4. **Finalizar**
5. Aparece na timeline do prontuário

### Estado atual do código (legado)

Hoje os campos clínicos ainda vivem no `Appointment` (`mainComplaint`, `physicalExam`, `startedAt`, etc.). A migração alvo é extrair isso para `Encounter` e manter `Appointment` só com dados operacionais + vínculo `encounterId` / `appointmentId`.

---

## 4. Dois status, dois significados

Hoje um único `Appointment.status` representa tudo. No modelo alvo:

### Appointment (operacional)

| Status | Label | Significado |
|---|---|---|
| `SCHEDULED` | Agendado | Card na grade |
| `CONFIRMED` | Confirmado | Presença confirmada |
| `RESCHEDULED` | Remarcado | Mudou data/hora/médico |
| `CANCELLED` | Cancelado | Slot cancelado |
| `NO_SHOW` | Faltou | Paciente não veio |
| `BLOCK` | Bloqueio | Almoço/reunião. **Não** é atendimento |
| `IN_PROGRESS` | Em atendimento | Espelho: existe Encounter aberto ligado |
| `COMPLETED` | Realizado | Compromisso terminou como atendimento realizado |

### Encounter (clínico)

| Status | Label | Significado |
|---|---|---|
| `NOT_STARTED` | Não iniciado | Registro criado sem início (raro; normalmente nasce `IN_PROGRESS`) |
| `IN_PROGRESS` | Em andamento | Evolução aberta (`startedAt`, `lastSavedAt`) |
| `COMPLETED` | Encerrado | Documento clínico fechado (`endedAt`) |

Não é redundância:

- **Appointment `COMPLETED`:** aquele compromisso da agenda terminou como atendimento realizado.
- **Encounter `COMPLETED`:** o documento clínico foi encerrado.

Financeiro continua em campo próprio (`billingStatus` / `paymentStatus`), **nunca** misturado com status clínico.

---

## 5. Máquina de estados (Appointment)

Explícita no backend. Transições inválidas devem falhar com erro claro.

```
SCHEDULED
   ├── CONFIRMED
   ├── CANCELLED
   ├── RESCHEDULED
   ├── NO_SHOW
   └── IN_PROGRESS

CONFIRMED
   ├── IN_PROGRESS
   ├── CANCELLED
   ├── RESCHEDULED
   └── NO_SHOW

IN_PROGRESS
   └── COMPLETED
```

### Proibido

| De | Para | Motivo |
|---|---|---|
| `COMPLETED` | `CANCELLED` | Atendimento já realizado |
| `NO_SHOW` | `COMPLETED` | Falta não vira atendimento no mesmo slot |
| `BLOCK` | `IN_PROGRESS` | Bloqueio não tem paciente |
| `CANCELLED` | `IN_PROGRESS` | Slot morto |

### Falta + reencaixe

```
Appointment A → NO_SHOW
Appointment B → SCHEDULED → IN_PROGRESS → COMPLETED
```

Nunca “ressuscitar” o A como atendimento.

### Quem pode mudar o quê

| Transição | Quem |
|---|---|
| `SCHEDULED` ↔ `CONFIRMED`, remarcação, cancelamento, `NO_SHOW` | Recepção / agenda operacional |
| → `IN_PROGRESS` | Só perfil clínico (Iniciar atendimento) |
| → `COMPLETED` | Só perfil clínico (Finalizar atendimento) |

**Removido do produto alvo:** menu do card → “Marcar como atendido” para recepção.

Motivo: recepcionista marcar `COMPLETED` faria o sistema parecer que houve ato clínico (relatório, financeiro, prontuário), sem evolução.

`COMPLETED` = **atendimento clínico encerrado por profissional autorizado**.

---

## 6. Encounter: ciclo de vida

### Criar / abrir

1. Médico clica **Iniciar atendimento** no card (ou detalhe).
2. Sistema busca Encounter `IN_PROGRESS` do mesmo `appointmentId` (ou do par paciente+médico+dia, conforme regra).
3. Se existir aberto: **retoma** (não cria outro).
4. Se não existir: cria Encounter `IN_PROGRESS`, grava `startedAt`, espelha Appointment → `IN_PROGRESS`.
5. Vai para `/atendimento/:encounterId` (ou `:appointmentId` com redirect interno enquanto houver legado).

### Autosave

Enquanto digita: atualiza campos clínicos + `lastSavedAt`. UI: “Salvo automaticamente às HH:MM”.

### Médico sai sem finalizar

Caso esperado (fecha aba, cai rede, troca de PC):

```
Encounter
  status = IN_PROGRESS
  startedAt = 14:00
  lastSavedAt = 14:34
```

Ao abrir de novo (mesmo card ou agenda):

> Você possui um atendimento em andamento para João Silva iniciado às 14:00.

Ações:

- **Continuar atendimento** (default)
- **Encerrar atendimento** (se a regra da clínica permitir fechar sem voltar à tela completa)

**Nunca** criar outro Encounter automaticamente para o mesmo compromisso.

### Finalizar

1. Médico clica **Finalizar atendimento**.
2. Confirma (assinatura digital ainda pode ser stub de UI).
3. Encounter → `COMPLETED` + `endedAt`.
4. Appointment → `COMPLETED`.
5. Evolução original **não** edita mais em silêncio.
6. Passa a permitir **adendo** (ver seção 8).

### Atendimento sem agendamento (futuro)

`appointmentId` opcional. Encounter liga direto a `patientId` + `doctorId`. Fora do MVP de superfície, mas o modelo já prevê.

---

## 7. Rotas e telas

| Onde | Rota | Quem usa |
|---|---|---|
| Agenda da semana | `/agenda` | Médico e recepção |
| Detalhe do agendamento | inline em `/agenda` | Ambos (ações clínicas só com permissão) |
| Atendimento clínico | `/atendimento/:id` | Médico (`records:write`) |
| Prontuário | `/prontuario/:patientId` | Médico (`records:view`) |
| Prescrições (aba) | `/prontuario/:patientId?tab=prescricoes` | Médico |
| Bulas / CID | `/outros/bulas`, `/outros/cid10` | Consulta de apoio |
| Relatório do dia | `/gestao/relatorios-atendimento` | Visão operacional |

---

## 8. Adendo (pós-`COMPLETED`)

`COMPLETED` **não** significa “nunca mais pode tocar”. Significa: a evolução original é imutável.

Se o médico esquecer um dado (ex.: alergia à dipirona):

1. Abre o atendimento finalizado no prontuário / detalhe.
2. Clica **Adicionar adendo**.
3. Sistema cria registro `Addendum` ligado ao Encounter:

| Campo | Uso |
|---|---|
| `authorId` | Médico que escreveu |
| `createdAt` | Data/hora do adendo |
| `body` | Texto do adendo |
| `reason` | Motivo (opcional mas recomendado) |

Regras:

- texto original **nunca** muda
- adendo tem autor, data e hora
- adendo entra na timeline / visualização do atendimento
- gera evento de auditoria `ADDENDUM_CREATED`

Exemplo de leitura:

```
Atendimento finalizado
─────────────────────
Evolução original
Dr. Ricardo
20/08/2026 • 14:32
...

[Adicionar adendo]

ADENDO
20/08/2026 • 17:48
Dr. Ricardo Almeida
Paciente também relatou alergia à dipirona.
```

---

## 9. UX da tela `/atendimento/:id` (mesa de trabalho)

Objetivo: o médico não precisa pular de tela.

### Topo

```
← Agenda

JOÃO SILVA                           Em atendimento • 18:32
42 anos • Masculino

Hoje • 14:00
Consulta • Particular
Dr. Ricardo Almeida

[Ver prontuário]
```

### Lateral (histórico curto)

```
ÚLTIMOS ATENDIMENTOS

12/06/2026
Dor lombar
M54.5

03/02/2026
Hipertensão
I10

[Ver prontuário completo]
```

### Área principal

```
Queixa principal
────────────────
HMA
────────────────
Histórico / antecedentes
────────────────
Exame físico
────────────────
Hipóteses / CID
[ + Adicionar CID ]
────────────────
Conduta
────────────────
Prescrição
[ Nova prescrição ]
────────────────
Observações
```

### Rodapé fixo

```
Salvo automaticamente às 14:32

[Sugerir com IA]          [Finalizar atendimento]
```

Teleconsulta usa o **mesmo** fluxo. O tipo muda o selo na agenda. Não há sala de vídeo nativa no produto.

---

## 10. Processo completo (passo a passo)

### Etapa A. Pré-atendimento (recepção)

1. Paciente já existe ou é cadastrado no modal de agendamento.
2. Cria Appointment: médico, data, horário, procedimento, convênio, observações.
3. Card na grade (`SCHEDULED`).
4. Opcional: `CONFIRMED`, lista de espera, remarcação, lembrete WhatsApp, link de pagamento.
5. No dia, o médico vê o paciente na grade e em **Pacientes do dia**.

**Status típico do Appointment:** `SCHEDULED` ou `CONFIRMED`.

O médico **não** precisa cadastrar o paciente para atender.

---

### Etapa B. Médico escolhe o paciente

1. Login `DOCTOR`.
2. Agenda (só `doctorId` dele).
3. Clica no card (ou lista do dia).
4. Detalhe do agendamento:

- **Abrir prontuário**
- **Iniciar atendimento** / **Continuar atendimento**
- (Recepção/admin) editar, cancelar, cobrar, WhatsApp (sem ações clínicas finais)

---

### Etapa C. Início / retomada

1. **Iniciar atendimento** → cria Encounter `IN_PROGRESS` (ou retoma o existente).
2. Appointment → `IN_PROGRESS`.
3. `startedAt` na primeira vez; `lastSavedAt` a cada save.
4. Cronômetro na tela.

---

### Etapa D. Durante o atendimento

| Campo | Uso |
|---|---|
| Queixa principal | Motivo da consulta |
| HMA | História da moléstia atual |
| Exame físico | Achados |
| Histórico e antecedentes | Antecedentes |
| Hipótese / CID | CID-10/11 vinculado |
| Conduta | Conduta clínica |
| Observações | Notas livres |
| Prescrição | Via hub, ligada ao Encounter |

Ações:

1. **Sugerir com IA** (ver seção 11).
2. **Nova prescrição** → medicamentos / exames / vacinas → PDF.
3. Consultar Bulas / CID nas ferramentas clínicas.

**Status:** Encounter e Appointment em `IN_PROGRESS`.

---

### Etapa E. Encerramento

1. **Finalizar atendimento**.
2. Confirmação.
3. Encounter `COMPLETED` + `endedAt`.
4. Appointment `COMPLETED`.
5. Evolução original imutável; adendos permitidos depois.

Não há atalho operacional de “marcar como atendido” para recepção.

---

### Etapa F. Pós-atendimento

1. Card na agenda: **Atendido / Concluído**.
2. Timeline do prontuário: card do Encounter (evolução, CID, duração, médico, receita, anexos, adendos).
3. Cobrança segue em paralelo (recepção/financeiro).
4. Relatório do dia conta Encounter/Appointment `COMPLETED` (ato clínico real).

---

## 11. IA

A IA **sugere rascunho**. Não inventa vitais nem CID definitivo. Nada entra sozinho no prontuário.

### Entrada possível

- Queixa, HMA, histórico, exame físico
- Atendimentos anteriores permitidos
- Medicações já cadastradas
- Alergias

### Saída (blocos separados)

| Bloco | Tratamento |
|---|---|
| Sugestão de evolução | Médico escolhe **Inserir na evolução** |
| Possíveis hipóteses | ⚠️ exigem confirmação médica |
| Possíveis condutas | ⚠️ sugestão clínica |
| Resumo da consulta | opcional, só após aceite |

### Nunca auto-inserir

- CID
- Prescrição
- Diagnóstico
- Alergia
- Medicamento

Cada inserção é clique explícito do médico.

---

## 12. Prescrição ligada ao Encounter

```
Encounter
  └── Prescription
        ├── MedicationItem
        ├── ExamItem
        └── VaccineItem
```

Na timeline:

```
20 AGO 2026
Consulta • Dr. Ricardo
Dor de garganta

CID
J02.9

Conduta
[...]

📄 Receita
Amoxicilina...
Dipirona...

[Ver atendimento]
[Ver receita]
```

(Legado atual: `Prescription` ainda amarra em `appointmentId`. Migração alvo: `encounterId`, mantendo ponte para o Appointment via Encounter.)

---

## 13. Financeiro separado

Decisão mantida: clínico e financeiro são processos diferentes.

Exemplos válidos:

| Clínico | Financeiro |
|---|---|
| Encounter `COMPLETED` | `PENDING` |
| Encounter `IN_PROGRESS` | `PAID` (pago adiantado) |
| Appointment `NO_SHOW` | cobrança de multa / nenhuma (regra da clínica) |

Campos:

- status clínico: Appointment / Encounter
- status financeiro: `billingStatus` / `paymentStatus`

Finalizar atendimento **não** obriga pagamento concluído.

---

## 14. Auditoria clínica

Desde o início do modelo Encounter:

```
ClinicalAuditLog
  id
  clinicId
  patientId
  appointmentId
  encounterId
  userId
  action
  createdAt
  ip
  metadata
```

Eventos mínimos:

- `ENCOUNTER_STARTED`
- `ENCOUNTER_UPDATED`
- `CID_ADDED`
- `CID_REMOVED`
- `PRESCRIPTION_CREATED`
- `PRESCRIPTION_FINALIZED`
- `ENCOUNTER_COMPLETED`
- `ADDENDUM_CREATED`
- `PATIENT_RECORD_VIEWED`

Não precisa aparecer na UI normal do médico. Serve para suporte, compliance e disputa.

---

## 15. Fluxograma definitivo

```
RECEPÇÃO
  Paciente
    → Appointment
      → SCHEDULED
      → CONFIRMED (opcional)

MÉDICO
  Agenda
    → abre paciente / histórico
    → INICIAR ATENDIMENTO
    → Encounter criado (ou retomado)
    → IN_PROGRESS
    → Queixa / HMA / Histórico / Exame / CID / Conduta
    → IA opcional (só com aceite)
    → Prescrição opcional
    → FINALIZAR
    → Encounter COMPLETED
    → Appointment COMPLETED

DEPOIS
  Prontuário (timeline)
    Consulta
      ├── evolução original
      ├── CID
      ├── médico
      ├── duração
      ├── prescrição
      ├── anexos
      └── adendos

EM PARALELO
  Financeiro
    Cobrança: pendente | pago | parcial | estornado | cancelado
```

---

## 16. O que a recepção faz em paralelo

- Confirma presença / trata atraso
- Remarca
- WhatsApp
- Cobra no balcão (ClinMax Pay / caixa)
- **Não** edita queixa, CID, conduta, receita
- **Não** marca consulta como atendida

Divisão:

- **Recepção:** operação da agenda e do paciente na clínica
- **Médico:** ato clínico (`Encounter`)

---

## 17. Casos especiais (mesmo motor)

| Situação | Como entra | Como o médico trata |
|---|---|---|
| Retorno | Card na grade | Abre histórico, renova receita se precisar |
| Primeira vez | Recepção cadastrou no modal | Primeira evolução |
| Encaixe | Lista de espera | Atende como consulta normal |
| Teleconsulta | Tipo/selo tele | Mesma tela de atendimento |
| Atraso / remarcação | `RESCHEDULED` | Atende no slot novo |
| Falta + reencaixe | `NO_SHOW` + novo Appointment | Atende só o novo |
| Bloqueio / almoço | `BLOCK` | Não inicia Encounter |
| Saiu sem finalizar | Encounter `IN_PROGRESS` | Continuar atendimento |
| Esqueceu dado depois | Encounter `COMPLETED` | Adendo |

Motor clínico: iniciar/retomar → evoluir → finalizar → (opcional) adendo.

---

## 18. Checklist do médico (dia a dia)

1. Entrar na Agenda
2. Ver pacientes do dia
3. Abrir o card
4. (Opcional) Abrir prontuário
5. Iniciar ou **Continuar** atendimento
6. Preencher evolução e CID
7. Prescrever se necessário
8. Finalizar atendimento
9. Conferir status **Atendido**
10. Se precisar corrigir depois: **Adicionar adendo**
11. Próximo card

---

## 19. Fora de escopo hoje

- Bater ponto / check-in de plantão
- Bloquear atendimento se o médico não estiver “online”
- Sala de espera digital com chamada automática
- Assinatura digital ICP-Brasil completa no finalizar
- Vídeo nativo para teleconsulta
- Encounter sem Appointment na UI (modelo já prevê; produto depois)

Se entrar plantão no futuro: **antes da Etapa B** (médico em plantão → disponível → inicia Encounters).

---

## 20. Resumo operacional

| Etapa | Responsável | Appointment | Encounter |
|---|---|---|---|
| Agendar / confirmar / remarcar / falta | Recepção | `SCHEDULED` / `CONFIRMED` / `RESCHEDULED` / `NO_SHOW` / `CANCELLED` | - |
| Iniciar / retomar | Médico | `IN_PROGRESS` | `IN_PROGRESS` |
| Evoluir / CID / IA / prescrever | Médico | `IN_PROGRESS` | `IN_PROGRESS` |
| Finalizar | Médico | `COMPLETED` | `COMPLETED` |
| Adendo | Médico | `COMPLETED` | `COMPLETED` + Addendum |
| Cobrar | Recepção / Financeiro | paralelo | paralelo |
| Timeline / auditoria | Sistema | vínculo | fonte clínica |

---

## 21. Domínios conectados, não misturados

| Domínio | Responsabilidade |
|---|---|
| Agenda (`Appointment`) | Compromisso, grade, operação |
| Ato clínico (`Encounter`) | Evolução, CID, adendo, assinatura |
| Prontuário | Timeline e leitura longitudinal |
| Financeiro | Cobrança e pagamento |
| Auditoria | Rastro jurídico/operacional |

Essa separação é a base para crescer TISS, exportação, multi-profissional e atendimento sem agendamento sem reescrever o prontuário.
