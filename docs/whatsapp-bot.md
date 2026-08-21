# Bot do WhatsApp (ClinMax)

Assistente virtual da clínica no WhatsApp. Responde o paciente, consulta a agenda e o cadastro no ClinMax, e só marca consulta depois que a pessoa confirma.

A IA conversa. A ClinMax decide se a operação é válida e grava no banco.

IA: **9Router** (`http://localhost:20128`, modelo `combini`). O bot precisa do 9Router ligado e do WhatsApp conectado em Configurações.

---

## Arquitetura mental

```
Paciente manda mensagem
        ↓
Orquestrador ClinMax (estado + IDs)
        ↓
Existe ação determinística?
 ┌──────┴──────┐
 SIM           NÃO
 │              ↓
Agenda /       9Router (intenção)
confirma       ↓
               Ferramenta ClinMax
```

A IA interpreta frases como "umas 9 e meia". Quem executa é o **orquestrador** da ClinMax: estado real da conversa (`aiContextJson.bookingState`) mais ferramentas. Confirmação pendente (`BOOKING_AWAITING_CONFIRMATION`) + "pode sim" **não passa pela IA**. O backend chama `agendar_consulta` com os IDs gravados.

Quem executa é função determinística (`agendar_consulta` → `appointmentService.create`), que verifica de novo:

- paciente existe?
- profissional pertence à clínica?
- horário continua livre?
- agenda funciona nesse dia?
- não é almoço nem bloqueio?
- não existe conflito?

Só depois grava. O prompt nunca diz "se achar que está tudo certo, crie a consulta".

---

## Fluxo de agendamento (não mudar)

```
Quero marcar
   ↓
Identificar paciente
   ↓
Encontrou?
 ┌──────┴──────┐
 SIM           NÃO
 │              ↓
 │        coletar dados
 │              ↓
 │        confirmar dados
 │              ↓
 │        criar paciente
 └───────┬──────┘
         ↓
Listar profissionais reais
         ↓
Escolher profissional
         ↓
Escolher data
         ↓
Buscar horários livres
         ↓
Paciente escolhe horário
         ↓
"Posso confirmar?"
         ↓
     SIM explícito
         ↓
Criar agendamento
         ↓
Resumo final
```

Consulta só é criada depois de confirmação. Isso vive no **estado operacional** (`aiContextJson`):

```
bookingState = BOOKING_AWAITING_CONFIRMATION
intent = BOOK_APPOINTMENT
patientId = cmsx...
selectedDoctor = doctor_123
selectedDoctorName = Doutor Jr
selectedDate = 2026-08-20
selectedTime = 09:00
awaitingConfirmation = true
```

"Pode sim" com esse estado: o orquestrador agenda. A IA não reconstrói médico por nome.

Número (`2`) só escolhe profissional em `BOOKING_SELECT_DOCTOR`. Em confirmação, o bot pede "sim".

Falha técnica: `BOOKING_RETRY` com o mesmo rascunho. Novo "pode sim" tenta o mesmo horário.

Depois de `BOOKING_CONFIRMED`, outro "pode sim" não cria consulta duplicada.

---

## Como o sistema funciona hoje

1. Paciente manda mensagem no número da clínica.
2. O backend espera um pouco (debounce) para juntar mensagens seguidas. Mensagem WhatsApp repetida (`waMessageId`) não dispara o bot de novo.
3. O orquestrador vê se há confirmação/retry/escolha numérica pendente. Se sim, executa sem IA.
4. Se não, a IA lê o histórico, o prompt e o estado, e pode chamar ferramenta.
5. No "Pode", o backend consulta a disponibilidade **de novo**. Se ocupou: "Esse horário acabou de ficar indisponível" e oferece horários próximos.
6. A resposta vai para o WhatsApp em texto curto (até cerca de 1200 caracteres).

Ligar/desligar: Configurações → WhatsApp → Lembretes. Assistente IA e resposta automática.

### Handoff humano

Estado da conversa:

- `BOT_ACTIVE`: a IA responde.
- `HUMAN_HANDOFF`: um humano da clínica mandou mensagem no chat. A IA **não entra no meio**.

Timeout: se o paciente voltar a falar depois de 30 minutos sem o humano (env `WHATSAPP_AI_HANDOFF_TIMEOUT_MS`), a IA retoma.

### Auditoria

Logs internos (o paciente não vê): consulta criada pelo bot, prescrição bloqueada se o WhatsApp não for do paciente. Módulo `whatsapp` em `AuditLog`.

Se a IA falhar (serviço fora, chave, 9Router desligado), o paciente recebe aviso de instabilidade e pode esperar um atendente.

---

## O que o bot pode fazer

