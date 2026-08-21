# Pacientes ClinMax

O paciente é a entidade central da operação. O prontuário **não se cadastra à parte**: nasce conceitualmente com o paciente (mesmo vazio). O primeiro atendimento só começa a preencher o histórico.

## Modelo mental

```
CLÍNICA
│
├── EQUIPE
│   ├── Owner/Admin ───────── operação (clínico só se também atender)
│   ├── Recepção ─────────── agenda + paciente básico
│   ├── Profissional ─────── atendimento + prontuário
│   ├── Financeiro ───────── financeiro + paciente básico
│   └── Consultor ────────── configuração, sem clínico por padrão
│
├── PACIENTE
│   ├── Cadastro básico
│   ├── Agendamentos
│   │     └── Atendimento
│   │           └── Registro clínico
│   ├── Prescrições
│   ├── Financeiro
│   └── Comunicação
│
└── CONFIGURAÇÕES
    ├── Horários
    ├── Equipe / Convites
    ├── Procedimentos
    ├── Convênios
    └── Permissões
```

Cadeia de um atendimento: **Paciente → Agendamento → Atendimento → Registro clínico**.

Ser administrador **não** significa ser profissional de saúde. Ver paciente **não** significa ver prontuário.

---

## Fluxos

### Paciente não existe (fluxo mais usado na recepção)

Agenda → Novo agendamento → buscar → não encontrou → **Cadastrar agora** → o modal **troca** para a tela de cadastro (mesmo casco) → paciente criado → volta já selecionado → salvar agendamento.

### Paciente já existe

Agenda → buscar → selecionar → contato/convênio aparecem → procedimento/horário → salvar.

---

## Cadastro administrativo (simples)

Obrigatório: **nome + nascimento + CPF ou telefone**.

Não entra aqui: alergia, medicamentos, antecedentes. Isso é dado clínico.

---

## Duplicidade (antes de criar)

Escopo: **esta clínica**.

| Campo | Gravidade | Comportamento |
|---|---|---|
| **CPF** | Identificação forte | 409 `PATIENT_EXISTS`. “Usar este paciente?”. Não cria outro. |
| **Telefone / e-mail** | Possível coincidência | 409 `PATIENT_POSSIBLE_DUPLICATE`. avisa (mãe/filho, casal). Pode **usar o existente** ou **cadastrar mesmo assim** (`force: true`). |

Identidade de **usuário** (login) e de **paciente** são coisas diferentes.

---

## Unicidade no banco

- CPF **não** é `@unique` global.
- Unicidade composta: `clinicId + cpf`.
- Telefone e e-mail **não** bloqueiam unique no banco.

---

## Arquivar, não excluir

`PATCH /patients/:id/archive`. Lista diária mostra só ativos.

---

## Permissões

| | Cadastro básico (`patients:view` / create / edit_basic) | Prontuário (`records:*` / `prescriptions:write` / `patients:edit_clinical`) |
|---|---|---|
| Admin **sem** perfil clínico | sim | **não** |
| Admin **com** perfil Doctor (`alsoTreats`) | sim | sim |
| Profissional (`DOCTOR`) | sim | sim |
| Recepção | sim | **não** |
| Financeiro | leitura básica | **não** |
| Consultor | **não** (configuração) | **não** |

Rotas de histórico clínico exigem `records:view`. GET de paciente sem essa permissão **omite** alergias, hábitos, evoluções.

---

## APIs

| Método | Caminho | |
|---|---|---|
| GET | `/patients` | Lista (clínico strip se sem `records:view`) |
| GET | `/patients/lookup` | Match |
| GET | `/patients/:id` | Ficha |
| GET | `/patients/:id/history` | Timeline. `records:view` |
| POST | `/patients` | Cria; 409 CPF ou aviso telefone/e-mail; `force` ignora aviso |
| PUT | `/patients/:id` | Atualiza (clínico filtrado) |
| PATCH | `/patients/:id/archive` | Inativa |

---

## Arquivos

Front: `PatientFormModal.tsx`, `Patients.tsx`, `AppointmentFormModal.tsx`, `ProntuarioPage.tsx`  
Back: `patient.service.ts`, `duplicate-validation.ts`, `permissions.ts`, `prisma/schema.prisma`