| Ação | O que acontece no ClinMax |
|---|---|
| Localizar cadastro | Telefone do WhatsApp, CPF ou nome. Nome ambíguo: pede CPF ou nascimento. Não escolhe sozinho. |
| Criar / atualizar cadastro | Nome, CPF, telefone, nascimento, sexo, e-mail. CPF completo não volta nas respostas (só final 1234). |
| Listar profissionais | Nome e especialidade. Sem telefone do médico. |
| Ver horários livres | Data e médico escolhidos. |
| Agendar | Só depois de confirmação + revalidação do slot. |
| Mandar prescrição | PDF no WhatsApp se a receita estiver finalizada **e** o telefone da conversa for o do paciente. |
| Lembrete de consulta | Template da clínica, se a ferramenta confirmar sucesso. |
| Info da clínica | Nome e dados cadastrados. |

O bot **não** envia e-mail de confirmação. Pode só registrar o e-mail no cadastro.

Lembrete "24 horas antes" só faz sentido se a consulta não for hoje. Consulta no mesmo dia: só confirma o horário.

---

## Próximos fluxos (assistente operacional de recepção)

1. **Agendar** (já especificado acima).
2. **Confirmar / cancelar / remarcar** e confirmar presença.
3. **Informações da clínica**.
4. **Entrega de documentos permitidos** (prescrição só com match de telefone).

Há ferramenta de listar consultas do paciente. Cancelar e remarcar ainda não são o fluxo principal do bot.

---

## Tom das mensagens

- Português do Brasil, curto, educado.
- 2 ou 3 frases por mensagem.
- Emoji leve no máximo (ex.: 😊).
- Sem falar em ferramenta, API, JSON, "sistema retornou".
- Sem inventar horário, médico ou "já enviei e-mail".
- Sem comparar médicos ("o melhor").
- Sem repetir CPF completo.

---

## Exemplos (o que o bot mandaria)

### Saudação / pedido de consulta

**Paciente:** Oi, quero marcar uma consulta  
**Bot:** Claro, posso te ajudar com o agendamento 😊 Para localizar ou criar seu cadastro, me informe seu nome completo e CPF.

### Cadastro novo

**Paciente:** Maria Silva, CPF 123.456.789-00, nasci 14/04/1990, feminino  
**Bot:** Perfeito, entendi assim: Nascimento 14/04/1990, Sexo feminino. Está correto?  
**Paciente:** Sim  
**Bot:** Cadastro pronto, Maria. Qual profissional você prefere? Temos Dra. Camila (Clínica Geral) e Dr. Rafael (Cardiologia).

### Nome ambíguo

**Paciente:** Maria Silva  
**Bot:** Encontrei mais de um cadastro com esse nome. Me informe o CPF ou a data de nascimento para eu localizar o certo.

### Horários

**Paciente:** Quero com a Dra. Camila amanhã  
**Bot:** Verifiquei os horários da Dra. Camila em 19/08/2026. Tenho 08:00, 09:30 e 14:00. Qual fica melhor para você?

### Confirmação (obrigatória)

**Paciente:** 09:30  
**Bot:** Posso confirmar sua consulta com Dra. Camila em 19/08/2026 às 09:30?  
**Paciente:** Pode  
**Bot:** Consulta confirmada com Dra. Camila em 19/08/2026 às 09:30. Quer registrar um e-mail no cadastro?

### Horário ocupou no meio do "Pode"

**Bot:** Esse horário acabou de ficar indisponível. Tenho 10:00 e 10:30.

### Consulta hoje (sem prometer lembrete 24h)

**Bot:** Sua consulta está confirmada para hoje às 16:00.

### Lembrete automático (template da clínica)

Olá Maria Silva, lembramos seu agendamento em 19/08/2026 às 09:30 com Dra. Camila. ClinMax Centro

### Confirmação (template)

Olá Maria Silva! Sua consulta na ClinMax Centro está confirmada para 19/08/2026 às 09:30. Qualquer dúvida, responda esta mensagem.

### Prescrição

**Paciente:** Pode me mandar a receita?  
**Bot:** Encontrei uma prescrição finalizada. Acabei de enviar o PDF neste WhatsApp.

### Não sabe / precisa de humano

**Paciente:** Quero remarcar um exame particular de outro laboratório  
**Bot:** Isso eu não consigo resolver por aqui. Um atendente da clínica vai te ajudar.

### Instabilidade da IA

Desculpe, no momento não consegui processar sua mensagem (instabilidade do serviço de IA). Por favor, tente novamente em alguns minutos ou aguarde um atendente.

---

## O que o bot não deve mandar (errado)

- "Usei a ferramenta buscar_horarios."
- "Já enviei o e-mail de confirmação."
- Horário que não veio da agenda.
- Telefone do médico.
- CPF completo nas respostas.
- "Lembrete 24 horas antes" para consulta de hoje.

---

## Onde configurar

- Número e QR: Configurações → WhatsApp → Conexões
- Textos de lembrete: mesma tela, aba Templates
- Horas do lembrete automático (ex.: 24, 2): aba Lembretes
- Assistente e auto-resposta: aba Lembretes (precisa 9Router em `localhost:20128`)

Arquivos: `whatsapp-ai.service.ts`, `whatsapp-booking-orchestrator.ts`, `whatsapp-ai-tools.service.ts`, `whatsapp-ai-prompt.ts`, `whatsapp-ai-context.ts`, `whatsapp-template.service.ts`.
